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
      .catch(() => toast.error('Unable to load support tickets.'))
      .finally(() => setLoading(false))
  }, [params])

  const updateParams = (nextParams) => {
    setLoading(true)
    setParams(nextParams)
  }

  return (
    <>
      <PageHeader title="Support Tickets" subtitle="Review customer tickets, assign them, and reply from here." />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <input value={params.search} onChange={(event) => updateParams({ ...params, search: event.target.value })} placeholder="Subject, customer, or order" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select value={params.status} onChange={(event) => updateParams({ ...params, status: event.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          {statuses.map((status) => <option key={status || 'all'} value={status}>{status || 'All Statuses'}</option>)}
        </select>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">Loading...</td></tr> : null}
            {!loading && !tickets.length ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">No tickets found.</td></tr> : null}
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td className="px-4 py-3 font-medium text-slate-950">{ticket.subject}</td>
                <td className="px-4 py-3 text-slate-600">{ticket.user?.full_name || '-'}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">{ticket.status}</span></td>
                <td className="px-4 py-3 text-slate-600">{ticket.assigned_staff?.full_name || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{date(ticket.created_at, 'en-US')}</td>
                <td className="px-4 py-3 text-right"><Link to={`/admin/support/${ticket.id}`} className="font-semibold text-emerald-700">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
