import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiFileText, FiMapPin, FiShield, FiTruck } from 'react-icons/fi'
import { addressApi } from '../../api/addressApi'
import { orderApi } from '../../api/orderApi'
import { prescriptionApi } from '../../api/prescriptionApi'
import PageHeader from '../../components/common/PageHeader'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useStorefront } from '../../context/StorefrontContext'
import { money } from '../../utils/formatters'

function createGuestAddressForm() {
  return {
    full_name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    area: '',
    postal_code: '',
  }
}

export default function Checkout() {
  const { customer, loading: authLoading } = useCustomerAuth()
  const { cart, cartLoading, clearCart } = useStorefront()
  const navigate = useNavigate()
  const [addresses, setAddresses] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [useSavedAddress, setUseSavedAddress] = useState(false)
  const [guestAddress, setGuestAddress] = useState(createGuestAddressForm())
  const [form, setForm] = useState({ address_id: '', payment_method: 'COD', prescription_id: '', notes: '' })

  useEffect(() => {
    if (authLoading || !cart) return

    const requests = []
    if (cart.requires_prescription) {
      requests.push(prescriptionApi.list().then((response) => ({ type: 'prescriptions', payload: response.data.data?.data || response.data.data || [] })))
    }
    if (customer) {
      requests.push(addressApi.list().then((response) => ({ type: 'addresses', payload: response.data.data?.data || response.data.data || [] })))
    }

    if (requests.length === 0) {
      const timeoutId = window.setTimeout(() => setLoading(false), 0)
      return () => window.clearTimeout(timeoutId)
    }

    Promise.all(requests)
      .then((responses) => {
        const nextPrescriptions = responses.find((item) => item.type === 'prescriptions')?.payload || []
        const nextAddresses = responses.find((item) => item.type === 'addresses')?.payload || []
        const defaultAddressId = nextAddresses.find((item) => item.is_default)?.id || nextAddresses[0]?.id || ''

        setPrescriptions(nextPrescriptions)
        setAddresses(nextAddresses)
        setUseSavedAddress(Boolean(customer && nextAddresses.length > 0))
        setForm((current) => ({ ...current, address_id: defaultAddressId || current.address_id }))
        setGuestAddress((current) => ({
          ...current,
          full_name: current.full_name || customer?.full_name || '',
          phone: current.phone || customer?.phone || '',
        }))
      })
      .catch(() => toast.error('Checkout data could not be loaded.'))
      .finally(() => setLoading(false))
  }, [authLoading, cart, customer])

  const submit = async (event) => {
    event.preventDefault()

    if (cart?.requires_prescription && !form.prescription_id) {
      toast.error('Please select a prescription before placing this order.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        payment_method: form.payment_method,
        prescription_id: form.prescription_id || undefined,
        notes: form.notes || undefined,
      }

      if (customer && useSavedAddress && form.address_id) {
        payload.address_id = form.address_id
      } else {
        payload.delivery_address = guestAddress
      }

      const { data } = await orderApi.checkout(payload)
      await clearCart()
      toast.success(`Order ${data.data.order_number} placed successfully.`)
      navigate(`/orders/${data.data.id}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Order could not be placed.')
    } finally {
      setSubmitting(false)
    }
  }

  const pageLoading = authLoading || (cartLoading && !cart)

  if (pageLoading) return <p className="text-sm text-slate-500">Loading checkout...</p>

  if (!cart?.items?.length) {
    return (
      <>
        <PageHeader title="Checkout" subtitle="Your cart is empty. Add medicines first to continue." />
        <button onClick={() => navigate('/products')} className="bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Browse medicines</button>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Checkout" subtitle="Confirm delivery details, connect prescriptions when required, and place your pharmacy order with a clear final review." />

      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="space-y-6">
          <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Delivery address</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Choose where the medicines should go.</h2>
              </div>
              {customer ? (
                <Link to="/addresses" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950">
                  Manage addresses
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>

            {customer && addresses.length > 0 ? (
              <div className="mt-5">
                <button
                  type="button"
                  className="border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                  onClick={() => setUseSavedAddress((current) => !current)}
                >
                  {useSavedAddress ? 'Use a new address' : 'Use saved addresses'}
                </button>
              </div>
            ) : null}

            {customer && useSavedAddress && addresses.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {addresses.map((address) => (
                  <label key={address.id} className={`block cursor-pointer border p-4 transition ${String(form.address_id) === String(address.id) ? 'border-slate-950 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
                    <input
                      type="radio"
                      name="address_id"
                      value={address.id}
                      checked={String(form.address_id) === String(address.id)}
                      onChange={(event) => setForm({ ...form, address_id: event.target.value })}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-950">{address.full_name}</span>
                          {address.is_default ? <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Default</span> : null}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate-500">
                          {address.phone}<br />
                          {address.address_line_1}
                          {address.address_line_2 ? `, ${address.address_line_2}` : ''}<br />
                          {address.area}, {address.city}
                          {address.postal_code ? `, ${address.postal_code}` : ''}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <CheckoutField label="Full name" value={guestAddress.full_name} onChange={(value) => setGuestAddress({ ...guestAddress, full_name: value })} required />
                <CheckoutField label="Phone number" value={guestAddress.phone} onChange={(value) => setGuestAddress({ ...guestAddress, phone: value })} required />
                <CheckoutField label="Address line 1" value={guestAddress.address_line_1} onChange={(value) => setGuestAddress({ ...guestAddress, address_line_1: value })} required className="md:col-span-2" />
                <CheckoutField label="Address line 2" value={guestAddress.address_line_2} onChange={(value) => setGuestAddress({ ...guestAddress, address_line_2: value })} className="md:col-span-2" />
                <CheckoutField label="City" value={guestAddress.city} onChange={(value) => setGuestAddress({ ...guestAddress, city: value })} required />
                <CheckoutField label="Area" value={guestAddress.area} onChange={(value) => setGuestAddress({ ...guestAddress, area: value })} required />
                <CheckoutField label="Postal code" value={guestAddress.postal_code} onChange={(value) => setGuestAddress({ ...guestAddress, postal_code: value })} className="md:col-span-2" />
              </div>
            )}
          </div>

          {cart.requires_prescription ? (
            <div className="border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center border border-amber-200 bg-white text-amber-700">
                  <FiFileText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Prescription required</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Attach an approved prescription to continue.</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Prescription-linked medicines cannot be finalized until one uploaded prescription is selected for this order.
                  </p>
                  <select value={form.prescription_id} onChange={(event) => setForm({ ...form, prescription_id: event.target.value })} required className="mt-4 w-full border border-amber-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
                    <option value="">{loading ? 'Loading prescriptions...' : 'Select a prescription'}</option>
                    {prescriptions.map((item) => (
                      <option key={item.id} value={item.id}>#{item.id} - {item.status}</option>
                    ))}
                  </select>
                  <Link to="/upload-prescription" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
                    Upload a new prescription
                    <FiArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <div className="border-b border-slate-200 pb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Payment and notes</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Confirm the final order method.</h2>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="border border-slate-200 bg-slate-50 p-4">
                <label className="text-sm font-medium text-slate-700">Payment method</label>
                <select value={form.payment_method} onChange={(event) => setForm({ ...form, payment_method: event.target.value })} className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
                  <option value="COD">Cash on delivery</option>
                </select>
                <p className="mt-3 text-sm leading-7 text-slate-500">COD remains visible in your order details and payment status stays trackable after order placement.</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Additional notes</label>
                <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Delivery instructions or order notes" className="mt-2 min-h-28 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none" />
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] xl:sticky xl:top-24 xl:self-start">
            <div className="border-b border-slate-200 pb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Order summary</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Final review before confirmation.</h2>
            </div>

            <div className="mt-4 space-y-3">
              {cart.items.map((item) => (
                <div key={item.cart_item_id} className="flex justify-between gap-3 border border-slate-200 bg-slate-50 p-4 text-sm">
                  <span className="text-slate-700">
                    {item.product_name}
                    <span className="mt-1 block text-xs text-slate-500">{item.quantity} {item.purchase_unit_label} • {item.piece_quantity} pieces</span>
                  </span>
                  <span className="font-medium text-slate-950">{money(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-600">
              <div className="flex justify-between"><span>Subtotal</span><span>{money(cart.subtotal)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{money(60)}</span></div>
              <div className="flex justify-between pt-2 text-base font-semibold text-slate-950"><span>Total</span><span>{money(Number(cart.subtotal) + 60)}</span></div>
            </div>

            <button disabled={submitting || loading || (customer && useSavedAddress ? !form.address_id : !guestAddress.full_name.trim())} className="mt-5 w-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Placing order...' : 'Confirm order'}
            </button>

            <div className="mt-5 grid gap-3">
              <CheckoutNote icon={FiShield} title="Prescription safety" body="Restricted medicines require a selected prescription before the order can be placed." />
              <CheckoutNote icon={FiTruck} title="Delivery support" body="After checkout, order and delivery progress remain visible from account history and tracking pages." />
              <CheckoutNote icon={FiMapPin} title="Address handling" body="Saved addresses speed up repeat checkout for logged-in customers." />
            </div>
          </div>
        </aside>
      </form>
    </>
  )
}

function CheckoutField({ label, value, onChange, required = false, className = '' }) {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none"
      />
    </div>
  )
}

function CheckoutNote({ icon: Icon, title, body }) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-4">
      <div className="inline-flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-950">
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-950">{title}</div>
      <div className="mt-2 text-sm leading-7 text-slate-500">{body}</div>
    </div>
  )
}
