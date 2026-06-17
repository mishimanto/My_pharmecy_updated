import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'

const statuses = ['requested', 'approved', 'rejected', 'picked_up', 'refunded', 'closed']

export default function Returns() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    adminApi.list('returns')
      .then((res) => setReturns(res.data.data?.data || []))
      .catch(() => toast.error('Unable to load returns.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const updateStatus = async (item, status) => {
    if (item.status === status) return
    const result = await Swal.fire({ title: 'Update return status?', text: `${item.status} to ${status}`, icon: 'question', showCancelButton: true, confirmButtonText: 'Update', cancelButtonText: 'Cancel' })
    if (!result.isConfirmed) return
    try {
      await adminApi.patch('returns', item.id, 'status', { status })
      toast.success('Return status updated.')
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update return status.')
    }
  }

  const processRefund = async (item) => {
    const result = await Swal.fire({
      title: 'Create a refund?',
      html: '<input id="amount" class="swal2-input" placeholder="Amount"><input id="method" class="swal2-input" placeholder="Method" value="COD Refund">',
      showCancelButton: true,
      confirmButtonText: 'Create Refund',
      cancelButtonText: 'Cancel',
      preConfirm: () => ({ refund_amount: document.getElementById('amount').value, refund_method: document.getElementById('method').value, status: 'completed' }),
    })
    if (!result.isConfirmed) return
    try {
      await adminApi.create(`returns/${item.id}/refund`, result.value)
      toast.success('Refund created.')
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create refund.')
    }
  }

  return (
    <>
      <PageHeader title="Returns" subtitle="Approve returns, reject them, and process refunds." />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Refund</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <AdminLoadingState colSpan={6} /> : null}
            {!loading && !returns.length ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">No returns found.</td></tr> : null}
            {returns.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-slate-950">{item.order?.order_number || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{item.user?.full_name || '-'}</td>
                <td className="max-w-[260px] truncate px-4 py-3 text-slate-600">{item.reason}</td>
                <td className="px-4 py-3">
                  <select value={item.status} onChange={(event) => updateStatus(item, event.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-sm">
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {item.refund ? `${item.refund.status} - ${money(item.refund.refund_amount)}` : <button onClick={() => processRefund(item)} className="rounded-md bg-emerald-600 px-3 py-1 text-sm font-semibold text-white">Refund</button>}
                </td>
                <td className="px-4 py-3 text-slate-600">{date(item.created_at, 'en-US')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
