import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
// import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'
import { getOrderStatusLabel } from '../../utils/statusLabels'

const labels = {
  total_users: 'Total Customers',
  total_orders: 'Total Orders',
  today_orders: 'Today\'s Orders',
  total_revenue: 'Total Revenue',
  pending_prescription_reviews: 'Pending Prescriptions',
  pending_deliveries: 'Pending Deliveries',
  low_stock_batches: 'Low-Stock Batches',
  near_expiry_batches: 'Near-Expiry Batches',
  open_support_tickets: 'Open Support Tickets',
  pending_return_requests: 'Pending Returns',
}
const DASHBOARD_CACHE_KEY = 'admin_dashboard_payload_v1'
const DASHBOARD_CACHE_TTL = 2 * 60 * 1000
const statStyles = {
  emerald: {
    panel: 'border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#d1fae5_100%)] shadow-[0_18px_45px_-34px_rgba(16,185,129,0.9)]',
    bubble: 'from-white/80 via-emerald-100 to-emerald-300/80 shadow-[-14px_18px_34px_-24px_rgba(5,150,105,0.9),inset_12px_-12px_24px_rgba(5,150,105,0.22),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
    value: 'text-emerald-700',
  },
  sky: {
    panel: 'border-sky-200 bg-[linear-gradient(135deg,#f0f9ff_0%,#dbeafe_100%)] shadow-[0_18px_45px_-34px_rgba(14,165,233,0.9)]',
    bubble: 'from-white/80 via-sky-100 to-sky-300/80 shadow-[-14px_18px_34px_-24px_rgba(2,132,199,0.9),inset_12px_-12px_24px_rgba(2,132,199,0.22),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
    value: 'text-sky-700',
  },
  violet: {
    panel: 'border-violet-200 bg-[linear-gradient(135deg,#f5f3ff_0%,#ede9fe_100%)] shadow-[0_18px_45px_-34px_rgba(139,92,246,0.9)]',
    bubble: 'from-white/80 via-violet-100 to-violet-300/80 shadow-[-14px_18px_34px_-24px_rgba(124,58,237,0.9),inset_12px_-12px_24px_rgba(124,58,237,0.22),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
    value: 'text-violet-700',
  },
  amber: {
    panel: 'border-amber-200 bg-[linear-gradient(135deg,#fffbeb_0%,#fef3c7_100%)] shadow-[0_18px_45px_-34px_rgba(245,158,11,0.9)]',
    bubble: 'from-white/80 via-amber-100 to-amber-300/80 shadow-[-14px_18px_34px_-24px_rgba(217,119,6,0.9),inset_12px_-12px_24px_rgba(217,119,6,0.22),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
    value: 'text-amber-700',
  },
  rose: {
    panel: 'border-rose-200 bg-[linear-gradient(135deg,#fff1f2_0%,#ffe4e6_100%)] shadow-[0_18px_45px_-34px_rgba(244,63,94,0.75)]',
    bubble: 'from-white/80 via-rose-100 to-rose-300/80 shadow-[-14px_18px_34px_-24px_rgba(225,29,72,0.75),inset_12px_-12px_24px_rgba(225,29,72,0.2),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
    value: 'text-rose-700',
  },
}
const statVariants = {
  total_users: 'emerald',
  total_orders: 'sky',
  today_orders: 'violet',
  total_revenue: 'emerald',
  pending_prescription_reviews: 'amber',
  pending_deliveries: 'sky',
  low_stock_batches: 'rose',
  near_expiry_batches: 'amber',
  open_support_tickets: 'violet',
  pending_return_requests: 'rose',
}

function getCachedDashboard() {
  if (typeof window === 'undefined') return null

  try {
    const cached = JSON.parse(window.sessionStorage.getItem(DASHBOARD_CACHE_KEY) || 'null')
    if (!cached || Date.now() - cached.cachedAt > DASHBOARD_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

function setCachedDashboard(payload) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({ payload, cachedAt: Date.now() }))
  } catch {
    // Ignore storage issues.
  }
}

function listFrom(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (payload && typeof payload === 'object') return Object.values(payload)
  return []
}

export default function Dashboard() {
  const cachedDashboard = getCachedDashboard()
  const [summary, setSummary] = useState(cachedDashboard?.summary || {})
  const [orders, setOrders] = useState(cachedDashboard?.orders || [])
  const [prescriptions, setPrescriptions] = useState(cachedDashboard?.prescriptions || [])
  const [lowStock, setLowStock] = useState(cachedDashboard?.lowStock || [])
  const [nearExpiry, setNearExpiry] = useState(cachedDashboard?.nearExpiry || [])
  const [loading, setLoading] = useState(!cachedDashboard)

  useEffect(() => {
    if (cachedDashboard) return

    Promise.all([
      adminApi.dashboardSummary(),
      adminApi.listFresh('orders', { per_page: 10 }),
      adminApi.listFresh('prescriptions', { status: 'pending', per_page: 10 }),
      adminApi.dashboardLowStock(),
      adminApi.dashboardNearExpiry(),
    ]).then(([summaryRes, orderRes, prescriptionRes, lowStockRes, nearExpiryRes]) => {
      const payload = {
        summary: summaryRes.data.data || {},
        orders: listFrom(orderRes.data.data?.data || orderRes.data.data),
        prescriptions: listFrom(prescriptionRes.data.data?.data || prescriptionRes.data.data),
        lowStock: listFrom(lowStockRes.data.data),
        nearExpiry: listFrom(nearExpiryRes.data.data),
      }

      setSummary(payload.summary)
      setOrders(payload.orders)
      setPrescriptions(payload.prescriptions)
      setLowStock(payload.lowStock)
      setNearExpiry(payload.nearExpiry)
      setCachedDashboard(payload)
    }).catch(() => toast.error('Unable to load dashboard data.')).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <AdminLoadingState inline size={180} />
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Object.entries(labels).map(([key, label]) => (
          <StatCard key={key} label={label} value={key === 'total_revenue' ? money(summary[key]) : summary[key] ?? 0} variant={statVariants[key]} />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Recent Orders" count={orders.length} to="/admin/orders">
          {orders.map((order) => <Row key={order.id} title={order.order_number} meta={`${order.customer_name || order.user?.full_name || '-'} - ${getOrderStatusLabel(order.order_status)}`} value={money(order.total_amount)} />)}
        </Panel>
        <Panel title="Pending Prescriptions" count={prescriptions.length} to="/admin/prescriptions">
          {prescriptions.map((item) => <Row key={item.id} title={item.prescription_code || `Prescription #${item.id}`} meta={item.user?.full_name || 'Guest customer'} value={date(item.uploaded_at, 'en-US')} />)}
        </Panel>
        <Panel title="Low Stock" count={lowStock.length} to="/admin/inventory/low-stock">
          {lowStock.map((item) => <Row key={item.id} title={item.product_name} meta={item.batch_number} value={item.available_stock} />)}
        </Panel>
        <Panel title="Near Expiry" count={nearExpiry.length} to="/admin/inventory/near-expiry">
          {nearExpiry.map((item) => <Row key={item.id} title={item.product_name} meta={item.batch_number} value={date(item.expiry_date, 'en-US')} />)}
        </Panel>
      </div>
    </>
  )
}

function Panel({ title, count, to, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        {to ? <Link to={to} className="shrink-0 text-sm font-semibold text-emerald-700 hover:text-emerald-800">View all</Link> : null}
      </div>
      <div className="space-y-2">{count > 0 ? children : <p className="text-sm text-slate-500">No data found.</p>}</div>
    </section>
  )
}

function StatCard({ label, value, variant = 'emerald' }) {
  const style = statStyles[variant] || statStyles.emerald

  return (
    <div className={`relative overflow-hidden rounded-lg border p-4 ${style.panel}`}>
      <span className={`pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-linear-to-br ${style.bubble}`}>
        <span className="absolute left-5 top-5 h-5 w-5 rounded-full bg-white/70 blur-[1px]" />
      </span>
      <p className="relative text-xs font-medium text-slate-500">{label}</p>
      <p className={`relative mt-2 text-2xl font-semibold ${style.value}`}>{value}</p>
    </div>
  )
}

function Row({ title, meta, value }) {
  return <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"><div><p className="font-medium text-slate-950">{title}</p><p className="text-xs text-slate-500">{meta}</p></div><span className="font-semibold text-slate-700">{value}</span></div>
}
