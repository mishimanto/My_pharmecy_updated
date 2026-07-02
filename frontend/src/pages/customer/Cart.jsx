import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { FiArrowRight, FiPlus, FiMinus, FiShoppingCart } from 'react-icons/fi'
import { FaFilePrescription } from 'react-icons/fa'
import { GrCheckboxSelected } from 'react-icons/gr'
import { PiPrescriptionBold } from 'react-icons/pi'
import { orderApi } from '../../api/orderApi'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import OptimizedImage from '../../components/common/OptimizedImage'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useStorefront } from '../../context/StorefrontContext'
import { useLanguage } from '../../context/LanguageContext'
import { money } from '../../utils/formatters'
import { getLocalizedConversionLabel, getUnitLabel } from '../../utils/purchaseUnits'
import { readCheckoutDraft, writeCheckoutDraft } from '../../utils/checkoutDraft'
import { handleImageFallback, resolveImageUrl } from '../../utils/imageUrl'

export default function Cart() {
  const { loading: authLoading } = useCustomerAuth()
  const { cart, cartLoading, updateCartItem, removeCartItem, clearCart } = useStorefront()
  const [updatingId, setUpdatingId] = useState(null)
  const draft = useMemo(() => readCheckoutDraft(), [])
  const [deliveryAreas, setDeliveryAreas] = useState([])
  const [deliveryAreaId, setDeliveryAreaId] = useState(draft.deliveryAreaId)
  const [pricing, setPricing] = useState(null)

  const items = useMemo(() => cart?.items || [], [cart])
  const hasPrescription = Boolean(cart?.requires_prescription)
  const warnings = useMemo(() => cart?.warnings || [], [cart?.warnings])
  const filteredWarnings = useMemo(
    () => warnings.filter((warning) => !['This cart contains prescription medicines.', 'This cart contains prescription products.'].includes(warning)),
    [warnings],
  )
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const selectedDeliveryArea = useMemo(
    () => deliveryAreas.find((item) => String(item.id) === String(deliveryAreaId)) || null,
    [deliveryAreaId, deliveryAreas],
  )

  const { isBangla } = useLanguage()
  const t = useCallback((bn, en) => (isBangla ? bn : en), [isBangla])
  const locale = isBangla ? 'bn-BD' : 'en-US'

  const formatMoney = useCallback((value) => money(value, locale), [locale])

  const formatNumber = useCallback((value) => new Intl.NumberFormat(locale).format(Number(value || 0)), [locale])
  const parseNumber = useCallback((value) => {
    const raw = String(value ?? '').trim()
    if (!raw) return 0

    // Convert Bangla digits (U+09E6 - U+09EF) to ASCII 0-9
    const withLatinDigits = raw.replace(/[\u09E6-\u09EF]/g, (ch) => String(ch.charCodeAt(0) - 0x09E6))

    // Keep digits, dot, comma and minus sign; remove other characters
    const cleaned = withLatinDigits.replace(/[^0-9.,-]/g, '')

    // Treat commas as thousands separators: remove them
    const normalized = cleaned.replace(/,/g, '')

    const num = Number(normalized)
    return Number.isFinite(num) ? num : 0
  }, [])

  const cartItemUnitLabel = useCallback((item) => item.purchase_unit_label || getUnitLabel(item.purchase_unit, isBangla), [isBangla])
  const cartItemConversionLabel = useCallback((item) => item.conversion_label || getLocalizedConversionLabel({ code: item.purchase_unit, pieces_per_unit: item.pieces_per_unit }, isBangla), [isBangla])
  const cartItemStockUnitLabel = useCallback((item) => Number(item.pieces_per_unit || 1) === 1 ? cartItemUnitLabel(item) : getUnitLabel('piece', isBangla), [cartItemUnitLabel, isBangla])
  const cartItemProductName = useCallback((item) => (isBangla ? item.product_name_bn || item.product_name : item.product_name), [isBangla])
  const cartItemGenericName = useCallback((item) => (isBangla ? item.generic_name_bn || item.generic_name : item.generic_name), [isBangla])

  const loadPricing = useCallback(async function loadPricing(nextAreaId, { silent = false } = {}) {
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
      })
      return null
    }

    try {
      const { data } = await orderApi.quote({
        delivery_area_id: Number(nextAreaId),
      })

      setPricing(data.data)
      return data.data
    } catch (error) {
      if (!silent) {
        toast.error(error.response?.data?.message || t('কার্ট সারসংক্ষেপ আপডেট করা যায়নি।', 'Cart summary could not be updated.'))
      }
      return null
    }
  }, [cart?.subtotal, items.length, t])

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
      .catch(() => toast.error(t('ডেলিভারি এলাকা লোড করা যায়নি।', 'Delivery areas could not be loaded.')))
  }, [draft.deliveryAreaId, items.length, t])

  useEffect(() => {
    if (!items.length || !selectedDeliveryArea) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPricing(selectedDeliveryArea.id, { silent: true })
  }, [items.length, loadPricing, cart?.subtotal, selectedDeliveryArea])

  const updateQuantity = async (item, quantity) => {
    if (quantity < 1) return
    setUpdatingId(item.cart_item_id)
    try {
      await updateCartItem(item.cart_item_id, { quantity })
    } catch (error) {
      toast.error(error.response?.data?.message || t('পরিমাণ হালনাগাদ করা যায়নি।', 'Quantity could not be updated.'))
    } finally {
      setUpdatingId(null)
    }
  }

  const remove = async (item) => {
    const result = await Swal.fire({
      title: t('এই আইটেমটি কার্ট থেকে সরাবেন?', 'Remove this item from the cart?'),
      text: cartItemProductName(item),
      showCancelButton: true,
      confirmButtonText: t('সরান', 'Remove'),
      cancelButtonText: t('বাতিল', 'Cancel'),
    })

    if (!result.isConfirmed) return

    await removeCartItem(item.cart_item_id)
    toast.success(t('আইটেমটি কার্ট থেকে সরানো হয়েছে।', 'Item removed from the cart.'))
  }

  const clear = async () => {
    const result = await Swal.fire({
      title: t('সারা কার্ট মুছবেন?', 'Clear the full cart?'),
      showCancelButton: true,
      confirmButtonText: t('কার্ট মুছুন', 'Clear cart'),
      cancelButtonText: t('বাতিল', 'Cancel'),
      confirmButtonColor: '#dc2626',
    })

    if (!result.isConfirmed) return

    await clearCart()
    toast.success(t('কার্ট সফলভাবে মুছে ফেলা হয়েছে।', 'Cart cleared successfully.'))
  }

  const pageLoading = authLoading || (cartLoading && !cart)
  const subtotal = Number(pricing?.subtotal_amount ?? cart?.subtotal ?? 0)
  const deliveryCharge = Number(pricing?.delivery_charge ?? selectedDeliveryArea?.delivery_charge ?? 0)
  const total = Number(pricing?.total_amount ?? Math.max(0, subtotal + deliveryCharge))

  const handleDeliveryAreaChange = async (value) => {
    setDeliveryAreaId(value)
    writeCheckoutDraft({ deliveryAreaId: value })
    await loadPricing(value, { silent: true })
  }

  return (
    <>
      <PageHeader title={t('কার্ট', 'Cart')} />

      {pageLoading ? <p className="text-slate-500">{t('কার্ট লোড হচ্ছে...', 'Loading cart...')}</p> : null}
      {!pageLoading && items.length === 0 ? <EmptyState title={t('কার্ট খালি', 'Cart is empty')} text={t('পণ্য যোগ করুন, সেগুলো এখানে দেখা যাবে।', 'Add products and they will appear here.')} /> : null}

      {items.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px] xl:gap-6">
          <section className="space-y-4">
            <div className="hidden gap-4 md:grid md:grid-cols-3">
              <MiniStat label={t('আইটেম সংখ্যা', 'Line items')} value={formatNumber(items.length)} icon={FiShoppingCart} />
              <MiniStat label={t('নির্বাচিত ইউনিট', 'Selected units')} value={formatNumber(totalQuantity)} icon={GrCheckboxSelected} />
              <MiniStat label={t('প্রেসক্রিপশন আইটেম', 'Prescription items')} value={hasPrescription ? t('হ্যাঁ', 'Yes') : t('না', 'No')} icon={FaFilePrescription} tone={hasPrescription ? 'danger' : 'default'} />
            </div>

            {hasPrescription ? (
              <div className="border border-amber-200 bg-amber-50 p-3 text-sm leading-7 text-amber-800">
                <span className="font-semibold">{t('নোট:', 'Note:')}</span> {t('এই কার্টে প্রেসক্রিপশন পণ্য আছে। চেকআউটের আগে একটি অনুমোদিত প্রেসক্রিপশন আপলোড বা নির্বাচন করুন।', 'This cart contains prescription products. Please upload or select an approved prescription before checkout.')}
              </div>
            ) : null}

            {filteredWarnings.length > 0 ? (
              <div className="border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-800">
                {filteredWarnings.map((warning) => <p key={warning}>{warning}</p>)}
              </div>
            ) : null}

            <div className="border border-slate-200 bg-white shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
              {items.map((item) => {
                const image = resolveImageUrl(item.thumbnail_url || item.image_url)

                return (
                  <div key={item.cart_item_id} className="grid grid-cols-[70px_minmax(0,1fr)] gap-3 border-b border-slate-200 p-3 last:border-b-0 sm:p-5 lg:grid-cols-[84px_1fr_160px_140px] lg:items-center lg:gap-5">
                    <div className="overflow-hidden border border-slate-200 bg-slate-50">
                      {image ? (
                        <OptimizedImage className="h-18 w-full object-cover sm:h-21" src={image} alt={cartItemProductName(item)} onError={handleImageFallback} />
                      ) : (
                        <div className="flex h-18 items-center justify-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 sm:h-21">Rx</div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="line-clamp-1 text-sm font-semibold leading-5 text-slate-950 sm:text-lg">{cartItemProductName(item)}</h2>
                        {item.requires_prescription ? (
                          <span
                            className="hidden items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-700 sm:inline-flex"
                            aria-label={t('এই পণ্যের জন্য প্রেসক্রিপশন প্রয়োজন', 'This product requires a prescription')}
                          >
                            <PiPrescriptionBold className="h-3.5 w-3.5" />
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500 sm:mt-1 sm:text-sm">{cartItemGenericName(item) || '-'} {item.strength || ''} {item.dosage_form || ''}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] sm:mt-3 sm:gap-2 sm:text-xs">
                        <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">{cartItemUnitLabel(item)}</span>
                        <span className="hidden border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600 sm:inline-flex">{cartItemConversionLabel(item)}</span>
                        <span className="hidden border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600 sm:inline-flex">{t('স্টক', 'Stock')} {item.available_stock.toLocaleString(locale)} {cartItemStockUnitLabel(item)}</span>
                      </div>
                      <p className="mt-2 hidden text-xs leading-6 text-slate-500 sm:block">{t('এই ইউনিটে সর্বোচ্চ:', 'Maximum in this unit:')} {item.available_quantity.toLocaleString(locale)} {cartItemUnitLabel(item)}</p>
                    </div>

                    <div className="col-span-2 border-t border-slate-200 pt-3 lg:col-span-1 lg:border-t-0 lg:pt-0">
                      <div className="flex items-center justify-between gap-3 lg:block">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t('পরিমাণ', 'Quantity')}</div>
                        <div className="mt-0 flex items-center gap-1.5 lg:mt-3 lg:gap-2">
                        <button className="flex h-8.5 w-8.5 items-center justify-center border border-slate-300 bg-white text-base text-slate-900 sm:h-10 sm:w-10 sm:text-lg" disabled={updatingId === item.cart_item_id} onClick={() => updateQuantity(item, item.quantity - 1)}>
                          <FiMinus />
                        </button>
                        <input
                          inputMode="numeric"
                          className="h-8.5 w-14 border border-slate-300 bg-white text-center text-sm text-slate-900 outline-none sm:h-10 sm:w-20"
                          value={formatNumber(item.quantity)}
                          onChange={(event) => updateQuantity(item, parseNumber(event.target.value))}
                        />
                        <button className="flex h-8.5 w-8.5 items-center justify-center border border-slate-300 bg-white text-base text-slate-900 sm:h-10 sm:w-10 sm:text-lg" disabled={updatingId === item.cart_item_id || item.quantity >= item.available_quantity} onClick={() => updateQuantity(item, item.quantity + 1)}>
                          <FiPlus />
                        </button>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 border-t border-slate-200 pt-3 text-left lg:col-span-1 lg:border-t-0 lg:pt-0 lg:text-right">
                      <div className="flex items-start justify-between gap-3 lg:block">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t('সাবটোটাল', 'Subtotal')}</div>
                          <div className="mt-1 text-lg font-semibold text-slate-950 sm:mt-1.5 sm:text-2xl">{formatMoney(item.subtotal)}</div>
                          <div className="mt-0.5 text-[11px] text-slate-500 sm:mt-1 sm:text-xs">{formatMoney(item.unit_price)} / {cartItemUnitLabel(item)}</div>
                          <div className="mt-1 hidden text-xs text-slate-500 sm:block">{formatNumber(item.piece_quantity)} {t('মোট পিস', 'pieces total')}</div>
                        </div>
                        <button className="shrink-0 border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 sm:px-3 sm:py-2 sm:text-sm lg:mt-3" onClick={() => remove(item)}>
                          {t('সরান', 'Remove')}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] sm:p-6 xl:sticky xl:top-24 xl:self-start">
              <div className="border-b border-slate-200 pb-4">
                <p className="text-sm text-center font-semibold uppercase tracking-[0.18em] text-emerald-600">{t('কার্টের সারসংক্ষেপ', 'Cart summary')}</p>
                {/* <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Ready for checkout.</h2> */}
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t('ডেলিভারি এলাকা', 'Delivery area')}</label>
                  <select
                    value={deliveryAreaId}
                    onChange={(event) => handleDeliveryAreaChange(event.target.value)}
                    className="mt-2 w-full border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none"
                  >
                    <option value="">{deliveryAreas.length ? t('একটি ডেলিভারি এলাকা নির্বাচন করুন', 'Select a delivery area') : t('ডেলিভারি এলাকা লোড হচ্ছে...', 'Loading delivery areas...')}</option>
                    {deliveryAreas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {isBangla ? (area.area_name_bn || area.area_name) : area.area_name}, {isBangla ? (area.city_bn || area.city) : area.city} - {formatMoney(area.delivery_charge)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-between"><span>{t('আইটেম সাবটোটাল', 'Items subtotal')}</span><span>{formatMoney(subtotal)}</span></div>
                <div className="flex justify-between"><span>{t('ডেলিভারি চার্জ', 'Delivery charge')}</span><span>{formatMoney(deliveryCharge)}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-950">
                  <span>{t('সর্বমোট (আনুমানিক)', 'Estimated total')}</span>
                  <span>{formatMoney(total)}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <Link to="/checkout" className="flex items-center justify-between bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  {t('চেকআউটে যান', 'Continue to checkout')}
                  <FiArrowRight className="h-4 w-4" />
                </Link>
                <button className="border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700" onClick={clear}>
                  {t('পণ্যগুলো মুছুন', 'Clear full cart')}
                </button>
              </div>              
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}

function MiniStat({ label, value, icon: Icon, tone = 'default' }) {
  const danger = tone === 'danger'

  return (
    <div className={`border p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] ${danger ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center gap-2">
        <div className={`inline-flex h-6 w-6 items-center justify-center text-slate-950`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className={`text-sm `}>
          {label}
        </div>
      </div>

      <div className={`mt-3 ml-2 text-2xl font-semibold ${danger ? 'text-rose-700' : 'text-slate-950'}`}>
        {value}
      </div>
    </div>
      )
    }
