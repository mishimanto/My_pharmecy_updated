import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import { cartApi } from '../../api/cartApi'
import { orderApi } from '../../api/orderApi'
import { prescriptionApi } from '../../api/prescriptionApi'
import PageHeader from '../../components/common/PageHeader'
import { money } from '../../utils/formatters'

export default function Checkout() {
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [deliveryAreas, setDeliveryAreas] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ address_id: '', payment_method: 'COD', prescription_id: '', notes: '' })

  useEffect(() => {
    Promise.all([
      cartApi.get(),
      api.get('/customer/addresses'),
      prescriptionApi.list(),
    ]).then(([cartRes, addressRes, prescriptionRes]) => {
      const cartData = cartRes.data.data
      const addressData = addressRes.data.data?.data || addressRes.data.data || []
      const prescriptionData = prescriptionRes.data.data?.data || prescriptionRes.data.data || []
      setCart(cartData)
      setAddresses(addressData)
      setPrescriptions(prescriptionData)
      setForm((current) => ({ ...current, address_id: addressData.find((item) => item.is_default)?.id || addressData[0]?.id || '' }))
    }).catch(() => toast.error('চেকআউট তথ্য লোড করা যায়নি।')).finally(() => setLoading(false))
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    if (cart?.requires_prescription && !form.prescription_id) {
      toast.error('এই অর্ডারের জন্য প্রেসক্রিপশন নির্বাচন করুন।')
      return
    }

    setSubmitting(true)

    try {
      await orderApi.checkout({
        address_id: form.address_id,
        payment_method: form.payment_method,
        prescription_id: form.prescription_id || undefined,
        coupon_code: appliedCouponCode || undefined,
        notes: form.notes || undefined,
      })
      toast.success('অর্ডার তৈরি হয়েছে।')
      navigate('/orders')
    } catch (error) {
      toast.error(error.response?.data?.message || 'অর্ডার তৈরি করা যায়নি।')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-600">লোড হচ্ছে...</p>

  if (!cart?.items?.length) {
    return (
      <>
        <PageHeader title="চেকআউট" subtitle="কার্ট খালি। অর্ডার করতে আগে পণ্য যোগ করুন।" />
        <button onClick={() => navigate('/products')} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">পণ্য দেখুন</button>
      </>
    )
  }

  return (
    <>
      <PageHeader title="চেকআউট" subtitle="ঠিকানা, পেমেন্ট এবং প্রয়োজন হলে প্রেসক্রিপশন নিশ্চিত করুন।" />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <label className="text-sm font-medium text-slate-700">ডেলিভারি ঠিকানা</label>
            <select value={form.address_id} onChange={(event) => setForm({ ...form, address_id: event.target.value })} required className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">ঠিকানা নির্বাচন করুন</option>
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>{address.full_name} - {address.area}, {address.city}</option>
              ))}
            </select>
          </div>

          {cart.requires_prescription && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">প্রেসক্রিপশন প্রয়োজন</p>
              <select value={form.prescription_id} onChange={(event) => setForm({ ...form, prescription_id: event.target.value })} required className="mt-3 w-full rounded-md border border-amber-300 px-3 py-2 text-sm">
                <option value="">প্রেসক্রিপশন নির্বাচন করুন</option>
                {prescriptions.map((item) => (
                  <option key={item.id} value={item.id}>#{item.id} - {item.status}</option>
                ))}
              </select>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <label className="text-sm font-medium text-slate-700">পেমেন্ট পদ্ধতি</label>
            <select value={form.payment_method} onChange={(event) => setForm({ ...form, payment_method: event.target.value })} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="COD">ক্যাশ অন ডেলিভারি</option>
            </select>
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="অতিরিক্ত নোট" className="mt-3 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-950">অর্ডার সারাংশ</h2>
          <div className="mt-4 space-y-3">
            {cart.items.map((item) => (
              <div key={item.cart_item_id} className="flex justify-between gap-3 text-sm">
                <span className="text-slate-700">{item.product_name} x {item.quantity}</span>
                <span className="font-medium text-slate-950">{money(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between"><span>সাবটোটাল</span><span>{money(cart.subtotal)}</span></div>
            <div className="mt-2 flex justify-between"><span>ডেলিভারি</span><span>{money(60)}</span></div>
            <div className="mt-3 flex justify-between text-base font-semibold text-slate-950"><span>মোট</span><span>{money(Number(cart.subtotal) + 60)}</span></div>
          </div>
        </aside>
      </form>

      <PaymentMethodModal
        open={paymentModalOpen}
        isBangla={isBangla}
        selectedMethod={selectedFullPaymentMethod}
        onClose={() => setPaymentModalOpen(false)}
        onSelect={handleFullPaymentMethodSelect}
      />
    </>
  )
}
