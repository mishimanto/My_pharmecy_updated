import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiCheckCircle, FiClock, FiPackage, FiTruck } from 'react-icons/fi'
import PageHeader from '../../components/common/PageHeader'
import { useLanguage } from '../../context/LanguageContext'
import { useOrdersQuery } from '../../queries/customerQueries'
import { date, money } from '../../utils/formatters'
import { getOrderPath } from '../../utils/orderRouting'
import { getDeliveryStatusLabel, getOrderStatusLabel, getPaymentStatusLabel } from '../../utils/statusLabels'

function statusTextClass(status, fallback = 'text-slate-950') {
  const value = String(status || '').toLowerCase()

  if (['delivered', 'paid', 'completed', 'refunded'].includes(value)) return 'text-emerald-700'
  if (['cancelled', 'failed', 'returned', 'rejected', 'unpaid'].includes(value)) return 'text-rose-700'
  if (['pending_confirmation', 'prescription_review', 'awaiting_proof', 'pending'].includes(value)) return 'text-amber-700'
  if (['confirmed', 'processing', 'under_review', 'assigned', 'picked_up', 'out_for_delivery'].includes(value)) return 'text-sky-700'

  return fallback
}

function orderStatusBadgeClass(status) {
  const value = String(status || '').toLowerCase()

  if (['delivered', 'refunded'].includes(value)) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (['cancelled', 'returned'].includes(value)) return 'border-rose-200 bg-rose-50 text-rose-700'
  if (['pending_confirmation', 'prescription_review'].includes(value)) return 'border-amber-200 bg-amber-50 text-amber-700'
  if (['confirmed', 'processing', 'out_for_delivery'].includes(value)) return 'border-sky-200 bg-sky-50 text-sky-700'

  return 'border-slate-200 bg-slate-50 text-slate-600'
}

export default function MyOrders() {
  const { isBangla } = useLanguage()
  const t = (bn, en) => (isBangla ? bn : en)
  const locale = isBangla ? 'bn-BD' : 'en-US'
  const [filter, setFilter] = useState('all')
  const ordersQuery = useOrdersQuery({ placeholderData: (previous) => previous })
  const orders = useMemo(() => (Array.isArray(ordersQuery.data) ? ordersQuery.data : []), [ordersQuery.data])
  const loading = ordersQuery.isLoading

  useEffect(() => {
    if (ordersQuery.isError) {
      toast.error(t('অর্ডার হিস্টোরি লোড করা যায়নি।', 'Order history could not be loaded.'))
    }
  }, [ordersQuery.isError, t])

  const filters = useMemo(() => ([
    ['all', t('সব অর্ডার', 'All orders')],
    ['active', t('চলমান', 'Active')],
    ['completed', t('সম্পন্ন', 'Completed')],
    ['issue', t('সমস্যার অর্ডার', 'Problem orders')],
  ]), [isBangla])

  const summary = useMemo(() => ({
    total: orders.length,
    active: orders.filter((order) => !['delivered', 'cancelled', 'returned', 'refunded'].includes(order.order_status)).length,
    delivered: orders.filter((order) => order.order_status === 'delivered').length,
    pendingDelivery: orders.filter((order) => ['confirmed', 'processing'].includes(order.order_status)).length,
  }), [orders])

  const visibleOrders = useMemo(() => {
    if (filter === 'active') {
      return orders.filter((order) => !['delivered', 'cancelled', 'returned', 'refunded'].includes(order.order_status))
    }
    if (filter === 'completed') {
      return orders.filter((order) => order.order_status === 'delivered')
    }
    if (filter === 'issue') {
      return orders.filter((order) => ['cancelled', 'returned', 'refunded'].includes(order.order_status))
    }
    return orders
  }, [filter, orders])

  const paymentMethodLabel = (method) => {
    if (method === 'COD') {
      return t('ক্যাশ অন ডেলিভারি', 'Cash on delivery')
    }

    if (method === 'BKASH') return 'bKash'
    if (method === 'NAGAD') return 'Nagad'
    return method || '-'
  }

  const formatNumber = (value) => new Intl.NumberFormat(locale).format(Number(value || 0))
  const formatMoney = (value) => money(value, locale)

  return (
    <>
      <PageHeader
        title={t('আমার অর্ডার', 'My orders')}
        className="flex-row items-center justify-between"
        action={(
          <Link to="/track-order" className="shrink-0 border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 sm:px-4">
            {t('অর্ডার ট্র্যাক', 'Track order')}
          </Link>
        )}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
        <SummaryCard label={t('মোট অর্ডার', 'Total orders')} value={formatNumber(summary.total)} icon={FiPackage} tone="slate" />
        <SummaryCard label={t('চলমান অর্ডার', 'Active orders')} value={formatNumber(summary.active)} icon={FiCheckCircle} tone="sky" />
        <SummaryCard label={t('ডেলিভারড', 'Delivered')} value={formatNumber(summary.delivered)} icon={FiTruck} tone="emerald" />
        <SummaryCard label={t('ডেলিভারি অপেক্ষায়', 'Pending delivery')} value={formatNumber(summary.pendingDelivery)} icon={FiClock} tone="amber" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`px-4 py-2 text-sm font-medium transition ${filter === value ? 'bg-slate-950 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <p className="mt-6 text-sm text-slate-500">{t('অর্ডার লোড হচ্ছে...', 'Loading orders...')}</p> : null}
      {!loading && !visibleOrders.length ? (
        <div className="mt-6 border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
          {t('এই ফিল্টারের জন্য কোনো অর্ডার পাওয়া যায়নি।', 'No orders found for this filter.')}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {visibleOrders.map((order) => (
          <Link key={order.id} to={getOrderPath(order)} className="block border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5">
            <div className="grid gap-4 xl:grid-cols-[1fr_160px_160px_140px_auto] xl:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-slate-950">{order.order_number}</p>
                  <span className={`border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${orderStatusBadgeClass(order.order_status)}`}>
                    {getOrderStatusLabel(order.order_status, isBangla)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  {date(order.order_date, locale)} • {formatNumber(order.items?.length || 0)} {t('লাইন আইটেম', 'line items')}
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t('পেমেন্ট', 'Payment')}</div>
                <div className={`mt-2 text-sm font-semibold ${statusTextClass(order.payment_status)}`}>{getPaymentStatusLabel(order.payment_status, isBangla)}</div>
                <div className="mt-1 text-xs text-slate-500">{paymentMethodLabel(order.payment_method)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t('ডেলিভারি', 'Delivery')}</div>
                <div className={`mt-2 text-sm font-semibold ${statusTextClass(order.delivery?.delivery_status)}`}>{getDeliveryStatusLabel(order.delivery?.delivery_status, isBangla)}</div>
                <div className="mt-1 text-xs text-slate-500">{order.shipping_address || t('বিস্তারিততে ঠিকানা আছে', 'Address available in details')}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t('মোট', 'Total')}</div>
                <div className="mt-2 text-lg font-semibold text-slate-950">{formatMoney(order.total_amount)}</div>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                {t('খুলুন', 'Open')}
                <FiArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

function SummaryCard({ label, value, icon: Icon, tone = 'slate' }) {
  const tones = {
    slate: {
      panel: 'border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]',
      icon: 'text-slate-700',
      label: 'text-slate-500',
    },
    sky: {
      panel: 'border-sky-200 bg-[linear-gradient(180deg,#f8fdff_0%,#eef8ff_100%)]',
      icon: 'text-sky-700',
      label: 'text-sky-700',
    },
    emerald: {
      panel: 'border-emerald-200 bg-[linear-gradient(180deg,#f8fffb_0%,#edfdf5_100%)]',
      icon: ' text-emerald-700',
      label: 'text-emerald-700',
    },
    amber: {
      panel: 'border-amber-200 bg-[linear-gradient(180deg,#fffdf7_0%,#fff7e8_100%)]',
      icon: 'text-amber-700',
      label: 'text-amber-700',
    },
  }

  const styles = tones[tone] || tones.slate

  return (
    <div className={`border p-3 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] sm:p-5 ${styles.panel}`}>
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className={`text-xs font-medium leading-5 sm:text-sm ${styles.label}`}>{label}</div>
          <div className="mt-1.5 text-xl font-semibold text-slate-950 sm:mt-2 sm:text-3xl">{value}</div>
        </div>
        <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center sm:h-10 sm:w-10 ${styles.icon}`}>
          <Icon className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
        </div>
      </div>
    </div>
  )
}
