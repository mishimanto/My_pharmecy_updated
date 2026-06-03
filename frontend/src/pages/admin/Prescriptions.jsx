import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { adminApi } from '../../api/adminApi'
import { date } from '../../utils/formatters'

const labels = { pending: 'পেন্ডিং', approved: 'অনুমোদিত', rejected: 'বাতিল', need_clarification: 'তথ্য প্রয়োজন' }

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
    }).catch(() => toast.error('প্রেসক্রিপশন লোড করা যায়নি'))
  }, [search, status, page])

  return (
    <>
      <PageHeader title="প্রেসক্রিপশন" subtitle="কাস্টমারের আপলোড করা প্রেসক্রিপশন রিভিউ করুন।" />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input className="w-full rounded border px-3 py-2" placeholder="রোগী, ডাক্তার বা কাস্টমার দিয়ে খুঁজুন" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <select className="rounded border px-3 py-2" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">সব স্ট্যাটাস</option><option value="pending">পেন্ডিং</option><option value="approved">অনুমোদিত</option><option value="rejected">বাতিল</option><option value="need_clarification">তথ্য প্রয়োজন</option></select>
      </div>
      {items.length === 0 && <EmptyState />}
      {items.length > 0 && <div className="overflow-x-auto rounded border bg-white"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="px-3 py-2">কাস্টমার</th><th className="px-3 py-2">রোগী</th><th className="px-3 py-2">স্ট্যাটাস</th><th className="px-3 py-2">আপলোড</th><th className="px-3 py-2" /></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t"><td className="px-3 py-2">{item.user?.full_name || '-'}</td><td className="px-3 py-2">{item.patient_name || '-'}</td><td className="px-3 py-2">{labels[item.status] || item.status}</td><td className="px-3 py-2">{date(item.uploaded_at || item.created_at)}</td><td className="px-3 py-2 text-right"><Link className="rounded bg-slate-100 px-2 py-1" to={`/admin/prescriptions/${item.id}`}>রিভিউ</Link></td></tr>)}</tbody></table></div>}
      {meta && <div className="mt-4 flex justify-between text-sm"><span>পৃষ্ঠা {meta.current_page} / {meta.last_page}</span><div className="flex gap-2"><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>আগে</button><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(page + 1)}>পরে</button></div></div>}
    </>
  )
}

