import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiEdit, FiPlus, FiShield, FiTrash2, FiUser, FiUserCheck, FiUserX, FiUsers } from 'react-icons/fi'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import EmptyState from '../../components/common/EmptyState'
import AdminFilterBar from '../../components/admin/AdminFilterBar'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import AdminStatCard from '../../components/admin/AdminStatCard'
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

function actionButtonClass(tone = 'slate') {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300',
    rose: 'border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:text-rose-700',
    slate: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
  }

  return `inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${tones[tone] || tones.slate}`
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

  const updateParams = (nextParams) => {
    setParams(nextParams)
  }

  const hasActiveFilters = Boolean(search || params.status)
  const statItems = [
    { label: 'Total Staff', value: stats.total, variant: 'slate', icon: FiUsers },
    { label: 'Active Staff', value: stats.active, variant: 'emerald', icon: FiUser },
    { label: 'Suspended', value: stats.suspended, variant: 'amber', icon: FiShield },
    { label: 'Role Types', value: stats.roles, variant: 'sky', icon: FiEdit },
  ]
  const filterOptions = [
    {
      key: 'status',
      value: params.status,
      onChange: (value) => updateParams({ ...params, status: value, page: 1 }),
      options: statuses.map((status) => ({
        value: status,
        label: status ? statusLabels[status] : 'All Statuses',
      })),
    },
  ]

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
        {statItems.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} variant={item.variant} icon={item.icon} />
        ))}
      </div>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, phone, or status"
        filters={filterOptions}
        onClear={() => { setSearch(''); updateParams({ search: '', status: '', page: 1 }) }}
        hasActiveFilters={hasActiveFilters}
      >
        <Link
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          to="/admin/staff/create"
        >
          <FiPlus className="h-4 w-4" />
          New Staff
        </Link>
      </AdminFilterBar>

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && staff.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && staff.length === 0 ? <EmptyState title="No staff found" text="Try another search term or adjust the status filter." /> : null}

      {staff.length > 0 ? (
        <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[980px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
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
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-xs font-semibold text-emerald-700">
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
                        className={actionButtonClass('emerald')}
                        to={`/admin/staff/${member.id}/edit`}
                        title="Edit staff"
                      >
                        <FiEdit className="h-4 w-4" />
                      </Link>
                      {member.status !== 'active' ? (
                        <button
                          type="button"
                          className={actionButtonClass('emerald')}
                          onClick={() => changeStatus(member, 'active')}
                          title="Activate staff"
                        >
                          <FiUserCheck className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={actionButtonClass('amber')}
                          onClick={() => changeStatus(member, 'inactive')}
                          title="Deactivate staff"
                        >
                          <FiUserX className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        className={actionButtonClass('rose')}
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
        </div>
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
