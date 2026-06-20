import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiMapPin,
  FiPackage,
  FiTruck,
} from 'react-icons/fi'
import { orderApi } from '../../api/orderApi'
import PageHeader from '../../components/common/PageHeader'
import { useLanguage } from '../../context/LanguageContext'
import { date, money } from '../../utils/formatters'
import { getOrderPath } from '../../utils/orderRouting'
import { getDeliveryStatusLabel, getOrderStatusLabel, getPaymentStatusLabel } from '../../utils/statusLabels'
import { getUnitLabel } from '../../utils/purchaseUnits'
import { readCustomerCache, writeCustomerCache } from '../../utils/customerDataCache'

const cancellable = ['pending_confirmation', 'prescription_review']

export default function OrderDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isBangla } = useLanguage()
  const t = useCallback((bn, en) => (isBangla ? bn : en), [isBangla])
  const locale = isBangla ? 'bn-BD' : 'en-US'
  const cacheKey = `order_details_${id}`
  const [order, setOrder] = useState(() => readCustomerCache(cacheKey, null))
  const [loading, setLoading] = useState(() => readCustomerCache(cacheKey, null) === null)

  useEffect(() => {
    let mounted = true
    setLoading((prev) => (prev || readCustomerCache(cacheKey, null) === null))

    orderApi.show(id)
      .then((res) => {
        if (!mounted) return
        const orderData = res.data.data
        setOrder(orderData)
        writeCustomerCache(cacheKey, orderData)
      })
      .catch(() => mounted && toast.error(t('অর্ডারের বিস্তারিত লোড করা যায়নি।', 'Order details could not be loaded.')))
      .finally(() => mounted && setLoading(false))

    return () => { mounted = false }
  }, [id, t, cacheKey])

  const cancelOrder = async () => {
    const result = await Swal.fire({
      title: t('এই অর্ডার বাতিল করবেন?', 'Cancel this order?'),
      text: t('অ্যাডমিন কনফার্ম করার আগে এই অর্ডার বাতিল করা যাবে।', 'This order can be cancelled before admin confirmation.'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('অর্ডার বাতিল', 'Cancel order'),
      cancelButtonText: t('রেখে দিন', 'Keep order'),
    })

    if (!result.isConfirmed) return

    try {
      const res = await orderApi.cancel(id)
      setOrder(res.data.data)
      toast.success(t('অর্ডার বাতিল হয়েছে।', 'Order cancelled successfully.'))
    } catch (error) {
      toast.error(error.response?.data?.message || t('অর্ডার বাতিল করা যায়নি।', 'Order could not be cancelled.'))
    }
  }

  const formattedDate = useMemo(
    () => date(order?.order_date, locale),
    [locale, order?.order_date],
  )

  const formatMoney = useCallback((value) => money(value, locale), [locale])

  const formatNumber = useCallback((value) => new Intl.NumberFormat(locale).format(Number(value || 0)), [locale])

  if (loading) {
    return (
      <div className="flex min-h-70 items-center justify-center">
        <div className="inline-flex items-center gap-3 px-4 py-3 text-md font-medium text-slate-700">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
          {t('অনুগ্রহ করে অপেক্ষা করুন...', 'Please wait...')}
        </div>
      </div>
    )
  }

  if (!order) {
    return <p className="text-sm text-slate-500">{t('অর্ডার পাওয়া যায়নি।', 'Order not found.')}</p>
  }

  const canOpenPaymentPage = ['BKASH', 'NAGAD'].includes(order.payment_method)
    && ['awaiting_proof', 'under_review', 'failed'].includes(order.payment_status)
  const hasSubmittedTransaction = Boolean(String(order.payment?.transaction_id || '').trim())

  const paymentOverview = getPaymentOverview(order.payment_status, isBangla)
  const paymentMethod = getPaymentMethodLabel(order.payment_method, isBangla)
  const deliveryStatus = getDeliveryStatusLabel(order.delivery?.delivery_status, isBangla)
  const orderStatus = getOrderStatusLabel(order.order_status, isBangla)
  const showMakePayment = !paymentOverview.isSettled && canOpenPaymentPage && !hasSubmittedTransaction

  return (
    <>
      <PageHeader
        title={order.order_number}
        action={(
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(getOrderPath(order, 'tracking'))}
              className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              <FiTruck className="h-4 w-4" />
              {t('ডেলিভারি ট্র্যাকিং', 'Delivery tracking')}
            </button>

            {cancellable.includes(order.order_status) ? (
              <button
                type="button"
                onClick={cancelOrder}
                className="inline-flex items-center gap-2 border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300"
              >
                <FiAlertCircle className="h-4 w-4" />
                {t('অর্ডার বাতিল', 'Cancel order')}
              </button>
            ) : null}
          </div>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <div className="border border-slate-200 bg-white shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <div className="border-b border-slate-200 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                    {t('অর্ডার ও পেমেন্টের তথ্য', 'Order and payment details')}
                  </p>
                </div>
                <div className="inline-flex border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  {orderStatus}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <MetricCard
                  label={t('মোট অর্ডার', 'Order total')}
                  value={formatMoney(order.total_amount)}
                  icon={FiCreditCard}
                  tone="slate"
                />
                <MetricCard
                  label={t('পেমেন্ট মেথড', 'Payment method')}
                  value={paymentMethod}
                  icon={FiClock}
                  tone="amber"
                />
                <MetricCard
                  label={t('ডেলিভারি স্ট্যাটাস', 'Delivery status')}
                  value={deliveryStatus}
                  icon={FiTruck}
                  tone="sky"
                />
              </div>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <InlineInfo
                label={t('অর্ডার তারিখ', 'Order date')}
                value={formattedDate}
              />

              <InlineInfo
                label={t('ট্রানজ্যাকশন আইডি', 'Transaction ID')}
                value={order.payment?.transaction_id || t('জমা দেওয়া হয়নি', 'Not submitted')}
              />
            </div>
          </div>

          <div className="border border-slate-200 bg-white shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <div className="border-b border-slate-200 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                {t('অর্ডার আইটেম', 'Ordered items')}
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              {order.items?.map((item) => {
                const meta = [
                  item.product?.generic_name,
                  item.product?.strength,
                  item.product?.dosage_form,
                ].filter(Boolean).join(' • ')

                return (
                  <div key={item.id} className="grid gap-4 p-6 lg:grid-cols-[minmax(0,1fr)_150px]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-950">
                          {item.product?.product_name || t('নাম পাওয়া যায়নি', 'Product name unavailable')}
                        </h3>
                        {item.product?.requires_prescription ? (
                          <span className="border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                            {t('প্রেসক্রিপশন', 'Prescription')}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        {meta || t('জেনেরিক ও স্ট্রেংথ তথ্য নেই', 'Generic and strength details are not listed.')}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <MetaChip>{formatNumber(item.quantity)} {getUnitLabel(item.purchase_unit, isBangla)}</MetaChip>
                        <MetaChip>{formatNumber(item.piece_quantity || item.quantity)} {t('পিস মোট', 'pieces total')}</MetaChip>
                        <MetaChip>{formatMoney(item.unit_price)} {t('প্রতি ইউনিট', 'each')}</MetaChip>
                      </div>

                      <p className="mt-4 text-xs leading-6 text-slate-500">
                        {t('ব্যাচ এলোকেশন', 'Batch allocation')}: {item.batches?.map((batch) => `${batch.batch?.batch_number} x ${batch.quantity}`).join(', ') || t('উল্লেখ নেই', 'Not listed')}
                      </p>
                    </div>

                    <div className="text-left lg:text-right">
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        {t('মোট', 'Total')}
                      </div>
                      <div className="mt-2 text-2xl font-semibold text-slate-950">
                        {formatMoney(item.subtotal)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <SurfaceCard>
            <SectionHeading eyebrow={t('পেমেন্ট সারাংশ', 'Payment summary')} />

            <div className={`mt-3 border p-5 ${paymentOverview.panelClass}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className={`text-3xl font-semibold ${paymentOverview.textClass}`}>
                    {paymentOverview.label}
                  </div>
                </div>
                {showMakePayment ? (
                  <button
                    type="button"
                    onClick={() => navigate(getOrderPath(order, 'payment'))}
                    className="inline-flex items-center gap-2 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {t('পেমেন্ট করুন', 'Payment')}
                    {/* <FiArrowRight className="h-4 w-4" /> */}
                  </button>
                ) : (
                  <div className={`inline-flex h-11 w-11 items-center justify-center border ${paymentOverview.iconClass}`}>
                    {paymentOverview.isSettled ? <FiCheckCircle className="h-5 w-5" /> : <FiAlertCircle className="h-5 w-5" />}
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-3 border-t border-white/70 pt-4 text-sm text-slate-700">
                <DataRow label={t('পেমেন্ট মেথড', 'Payment method')} value={paymentMethod} />
                <DataRow label={t('রিভিউ স্ট্যাটাস', 'Review status')} value={getPaymentStatusLabel(order.payment_status, isBangla)} />
                <DataRow label={t('অর্ডার টোটাল', 'Order total')} value={formatMoney(order.total_amount)} emphasized />
              </div>
            </div>

            {order.payment?.reviewed_note ? (
              <div className="mt-4 border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-950">{t('রিভিউ নোট', 'Review note')}:</span> {order.payment.reviewed_note}
              </div>
            ) : null}
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeading eyebrow={t('অর্ডার সামারি', 'Order summary')} />

            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <DataRow label={t('সাবটোটাল', 'Subtotal')} value={formatMoney(order.subtotal_amount)} />
              <DataRow label={t('ডেলিভারি চার্জ', 'Delivery charge')} value={formatMoney(order.delivery_charge)} />
              {Number(order.discount_amount || 0) > 0 ? (
                <DataRow label={t('কুপন ডিসকাউন্ট', 'Coupon discount')} value={`-${formatMoney(order.discount_amount)}`} />
              ) : null}
              <DataRow label={t('মোট', 'Total')} value={formatMoney(order.total_amount)} emphasized />
            </div>

            {order.admin_note ? (
              <div className="mt-4 border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-950">{t('অ্যাডমিন নোট', 'Admin note')}:</span> {order.admin_note}
              </div>
            ) : null}

            {order.cancellation_reason ? (
              <div className="mt-4 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <span className="font-semibold">{t('বাতিলের কারণ', 'Cancellation reason')}:</span> {order.cancellation_reason}
              </div>
            ) : null}
          </SurfaceCard>

          <SurfaceCard>
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-slate-50 text-slate-950">
                <FiMapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <SectionHeading
                  eyebrow={t('শিপিং ঠিকানা', 'Shipping address')}
                  title={order.customer_name || t('ডেলিভারি তথ্য', 'Delivery information')}
                />
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {order.shipping_address || t('ঠিকানা পাওয়া যায়নি', 'Address not available')}
                </p>
              </div>
            </div>
          </SurfaceCard>
        </aside>
      </div>
    </>
  )
}

function getPaymentOverview(status, isBangla) {
  const settled = ['paid', 'refunded'].includes(status)

  if (settled) {
    return {
      isSettled: true,
      label: isBangla ? 'পেইড' : 'Paid',
      panelClass: 'border-emerald-200 bg-emerald-50/70',
      iconClass: 'border-emerald-200 bg-white text-emerald-700',
      textClass: 'text-emerald-700',
    }
  }

  return {
    isSettled: false,
    label: isBangla ? 'আনপেইড' : 'Unpaid',
    panelClass: 'border-rose-200 bg-rose-50/70',
    iconClass: 'border-rose-200 bg-white text-rose-700',
    textClass: 'text-rose-700',
  }
}

function getPaymentMethodLabel(method, isBangla) {
  const labels = {
    COD: isBangla ? 'ক্যাশ অন ডেলিভারি' : 'Cash on delivery',
    BKASH: 'bKash',
    NAGAD: 'Nagad',
  }

  return labels[method] || method || '-'
}

function SurfaceCard({ children }) {
  return (
    <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
      {children}
    </div>
  )
}

function SectionHeading({ eyebrow, title }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">{eyebrow}</p>
      {title ? <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2> : null}
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, tone }) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50/60 text-amber-700',
    emerald: 'border-emerald-200 bg-emerald-50/60 text-emerald-700',
    sky: 'border-sky-200 bg-sky-50/60 text-sky-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  }

  return (
    <div className="border border-slate-200 bg-slate-50/40 p-4">
      <div className={`inline-flex h-10 w-10 items-center justify-center border ${tones[tone] || tones.slate}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-950">{value}</div>
    </div>
  )
}

function InlineInfo({ label, value }) {
  return (
    <div className="border border-slate-200 bg-slate-50/60 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-950">{value}</div>
    </div>
  )
}

function MetaChip({ children }) {
  return (
    <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">
      {children}
    </span>
  )
}

function DataRow({ label, value, emphasized = false }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${emphasized ? 'border-t border-slate-200 pt-3 text-base font-semibold text-slate-950' : ''}`}>
      <span>{label}</span>
      <span className={`${emphasized ? 'text-slate-950' : 'text-slate-700'} text-right`}>{value}</span>
    </div>
  )
}
