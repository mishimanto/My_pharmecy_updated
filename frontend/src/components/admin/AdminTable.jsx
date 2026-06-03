import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import EmptyState from '../common/EmptyState'

export default function AdminTable({ resource }) {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    let active = true
    adminApi
      .list(resource, { search, page })
      .then(({ data }) => {
        if (!active) return
        setRows(data.data.data || [])
        setMeta(data.data)
      })
      .catch(() => active && toast.error('ডাটা লোড করা যায়নি'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [resource, search, page])

  const remove = async (id) => {
    const result = await Swal.fire({
      title: 'রেকর্ড ডিলিট করবেন?',
      text: 'এই কাজটি নিশ্চিত করলে রেকর্ড মুছে যাবে।',
      showCancelButton: true,
      confirmButtonText: 'ডিলিট',
      cancelButtonText: 'বাতিল',
      confirmButtonColor: '#dc2626',
    })
    if (!result.isConfirmed) return
    await adminApi.remove(resource, id)
    toast.success('রেকর্ড ডিলিট হয়েছে')
    setRows((current) => current.filter((row) => row.id !== id))
  }

  const columns = rows[0] ? Object.keys(rows[0]).slice(0, 6) : []
  const readOnly = ['inventory/transactions', 'inventory/low-stock', 'inventory/near-expiry'].includes(resource)

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input className="w-full rounded border border-slate-300 bg-white px-3 py-2" placeholder="সার্চ করুন" value={search} onChange={(event) => { setLoading(true); setSearch(event.target.value); setPage(1) }} />
        <button className="rounded border border-slate-300 bg-white px-4 py-2 text-sm" onClick={() => { setLoading(true); setSearch(''); setPage(1) }}>রিসেট</button>
      </div>
      {loading && <p className="text-sm text-slate-500">লোড হচ্ছে...</p>}
      {!loading && rows.length === 0 && <EmptyState />}
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>{columns.map((column) => <th key={column} className="px-3 py-2 font-semibold">{column}</th>)}{!readOnly && <th className="px-3 py-2" />}</tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  {columns.map((column) => <td key={column} className="max-w-[220px] truncate px-3 py-2">{String(row[column] ?? '-')}</td>)}
                  {!readOnly && <td className="px-3 py-2 text-right"><button className="rounded bg-rose-50 px-2 py-1 text-rose-700" onClick={() => remove(row.id)}>ডিলিট</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>পৃষ্ঠা {meta.current_page || page} / {meta.last_page || 1}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} className="rounded border px-3 py-1 disabled:opacity-40" onClick={() => { setLoading(true); setPage((value) => Math.max(1, value - 1)) }}>আগে</button>
            <button disabled={!meta || meta.current_page >= meta.last_page} className="rounded border px-3 py-1 disabled:opacity-40" onClick={() => { setLoading(true); setPage((value) => value + 1) }}>পরে</button>
          </div>
        </div>
      )}
    </div>
  )
}
