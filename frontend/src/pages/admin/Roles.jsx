import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiEdit, FiKey, FiPlus, FiShield, FiTrash2 } from 'react-icons/fi'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import EmptyState from '../../components/common/EmptyState'
import { date } from '../../utils/formatters'

const ROLES_CACHE_KEY = 'admin_roles_payload_v1'
const ROLES_CACHE_TTL = 2 * 60 * 1000

function cacheKey(params) {
  return JSON.stringify({
    search: params.search || '',
    page: params.page || 1,
  })
}

function readCache(params) {
  if (typeof window === 'undefined') return null

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(ROLES_CACHE_KEY) || '{}')
    const cached = cache[cacheKey(params)]
    if (!cached || Date.now() - cached.cachedAt > ROLES_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

function writeCache(params, payload) {
  if (typeof window === 'undefined') return

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(ROLES_CACHE_KEY) || '{}')
    cache[cacheKey(params)] = { payload, cachedAt: Date.now() }
    window.sessionStorage.setItem(ROLES_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

function clearCache() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(ROLES_CACHE_KEY)
}

function getInitials(name) {
  return String(name || 'R')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'R'
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

export default function Roles() {
  const initialParams = { search: '', page: 1 }
  const initialCache = readCache(initialParams)
  const [params, setParams] = useState(initialParams)
  const [roles, setRoles] = useState(initialCache?.roles || [])
  const [meta, setMeta] = useState(initialCache?.meta || null)
  const [allRoles, setAllRoles] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(!initialCache)
  const [updating, setUpdating] = useState(false)

  const stats = useMemo(() => ({
    total: allRoles.length,
    protected: allRoles.filter((role) => role.name === 'Super Admin').length,
    permissionLinks: allRoles.reduce((sum, role) => sum + (role.permissions?.length || 0), 0),
    noPermissions: allRoles.filter((role) => (role.permissions?.length || 0) === 0).length,
  }), [allRoles])

  const hasActiveFilters = Boolean(search)

  const loadRoleOptions = () => {
    adminApi.listFresh('roles', { page: 1, per_page: 100 })
      .then((res) => setAllRoles(res.data.data?.data || []))
      .catch(() => {})
  }

  useEffect(() => {
    loadRoleOptions()
  }, [])

  useEffect(() => {
    let active = true
    const cached = readCache(params)

    if (cached) {
      setRoles(cached.roles || [])
      setMeta(cached.meta || null)
      setLoading(false)
      setUpdating(false)
      return () => { active = false }
    }

    const hasRows = roles.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('roles', params)
      .then((res) => {
        if (!active) return
        const payload = {
          roles: res.data.data?.data || [],
          meta: res.data.data,
        }
        setRoles(payload.roles)
        setMeta(payload.meta)
        writeCache(params, payload)
      })
      .catch(() => active && toast.error('Unable to load roles.'))
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

  const refreshList = () => {
    clearCache()
    loadRoleOptions()
    setParams((current) => ({ ...current }))
  }

  const remove = async (role) => {
    const result = await Swal.fire({
      title: 'Delete this role?',
      text: role.name,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    })

    if (!result.isConfirmed) return

    try {
      await adminApi.remove('roles', role.id)
      toast.success('Role deleted.')
      refreshList()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete role.')
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 lg:flex-1">
          <StatCard icon={FiShield} label="Total Roles" value={stats.total} tone="slate" />
          <StatCard icon={FiKey} label="Permission Links" value={stats.permissionLinks} tone="emerald" />
          <StatCard icon={FiShield} label="Protected Roles" value={stats.protected} tone="amber" />
          <StatCard icon={FiEdit} label="No Permissions" value={stats.noPermissions} tone="sky" />
        </div>        
      </div>

      <div className="mb-4">
        <div className="grid gap-3 md:grid-cols-[1fr_150px_140px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search roles by name"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />

          <button
            type="button"
            onClick={() => {
              setSearch('')
              setParams({ search: '', page: 1 })
            }}
            disabled={!hasActiveFilters}
            className="inline-flex items-center justify-center rounded-md border border-slate-500 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-gray-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Filters
          </button>

          <Link
            to="/admin/roles/create"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <FiPlus className="h-4 w-4" />
            <span>New Role</span>
          </Link>
        </div>
      </div>

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && roles.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && roles.length === 0 ? (
        <EmptyState title="No roles found" text="Create a new role or adjust the search." />
      ) : null}

      {roles.length > 0 ? (
        <table className="min-w-full border border-slate-300 divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Permissions</th>
              <th className="px-4 py-3 text-center">Count</th>
              <th className="px-4 py-3 text-center">Created</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roles.map((role) => {
              const permissionNames = role.permissions?.map((permission) => permission.name) || []
              const preview = permissionNames.slice(0, 3).join(', ')
              const isProtected = role.name === 'Super Admin'

              return (
                <tr key={role.id} className="transition hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-slate-100 to-slate-200 text-xs font-semibold text-slate-700">
                        {getInitials(role.name)}
                      </span>
                      <div>
                        <div className="font-medium text-slate-950">{role.name}</div>
                        <div className="text-xs text-slate-500">Role #{role.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {permissionNames.length > 0 ? (
                      <div>
                        <div className="font-medium text-slate-800">{preview}{permissionNames.length > 3 ? '...' : ''}</div>
                        <div className="text-xs text-slate-500">Assigned permissions</div>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">{permissionNames.length}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{date(role.created_at, 'en-US')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-3">
                      <Link
                        to={`/admin/roles/${role.id}/edit`}
                        title="Edit role"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-300"
                      >
                        <FiEdit className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        title={isProtected ? 'Super Admin role cannot be deleted.' : 'Delete role'}
                        disabled={isProtected}
                        onClick={() => remove(role)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : null}

      {roles.length > 0 ? (
        <div className="mt-3 border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          <span className="font-semibold">Note:</span> Super Admin role stays protected from delete.
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
