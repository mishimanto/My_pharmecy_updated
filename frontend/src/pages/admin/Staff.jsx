import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiEdit, FiPlus, FiShield, FiTrash2, FiUser, FiUserCheck, FiUserX, FiUsers, FiLock  } from 'react-icons/fi'
import { PiNewspaperClipping } from "react-icons/pi";
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import EmptyState from '../../components/common/EmptyState'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import { adminApi } from '../../api/adminApi'

const statuses = ['', 'active', 'inactive', 'suspended']
const statusLabels = { active: 'Active', inactive: 'Inactive', suspended: 'Suspended' }
const STAFF_CACHE_KEY = 'admin_staff_payload_v1'
const STAFF_CACHE_TTL = 2 * 60 * 1000

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
    const cache = JSON.parse(window.sessionStorage.getItem(STAFF_CACHE_KEY) || '{}')
    const cached = cache[cacheKey(params)]
    if (!cached || Date.now() - cached.cachedAt > STAFF_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

function writeCache(params, payload) {
  if (typeof window === 'undefined') return

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(STAFF_CACHE_KEY) || '{}')
    cache[cacheKey(params)] = { payload, cachedAt: Date.now() }
    window.sessionStorage.setItem(STAFF_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

function clearCache() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(STAFF_CACHE_KEY)
}

function getInitials(name) {
  return String(name || 'S')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'S'
}

function statusBadgeClass(status) {
  if (status === 'active') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'suspended') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-slate-100 text-slate-600'
}

function StatCard({ icon: Icon, label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-white text-slate-700',
    emerald: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50/70 text-amber-700',
    sky: 'border-sky-200 bg-sky-50/70 text-sky-700',
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

export default function Staff() {
  const initialParams = { search: '', status: '', page: 1 }
  const initialCache = readCache(initialParams)
  const [params, setParams] = useState(initialParams)
  const [staff, setStaff] = useState(initialCache?.staff || [])
  const [allStaff, setAllStaff] = useState([])
  const [meta, setMeta] = useState(initialCache?.meta || null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(!initialCache)
  const [updating, setUpdating] = useState(false)

  const stats = useMemo(() => ({
    total: allStaff.length,
    active: allStaff.filter((member) => member.status === 'active').length,
    suspended: allStaff.filter((member) => member.status === 'suspended').length,
    roles: new Set(allStaff.flatMap((member) => member.roles?.map((role) => role.name) || [])).size,
  }), [allStaff])

  const hasActiveFilters = Boolean(search || params.status)

  const loadStats = () => {
    adminApi.listFresh('staff', { page: 1, per_page: 100 })
      .then(({ data }) => setAllStaff(data.data?.data || []))
      .catch(() => {})
  }

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    let active = true
    const cached = readCache(params)

    if (cached) {
      setStaff(cached.staff || [])
      setMeta(cached.meta || null)
      setLoading(false)
      setUpdating(false)
      return () => { active = false }
    }

    const hasRows = staff.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('staff', params)
      .then(({ data }) => {
        if (!active) return
        const payload = {
          staff: data.data?.data || [],
          meta: data.data,
        }
        setStaff(payload.staff)
        setMeta(payload.meta)
        writeCache(params, payload)
      })
      .catch(() => active && toast.error('Unable to load staff.'))
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

  const updateParams = (nextParams) => {
    setParams(nextParams)
  }

  const changeStatus = async (member, status) => {
    const result = await Swal.fire({
      title: 'Update staff status?',
      text: `${statusLabels[member.status] || member.status} to ${statusLabels[status] || status}`,
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
    })
    if (!result.isConfirmed) return

    try {
      await adminApi.patch('staff', member.id, 'status', { status })
      toast.success('Status updated.')
      refresh()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update staff status.')
    }
  }

  const remove = async (member) => {
    const result = await Swal.fire({
      title: 'Delete this staff member?',
      text: member.full_name,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    })
    if (!result.isConfirmed) return

    try {
      await adminApi.remove('staff', member.id)
      toast.success('Staff member deleted.')
      refresh()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete staff member.')
    }
  }

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FiUsers} label="Total Staff" value={stats.total} tone="slate" />
        <StatCard icon={FiUser} label="Active Staff" value={stats.active} tone="emerald" />
        <StatCard icon={FiShield} label="Suspended" value={stats.suspended} tone="amber" />
        <StatCard icon={FiEdit} label="Role Types" value={stats.roles} tone="sky" />
      </div>

      <div className="mb-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_220px_150px_170px]">
          <input
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            placeholder="Search by name, email, phone, or status"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            value={params.status}
            onChange={(event) => updateParams({ ...params, status: event.target.value, page: 1 })}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          >
            {statuses.map((status) => (
              <option key={status || 'all'} value={status}>
                {status ? statusLabels[status] : 'All Statuses'}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => { setSearch(''); updateParams({ search: '', status: '', page: 1 }) }}
            disabled={!hasActiveFilters}
            className="inline-flex items-center justify-center rounded-md border border-slate-500 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-gray-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Filters
          </button>
          <Link
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            to="/admin/staff/create"
          >
            <FiPlus className="h-4 w-4" />
            New Staff
          </Link>
        </div>
      </div>

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && staff.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && staff.length === 0 ? <EmptyState title="No staff found" text="Try another search term or adjust the status filter." /> : null}

      {staff.length > 0 ? (
          <table className="min-w-full border border-slate-300 divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Staff Member</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">License</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((member) => (
                <tr key={member.id} className="transition hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-slate-100 to-slate-200 text-xs font-semibold text-slate-700">
                        {getInitials(member.full_name)}
                      </span>
                      <div>
                        <div className="font-medium text-slate-950">{member.full_name}</div>
                        <div className="text-xs text-slate-500">Staff #{member.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700">{member.email || '-'}</div>
                    <div className="text-xs text-slate-500">{member.phone || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{member.roles?.map((role) => role.name).join(', ') || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{member.license_no || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(member.status)}`}>
                      {statusLabels[member.status] || member.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-3">
                      <Link
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-300"
                        to={`/admin/staff/${member.id}/edit`}
                        title="Edit staff"
                      >
                        <FiEdit className="h-4 w-4" />
                      </Link>
                      {member.status !== 'active' ? (
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-300"
                          onClick={() => changeStatus(member, 'active')}
                          title="Activate staff"
                        >
                          <FiUserCheck className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700 transition hover:border-amber-300"
                          onClick={() => changeStatus(member, 'inactive')}
                          title="Deactivate staff"
                        >
                          <FiUserX className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                        onClick={() => remove(member)}
                        title="Delete staff"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
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
            <button className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={params.page <= 1} onClick={() => updateParams({ ...params, page: params.page - 1 })}>Previous</button>
            <button className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={meta.current_page >= meta.last_page} onClick={() => updateParams({ ...params, page: params.page + 1 })}>Next</button>
          </div>
        </div>
      ) : null}
    </>
  )
}
