import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiClock, FiPackage, FiTruck } from 'react-icons/fi'
import { orderApi } from '../../api/orderApi'
import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'

const filters = [
  ['all', 'All orders'],
  ['active', 'Active'],
  ['completed', 'Completed'],
  ['issue', 'Problem orders'],
]

export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    orderApi.list()
      .then((res) => setOrders(res.data.data?.data || []))
      .catch(() => toast.error('Order history could not be loaded.'))
      .finally(() => setLoading(false))
  }, [])

  const summary = useMemo(() => ({
    total: orders.length,
    active: orders.filter((order) => !['delivered', 'cancelled', 'returned', 'refunded'].includes(order.order_status)).length,
    delivered: orders.filter((order) => order.order_status === 'delivered').length,
    pendingDelivery: orders.filter((order) => ['confirmed', 'processing', 'packed', 'out_for_delivery'].includes(order.order_status)).length,
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

  return (
    <>
      <PageHeader title="My orders" subtitle="Review order progress, payment state, and delivery movement from one order history screen." action={<Link to="/track-order" className="border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Track order</Link>} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total orders" value={summary.total} icon={FiPackage} />
        <SummaryCard label="Active orders" value={summary.active} icon={FiClock} />
        <SummaryCard label="Delivered" value={summary.delivered} icon={FiTruck} />
        <SummaryCard label="Pending delivery" value={summary.pendingDelivery} icon={FiArrowRight} />
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

      {loading ? <p className="mt-6 text-sm text-slate-500">Loading orders...</p> : null}
      {!loading && !visibleOrders.length ? (
        <div className="mt-6 border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
          No orders found for this filter.
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {visibleOrders.map((order) => (
          <Link key={order.id} to={`/orders/${order.id}`} className="block border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5">
            <div className="grid gap-4 xl:grid-cols-[1fr_160px_160px_140px_auto] xl:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-slate-950">{order.order_number}</p>
                  <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    {order.order_status}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-500">{date(order.order_date)} • {order.items?.length || 0} line items</p>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Payment</div>
                <div className="mt-2 text-sm font-semibold text-slate-950">{order.payment_status}</div>
                <div className="mt-1 text-xs text-slate-500">{order.payment_method}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Delivery</div>
                <div className="mt-2 text-sm font-semibold text-slate-950">{order.delivery?.delivery_status || 'Not created'}</div>
                <div className="mt-1 text-xs text-slate-500">{order.shipping_address || 'Address available in details'}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Total</div>
                <div className="mt-2 text-lg font-semibold text-slate-950">{money(order.total_amount)}</div>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                Open
                <FiArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
      <div className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-slate-50 text-slate-950">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-950">{value}</div>
    </div>
  )
}
