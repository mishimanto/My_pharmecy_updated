/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { FiCheckCircle, FiClock, FiMinusCircle, FiRefreshCw, FiSend, FiSliders, FiXCircle } from 'react-icons/fi'
import EmptyState from '../../../components/common/EmptyState'
import AdminFilterBar from '../../../components/admin/AdminFilterBar'
import AdminLoadingState from '../../../components/admin/AdminLoadingState'
import AdminStatCard from '../../../components/admin/AdminStatCard'
import { adminApi } from '../../../api/adminApi'
import { productApi } from '../../../api/productApi'
import { useStaffAuth } from '../../../context/StaffAuthContext'
import { hasPermission } from '../../../utils/permissions'
import { date } from '../../../utils/formatters'
import { clearInventoryBatchesCache } from '../../../utils/adminInventoryBatchCache'
import { clearProductsCache } from '../../../utils/adminProductCache'

const reasons = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'expired', label: 'Expired' },
  { value: 'lost', label: 'Lost' },
  { value: 'correction', label: 'Correction' },
]

const statuses = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

function statusClass(status) {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  if (status === 'rejected') return 'bg-rose-50 text-rose-700 ring-rose-100'
  return 'bg-amber-50 text-amber-700 ring-amber-100'
}

function reasonLabel(reason) {
  return reasons.find((item) => item.value === reason)?.label || '-'
}

function quantityLabel(quantity) {
  const value = Number(quantity || 0)
  return value > 0 ? `+${value}` : `${value}`
}

function requestBatchLabel(batch) {
  const product = batch.product?.product_name || 'Unknown product'
  return `${product} - ${batch.batch_number}`
}

export default function StockAdjustments() {
  const { staff } = useStaffAuth()
  const canApprove = hasPermission(staff, 'stock-adjustment.approve')
  const initialParams = { search: '', status: 'pending', reason: '', page: 1 }
  const [params, setParams] = useState(initialParams)
  const [rows, setRows] = useState([])
  const [batches, setBatches] = useState([])
  const [meta, setMeta] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    batch_id: '',
    reason: 'damaged',
    quantity: '',
    correction_direction: 'decrease',
    note: '',
  })

  const selectedBatch = useMemo(
    () => batches.find((batch) => String(batch.id) === String(form.batch_id)),
    [batches, form.batch_id],
  )
  const formTitle = canApprove ? 'Direct stock adjustment' : 'Request stock adjustment'
  const submitLabel = canApprove ? 'Apply Adjustment' : 'Submit Request'
  const submittingLabel = canApprove ? 'Applying...' : 'Submitting...'

  const statItems = useMemo(() => {
    const pending = rows.filter((row) => row.status === 'pending').length
    const approved = rows.filter((row) => row.status === 'approved').length
    const rejected = rows.filter((row) => row.status === 'rejected').length
    const outgoing = rows.filter((row) => Number(row.quantity_change || 0) < 0).length

    return [
      { label: 'Total Requests', value: meta?.total ?? rows.length, variant: 'sky', icon: FiSliders },
      { label: 'Pending', value: pending, variant: 'amber', icon: FiClock },
      { label: 'Approved', value: approved, variant: 'emerald', icon: FiCheckCircle },
      { label: 'Stock Reduction', value: outgoing, variant: 'rose', icon: FiMinusCircle },
      { label: 'Rejected', value: rejected, variant: 'slate', icon: FiXCircle },
    ]
  }, [rows, meta?.total])

  useEffect(() => {
    adminApi.listFresh('inventory/batches', { per_page: 500 })
      .then(({ data }) => setBatches(data.data?.data || []))
      .catch(() => toast.error('Unable to load inventory batches.'))
  }, [])

  useEffect(() => {
    let active = true
    const hasRows = rows.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('stock-adjustments', params)
      .then(({ data }) => {
        if (!active) return
        setRows(data.data?.data || [])
        setMeta(data.data || null)
      })
      .catch(() => active && toast.error('Unable to load stock adjustment requests.'))
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

  const filterOptions = [
    {
      key: 'status',
      value: params.status,
      onChange: (value) => setParams((current) => ({ ...current, status: value, page: 1 })),
      options: statuses,
    },
    {
      key: 'reason',
      value: params.reason,
      onChange: (value) => setParams((current) => ({ ...current, reason: value, page: 1 })),
      options: [{ value: '', label: 'All Reasons' }, ...reasons],
    },
  ]

  const hasActiveFilters = Boolean(search || params.status || params.reason)

  const clearFilters = () => {
    setSearch('')
    setParams(initialParams)
  }

  const refreshInventoryData = () => {
    clearInventoryBatchesCache()
    clearProductsCache()
    productApi.clearCache()
    adminApi.listFresh('inventory/batches', { per_page: 500 })
      .then(({ data }) => setBatches(data.data?.data || []))
      .catch(() => {})
    setParams((current) => ({ ...current }))
  }

  const resolveQuantityChange = () => {
    const quantity = Math.abs(Number(form.quantity || 0))
    if (form.reason !== 'correction') return -quantity
    return form.correction_direction === 'increase' ? quantity : -quantity
  }

  const submitRequest = async (event) => {
    event.preventDefault()
    const quantity = Math.abs(Number(form.quantity || 0))
    if (!form.batch_id || quantity <= 0) {
      toast.error('Select a batch and enter a valid quantity.')
      return
    }

    setSubmitting(true)
    try {
      await adminApi.create(canApprove ? 'stock-adjustments/direct' : 'stock-adjustments', {
        batch_id: form.batch_id,
        reason: form.reason,
        quantity_change: resolveQuantityChange(),
        note: form.note,
      })
      toast.success(canApprove ? 'Stock adjustment applied.' : 'Stock adjustment request submitted.')
      setForm({ batch_id: '', reason: 'damaged', quantity: '', correction_direction: 'decrease', note: '' })
      refreshInventoryData()
    } catch (error) {
      toast.error(error.response?.data?.message || (canApprove ? 'Unable to apply adjustment.' : 'Unable to submit request.'))
    } finally {
      setSubmitting(false)
    }
  }

  const review = async (row, action) => {
    const isApprove = action === 'approve'
    const result = await Swal.fire({
      title: isApprove ? 'Approve stock adjustment?' : 'Reject stock adjustment?',
      text: `${requestBatchLabel(row.batch || {})} (${quantityLabel(row.quantity_change)})`,
      input: 'textarea',
      inputPlaceholder: 'Review note (optional)',
      showCancelButton: true,
      confirmButtonText: isApprove ? 'Approve' : 'Reject',
      cancelButtonText: 'Cancel',
      confirmButtonColor: isApprove ? '#059669' : '#dc2626',
    })

    if (!result.isConfirmed) return

    try {
      await adminApi.patch('stock-adjustments', row.id, action, { review_note: result.value || '' })
      toast.success(isApprove ? 'Stock adjustment approved.' : 'Stock adjustment rejected.')
      refreshInventoryData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to review request.')
    }
  }

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {statItems.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} variant={item.variant} icon={item.icon} />
        ))}
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form onSubmit={submitRequest} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">{formTitle}</h2>
            <span className="inline-flex shrink-0 items-center justify-center text-emerald-700">
              {canApprove ? <FiSliders className="h-4 w-4" /> : <FiSend className="h-4 w-4" />}
            </span>
          </div>

          <div className="space-y-3 p-5">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Batch</span>
              <select
                value={form.batch_id}
                onChange={(event) => setForm((current) => ({ ...current, batch_id: event.target.value }))}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Select batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {requestBatchLabel(batch)} - stock {batch.stock_quantity}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Reason</span>
                <select
                  value={form.reason}
                  onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                >
                  {reasons.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Quantity</span>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            {form.reason === 'correction' ? (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Correction direction</span>
                <select
                  value={form.correction_direction}
                  onChange={(event) => setForm((current) => ({ ...current, correction_direction: event.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="decrease">Decrease stock</option>
                  <option value="increase">Increase stock</option>
                </select>
              </label>
            ) : null}

            {selectedBatch ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">Current stock:</span> {selectedBatch.stock_quantity}
                <span className="mx-2 text-slate-300">|</span>
                <span className="font-semibold text-slate-800">Reserved:</span> {selectedBatch.reserved_quantity || 0}
                <span className="mx-2 text-slate-300">|</span>
                <span className="font-semibold text-slate-800">Available:</span> {selectedBatch.available_stock ?? Math.max(0, Number(selectedBatch.stock_quantity || 0) - Number(selectedBatch.reserved_quantity || 0))}
              </div>
            ) : null}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Note</span>
              <textarea
                rows="4"
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Short reason or audit note"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {canApprove ? <FiSliders className="h-4 w-4" /> : <FiSend className="h-4 w-4" />}
              {submitting ? submittingLabel : submitLabel}
            </button>
          </div>
        </form>

        <div>
          <AdminFilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by product, batch, reason, or note"
            filters={filterOptions}
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters}
          >
            <button
              type="button"
              onClick={refreshInventoryData}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
            >
              <FiRefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </AdminFilterBar>

          {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
          {loading && rows.length === 0 ? <AdminLoadingState className="py-8" /> : null}
          {!loading && rows.length === 0 ? <EmptyState title="No stock adjustment requests" text="Submit a request or adjust the filters." /> : null}

          {rows.length > 0 ? (
            <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-280 divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.04em] text-slate-600">
                  <tr>
                    <th className="w-30 px-4 py-3">Date</th>
                    <th className="min-w-62.5 px-4 py-3">Item</th>
                    <th className="w-32.5 px-4 py-3">Reason</th>
                    <th className="w-27.5 px-4 py-3 text-center">Change</th>
                    <th className="w-32.5 px-4 py-3 text-center">Status</th>
                    <th className="w-42.5 px-4 py-3">Requested By</th>
                    <th className="min-w-55 px-4 py-3">Notes</th>
                    <th className="w-32.5 px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.id} className="transition hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-4 align-middle text-slate-600">{date(row.created_at, 'en-US')}</td>
                      <td className="whitespace-nowrap px-4 py-4 align-middle">
                        <div className="font-semibold text-slate-950">{row.batch?.product?.product_name || '-'}</div>
                        <div className="mt-1 text-xs font-medium text-slate-500">{row.batch?.batch_number || 'No batch'}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 align-middle font-medium text-slate-700">{reasonLabel(row.reason)}</td>
                      <td className={`whitespace-nowrap px-4 py-4 text-center align-middle text-base font-semibold ${Number(row.quantity_change || 0) < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {quantityLabel(row.quantity_change)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-center align-middle">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass(row.status)}`}>
                          {row.status ? row.status[0].toUpperCase() + row.status.slice(1) : '-'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 align-middle text-slate-600">{row.requested_by?.full_name || '-'}</td>
                      <td className="max-w-75 px-4 py-4 align-middle text-slate-500">
                        <div className="truncate" title={row.note || ''}>{row.note || '-'}</div>
                        {row.review_note ? <div className="mt-1 truncate text-xs text-slate-400" title={row.review_note}>Review: {row.review_note}</div> : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-center align-middle">
                        {row.status === 'pending' && canApprove ? (
                          <div className="flex justify-center gap-2">
                            <button onClick={() => review(row, 'approve')} className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-emerald-100 px-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50">
                              <FiCheckCircle className="h-4 w-4" />
                              Approve
                            </button>
                            <button onClick={() => review(row, 'reject')} className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-rose-100 px-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50">
                              <FiXCircle className="h-4 w-4" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">
                            {row.status === 'pending' ? 'Awaiting approval' : row.reviewed_by?.full_name || '-'}
                          </span>
                        )}
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
                <button disabled={params.page <= 1} onClick={() => setParams((current) => ({ ...current, page: current.page - 1 }))} className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                <button disabled={params.page >= meta.last_page} onClick={() => setParams((current) => ({ ...current, page: current.page + 1 }))} className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
