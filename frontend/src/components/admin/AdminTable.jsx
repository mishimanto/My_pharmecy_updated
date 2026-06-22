import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import { adminQueryKeys, useAdminListQuery } from '../../queries/adminQueries'
import EmptyState from '../common/EmptyState'
import AdminLoadingState from './AdminLoadingState'

export default function AdminTable({ resource }) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const tableQuery = useAdminListQuery(resource, { search, page })
  const meta = tableQuery.data || null
  const rows = meta?.data || []
  const loading = tableQuery.isLoading

  const remove = async (id) => {
    const result = await Swal.fire({
      title: 'Delete this record?',
      text: 'This action will permanently remove the record.',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    })
    if (!result.isConfirmed) return
    await adminApi.remove(resource, id)
    toast.success('Record deleted.')
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.resourceList(resource, { search, page }) })
  }

  const columns = rows[0] ? Object.keys(rows[0]).slice(0, 6) : []
  const readOnly = ['inventory/transactions', 'inventory/low-stock', 'inventory/near-expiry'].includes(resource)

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input className="w-full rounded border border-slate-300 bg-white px-3 py-2" placeholder="Search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
        <button className="rounded border border-slate-300 bg-white px-4 py-2 text-sm" onClick={() => { setSearch(''); setPage(1) }}>Reset</button>
      </div>
      {loading && <AdminLoadingState className="py-6" />}
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
                  {columns.map((column) => <td key={column} className="max-w-55 truncate px-3 py-2">{String(row[column] ?? '-')}</td>)}
                  {!readOnly && <td className="px-3 py-2 text-right"><button className="rounded bg-rose-50 px-2 py-1 text-rose-700" onClick={() => remove(row.id)}>Delete</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>Page {meta.current_page || page} / {meta.last_page || 1}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} className="rounded border px-3 py-1 disabled:opacity-40" onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
            <button disabled={!meta || meta.current_page >= meta.last_page} className="rounded border px-3 py-1 disabled:opacity-40" onClick={() => setPage((value) => value + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
