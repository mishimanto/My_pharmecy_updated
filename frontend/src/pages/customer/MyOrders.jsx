import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { orderApi } from '../../api/orderApi'
import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'

export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    orderApi.list()
      .then((res) => setOrders(res.data.data?.data || []))
      .catch(() => toast.error('অর্ডার তালিকা লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHeader title="আমার অর্ডার" subtitle="অর্ডার, পেমেন্ট ও ডেলিভারি স্ট্যাটাস দেখুন।" />
      {loading ? <p className="text-sm text-slate-600">লোড হচ্ছে...</p> : null}
      {!loading && !orders.length ? <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">এখনো কোনো অর্ডার নেই।</p> : null}
      <div className="space-y-3">
        {orders.map((order) => (
          <Link key={order.id} to={`/orders/${order.id}`} className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-emerald-300">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-950">{order.order_number}</p>
                <p className="text-sm text-slate-500">{date(order.order_date)} - {order.order_status}</p>
              </div>
              <div className="text-sm font-semibold text-slate-950">{money(order.total_amount)}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
