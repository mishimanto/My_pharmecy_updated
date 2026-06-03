import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import PageHeader from '../../components/common/PageHeader'
import { date } from '../../utils/formatters'

const statuses = ['', 'open', 'in_progress', 'resolved', 'closed']

export default function SupportTickets() {
  const [tickets, setTickets] = useState([])
  const [params, setParams] = useState({ search: '', status: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.list('support-tickets', params)
      .then((res) => setTickets(res.data.data?.data || []))
      .catch(() => toast.error('সাপোর্ট টিকিট লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }, [params])

  const updateParams = (nextParams) => {
    setLoading(true)
    setParams(nextParams)
  }

  return (
    <>
      <PageHeader title="সাপোর্ট টিকিট" subtitle="গ্রাহকের টিকিট দেখুন, অ্যাসাইন করুন এবং উত্তর দিন।" />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <input value={params.search} onChange={(event) => updateParams({ ...params, search: event.target.value })} placeholder="বিষয়, গ্রাহক বা অর্ডার" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select value={params.status} onChange={(event) => updateParams({ ...params, status: event.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          {statuses.map((status) => <option key={status || 'all'} value={status}>{status || 'সব স্ট্যাটাস'}</option>)}
        </select>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">বিষয়</th>
              <th className="px-4 py-3">গ্রাহক</th>
              <th className="px-4 py-3">স্ট্যাটাস</th>
              <th className="px-4 py-3">অ্যাসাইন</th>
              <th className="px-4 py-3">তারিখ</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">লোড হচ্ছে...</td></tr> : null}
            {!loading && !tickets.length ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">কোনো টিকিট নেই।</td></tr> : null}
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td className="px-4 py-3 font-medium text-slate-950">{ticket.subject}</td>
                <td className="px-4 py-3 text-slate-600">{ticket.user?.full_name || '-'}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">{ticket.status}</span></td>
                <td className="px-4 py-3 text-slate-600">{ticket.assigned_staff?.full_name || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{date(ticket.created_at)}</td>
                <td className="px-4 py-3 text-right"><Link to={`/admin/support/${ticket.id}`} className="font-semibold text-emerald-700">দেখুন</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
