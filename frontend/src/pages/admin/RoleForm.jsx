import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle, FiKey, FiSave, FiShield } from 'react-icons/fi'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
// import PageHeader from '../../components/common/PageHeader'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import { adminApi } from '../../api/adminApi'

export default function RoleForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const [name, setName] = useState('')
  const [permissions, setPermissions] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    adminApi.permissions()
      .then(({ data }) => active && setPermissions(data.data || []))
      .catch(() => active && toast.error('Unable to load permissions.'))

    if (editing) {
      adminApi.show('roles', id).then(({ data }) => {
        if (!active) return
        setName(data.data.name)
        setSelected((data.data.permissions || []).map((permission) => permission.name))
      })
        .catch(() => active && toast.error('Unable to load role details.'))
        .finally(() => active && setLoading(false))
    }

    return () => { active = false }
  }, [editing, id])

  const groupedPermissions = useMemo(() => {
    return permissions.reduce((groups, permission) => {
      const key = permissionGroup(permission.name)
      groups[key] = groups[key] || []
      groups[key].push(permission)
      return groups
    }, {})
  }, [permissions])

  const toggle = (permission) => {
    setSelected((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission])
  }

  const selectAll = () => {
    setSelected(permissions.map((permission) => permission.name))
  }

  const clearAll = () => {
    setSelected([])
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!name.trim()) {
      toast.error('Role name is required.')
      return
    }

    const result = await Swal.fire({ title: 'Save role permissions?', showCancelButton: true, confirmButtonText: 'Save', cancelButtonText: 'Cancel' })
    if (!result.isConfirmed) return

    setSaving(true)

    try {
      if (editing) await adminApi.update('roles', id, { name: name.trim(), permissions: selected })
      else await adminApi.create('roles', { name: name.trim(), permissions: selected })
      toast.success(editing ? 'Role updated.' : 'Role created.')
      navigate('/admin/roles')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save role.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <AdminLoadingState className="py-8" />
  }

  return (
    <>
      {/* <PageHeader title={editing ? 'Edit Role' : 'New Role'} subtitle="Enter a role name and select the required permissions." /> */}

      <form className="space-y-4" onSubmit={submit}>
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{editing ? 'Edit role permissions' : 'Create role permissions'}</h2>
          </div>
          <Link
            to="/admin/roles"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
              <label className="block">
                {/* <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Role name</span> */}
                <input
                  className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Role name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={selectAll}
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={selected.length === 0}
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {Object.entries(groupedPermissions).map(([group, groupPermissions]) => (
                <section key={group} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-slate-500">
                        <FiKey className="h-4 w-4" />
                      </span>
                      <h3 className="text-sm font-semibold text-slate-950">{formatPermissionLabel(group)}</h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{groupPermissions.length} permissions</span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {groupPermissions.map((permission) => {
                      const checked = selected.includes(permission.name)

                      return (
                        <label
                          key={permission.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-md border bg-white p-3 text-sm transition ${
                            checked ? 'border-emerald-200 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(permission.name)}
                            className="h-4 w-4 accent-emerald-600"
                          />
                          <span>
                            <span className="block font-semibold text-slate-800">{formatPermissionLabel(permission.name)}</span>
                            {/* <span className="mt-1 block text-xs text-slate-500">{permission.name}</span> */}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <FiShield className="h-4 w-4 text-emerald-700" />
                Role summary
              </div>
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Role</p>
                {/* <p className="mt-2 text-lg font-semibold text-slate-950">{name || 'Role name'}</p> */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <SummaryCard label="Selected" value={selected.length} />
                  <SummaryCard label="Available" value={permissions.length} />
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <FiCheckCircle className="h-4 w-4 text-sky-700" />
                Permission note
              </div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <p>Permissions control which admin routes and actions this role can access.</p>
                <p>Use least access for daily staff roles and reserve full access for trusted admins.</p>
              </div>
            </section>
          </aside>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiSave className="h-4 w-4" />
            <span>{saving ? 'Saving...' : editing ? 'Update Role' : 'Create Role'}</span>
          </button>
          <p className="text-sm text-slate-500">Selected permissions will be applied after save.</p>
        </div>
      </form>
    </>
  )
}

function permissionGroup(name) {
  const [group] = String(name || 'Other').split(/[.:_-]/)
  return group || 'Other'
}

function formatPermissionLabel(value) {
  return String(value || '-')
    .replace(/[._:-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}
