import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowUpRight, FiCheckCircle, FiClock, FiDollarSign, FiRefreshCw } from 'react-icons/fi'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminFilterBar from '../../components/admin/AdminFilterBar'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import AdminStatCard from '../../components/admin/AdminStatCard'
import EmptyState from '../../components/common/EmptyState'
import { date, money } from '../../utils/formatters'

const statuses = ['pending', 'processing', 'completed', 'rejected']
const REFUNDS_CACHE_KEY = 'admin_refunds_payload_v1'
const REFUNDS_CACHE_TTL = 2 * 60 * 1000

function cacheKey(params) {
  return JSON.stringify({
    search: params.search || '',
    status: params.status || '',
    page: params.page || 1,
  })
}

function readCache(params) {
  if (typeof window === 'undefined') return null

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(REFUNDS_CACHE_KEY) || '{}')
    const cached = cache[cacheKey(params)]
    if (!cached || Date.now() - cached.cachedAt > REFUNDS_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

function writeCache(params, payload) {
  if (typeof window === 'undefined') return

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(REFUNDS_CACHE_KEY) || '{}')
    cache[cacheKey(params)] = { payload, cachedAt: Date.now() }
    window.sessionStorage.setItem(REFUNDS_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

function clearCache() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(REFUNDS_CACHE_KEY)
}

function statusLabel(status) {
  return String(status || '-')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function statusBadgeClass(status) {
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'processing') return 'border-sky-200 bg-sky-50 text-sky-700'
  if (status === 'pending') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (status === 'rejected') return 'border-rose-200 bg-rose-50 text-rose-700'
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function actionButtonClass(tone = 'slate') {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300',
    sky: 'border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300',
    slate: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
  }

  return `inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${tones[tone] || tones.slate}`
}

export default function Refunds() {
  const initialParams = { search: '', status: '', page: 1 }
  const initialCache = readCache(initialParams)
  const [params, setParams] = useState(initialParams)
  const [refunds, setRefunds] = useState(initialCache?.refunds || [])
  const [allRefunds, setAllRefunds] = useState([])
  const [meta, setMeta] = useState(initialCache?.meta || null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(!initialCache)
  const [updating, setUpdating] = useState(false)

  const stats = useMemo(() => ({
    total: allRefunds.length,
    pending: allRefunds.filter((refund) => refund.status === 'pending').length,
    processing: allRefunds.filter((refund) => refund.status === 'processing').length,
    completed: allRefunds.filter((refund) => refund.status === 'completed').length,
  }), [allRefunds])

  const updateParams = (nextParams) => {
    setParams(nextParams)
  }

  const hasActiveFilters = Boolean(search || params.status)
  const statItems = [
    { label: 'Total Refunds', value: stats.total, variant: 'slate', icon: FiRefreshCw },
    { label: 'Pending', value: stats.pending, variant: 'amber', icon: FiClock },
    { label: 'Processing', value: stats.processing, variant: 'sky', icon: FiDollarSign },
    { label: 'Completed', value: stats.completed, variant: 'emerald', icon: FiCheckCircle },
  ]
  const filterOptions = [
    {
      key: 'status',
      value: params.status,
      onChange: (value) => updateParams({ ...params, status: value, page: 1 }),
      options: [
        { value: '', label: 'All Statuses' },
        ...statuses.map((status) => ({ value: status, label: statusLabel(status) })),
      ],
    },
  ]

  const loadStats = () => {
    adminApi.listFresh('refunds', { page: 1, per_page: 100 })
      .then((res) => setAllRefunds(res.data.data?.data || []))
      .catch(() => {})
  }

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    let active = true
    const cached = readCache(params)

    if (cached) {
      setRefunds(cached.refunds || [])
      setMeta(cached.meta || null)
      setLoading(false)
      setUpdating(false)
      return () => { active = false }
    }

    const hasRows = refunds.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('refunds', params)
      .then((res) => {
        if (!active) return
        const payload = {
          refunds: res.data.data?.data || [],
          meta: res.data.data,
        }
        setRefunds(payload.refunds)
        setMeta(payload.meta)
        writeCache(params, payload)
      })
      .catch(() => active && toast.error('Unable to load refunds.'))
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

  const refresh = () => {
    clearCache()
    loadStats()
    setParams((current) => ({ ...current }))
  }

  const updateStatus = async (refund, status) => {
    if (refund.status === status) return

    const result = await Swal.fire({
      title: 'Update refund status?',
      html: `
        <p class="mb-3 text-sm text-slate-600">${statusLabel(refund.status)} to ${statusLabel(status)}</p>
        <input id="transaction_id" class="swal2-input" placeholder="Transaction ID (optional)" value="${refund.transaction_id || ''}">
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
      preConfirm: () => ({
        transaction_id: document.getElementById('transaction_id')?.value?.trim() || undefined,
      }),
    })
    if (!result.isConfirmed) return

    try {
      await adminApi.patch('refunds', refund.id, 'status', {
        status,
        transaction_id: result.value?.transaction_id,
      })
      toast.success('Refund status updated.')
      refresh()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update refund status.')
    }
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
        searchPlaceholder="Search by order, customer, method, or transaction ID"
        filters={filterOptions}
        onClear={() => {
          setSearch('')
          updateParams({ search: '', status: '', page: 1 })
        }}
        hasActiveFilters={hasActiveFilters}
      />

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && refunds.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && refunds.length === 0 ? (
        <EmptyState title="No refunds found" text="Try another search term or adjust the refund status filter." />
      ) : null}

      {refunds.length > 0 ? (
        <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[1120px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Refund</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3 text-center">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Date</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {refunds.map((refund) => (
                <tr key={refund.id} className="transition hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-sky-700">
                        <FiRefreshCw className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="font-medium text-slate-950">{refund.return_request?.order?.order_number || `Refund #${refund.id}`}</div>
                        <div className="text-xs text-slate-500">Return #{refund.return_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-slate-800">{refund.return_request?.user?.full_name || '-'}</div>
                      <div className="text-xs text-slate-500">{refund.return_request?.user?.phone || '-'}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{refund.refund_method || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{refund.transaction_id || '-'}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">{money(refund.refund_amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="space-y-2">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(refund.status)}`}>
                        {statusLabel(refund.status)}
                      </span>
                      <select
                        value={refund.status}
                        onChange={(event) => updateStatus(refund, event.target.value)}
                        className="block w-full rounded-md border border-slate-300 px-2 py-1 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                      >
                        {statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">{date(refund.refunded_at || refund.created_at, 'en-US')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-3">
                      {refund.return_request?.user?.id ? (
                        <Link to={`/admin/users/${refund.return_request.user.id}`} className={actionButtonClass('emerald')} title="Open user">
                          <FiArrowUpRight className="h-4 w-4" />
                        </Link>
                      ) : null}
                      {refund.return_request?.order?.id ? (
                        <Link to={`/admin/orders/${refund.return_request.order.id}`} className={actionButtonClass('sky')} title="Open order">
                          <FiRefreshCw className="h-4 w-4" />
                        </Link>
                      ) : null}
                    </div>
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
              onClick={() => updateParams({ ...params, page: params.page - 1 })}
              className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={params.page >= meta.last_page}
              onClick={() => updateParams({ ...params, page: params.page + 1 })}
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
