import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import PageHeader from '../../components/common/PageHeader'
import { date } from '../../utils/formatters'
import { getDeliveryStatusLabel } from '../../utils/statusLabels'

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.list('deliveries')
      .then((res) => setDeliveries(res.data.data?.data || []))
      .catch(() => toast.error('Unable to load deliveries.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHeader title="Deliveries" subtitle="Assign riders and manage delivery statuses." />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Tracking</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Rider</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Delivered</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">Loading...</td></tr> : null}
            {!loading && !deliveries.length ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">No deliveries found.</td></tr> : null}
            {deliveries.map((delivery) => (
              <tr key={delivery.id}>
                <td className="px-4 py-3 font-medium text-slate-950">{delivery.tracking_no || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{delivery.order?.order_number || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{delivery.rider?.full_name || '-'}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">{getDeliveryStatusLabel(delivery.delivery_status)}</span></td>
                <td className="px-4 py-3 text-slate-600">{date(delivery.delivered_at, 'en-US')}</td>
                <td className="px-4 py-3 text-right"><Link className="font-semibold text-emerald-700" to={`/admin/deliveries/${delivery.id}`}>Manage</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
