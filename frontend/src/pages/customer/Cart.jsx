import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { FiArrowRight, FiFileText, FiShield, FiShoppingCart, FiTruck } from 'react-icons/fi'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useStorefront } from '../../context/StorefrontContext'
import { money } from '../../utils/formatters'

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://my_pharmecy.test/api').replace(/\/api\/?$/, '')

function resolveImage(path) {
  if (!path) return null
  return path.startsWith('http') ? path : new URL(path, `${API_ORIGIN}/`).toString()
}

export default function Cart() {
  const { loading: authLoading } = useCustomerAuth()
  const { cart, cartLoading, updateCartItem, removeCartItem, clearCart } = useStorefront()
  const [updatingId, setUpdatingId] = useState(null)

  const items = useMemo(() => cart?.items || [], [cart])
  const hasPrescription = Boolean(cart?.requires_prescription)
  const warnings = cart?.warnings || []
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)

  const updateQuantity = async (item, quantity) => {
    if (quantity < 1) return
    setUpdatingId(item.cart_item_id)
    try {
      await updateCartItem(item.cart_item_id, { quantity })
      toast.success('Quantity updated successfully.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Quantity could not be updated.')
    } finally {
      setUpdatingId(null)
    }
  }

  const remove = async (item) => {
    const result = await Swal.fire({
      title: 'Remove this item from the cart?',
      text: item.product_name,
      showCancelButton: true,
      confirmButtonText: 'Remove',
      cancelButtonText: 'Cancel',
    })

    if (!result.isConfirmed) return

    await removeCartItem(item.cart_item_id)
    toast.success('Item removed from the cart.')
  }

  const clear = async () => {
    const result = await Swal.fire({
      title: 'Clear the full cart?',
      showCancelButton: true,
      confirmButtonText: 'Clear cart',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    })

    if (!result.isConfirmed) return

    await clearCart()
    toast.success('Cart cleared successfully.')
  }

  const pageLoading = authLoading || (cartLoading && !cart)

  return (
    <>
      <PageHeader title="My cart" subtitle="Review medicines, purchase units, stock limits, and prescription requirements before confirming the pharmacy order." />

      {pageLoading ? <p className="text-slate-500">Loading cart...</p> : null}
      {!pageLoading && items.length === 0 ? <EmptyState title="Cart is empty" text="Add medicines and they will appear here." /> : null}

      {items.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <MiniStat label="Line items" value={items.length} icon={FiShoppingCart} />
              <MiniStat label="Selected units" value={totalQuantity} icon={FiArrowRight} />
              <MiniStat label="Prescription items" value={hasPrescription ? 'Yes' : 'No'} icon={FiShield} />
            </div>

            {hasPrescription ? (
              <div className="border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800">
                This cart contains prescription medicines. Please upload or select an approved prescription before checkout.
              </div>
            ) : null}

            {warnings.length > 0 ? (
              <div className="border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-800">
                {warnings.map((warning) => <p key={warning}>{warning}</p>)}
              </div>
            ) : null}

            <div className="border border-slate-200 bg-white shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
              {items.map((item) => {
                const image = resolveImage(item.image_url)

                return (
                  <div key={item.cart_item_id} className="grid gap-5 border-b border-slate-200 p-5 last:border-b-0 lg:grid-cols-[84px_1fr_160px_140px] lg:items-center">
                    <div className="overflow-hidden border border-slate-200 bg-slate-50">
                      {image ? (
                        <img className="h-[84px] w-full object-cover" src={image} alt={item.product_name} />
                      ) : (
                        <div className="flex h-[84px] items-center justify-center text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">Rx</div>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-950">{item.product_name}</h2>
                        {item.requires_prescription ? (
                          <span className="border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                            Prescription
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-slate-500">{item.generic_name || '-'} {item.strength || ''} {item.dosage_form || ''}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">{item.purchase_unit_label}</span>
                        <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">{item.conversion_label}</span>
                        <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">Stock {item.available_stock} pieces</span>
                      </div>
                      <p className="mt-3 text-xs leading-6 text-slate-500">Maximum in this unit: {item.available_quantity}</p>
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Quantity</div>
                      <div className="mt-3 flex items-center gap-2">
                        <button className="flex h-10 w-10 items-center justify-center border border-slate-300 text-lg text-slate-900" disabled={updatingId === item.cart_item_id} onClick={() => updateQuantity(item, item.quantity - 1)}>
                          -
                        </button>
                        <input
                          className="h-10 w-20 border border-slate-300 text-center text-sm text-slate-900 outline-none"
                          value={item.quantity}
                          onChange={(event) => updateQuantity(item, Number(event.target.value))}
                        />
                        <button className="flex h-10 w-10 items-center justify-center border border-slate-300 text-lg text-slate-900" disabled={updatingId === item.cart_item_id || item.quantity >= item.available_quantity} onClick={() => updateQuantity(item, item.quantity + 1)}>
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-left lg:text-right">
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Subtotal</div>
                      <div className="mt-2 text-2xl font-semibold text-slate-950">{money(item.subtotal)}</div>
                      <div className="mt-1 text-xs text-slate-500">{money(item.unit_price)} / {item.purchase_unit_label}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.piece_quantity} pieces total</div>
                      <button className="mt-3 border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700" onClick={() => remove(item)}>
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] xl:sticky xl:top-24 xl:self-start">
              <div className="border-b border-slate-200 pb-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Cart summary</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Ready for checkout.</h2>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex justify-between"><span>Items subtotal</span><span>{money(cart?.subtotal)}</span></div>
                <div className="flex justify-between"><span>Estimated delivery</span><span>{money(60)}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-950">
                  <span>Estimated total</span>
                  <span>{money(Number(cart?.subtotal || 0) + 60)}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <Link to="/checkout" className="flex items-center justify-between bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Continue to checkout
                  <FiArrowRight className="h-4 w-4" />
                </Link>
                <button className="border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700" onClick={clear}>
                  Clear full cart
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                <SupportNote icon={FiFileText} title="Prescription workflow" body="Upload a prescription before checkout if the cart contains restricted medicines." />
                <SupportNote icon={FiTruck} title="Delivery flow" body="Delivery status becomes visible from your order details after confirmation and processing." />
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}

function MiniStat({ label, value, icon: Icon }) {
  return (
    <div className="border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
      <div className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-slate-50 text-slate-950">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  )
}

function SupportNote({ icon: Icon, title, body }) {
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
