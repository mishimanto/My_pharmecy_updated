/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiAlertCircle, FiArchive, FiPackage, FiSliders } from 'react-icons/fi'
import EmptyState from '../../../components/common/EmptyState'
import AdminFilterBar from '../../../components/admin/AdminFilterBar'
import AdminLoadingState from '../../../components/admin/AdminLoadingState'
import AdminStatCard from '../../../components/admin/AdminStatCard'
import { adminApi } from '../../../api/adminApi'
import { date, money } from '../../../utils/formatters'

const thresholdOptions = [5, 10, 20, 30, 50]

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

export default function LowStock() {
  const initialParams = { search: '', threshold: 10, page: 1 }
  const [params, setParams] = useState(initialParams)
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const statItems = useMemo(() => {
    const totalLowStock = meta?.total ?? rows.length
    const outOfStock = rows.filter((batch) => Number(batch.available_stock || 0) <= 0).length
    const availableStock = rows.reduce((total, batch) => total + Number(batch.available_stock || 0), 0)

    return [
      { label: 'Low Stock Batches', value: totalLowStock, variant: 'amber', icon: FiAlertCircle },
      { label: 'Out of Stock', value: outOfStock, variant: 'rose', icon: FiArchive },
      { label: 'Available Units', value: availableStock, variant: 'sky', icon: FiPackage },
      { label: 'Threshold', value: params.threshold, variant: 'emerald', icon: FiSliders },
    ]
  }, [meta?.total, params.threshold, rows])

  useEffect(() => {
    let active = true
    const hasRows = rows.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('inventory/low-stock', params)
      .then(({ data }) => {
        if (!active) return
        setRows(data.data?.data || [])
        setMeta(data.data)
      })
      .catch(() => active && toast.error('Unable to load low stock batches.'))
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

  const hasActiveFilters = Boolean(search || Number(params.threshold) !== initialParams.threshold)
  const filterOptions = [
    {
      key: 'threshold',
      value: String(params.threshold),
      onChange: (value) => setParams((current) => ({ ...current, threshold: Number(value), page: 1 })),
      options: thresholdOptions.map((value) => ({
        value: String(value),
        label: `Threshold: ${value} pieces`,
      })),
    },
  ]

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
        searchPlaceholder="Search by batch, product, supplier, or status"
        filters={filterOptions}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && rows.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && rows.length === 0 ? <EmptyState title="No low stock batches found" text="Try another search term or change the threshold." /> : null}

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-[1080px] divide-y divide-slate-200 text-sm">
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
