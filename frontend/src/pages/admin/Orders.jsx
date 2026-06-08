import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'

const statuses = ['', 'pending', 'prescription_review', 'confirmed', 'processing', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded']

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [meta, setMeta] = useState(null)
  const [params, setParams] = useState({ search: '', status: '', page: 1 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.list('orders', params)
      .then((res) => {
        setOrders(res.data.data?.data || [])
        setMeta(res.data.data)
      })
      .catch(() => toast.error('অর্ডার তালিকা লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }, [params])

  const updateParams = (nextParams) => {
    setLoading(true)
    setParams(nextParams)
  }

  return (
    <>
      <PageHeader title="অর্ডার" subtitle="অর্ডার খুঁজুন, ফিল্টার করুন এবং বিস্তারিত দেখুন।" />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <input value={params.search} onChange={(event) => updateParams({ ...params, search: event.target.value, page: 1 })} placeholder="অর্ডার নম্বর, নাম বা ফোন" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select value={params.status} onChange={(event) => updateParams({ ...params, status: event.target.value, page: 1 })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          {statuses.map((status) => <option key={status || 'all'} value={status}>{status || 'সব স্ট্যাটাস'}</option>)}
        </select>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">অর্ডার</th>
              <th className="px-4 py-3">গ্রাহক</th>
              <th className="px-4 py-3">স্ট্যাটাস</th>
              <th className="px-4 py-3">মোট</th>
              <th className="px-4 py-3">তারিখ</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">লোড হচ্ছে...</td></tr> : null}
            {!loading && !orders.length ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">কোনো অর্ডার পাওয়া যায়নি।</td></tr> : null}
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 font-medium text-slate-950">{order.order_number}</td>
                <td className="px-4 py-3 text-slate-600">{order.customer_name || order.user?.full_name || '-'}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{order.order_status}</span></td>
                <td className="px-4 py-3 text-slate-700">{money(order.total_amount)}</td>
                <td className="px-4 py-3 text-slate-600">{date(order.order_date)}</td>
                <td className="px-4 py-3 text-right"><Link to={`/admin/orders/${order.id}`} className="font-semibold text-emerald-700">দেখুন</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {meta?.last_page > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <button disabled={params.page <= 1} onClick={() => updateParams({ ...params, page: params.page - 1 })} className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50">আগে</button>
          <span className="text-sm text-slate-600">{params.page} / {meta.last_page}</span>
          <button disabled={params.page >= meta.last_page} onClick={() => updateParams({ ...params, page: params.page + 1 })} className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50">পরে</button>
        </div>
      )}
    </>
  )
}
