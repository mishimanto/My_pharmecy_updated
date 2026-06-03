import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import PageHeader from '../../components/common/PageHeader'
import { date } from '../../utils/formatters'

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.list('deliveries')
      .then((res) => setDeliveries(res.data.data?.data || []))
      .catch(() => toast.error('ডেলিভারি তালিকা লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHeader title="ডেলিভারি" subtitle="রাইডার অ্যাসাইন এবং ডেলিভারি স্ট্যাটাস ম্যানেজ করুন।" />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">ট্র্যাকিং</th>
              <th className="px-4 py-3">অর্ডার</th>
              <th className="px-4 py-3">রাইডার</th>
              <th className="px-4 py-3">স্ট্যাটাস</th>
              <th className="px-4 py-3">ডেলিভারি</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">লোড হচ্ছে...</td></tr> : null}
            {!loading && !deliveries.length ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">কোনো ডেলিভারি নেই।</td></tr> : null}
            {deliveries.map((delivery) => (
              <tr key={delivery.id}>
                <td className="px-4 py-3 font-medium text-slate-950">{delivery.tracking_no || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{delivery.order?.order_number || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{delivery.rider?.full_name || '-'}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">{delivery.delivery_status}</span></td>
                <td className="px-4 py-3 text-slate-600">{date(delivery.delivered_at)}</td>
                <td className="px-4 py-3 text-right"><Link className="font-semibold text-emerald-700" to={`/admin/deliveries/${delivery.id}`}>ম্যানেজ</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
