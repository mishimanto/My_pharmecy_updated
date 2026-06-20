import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiClock, FiPackage, FiTruck } from 'react-icons/fi'
import { orderApi } from '../../api/orderApi'
import PageHeader from '../../components/common/PageHeader'
import { useLanguage } from '../../context/LanguageContext'
import { readCustomerCache, writeCustomerCache } from '../../utils/customerDataCache'
import { date, money } from '../../utils/formatters'
import { getOrderPath } from '../../utils/orderRouting'
import { getDeliveryStatusLabel, getOrderStatusLabel, getPaymentStatusLabel } from '../../utils/statusLabels'

const ORDERS_CACHE_KEY = 'orders_list'

export default function MyOrders() {
  const { isBangla } = useLanguage()
  const t = (bn, en) => (isBangla ? bn : en)
  const locale = isBangla ? 'bn-BD' : 'en-US'
  const [orders, setOrders] = useState(() => readCustomerCache(ORDERS_CACHE_KEY, []))
  const [loading, setLoading] = useState(() => readCustomerCache(ORDERS_CACHE_KEY, null) === null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    orderApi.list()
      .then((res) => {
        const nextOrders = res.data.data?.data || []
        setOrders(nextOrders)
        writeCustomerCache(ORDERS_CACHE_KEY, nextOrders)
      })
      .catch(() => toast.error(t('অর্ডার হিস্টোরি লোড করা যায়নি।', 'Order history could not be loaded.')))
      .finally(() => setLoading(false))
  }, [isBangla])

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
        action={(
          <Link to="/track-order" className="border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            {t('অর্ডার ট্র্যাক', 'Track order')}
          </Link>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label={t('মোট অর্ডার', 'Total orders')} value={formatNumber(summary.total)} icon={FiPackage} tone="slate" />
        <SummaryCard label={t('চলমান অর্ডার', 'Active orders')} value={formatNumber(summary.active)} icon={FiClock} tone="sky" />
        <SummaryCard label={t('ডেলিভারড', 'Delivered')} value={formatNumber(summary.delivered)} icon={FiTruck} tone="emerald" />
        <SummaryCard label={t('ডেলিভারি অপেক্ষায়', 'Pending delivery')} value={formatNumber(summary.pendingDelivery)} icon={FiArrowRight} tone="amber" />
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
                  <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    {getOrderStatusLabel(order.order_status, isBangla)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  {date(order.order_date, locale)} • {formatNumber(order.items?.length || 0)} {t('লাইন আইটেম', 'line items')}
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t('পেমেন্ট', 'Payment')}</div>
                <div className="mt-2 text-sm font-semibold text-slate-950">{getPaymentStatusLabel(order.payment_status, isBangla)}</div>
                <div className="mt-1 text-xs text-slate-500">{paymentMethodLabel(order.payment_method)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t('ডেলিভারি', 'Delivery')}</div>
                <div className="mt-2 text-sm font-semibold text-slate-950">{getDeliveryStatusLabel(order.delivery?.delivery_status, isBangla)}</div>
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
      icon: 'border-slate-200 bg-slate-50 text-slate-700',
      label: 'text-slate-500',
    },
    sky: {
      panel: 'border-sky-200 bg-[linear-gradient(180deg,#f8fdff_0%,#eef8ff_100%)]',
      icon: 'border-sky-200 bg-white text-sky-700',
      label: 'text-sky-700',
    },
    emerald: {
      panel: 'border-emerald-200 bg-[linear-gradient(180deg,#f8fffb_0%,#edfdf5_100%)]',
      icon: 'border-emerald-200 bg-white text-emerald-700',
      label: 'text-emerald-700',
    },
    amber: {
      panel: 'border-amber-200 bg-[linear-gradient(180deg,#fffdf7_0%,#fff7e8_100%)]',
      icon: 'border-amber-200 bg-white text-amber-700',
      label: 'text-amber-700',
    },
  }

  const styles = tones[tone] || tones.slate

  return (
    <div className={`border p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] ${styles.panel}`}>
      <div className={`inline-flex h-10 w-10 items-center justify-center border ${styles.icon}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className={`mt-4 text-sm font-medium ${styles.label}`}>{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-950">{value}</div>
    </div>
  )
}
