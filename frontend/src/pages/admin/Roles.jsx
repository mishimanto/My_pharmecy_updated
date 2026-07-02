import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiEdit, FiKey, FiPlus, FiShield, FiTrash2 } from 'react-icons/fi'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminFilterBar from '../../components/admin/AdminFilterBar'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import AdminStatCard from '../../components/admin/AdminStatCard'
import EmptyState from '../../components/common/EmptyState'
import { useAdminFreshListQuery } from '../../queries/adminQueries'
import { date } from '../../utils/formatters'

function getInitials(name) {
  return String(name || 'R')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'R'
}

function actionButtonClass(tone = 'slate', disabled = false) {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300',
    rose: 'border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:text-rose-700',
    slate: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
  }

  return `inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${
    disabled ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : tones[tone] || tones.slate
  }`
}

export default function Roles() {
  const initialParams = { search: '', page: 1 }
  const [params, setParams] = useState(initialParams)
  const [search, setSearch] = useState('')
  const rolesQuery = useAdminFreshListQuery('roles', params, {
    placeholderData: (previous) => previous,
    staleTime: 1000 * 30,
  })
  const statsQuery = useAdminFreshListQuery('roles', { page: 1, per_page: 100 }, {
    staleTime: 1000 * 30,
  })
  const roles = rolesQuery.data?.data || []
  const meta = rolesQuery.data || null
  const allRoles = statsQuery.data?.data || []
  const loading = rolesQuery.isLoading && !rolesQuery.data
  const updating = rolesQuery.isFetching && Boolean(rolesQuery.data)

  const stats = useMemo(() => ({
    total: allRoles.length,
    protected: allRoles.filter((role) => role.name === 'Super Admin').length,
    permissionLinks: allRoles.reduce((sum, role) => sum + (role.permissions?.length || 0), 0),
    noPermissions: allRoles.filter((role) => (role.permissions?.length || 0) === 0).length,
  }), [allRoles])

  const hasActiveFilters = Boolean(search)
  const statItems = [
    { label: 'Total Roles', value: stats.total, variant: 'slate', icon: FiShield },
    { label: 'Permission Links', value: stats.permissionLinks, variant: 'emerald', icon: FiKey },
    { label: 'Protected Roles', value: stats.protected, variant: 'amber', icon: FiShield },
    { label: 'No Permissions', value: stats.noPermissions, variant: 'sky', icon: FiEdit },
  ]

  useEffect(() => {
    if (rolesQuery.isError) {
      toast.error('Unable to load roles.')
    }
  }, [rolesQuery.isError])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setParams((current) => current.search === search ? current : { ...current, search, page: 1 })
    }, 350)

    return () => clearTimeout(timeout)
  }, [search])

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
      await Promise.all([rolesQuery.refetch(), statsQuery.refetch()])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete role.')
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
        searchPlaceholder="Search roles by name"
        onClear={() => {
          setSearch('')
          setParams({ search: '', page: 1 })
        }}
        hasActiveFilters={hasActiveFilters}
      >
        <Link
          to="/admin/roles/create"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <FiPlus className="h-4 w-4" />
          <span>New Role</span>
        </Link>
      </AdminFilterBar>

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && roles.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && roles.length === 0 ? (
        <EmptyState title="No roles found" text="Create a new role or adjust the search." />
      ) : null}

      {roles.length > 0 ? (
        <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
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
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-xs font-semibold text-emerald-700">
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
                          className={actionButtonClass('emerald')}
                        >
                          <FiEdit className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          title={isProtected ? 'Super Admin role cannot be deleted.' : 'Delete role'}
                          disabled={isProtected}
                          onClick={() => remove(role)}
                          className={actionButtonClass('rose', isProtected)}
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
        </div>
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
