import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { FiArrowRight, FiFileText, FiShield, FiShoppingCart, FiTruck } from 'react-icons/fi'
import { FaFilePrescription } from "react-icons/fa";
import { GrCheckboxSelected } from "react-icons/gr";
import { orderApi } from '../../api/orderApi'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useStorefront } from '../../context/StorefrontContext'
import { money } from '../../utils/formatters'
import { readCheckoutDraft, writeCheckoutDraft } from '../../utils/checkoutDraft'
import { handleImageFallback, resolveImageUrl } from '../../utils/imageUrl'

export default function Cart() {
  const { loading: authLoading } = useCustomerAuth()
  const { cart, cartLoading, updateCartItem, removeCartItem, clearCart } = useStorefront()
  const [updatingId, setUpdatingId] = useState(null)
  const draft = useMemo(() => readCheckoutDraft(), [])
  const [deliveryAreas, setDeliveryAreas] = useState([])
  const [deliveryAreaId, setDeliveryAreaId] = useState(draft.deliveryAreaId)
  const [couponInput, setCouponInput] = useState(draft.couponCode)
  const [appliedCouponCode, setAppliedCouponCode] = useState(draft.couponCode)
  const [pricing, setPricing] = useState(null)
  const [pricingLoading, setPricingLoading] = useState(false)

  const items = useMemo(() => cart?.items || [], [cart])
  const hasPrescription = Boolean(cart?.requires_prescription)
  const warnings = cart?.warnings || []
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const selectedDeliveryArea = useMemo(
    () => deliveryAreas.find((item) => String(item.id) === String(deliveryAreaId)) || null,
    [deliveryAreaId, deliveryAreas],
  )

  const loadPricing = useCallback(async (nextAreaId, nextCouponCode, { silent = false } = {}) => {
    if (!items.length) {
      setPricing(null)
      return null
    }

    if (!nextAreaId) {
      setPricing({
        subtotal_amount: Number(cart?.subtotal || 0),
        delivery_charge: 0,
        discount_amount: 0,
        total_amount: Number(cart?.subtotal || 0),
        coupon: null,
      })
      return null
    }

    setPricingLoading(true)

    try {
      const { data } = await orderApi.quote({
        delivery_area_id: Number(nextAreaId),
        coupon_code: nextCouponCode || undefined,
      })

      setPricing(data.data)
      return data.data
    } catch (error) {
      if (nextCouponCode) {
        setAppliedCouponCode('')
        writeCheckoutDraft({ couponCode: '' })
        const fallback = await loadPricing(nextAreaId, '', { silent: true })
        if (!silent) {
          toast.error(error.response?.data?.message || 'Coupon could not be applied.')
        }
        return fallback
      }

      if (!silent) {
        toast.error(error.response?.data?.message || 'Cart summary could not be updated.')
      }
      return null
    } finally {
      setPricingLoading(false)
    }
  }, [cart?.subtotal, items.length])

  useEffect(() => {
    if (!items.length) return

    orderApi.deliveryAreas()
      .then(({ data }) => {
        const nextAreas = data.data || []
        setDeliveryAreas(nextAreas)

        if (!nextAreas.length) {
          setDeliveryAreaId('')
          writeCheckoutDraft({ deliveryAreaId: '' })
          return
        }

        const preferredAreaId = nextAreas.some((item) => String(item.id) === String(draft.deliveryAreaId))
          ? String(draft.deliveryAreaId)
          : String(nextAreas[0].id)

        setDeliveryAreaId((current) => {
          if (current && nextAreas.some((item) => String(item.id) === String(current))) {
            return current
          }

          writeCheckoutDraft({ deliveryAreaId: preferredAreaId })
          return preferredAreaId
        })
      })
      .catch(() => toast.error('Delivery areas could not be loaded.'))
  }, [draft.deliveryAreaId, items.length])

  useEffect(() => {
    if (!items.length || !deliveryAreaId) return

    loadPricing(deliveryAreaId, appliedCouponCode, { silent: true })
  }, [appliedCouponCode, deliveryAreaId, items.length, loadPricing, cart?.subtotal])

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
  const subtotal = Number(pricing?.subtotal_amount ?? cart?.subtotal ?? 0)
  const deliveryCharge = Number(pricing?.delivery_charge ?? selectedDeliveryArea?.delivery_charge ?? 0)
  const discountAmount = Number(pricing?.discount_amount ?? 0)
  const total = Number(pricing?.total_amount ?? Math.max(0, subtotal + deliveryCharge - discountAmount))

  const handleDeliveryAreaChange = async (value) => {
    setDeliveryAreaId(value)
    writeCheckoutDraft({ deliveryAreaId: value })
    await loadPricing(value, appliedCouponCode, { silent: true })
  }

  const applyCoupon = async () => {
    const nextCode = couponInput.trim().toUpperCase()

    if (!nextCode) {
      toast.error('Enter a coupon code first.')
      return
    }

    const quote = await loadPricing(deliveryAreaId, nextCode)

    if (!quote) return

    setCouponInput(nextCode)
    setAppliedCouponCode(nextCode)
    writeCheckoutDraft({ couponCode: nextCode })
    toast.success(`${nextCode} applied successfully.`)
  }

  const removeCoupon = async () => {
    setCouponInput('')
    setAppliedCouponCode('')
    writeCheckoutDraft({ couponCode: '' })
    await loadPricing(deliveryAreaId, '', { silent: true })
  }

  return (
    <>
      <PageHeader title="Cart" />

      {pageLoading ? <p className="text-slate-500">Loading cart...</p> : null}
      {!pageLoading && items.length === 0 ? <EmptyState title="Cart is empty" text="Add medicines and they will appear here." /> : null}

      {items.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <MiniStat label="Line items" value={items.length} icon={FiShoppingCart} />
              <MiniStat label="Selected units" value={totalQuantity} icon={GrCheckboxSelected} />
              <MiniStat label="Prescription items" value={hasPrescription ? 'Yes' : 'No'} icon={FaFilePrescription} />
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
                const image = resolveImageUrl(item.image_url)

                return (
                  <div key={item.cart_item_id} className="grid gap-5 border-b border-slate-200 p-5 last:border-b-0 lg:grid-cols-[84px_1fr_160px_140px] lg:items-center">
                    <div className="overflow-hidden border border-slate-200 bg-slate-50">
                      {image ? (
                        <img className="h-21 w-full object-cover" src={image} alt={item.product_name} onError={handleImageFallback} />
                      ) : (
                        <div className="flex h-21 items-center justify-center text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">Rx</div>
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
                <p className="text-sm text-center font-semibold uppercase tracking-[0.18em] text-emerald-600">Cart summary</p>
                {/* <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Ready for checkout.</h2> */}
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Delivery area</label>
                  <select
                    value={deliveryAreaId}
                    onChange={(event) => handleDeliveryAreaChange(event.target.value)}
                    className="mt-2 w-full border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none"
                  >
                    <option value="">{deliveryAreas.length ? 'Select a delivery area' : 'Loading delivery areas...'}</option>
                    {deliveryAreas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.area_name}, {area.city} - {money(area.delivery_charge)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="py-5 border-y border-slate-200">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Apply coupon</label>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="min-w-0 flex-1 border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={!deliveryAreaId || pricingLoading}
                      className="border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Apply
                    </button>
                  </div>
                  {appliedCouponCode && pricing?.coupon ? (
                    <div className="mt-2 flex items-center justify-between gap-3 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                      <span>{pricing.coupon.label} ({pricing.coupon.code})</span>
                      <button type="button" onClick={removeCoupon} className="text-emerald-800 underline">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">Available demo codes: `SAVE50`, `SAVE10`, `FREESHIP`.</p>
                  )}
                </div>

                <div className="flex justify-between"><span>Items subtotal</span><span>{money(subtotal)}</span></div>
                <div className="flex justify-between"><span>Delivery charge</span><span>{money(deliveryCharge)}</span></div>
                <div className="flex justify-between"><span>Coupon discount</span><span>-{money(discountAmount)}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-950">
                  <span>Estimated total</span>
                  <span>{money(total)}</span>
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
        <div className="mt-4 text-sm text-slate-500">{label}</div>
      </div>
      <div className="mt-4 text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  )
}

