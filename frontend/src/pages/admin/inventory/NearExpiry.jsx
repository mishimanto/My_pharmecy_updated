import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import EmptyState from '../../../components/common/EmptyState'
import AdminLoadingState from '../../../components/admin/AdminLoadingState'
import { adminApi } from '../../../api/adminApi'
import { date, money } from '../../../utils/formatters'

const dayOptions = [7, 15, 30, 45, 60, 90]

function statusClass(status) {
  if (status === 'active') return 'text-emerald-600'
  if (status === 'inactive') return 'text-slate-500'
  if (status === 'expired') return 'text-amber-600'
  return 'text-rose-600'
}

function stockLabel(batch) {
  const available = Number(batch.available_stock || 0)
  const reserved = Number(batch.reserved_quantity || 0)
  if (available <= 0) return 'Out of stock'
  if (reserved > 0) return 'Partially reserved'
  return 'Available'
}

export default function NearExpiry() {
  const initialParams = { search: '', days: 30, page: 1 }
  const [params, setParams] = useState(initialParams)
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    let active = true
    const hasRows = rows.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('inventory/near-expiry', params)
      .then(({ data }) => {
        if (!active) return
        setRows(data.data?.data || [])
        setMeta(data.data)
      })
      .catch(() => active && toast.error('Unable to load near expiry batches.'))
      .finally(() => {
        if (!active) return
        setLoading(false)
        setUpdating(false)
      })

    return () => { active = false }
  }, [params])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setParams((current) => current.search === search ? current : { ...current, search, page: 1 })
    }, 350)

    return () => clearTimeout(timeout)
  }, [search])

  const hasActiveFilters = Boolean(search || Number(params.days) !== initialParams.days)

  const clearFilters = () => {
    setSearch('')
    setParams(initialParams)
  }

  return (
    <>
      <div className="mb-4 space-y-3">
        <div className="grid gap-3 xl:grid-cols-[1fr_220px_150px]">
          <input
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            placeholder="Search by batch, product, supplier, or status"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            value={params.days}
            onChange={(event) => setParams((current) => ({ ...current, days: Number(event.target.value), page: 1 }))}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          >
            {dayOptions.map((value) => (
              <option key={value} value={value}>
                Within {value} days
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex items-center justify-center rounded-md border border-slate-500 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-gray-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && rows.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && rows.length === 0 ? <EmptyState title="No near expiry batches found" text="Try another search term or change the date range." /> : null}

      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3 text-center">Total Stock</th>
                <th className="px-4 py-3 text-center">Reserved</th>
                <th className="px-4 py-3 text-center">Available Stock</th>
                <th className="px-4 py-3 text-center">Price</th>
                <th className="px-4 py-3 text-center">Expiry</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((batch) => (
                <tr key={batch.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-950">{batch.batch_number}</div>
                    <div className="text-xs text-slate-500">{stockLabel(batch)}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{batch.product_name || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{batch.supplier_name || '-'}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">{batch.stock_quantity}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{batch.reserved_quantity || 0}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">{batch.available_stock}</td>
                  <td className="px-4 py-3 text-center text-slate-700">{money(batch.selling_price)}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{date(batch.expiry_date, 'en-US')}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold ${statusClass(batch.status)}`}>
                      {batch.status ? batch.status[0].toUpperCase() + batch.status.slice(1) : '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {meta?.last_page > 1 ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Page {meta.current_page || params.page} / {meta.last_page}</span>
          <div className="flex justify-end gap-2">
            <button
              disabled={params.page <= 1}
              onClick={() => setParams((current) => ({ ...current, page: current.page - 1 }))}
              className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={params.page >= meta.last_page}
              onClick={() => setParams((current) => ({ ...current, page: current.page + 1 }))}
              className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
