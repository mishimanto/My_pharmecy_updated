import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
// import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { adminApi } from '../../api/adminApi'
import { date } from '../../utils/formatters'

const labels = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', need_clarification: 'Needs Clarification' }

export default function Prescriptions() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    adminApi.list('prescriptions', { search, status, page }).then(({ data }) => {
      setItems(data.data.data || [])
      setMeta(data.data)
    }).catch(() => toast.error('Unable to load prescriptions.'))
  }, [search, status, page])

  return (
    <>
      {/* <PageHeader title="Prescriptions" subtitle="Review prescriptions uploaded by customers." /> */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input className="w-full rounded border px-3 py-2" placeholder="Search by patient, doctor, or customer" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <select className="rounded border px-3 py-2" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">All Statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="need_clarification">Needs Clarification</option></select>
      </div>
      {items.length === 0 && <EmptyState />}
      {items.length > 0 && <div className="overflow-x-auto rounded border bg-white"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Patient</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Uploaded</th><th className="px-3 py-2" /></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t"><td className="px-3 py-2">{item.user?.full_name || '-'}</td><td className="px-3 py-2">{item.patient_name || '-'}</td><td className="px-3 py-2">{labels[item.status] || item.status}</td><td className="px-3 py-2">{date(item.uploaded_at || item.created_at, 'en-US')}</td><td className="px-3 py-2 text-right"><Link className="rounded bg-slate-100 px-2 py-1" to={`/admin/prescriptions/${item.id}`}>Review</Link></td></tr>)}</tbody></table></div>}
      {meta && <div className="mt-4 flex justify-between text-sm"><span>Page {meta.current_page} / {meta.last_page}</span><div className="flex gap-2"><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(page + 1)}>Next</button></div></div>}
    </>
  )
}
