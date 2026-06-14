import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'
import { getPaymentStatusLabel } from '../../utils/statusLabels'

const statuses = ['awaiting_proof', 'under_review', 'pending', 'paid', 'failed', 'cancelled', 'refunded']

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    adminApi.list('payments')
      .then((res) => setPayments(res.data.data?.data || []))
      .catch(() => toast.error('Unable to load payments.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const updateStatus = async (payment, status) => {
    if (payment.payment_status === status) return

    const result = await Swal.fire({
      title: 'Update payment status?',
      input: 'textarea',
      inputLabel: status === 'failed' || status === 'cancelled' ? 'Review note / reason' : 'Review note (optional)',
      inputPlaceholder: 'Add an admin note',
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if ((status === 'failed' || status === 'cancelled') && !value.trim()) {
          return 'A note is required for this status.'
        }
        return undefined
      },
    })

    if (!result.isConfirmed) return

    try {
      await adminApi.patch('payments', payment.id, 'status', {
        payment_status: status,
        reviewed_note: result.value || '',
      })
      toast.success('Payment status updated.')
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update payment status.')
    }
  }

  return (
    <>
      <PageHeader title="Payments" subtitle="Review manual payment proofs, transaction IDs, and the verification workflow." />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Transaction</th>
              <th className="px-4 py-3">Proof</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-500">Loading...</td></tr> : null}
            {!loading && !payments.length ? <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-500">No payments found.</td></tr> : null}
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-3 font-medium text-slate-950">{payment.order?.order_number || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{payment.payment_method}</td>
                <td className="px-4 py-3 text-slate-600">
                  <div>{payment.transaction_id || '-'}</div>
                  {payment.reviewed_note ? <div className="mt-1 text-xs text-slate-500">{payment.reviewed_note}</div> : null}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {payment.payment_proof_url ? <a href={payment.payment_proof_url} target="_blank" rel="noreferrer" className="text-emerald-700 underline">View</a> : '-'}
                </td>
                <td className="px-4 py-3 text-slate-700">{money(payment.amount)}</td>
                <td className="px-4 py-3">
                  <select value={payment.payment_status} onChange={(event) => updateStatus(payment, event.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-sm">
                    {statuses.map((status) => <option key={status} value={status}>{getPaymentStatusLabel(status)}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-600">{date(payment.paid_at, 'en-US')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Keep COD payments pending until delivery is completed. For full-payment bKash or Nagad orders, move the status to `paid` after the proof is verified.
      </div>
    </>
  )
}
