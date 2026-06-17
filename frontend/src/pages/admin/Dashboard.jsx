import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
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

export default function Dashboard() {
  const [summary, setSummary] = useState({})
  const [orders, setOrders] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [nearExpiry, setNearExpiry] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.dashboardSummary(),
      adminApi.dashboardRecentOrders(),
      adminApi.dashboardPendingPrescriptions(),
      adminApi.dashboardLowStock(),
      adminApi.dashboardNearExpiry(),
    ]).then(([summaryRes, orderRes, prescriptionRes, lowStockRes, nearExpiryRes]) => {
      setSummary(summaryRes.data.data || {})
      setOrders(orderRes.data.data || [])
      setPrescriptions(prescriptionRes.data.data || [])
      setLowStock(lowStockRes.data.data || [])
      setNearExpiry(nearExpiryRes.data.data || [])
    }).catch(() => toast.error('Unable to load dashboard data.')).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Object.entries(labels).map(([key, label]) => (
          <div key={key} className="rounded-lg shadow-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{key === 'total_revenue' ? money(summary[key]) : summary[key] ?? 0}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Recent Orders">
          {orders.map((order) => <Row key={order.id} title={order.order_number} meta={`${order.customer_name || order.user?.full_name || '-'} - ${getOrderStatusLabel(order.order_status)}`} value={money(order.total_amount)} />)}
        </Panel>
        <Panel title="Pending Prescriptions">
          {prescriptions.map((item) => <Row key={item.id} title={`Prescription #${item.id}`} meta={item.user?.full_name || '-'} value={date(item.uploaded_at, 'en-US')} />)}
        </Panel>
        <Panel title="Low Stock">
          {lowStock.map((item) => <Row key={item.id} title={item.product_name} meta={item.batch_number} value={item.available_stock} />)}
        </Panel>
        <Panel title="Near Expiry">
          {nearExpiry.map((item) => <Row key={item.id} title={item.product_name} meta={item.batch_number} value={date(item.expiry_date, 'en-US')} />)}
        </Panel>
      </div>
    </>
  )
}

function Panel({ title, children }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-4"><h2 className="mb-3 text-lg font-semibold text-slate-950">{title}</h2><div className="space-y-2">{children || <p className="text-sm text-slate-500">No data found.</p>}</div></section>
}

function Row({ title, meta, value }) {
  return <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"><div><p className="font-medium text-slate-950">{title}</p><p className="text-xs text-slate-500">{meta}</p></div><span className="font-semibold text-slate-700">{value}</span></div>
}
