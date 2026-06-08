import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'

const labels = {
  total_users: 'মোট কাস্টমার',
  total_orders: 'মোট অর্ডার',
  today_orders: 'আজকের অর্ডার',
  total_revenue: 'মোট আয়',
  pending_prescription_reviews: 'পেন্ডিং প্রেসক্রিপশন',
  pending_deliveries: 'পেন্ডিং ডেলিভারি',
  low_stock_batches: 'লো স্টক ব্যাচ',
  near_expiry_batches: 'নিয়ার এক্সপায়ারি',
  open_support_tickets: 'ওপেন সাপোর্ট',
  pending_return_requests: 'পেন্ডিং রিটার্ন',
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
    }).catch(() => toast.error('ড্যাশবোর্ড লোড করা যায়নি।')).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHeader title="ড্যাশবোর্ড" subtitle="অপারেশনাল সারাংশ, পেন্ডিং কাজ এবং স্টক সতর্কতা।" />
      {loading ? <p className="text-sm text-slate-600">লোড হচ্ছে...</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Object.entries(labels).map(([key, label]) => (
          <div key={key} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{key === 'total_revenue' ? money(summary[key]) : summary[key] ?? 0}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="সাম্প্রতিক অর্ডার">
          {orders.map((order) => <Row key={order.id} title={order.order_number} meta={`${order.customer_name || order.user?.full_name || '-'} - ${order.order_status}`} value={money(order.total_amount)} />)}
        </Panel>
        <Panel title="পেন্ডিং প্রেসক্রিপশন">
          {prescriptions.map((item) => <Row key={item.id} title={`প্রেসক্রিপশন #${item.id}`} meta={item.user?.full_name || '-'} value={date(item.uploaded_at)} />)}
        </Panel>
        <Panel title="লো স্টক">
          {lowStock.map((item) => <Row key={item.id} title={item.product_name} meta={item.batch_number} value={item.available_stock} />)}
        </Panel>
        <Panel title="নিয়ার এক্সপায়ারি">
          {nearExpiry.map((item) => <Row key={item.id} title={item.product_name} meta={item.batch_number} value={date(item.expiry_date)} />)}
        </Panel>
      </div>
    </>
  )
}

function Panel({ title, children }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-4"><h2 className="mb-3 text-lg font-semibold text-slate-950">{title}</h2><div className="space-y-2">{children || <p className="text-sm text-slate-500">ডাটা নেই।</p>}</div></section>
}

function Row({ title, meta, value }) {
  return <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"><div><p className="font-medium text-slate-950">{title}</p><p className="text-xs text-slate-500">{meta}</p></div><span className="font-semibold text-slate-700">{value}</span></div>
}
