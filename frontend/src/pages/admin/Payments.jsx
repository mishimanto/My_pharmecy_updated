import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'

const statuses = ['pending', 'paid', 'failed', 'cancelled', 'refunded']

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    adminApi.list('payments')
      .then((res) => setPayments(res.data.data?.data || []))
      .catch(() => toast.error('পেমেন্ট তালিকা লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const updateStatus = async (payment, status) => {
    if (payment.payment_status === status) return
    const result = await Swal.fire({
      title: 'পেমেন্ট স্ট্যাটাস আপডেট করবেন?',
      text: `${payment.payment_status} থেকে ${status} করা হবে।`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'আপডেট',
      cancelButtonText: 'বাতিল',
    })
    if (!result.isConfirmed) return
    try {
      await adminApi.patch('payments', payment.id, 'status', { payment_status: status })
      toast.success('পেমেন্ট স্ট্যাটাস আপডেট হয়েছে।')
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'স্ট্যাটাস আপডেট করা যায়নি।')
    }
  }

  return (
    <>
      <PageHeader title="পেমেন্ট" subtitle="COD পেমেন্ট মনিটর এবং স্ট্যাটাস আপডেট করুন।" />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">অর্ডার</th>
              <th className="px-4 py-3">মেথড</th>
              <th className="px-4 py-3">পরিমাণ</th>
              <th className="px-4 py-3">স্ট্যাটাস</th>
              <th className="px-4 py-3">পেইড</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-500">লোড হচ্ছে...</td></tr> : null}
            {!loading && !payments.length ? <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-500">কোনো পেমেন্ট নেই।</td></tr> : null}
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-3 font-medium text-slate-950">{payment.order?.order_number || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{payment.payment_method}</td>
                <td className="px-4 py-3 text-slate-700">{money(payment.amount)}</td>
                <td className="px-4 py-3">
                  <select value={payment.payment_status} onChange={(event) => updateStatus(payment, event.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-sm">
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-600">{date(payment.paid_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        bKash, Nagad, Card এবং SSLCommerz পেমেন্ট গেটওয়ে placeholder রাখা হয়েছে।
      </div>
    </>
  )
}
