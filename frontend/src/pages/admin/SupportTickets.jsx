import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCheckCircle, FiClock, FiEye, FiHeadphones, FiMessageSquare } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import EmptyState from '../../components/common/EmptyState'
import { date } from '../../utils/formatters'

const statuses = ['', 'open', 'in_progress', 'resolved', 'closed']
const SUPPORT_CACHE_KEY = 'admin_support_tickets_payload_v1'
const SUPPORT_CACHE_TTL = 2 * 60 * 1000

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
    const cache = JSON.parse(window.sessionStorage.getItem(SUPPORT_CACHE_KEY) || '{}')
    const cached = cache[cacheKey(params)]
    if (!cached || Date.now() - cached.cachedAt > SUPPORT_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

function writeCache(params, payload) {
  if (typeof window === 'undefined') return

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(SUPPORT_CACHE_KEY) || '{}')
    cache[cacheKey(params)] = { payload, cachedAt: Date.now() }
    window.sessionStorage.setItem(SUPPORT_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

function statusBadgeClass(status) {
  if (status === 'open') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (status === 'in_progress') return 'border-sky-200 bg-sky-50 text-sky-700'
  if (status === 'resolved') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'closed') return 'border-slate-200 bg-slate-100 text-slate-600'
  return 'border-slate-200 bg-slate-50 text-slate-500'
}

function statusLabel(status) {
  if (!status) return 'Unknown'
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function StatCard({ icon: Icon, label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-white text-slate-700',
    amber: 'border-amber-200 bg-amber-50/70 text-amber-700',
    sky: 'border-sky-200 bg-sky-50/70 text-sky-700',
    emerald: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
  }

  return (
    <div className={`rounded-lg border px-4 py-4 ${tones[tone] || tones.slate}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}

export default function SupportTickets() {
  const initialParams = { search: '', status: '', page: 1 }
  const initialCache = readCache(initialParams)
  const [params, setParams] = useState(initialParams)
  const [tickets, setTickets] = useState(initialCache?.tickets || [])
  const [allTickets, setAllTickets] = useState([])
  const [meta, setMeta] = useState(initialCache?.meta || null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(!initialCache)
  const [updating, setUpdating] = useState(false)

  const stats = useMemo(() => ({
    total: allTickets.length,
    open: allTickets.filter((ticket) => ticket.status === 'open').length,
    inProgress: allTickets.filter((ticket) => ticket.status === 'in_progress').length,
    resolved: allTickets.filter((ticket) => ticket.status === 'resolved').length,
  }), [allTickets])

  const hasActiveFilters = Boolean(search || params.status)

  const loadStats = () => {
    adminApi.listFresh('support-tickets', { page: 1, per_page: 100 })
      .then((res) => setAllTickets(res.data.data?.data || []))
      .catch(() => {})
  }

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    let active = true
    const cached = readCache(params)

    if (cached) {
      setTickets(cached.tickets || [])
      setMeta(cached.meta || null)
      setLoading(false)
      setUpdating(false)
      return () => { active = false }
    }

    const hasRows = tickets.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('support-tickets', params)
      .then((res) => {
        if (!active) return
        const payload = {
          tickets: res.data.data?.data || [],
          meta: res.data.data,
        }
        setTickets(payload.tickets)
        setMeta(payload.meta)
        writeCache(params, payload)
      })
      .catch(() => active && toast.error('Unable to load support tickets.'))
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

  const updateParams = (nextParams) => {
    setParams(nextParams)
  }

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FiHeadphones} label="Total Tickets" value={stats.total} tone="slate" />
        <StatCard icon={FiClock} label="Open Tickets" value={stats.open} tone="amber" />
        <StatCard icon={FiMessageSquare} label="In Progress" value={stats.inProgress} tone="sky" />
        <StatCard icon={FiCheckCircle} label="Resolved" value={stats.resolved} tone="emerald" />
      </div>

      <div className="mb-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_220px_140px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by subject, customer, phone, or order number"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <select
            value={params.status}
            onChange={(event) => updateParams({ ...params, status: event.target.value, page: 1 })}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          >
            {statuses.map((status) => (
              <option key={status || 'all'} value={status}>
                {status ? statusLabel(status) : 'All Statuses'}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              updateParams({ search: '', status: '', page: 1 })
            }}
            disabled={!hasActiveFilters}
            className="inline-flex items-center justify-center rounded-md border border-slate-500 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-gray-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && tickets.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && tickets.length === 0 ? (
        <EmptyState title="No support tickets found" text="Try another search term or adjust the ticket status filter." />
      ) : null}

      {tickets.length > 0 ? (
        <table className="min-w-full border border-slate-300 divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Linked Order</th>
              <th className="px-4 py-3 text-center">Replies</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Created</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="transition hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-slate-950">{ticket.subject}</div>
                    <div className="text-xs text-slate-500">Ticket #{ticket.id}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-slate-800">{ticket.user?.full_name || '-'}</div>
                    <div className="text-xs text-slate-500">{ticket.user?.phone || '-'}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{ticket.order?.order_number || '-'}</td>
                <td className="px-4 py-3 text-center font-semibold text-slate-700">{ticket.replies_count || 0}</td>
                <td className="px-4 py-3 text-slate-600">{ticket.assigned_staff?.full_name || 'Unassigned'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(ticket.status)}`}>
                    {statusLabel(ticket.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-slate-600">{date(ticket.created_at, 'en-US')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-3">
                    <Link
                      to={`/admin/support/${ticket.id}`}
                      title="Open ticket"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-300"
                    >
                      <FiEye className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
