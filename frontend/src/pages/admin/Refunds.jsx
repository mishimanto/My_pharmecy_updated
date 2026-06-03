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
      .catch(() => toast.error('রিফান্ড তালিকা লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const updateStatus = async (refund, status) => {
    if (refund.status === status) return
    const result = await Swal.fire({ title: 'রিফান্ড স্ট্যাটাস আপডেট করবেন?', text: `${refund.status} থেকে ${status}`, icon: 'question', showCancelButton: true, confirmButtonText: 'আপডেট', cancelButtonText: 'বাতিল' })
    if (!result.isConfirmed) return
    try {
      await adminApi.patch('refunds', refund.id, 'status', { status })
      toast.success('রিফান্ড স্ট্যাটাস আপডেট হয়েছে।')
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'স্ট্যাটাস আপডেট করা যায়নি।')
    }
  }

  return (
    <>
      <PageHeader title="রিফান্ড" subtitle="রিফান্ড স্ট্যাটাস প্রসেস করুন।" />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">রিটার্ন</th>
              <th className="px-4 py-3">গ্রাহক</th>
              <th className="px-4 py-3">পরিমাণ</th>
              <th className="px-4 py-3">মেথড</th>
              <th className="px-4 py-3">স্ট্যাটাস</th>
              <th className="px-4 py-3">তারিখ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">লোড হচ্ছে...</td></tr> : null}
            {!loading && !refunds.length ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">কোনো রিফান্ড নেই।</td></tr> : null}
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
                <td className="px-4 py-3 text-slate-600">{date(refund.refunded_at || refund.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
