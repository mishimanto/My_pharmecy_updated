/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiArchive, FiMinusCircle, FiPlusCircle, FiRepeat } from 'react-icons/fi'
import EmptyState from '../../../../components/common/EmptyState'
import AdminFilterBar from '../../../../components/admin/AdminFilterBar'
import AdminLoadingState from '../../../../components/admin/AdminLoadingState'
import AdminStatCard from '../../../../components/admin/AdminStatCard'
import { adminApi } from '../../../../api/adminApi'
import { date } from '../../../../utils/formatters'
import {
  readInventoryTransactionsCache,
  writeInventoryTransactionsCache,
} from '../../../../utils/adminInventoryTransactionCache'

function typeLabel(type) {
  const labels = {
    stock_in: 'Stock In',
    reserve: 'Reserved',
    release: 'Released',
    sold: 'Sold',
    return: 'Returned',
    adjustment: 'Adjustment',
    expired: 'Expired',
    damaged: 'Damaged',
  }

  return labels[String(type || '').toLowerCase()] || String(type || '-').replace(/_/g, ' ')
}

function typeClass(type) {
  const value = String(type || '').toLowerCase()
  if (['stock_in', 'return', 'release'].includes(value)) return 'bg-emerald-50 text-emerald-700'
  if (['reserve', 'sold', 'expired', 'damaged'].includes(value)) return 'bg-rose-50 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}

function quantityClass(change) {
  if (Number(change) > 0) return 'text-emerald-700'
  if (Number(change) < 0) return 'text-rose-700'
  return 'text-slate-700'
}

function formatQuantity(change) {
  const value = Number(change || 0)
  if (value > 0) return `+${value}`
  return `${value}`
}

function referenceLabel(row) {
  if (!row.reference_type) return '-'
  const type = String(row.reference_type).replace(/_/g, ' ')
  return row.reference_id ? `${type} #${row.reference_id}` : type
}

export default function InventoryTransactionsIndex() {
  const initialParams = { search: '', page: 1 }
  const initialCache = readInventoryTransactionsCache(initialParams)
  const [params, setParams] = useState(initialParams)
  const [rows, setRows] = useState(initialCache?.rows || [])
  const [meta, setMeta] = useState(initialCache?.meta || null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(!initialCache)
  const [updating, setUpdating] = useState(false)
  const statItems = useMemo(() => {
    const totalTransactions = meta?.total ?? rows.length
    const stockInRows = rows.filter((row) => Number(row.quantity_change || 0) > 0).length
    const stockOutRows = rows.filter((row) => Number(row.quantity_change || 0) < 0).length
    const adjustmentRows = rows.filter((row) => String(row.transaction_type || '').toLowerCase() === 'adjustment').length

    return [
      { label: 'Transactions', value: totalTransactions, variant: 'sky', icon: FiArchive },
      { label: 'Stock In', value: stockInRows, variant: 'emerald', icon: FiPlusCircle },
      { label: 'Stock Out', value: stockOutRows, variant: 'rose', icon: FiMinusCircle },
      { label: 'Adjustments', value: adjustmentRows, variant: 'amber', icon: FiRepeat },
    ]
  }, [meta?.total, rows])

  useEffect(() => {
    let active = true
    const cached = readInventoryTransactionsCache(params)

    if (cached) {
      setRows(cached.rows || [])
      setMeta(cached.meta || null)
      setLoading(false)
      setUpdating(false)
      return () => { active = false }
    }

    const hasRows = rows.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('inventory/transactions', params)
      .then(({ data }) => {
        if (!active) return
        const payload = {
          rows: data.data?.data || [],
          meta: data.data,
        }
        setRows(payload.rows)
        setMeta(payload.meta)
        writeInventoryTransactionsCache(params, payload)
      })
      .catch(() => active && toast.error('Unable to load stock transactions.'))
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

  const hasActiveFilters = Boolean(search)

  const clearFilters = () => {
    setSearch('')
    setParams(initialParams)
  }

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statItems.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} variant={item.variant} icon={item.icon} />
        ))}
      </div>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by type, batch, or product"
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && rows.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && rows.length === 0 ? <EmptyState title="No transactions found" text="Try another search term." /> : null}

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-[980px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-center">Change</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-slate-600">{date(row.transaction_date, 'en-US')}</td>
                  <td className="px-4 py-3 text-slate-800">{row.product_name || '-'}</td>
                  <td className="px-4 py-3 font-medium text-slate-950">{row.batch_number || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${typeClass(row.transaction_type)}`}>
                      {typeLabel(row.transaction_type)}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-center font-semibold ${quantityClass(row.quantity_change)}`}>{formatQuantity(row.quantity_change)}</td>
                  <td className="px-4 py-3 text-slate-600">{referenceLabel(row)}</td>
                  <td className="px-4 py-3 text-slate-500">{row.note || '-'}</td>
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
            <button disabled={params.page <= 1} onClick={() => setParams((current) => ({ ...current, page: current.page - 1 }))} className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
            <button disabled={params.page >= meta.last_page} onClick={() => setParams((current) => ({ ...current, page: current.page + 1 }))} className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
          </div>
        </div>
      ) : null}
    </>
  )
}
