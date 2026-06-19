import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiKey, FiSave } from 'react-icons/fi'
import toast from 'react-hot-toast'
// import PageHeader from '../../components/common/PageHeader'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { hasPermission } from '../../utils/permissions'
import { date } from '../../utils/formatters'
import { adminAuthApi } from '../../api/adminAuthApi'

const settingsLinks = [
  { to: '/admin/site-settings', title: 'Site Settings', description: 'Manage the shared logo, name, contact details, and footer info.', permission: 'role.manage' },
  { to: '/admin/staff', title: 'Staff Management', description: 'Review the staff list, statuses, edits, and team access.', permission: 'staff.view' },
  { to: '/admin/roles', title: 'Roles & Permissions', description: 'Control which roles get access to which areas.', permission: 'role.manage' },
  { to: '/admin/reports', title: 'Report Center', description: 'Open sales, orders, inventory, delivery, and refund reports.', permission: 'report.view' },
  { to: '/admin/activity-logs', title: 'Activity Logs', description: 'Shortcut to review admin action history.', permission: 'activity-log.view' },
]

const statusTone = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  inactive: 'bg-slate-100 text-slate-700 ring-slate-200',
  suspended: 'bg-amber-50 text-amber-700 ring-amber-100',
}

export default function AdminProfile() {
  const { staff, updateProfileState } = useStaffAuth()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    license_no: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      full_name: staff?.full_name || '',
      email: staff?.email || '',
      phone: staff?.phone || '',
      license_no: staff?.license_no || '',
    })
  }, [staff])

  const visibleLinks = settingsLinks.filter((item) => hasPermission(staff, item.permission))
  const roleNames = staff?.roles?.map((role) => role.name).join(', ') || 'No assigned role'
  const permissionCount = staff?.permissions?.length || 0
  const statusClass = statusTone[staff?.status] || statusTone.inactive

  const hasChanges = useMemo(() => (
    form.full_name !== (staff?.full_name || '')
    || form.email !== (staff?.email || '')
    || form.phone !== (staff?.phone || '')
    || form.license_no !== (staff?.license_no || '')
  ), [form, staff])

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)

    try {
      const res = await adminAuthApi.updateProfile(form)
      updateProfileState(res.data.data)
      toast.success('Profile updated.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="bg-linear-to-r from-slate-950 via-slate-900 to-emerald-950 px-6 py-7 text-white">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-xl font-semibold">
                  {initials(staff?.full_name)}
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-emerald-200/75">Admin Account</p>
                  <h2 className="mt-1 text-2xl font-semibold">{staff?.full_name || 'Admin User'}</h2>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-6 md:grid-cols-3">
            <MetricCard label="Assigned Roles" value={staff?.roles?.length || 0} note={roleNames} />
            <MetricCard label="Permissions" value={permissionCount} note="Current account access scope" />
            <MetricCard label="Last Login" value={staff?.last_login_at ? date(staff.last_login_at, 'en-US') : 'N/A'} note="Most recent recorded session" />
          </div>

          <div className="border-t border-slate-200 px-6 py-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Profile information</h3>
              </div>
              <Link
                to="/admin/profile/password"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              >
                <FiKey className="h-4 w-4" />
                Change Password
              </Link>
            </div>

            <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="admin-full-name" className="text-sm font-medium text-slate-700">Full name</label>
                <input
                  id="admin-full-name"
                  type="text"
                  value={form.full_name}
                  onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                  placeholder="Enter full name"
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-3 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label htmlFor="admin-email" className="text-sm font-medium text-slate-700">Email address</label>
                <input
                  id="admin-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Enter email"
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-3 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label htmlFor="admin-phone" className="text-sm font-medium text-slate-700">Phone number</label>
                <input
                  id="admin-phone"
                  type="text"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="Enter phone number"
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-3 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label htmlFor="admin-license-no" className="text-sm font-medium text-slate-700">License no</label>
                <input
                  id="admin-license-no"
                  type="text"
                  value={form.license_no}
                  onChange={(event) => setForm((current) => ({ ...current, license_no: event.target.value }))}
                  placeholder="Enter license number"
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-3 focus:ring-emerald-100"
                />
              </div>

              <div className="sm:col-span-2 flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!hasChanges || saving}
                  className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <FiSave className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg pb-2 border-b border-slate-300 font-semibold text-slate-950">Quick settings</h3>            

            <div className="mt-5 space-y-3">
              {visibleLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group block rounded-md border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-emerald-300 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{item.title}</p>
                    </div>
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-emerald-700 transition group-hover:text-emerald-800 group-hover:translate-x-0.5" title={`Open ${item.title}`}>
                      <FiArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg pb-2 border-b border-slate-300 font-semibold text-slate-950">Access summary</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {(staff?.permissions || []).length ? (
                staff.permissions.map((permission) => (
                  <span key={permission} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                    {permission}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">No explicit permissions assigned.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

function MetricCard({ label, value, note }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{note}</p>
    </div>
  )
}

function labelForStatus(status) {
  const labels = {
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
  }

  return labels[status] || status || 'Unknown'
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AD'
}
