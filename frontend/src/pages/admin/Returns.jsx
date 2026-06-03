import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'

const statuses = ['requested', 'approved', 'rejected', 'picked_up', 'refunded', 'closed']

export default function Returns() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    adminApi.list('returns')
      .then((res) => setReturns(res.data.data?.data || []))
      .catch(() => toast.error('রিটার্ন তালিকা লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const updateStatus = async (item, status) => {
    if (item.status === status) return
    const result = await Swal.fire({ title: 'রিটার্ন স্ট্যাটাস আপডেট করবেন?', text: `${item.status} থেকে ${status}`, icon: 'question', showCancelButton: true, confirmButtonText: 'আপডেট', cancelButtonText: 'বাতিল' })
    if (!result.isConfirmed) return
    try {
      await adminApi.patch('returns', item.id, 'status', { status })
      toast.success('রিটার্ন স্ট্যাটাস আপডেট হয়েছে।')
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'স্ট্যাটাস আপডেট করা যায়নি।')
    }
  }

  const processRefund = async (item) => {
    const result = await Swal.fire({
      title: 'রিফান্ড তৈরি করবেন?',
      html: '<input id="amount" class="swal2-input" placeholder="Amount"><input id="method" class="swal2-input" placeholder="Method" value="COD Refund">',
      showCancelButton: true,
      confirmButtonText: 'রিফান্ড',
      cancelButtonText: 'বাতিল',
      preConfirm: () => ({ refund_amount: document.getElementById('amount').value, refund_method: document.getElementById('method').value, status: 'completed' }),
    })
    if (!result.isConfirmed) return
    try {
      await adminApi.create(`returns/${item.id}/refund`, result.value)
      toast.success('রিফান্ড আপডেট হয়েছে।')
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'রিফান্ড করা যায়নি।')
    }
  }

  return (
    <>
      <PageHeader title="রিটার্ন" subtitle="রিটার্ন অনুমোদন, বাতিল ও রিফান্ড প্রসেস করুন।" />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">অর্ডার</th>
              <th className="px-4 py-3">গ্রাহক</th>
              <th className="px-4 py-3">কারণ</th>
              <th className="px-4 py-3">স্ট্যাটাস</th>
              <th className="px-4 py-3">রিফান্ড</th>
              <th className="px-4 py-3">তারিখ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">লোড হচ্ছে...</td></tr> : null}
            {!loading && !returns.length ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">কোনো রিটার্ন নেই।</td></tr> : null}
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
                  {item.refund ? `${item.refund.status} - ${money(item.refund.refund_amount)}` : <button onClick={() => processRefund(item)} className="rounded-md bg-emerald-600 px-3 py-1 text-sm font-semibold text-white">রিফান্ড</button>}
                </td>
                <td className="px-4 py-3 text-slate-600">{date(item.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
