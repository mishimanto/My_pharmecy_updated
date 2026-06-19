import { useEffect, useMemo, useState } from 'react'
import { FiActivity, FiArrowUpRight, FiClock, FiEye, FiLayers, FiShield } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { date } from '../../utils/formatters'

const ACTIVITY_CACHE_KEY = 'admin_activity_logs_payload_v1'
const ACTIVITY_CACHE_TTL = 2 * 60 * 1000

function cacheKey(params) {
  return JSON.stringify({
    search: params.search || '',
    module_name: params.module_name || '',
    action_type: params.action_type || '',
    page: params.page || 1,
  })
}

function readCache(params) {
  if (typeof window === 'undefined') return null

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(ACTIVITY_CACHE_KEY) || '{}')
    const cached = cache[cacheKey(params)]
    if (!cached || Date.now() - cached.cachedAt > ACTIVITY_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

function writeCache(params, payload) {
  if (typeof window === 'undefined') return

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(ACTIVITY_CACHE_KEY) || '{}')
    cache[cacheKey(params)] = { payload, cachedAt: Date.now() }
    window.sessionStorage.setItem(ACTIVITY_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

function clearCache() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(ACTIVITY_CACHE_KEY)
}

function humanize(value) {
  return String(value || '-')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function StatCard({ icon: Icon, label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-white text-slate-700',
    sky: 'border-sky-200 bg-sky-50/70 text-sky-700',
    emerald: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    violet: 'border-violet-200 bg-violet-50/70 text-violet-700',
  }

  return (
    <div className={`rounded-lg border px-4 py-4 ${tones[tone] || tones.slate}`}>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  )
}

function JsonPreview({ title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      {value ? (
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-700">
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : (
        <p className="mt-3 text-sm text-slate-500">No data captured for this side of the change.</p>
      )}
    </div>
  )
}

export default function ActivityLogs() {
  const initialParams = { search: '', module_name: '', action_type: '', page: 1 }
  const initialCache = readCache(initialParams)
  const [params, setParams] = useState(initialParams)
  const [logs, setLogs] = useState(initialCache?.logs || [])
  const [allLogs, setAllLogs] = useState([])
  const [meta, setMeta] = useState(initialCache?.meta || null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(!initialCache)
  const [updating, setUpdating] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const moduleOptions = useMemo(() => [...new Set(allLogs.map((log) => log.module_name).filter(Boolean))].sort(), [allLogs])
  const actionOptions = useMemo(() => [...new Set(allLogs.map((log) => log.action_type).filter(Boolean))].sort(), [allLogs])

  const stats = useMemo(() => ({
    total: allLogs.length,
    modules: moduleOptions.length,
    actions: actionOptions.length,
    uniqueStaff: new Set(allLogs.map((log) => log.staff_id).filter(Boolean)).size,
  }), [allLogs, moduleOptions.length, actionOptions.length])

  const loadOptions = () => {
    adminApi.listFresh('admin_activity_logs', { page: 1, per_page: 100 })
      .then((res) => setAllLogs(res.data.data?.data || []))
      .catch(() => {})
  }

  useEffect(() => {
    loadOptions()
  }, [])

  useEffect(() => {
    let active = true
    const cached = readCache(params)

    if (cached) {
      setLogs(cached.logs || [])
      setMeta(cached.meta || null)
      setLoading(false)
      setUpdating(false)
      return () => { active = false }
    }

    const hasRows = logs.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('admin_activity_logs', params)
      .then((res) => {
        if (!active) return
        const payload = {
          logs: res.data.data?.data || [],
          meta: res.data.data,
        }
        setLogs(payload.logs)
        setMeta(payload.meta)
        writeCache(params, payload)
      })
      .catch(() => active && toast.error('Unable to load activity logs.'))
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

  const openLog = async (id) => {
    setDetailsLoading(true)
    try {
      const res = await adminApi.show('admin_activity_logs', id)
      setSelectedLog(res.data.data)
    } catch {
      toast.error('Unable to load log details.')
    } finally {
      setDetailsLoading(false)
    }
  }

  const resetFilters = () => {
    setSearch('')
    setParams({ search: '', module_name: '', action_type: '', page: 1 })
  }

  const detailTarget = selectedLog?.record_id && selectedLog?.module_name
    ? getTargetLink(selectedLog.module_name, selectedLog.record_id)
    : null

  return (
    <>
      <PageHeader title="Activity Logs" subtitle="Review who changed what, where it happened, and what data changed." />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FiActivity} label="Visible Logs" value={stats.total} tone="slate" />
        <StatCard icon={FiLayers} label="Modules" value={stats.modules} tone="sky" />
        <StatCard icon={FiClock} label="Action Types" value={stats.actions} tone="emerald" />
        <StatCard icon={FiShield} label="Active Staff" value={stats.uniqueStaff} tone="violet" />
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1fr_220px_220px_140px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by action, module, record, staff, or IP"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <select
            value={params.module_name}
            onChange={(event) => setParams((current) => ({ ...current, module_name: event.target.value, page: 1 }))}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">All Modules</option>
            {moduleOptions.map((module) => <option key={module} value={module}>{humanize(module)}</option>)}
          </select>
          <select
            value={params.action_type}
            onChange={(event) => setParams((current) => ({ ...current, action_type: event.target.value, page: 1 }))}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">All Actions</option>
            {actionOptions.map((action) => <option key={action} value={action}>{humanize(action)}</option>)}
          </select>
          <button
            type="button"
            onClick={resetFilters}
            disabled={!search && !params.module_name && !params.action_type}
            className="inline-flex items-center justify-center rounded-md border border-slate-500 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-700 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && logs.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && logs.length === 0 ? (
        <EmptyState title="No activity logs found" text="Try another search term or adjust the module and action filters." />
      ) : null}

      {logs.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3 text-center">Record</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="transition hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-slate-900">{log.staff_name || 'System / Unknown'}</div>
                      <div className="text-xs text-slate-500">{log.staff_email || '-'}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      {humanize(log.action_type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{humanize(log.module_name)}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">{log.record_id || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{log.ip_address || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{date(log.created_at, 'en-US')}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => openLog(log.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300"
                    >
                      <FiEye className="h-4 w-4" />
                      View
                    </button>
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

      {selectedLog || detailsLoading ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">Log Details</h2>
              <p className="mt-1 text-sm text-slate-500">Inspect the before and after data captured for this action.</p>
            </div>
            <div className="flex items-center gap-2">
              {detailTarget ? (
                <Link
                  to={detailTarget}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400"
                >
                  Open Related Record
                  <FiArrowUpRight className="h-4 w-4" />
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400"
              >
                Close
              </button>
            </div>
          </div>

          {detailsLoading ? <AdminLoadingState className="py-8" /> : null}
          {selectedLog ? (
            <div className="grid gap-4 px-5 py-5 lg:grid-cols-[320px_minmax(0,1fr)] sm:px-6">
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="grid gap-3 text-sm">
                    <DetailRow label="Staff" value={selectedLog.staff_name || 'System / Unknown'} />
                    <DetailRow label="Email" value={selectedLog.staff_email || '-'} />
                    <DetailRow label="Action" value={humanize(selectedLog.action_type)} />
                    <DetailRow label="Module" value={humanize(selectedLog.module_name)} />
                    <DetailRow label="Record ID" value={selectedLog.record_id || '-'} />
                    <DetailRow label="IP Address" value={selectedLog.ip_address || '-'} />
                    <DetailRow label="Created" value={date(selectedLog.created_at, 'en-US')} />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <JsonPreview title="Old Value" value={selectedLog.old_value} />
                <JsonPreview title="New Value" value={selectedLog.new_value} />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-950">{value}</p>
    </div>
  )
}

function getTargetLink(moduleName, recordId) {
  const module = String(moduleName || '')

  if (!recordId) return null
  if (module === 'orders') return `/admin/orders/${recordId}`
  if (module === 'support_tickets') return `/admin/support/${recordId}`
  if (module === 'support-tickets') return `/admin/support/${recordId}`
  if (module === 'prescriptions') return `/admin/prescriptions/${recordId}`
  if (module === 'users') return `/admin/users/${recordId}`
  if (module === 'payments') return `/admin/payments`
  if (module === 'return_requests') return `/admin/returns`
  if (module === 'refunds') return `/admin/refunds`
  if (module === 'delivery_areas') return `/admin/delivery-areas`
  if (module === 'riders') return `/admin/riders`
  if (module === 'categories') return `/admin/categories/${recordId}/edit`
  if (module === 'manufacturers') return `/admin/manufacturers/${recordId}/edit`
  if (module === 'products') return `/admin/products/${recordId}/edit`
  if (module === 'suppliers') return `/admin/suppliers/${recordId}/edit`
  if (module === 'inventory_batches') return `/admin/inventory/batches/${recordId}/edit`

  return null
}
