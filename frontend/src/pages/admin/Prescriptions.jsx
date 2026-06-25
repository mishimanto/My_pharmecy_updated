import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiAlertCircle, FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi'
// import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import { date } from '../../utils/formatters'

const labels = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', need_clarification: 'Needs Clarification' }
const statusClasses = {
  pending: 'text-amber-600',
  approved: 'text-emerald-600',
  rejected: 'text-rose-600',
  need_clarification: 'text-violet-600',
}
const PRESCRIPTIONS_CACHE_KEY = 'admin_prescriptions_payload_v1'
const PRESCRIPTIONS_CACHE_TTL = 2 * 60 * 1000
const statStyles = {
  emerald: {
    panel: 'border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#d1fae5_100%)] shadow-[0_18px_45px_-34px_rgba(16,185,129,0.9)]',
    bubble: 'from-white/80 via-emerald-100 to-emerald-300/80 shadow-[-14px_18px_34px_-24px_rgba(5,150,105,0.9),inset_12px_-12px_24px_rgba(5,150,105,0.22),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
    value: 'text-emerald-700',
  },
  sky: {
    panel: 'border-sky-200 bg-[linear-gradient(135deg,#f0f9ff_0%,#dbeafe_100%)] shadow-[0_18px_45px_-34px_rgba(14,165,233,0.9)]',
    bubble: 'from-white/80 via-sky-100 to-sky-300/80 shadow-[-14px_18px_34px_-24px_rgba(2,132,199,0.9),inset_12px_-12px_24px_rgba(2,132,199,0.22),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
    value: 'text-sky-700',
  },
  amber: {
    panel: 'border-amber-200 bg-[linear-gradient(135deg,#fffbeb_0%,#fef3c7_100%)] shadow-[0_18px_45px_-34px_rgba(245,158,11,0.9)]',
    bubble: 'from-white/80 via-amber-100 to-amber-300/80 shadow-[-14px_18px_34px_-24px_rgba(217,119,6,0.9),inset_12px_-12px_24px_rgba(217,119,6,0.22),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
    value: 'text-amber-700',
  },
  rose: {
    panel: 'border-rose-200 bg-[linear-gradient(135deg,#fff1f2_0%,#ffe4e6_100%)] shadow-[0_18px_45px_-34px_rgba(244,63,94,0.75)]',
    bubble: 'from-white/80 via-rose-100 to-rose-300/80 shadow-[-14px_18px_34px_-24px_rgba(225,29,72,0.75),inset_12px_-12px_24px_rgba(225,29,72,0.2),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
    value: 'text-rose-700',
  },
}

function prescriptionCacheKey(params) {
  return JSON.stringify({
    search: params.search || '',
    status: params.status || '',
    page: params.page || 1,
  })
}

function readPrescriptionsCache(params) {
  if (typeof window === 'undefined') return null

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(PRESCRIPTIONS_CACHE_KEY) || '{}')
    const cached = cache[prescriptionCacheKey(params)]
    if (!cached || Date.now() - cached.cachedAt > PRESCRIPTIONS_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

function writePrescriptionsCache(params, payload) {
  if (typeof window === 'undefined') return

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(PRESCRIPTIONS_CACHE_KEY) || '{}')
    cache[prescriptionCacheKey(params)] = { payload, cachedAt: Date.now() }
    window.sessionStorage.setItem(PRESCRIPTIONS_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

export default function Prescriptions() {
  const initialParams = { search: '', status: '', page: 1 }
  const initialCache = readPrescriptionsCache(initialParams)
  const [items, setItems] = useState(initialCache?.items || [])
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(initialCache?.meta || null)
  const [loading, setLoading] = useState(!initialCache)
  const [updating, setUpdating] = useState(false)
  const statItems = useMemo(() => {
    const totalPrescriptions = meta?.total ?? items.length
    const pendingItems = items.filter((item) => item.status === 'pending').length
    const approvedItems = items.filter((item) => item.status === 'approved').length
    const flaggedItems = items.filter((item) => ['rejected', 'need_clarification'].includes(item.status)).length

    return [
      { label: 'Total Prescriptions', value: totalPrescriptions, variant: 'sky', icon: FiFileText },
      { label: 'Pending', value: pendingItems, variant: 'amber', icon: FiClock },
      { label: 'Approved', value: approvedItems, variant: 'emerald', icon: FiCheckCircle },
      { label: 'Rejected / Clarification', value: flaggedItems, variant: 'rose', icon: FiAlertCircle },
    ]
  }, [items, meta?.total])

  useEffect(() => {
    let active = true
    const params = { search, status, page }
    const cached = readPrescriptionsCache(params)

    if (cached) {
      setItems(cached.items || [])
      setMeta(cached.meta || null)
      setLoading(false)
      setUpdating(false)
      return () => { active = false }
    }

    const hasRows = items.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('prescriptions', params).then(({ data }) => {
      if (!active) return
      const payload = {
        items: data.data.data || [],
        meta: data.data,
      }
      setItems(payload.items)
      setMeta(payload.meta)
      writePrescriptionsCache(params, payload)
    }).catch(() => active && toast.error('Unable to load prescriptions.')).finally(() => {
      if (!active) return
      setLoading(false)
      setUpdating(false)
    })

    return () => { active = false }
  }, [search, status, page])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch((current) => current === query ? current : query)
      setPage(1)
    }, 350)

    return () => clearTimeout(timeout)
  }, [query])

  return (
    <>
      {/* <PageHeader title="Prescriptions" subtitle="Review prescriptions uploaded by customers." /> */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statItems.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} variant={item.variant} icon={item.icon} />
        ))}
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <input
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          placeholder="Search by code, patient, doctor, or customer"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="need_clarification">Needs Clarification</option>
        </select>
      </div>
      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && items.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && items.length === 0 && (
        <EmptyState
          title="No prescriptions found"
          text="Try another search term or adjust the status filter."
        />
      )}
      {items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Prescription</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-950">{item.prescription_code || `Prescription #${item.id}`}</div>
                    {item.order?.order_number ? (
                      <div className="text-xs text-slate-500">Order {item.order.order_number}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.user?.full_name || 'Guest customer'}</td>
                  <td className="px-4 py-3 font-medium text-slate-950">{item.patient_name || '-'}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold ${statusClasses[item.status] || 'text-slate-600'}`}>{labels[item.status] || item.status}</span></td>
                  <td className="px-4 py-3 text-slate-600">{date(item.uploaded_at || item.created_at, 'en-US')}</td>
                  <td className="px-4 py-3 text-center"><Link className="font-semibold text-emerald-700" to={`/admin/prescriptions/${item.id}`}>Review</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta?.last_page > 1 && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Page {meta.current_page || page} / {meta.last_page}</span>
          <div className="flex justify-end gap-2">
            <button className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <button className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      )}
    </>
  )
}

function StatCard({ label, value, variant = 'emerald', icon: Icon = FiFileText }) {
  const style = statStyles[variant] || statStyles.emerald

  return (
    <div className={`relative overflow-hidden rounded-lg border p-4 ${style.panel}`}>
      <span className={`pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-linear-to-br ${style.bubble}`}>
        <span className="absolute left-5 top-5 h-5 w-5 rounded-full bg-white/70 blur-[1px]" />
      </span>
      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className={`mt-2 text-2xl font-semibold ${style.value}`}>{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-slate-500">
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </div>
  )
}
