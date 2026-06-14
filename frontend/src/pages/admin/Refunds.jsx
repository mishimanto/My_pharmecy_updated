import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'

const statuses = ['pending', 'processing', 'completed', 'rejected']

export default function Refunds() {
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    adminApi.list('refunds')
      .then((res) => setRefunds(res.data.data?.data || []))
      .catch(() => toast.error('Unable to load refunds.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const updateStatus = async (refund, status) => {
    if (refund.status === status) return
    const result = await Swal.fire({ title: 'Update refund status?', text: `${refund.status} to ${status}`, icon: 'question', showCancelButton: true, confirmButtonText: 'Update', cancelButtonText: 'Cancel' })
    if (!result.isConfirmed) return
    try {
      await adminApi.patch('refunds', refund.id, 'status', { status })
      toast.success('Refund status updated.')
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update refund status.')
    }
  }

  return (
    <>
      <PageHeader title="Refunds" subtitle="Process refund statuses." />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Return</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">Loading...</td></tr> : null}
            {!loading && !refunds.length ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">No refunds found.</td></tr> : null}
            {refunds.map((refund) => (
              <tr key={refund.id}>
                <td className="px-4 py-3 font-medium text-slate-950">#{refund.return_id}</td>
                <td className="px-4 py-3 text-slate-600">{refund.return_request?.user?.full_name || '-'}</td>
                <td className="px-4 py-3 text-slate-700">{money(refund.refund_amount)}</td>
                <td className="px-4 py-3 text-slate-600">{refund.refund_method}</td>
                <td className="px-4 py-3">
                  <select value={refund.status} onChange={(event) => updateStatus(refund, event.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-sm">
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-600">{date(refund.refunded_at || refund.created_at, 'en-US')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
