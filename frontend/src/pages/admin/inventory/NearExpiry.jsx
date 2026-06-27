/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiAlertTriangle, FiArchive, FiCalendar, FiPackage } from 'react-icons/fi'
import EmptyState from '../../../components/common/EmptyState'
import AdminFilterBar from '../../../components/admin/AdminFilterBar'
import AdminLoadingState from '../../../components/admin/AdminLoadingState'
import AdminStatCard from '../../../components/admin/AdminStatCard'
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
  const statItems = useMemo(() => {
    const totalNearExpiry = meta?.total ?? rows.length
    const reservedStock = rows.reduce((total, batch) => total + Number(batch.reserved_quantity || 0), 0)
    const availableStock = rows.reduce((total, batch) => total + Number(batch.available_stock || 0), 0)

    return [
      { label: 'Near Expiry Batches', value: totalNearExpiry, variant: 'amber', icon: FiAlertTriangle },
      { label: 'Reserved Units', value: reservedStock, variant: 'rose', icon: FiArchive },
      { label: 'Available Units', value: availableStock, variant: 'sky', icon: FiPackage },
      { label: 'Date Range', value: `${params.days} days`, variant: 'emerald', icon: FiCalendar },
    ]
  }, [meta?.total, params.days, rows])

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
  const filterOptions = [
    {
      key: 'days',
      value: String(params.days),
      onChange: (value) => setParams((current) => ({ ...current, days: Number(value), page: 1 })),
      options: dayOptions.map((value) => ({
        value: String(value),
        label: `Within ${value} days`,
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
      {!loading && rows.length === 0 ? <EmptyState title="No near expiry batches found" text="Try another search term or change the date range." /> : null}

      {rows.length > 0 ? (
        <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[1220px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.04em] text-slate-600">
              <tr>
                <th className="w-[130px] px-4 py-3">Batch</th>
                <th className="w-[230px] px-4 py-3">Product</th>
                <th className="w-[220px] px-4 py-3">Supplier</th>
                <th className="w-[120px] px-4 py-3 text-center">Total Stock</th>
                <th className="w-[110px] px-4 py-3 text-center">Reserved</th>
                <th className="w-[140px] px-4 py-3 text-center">Available Stock</th>
                <th className="w-[110px] px-4 py-3 text-center">Price</th>
                <th className="w-[130px] px-4 py-3 text-center">Expiry</th>
                <th className="w-[110px] px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((batch) => (
                <tr key={batch.id} className="transition hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-4 py-4 align-middle">
                    <div className="font-semibold text-slate-950">{batch.batch_number}</div>
                    <div className="text-xs text-slate-500">{stockLabel(batch)}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 align-middle text-slate-700">{batch.product_name || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-4 align-middle text-slate-600">{batch.supplier_name || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-center align-middle font-semibold text-slate-800">{batch.stock_quantity}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-center align-middle text-slate-600">{batch.reserved_quantity || 0}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-center align-middle font-semibold text-slate-800">{batch.available_stock}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-center align-middle text-slate-700">{money(batch.selling_price)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-center align-middle text-slate-600">{date(batch.expiry_date, 'en-US')}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-center align-middle">
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
