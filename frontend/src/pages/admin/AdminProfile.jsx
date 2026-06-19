import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiEdit, FiKey, FiMail, FiPhone, FiSave, FiShield, FiUser } from 'react-icons/fi'
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
              <FormField
                icon={FiUser}
                label="Full name"
                value={form.full_name}
                onChange={(value) => setForm((current) => ({ ...current, full_name: value }))}
                placeholder="Enter full name"
              />
              <FormField
                icon={FiMail}
                label="Email address"
                type="email"
                value={form.email}
                onChange={(value) => setForm((current) => ({ ...current, email: value }))}
                placeholder="Enter email"
              />
              <FormField
                icon={FiPhone}
                label="Phone number"
                value={form.phone}
                onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
                placeholder="Enter phone number"
              />
              <FormField
                icon={FiShield}
                label="License no"
                value={form.license_no}
                onChange={(value) => setForm((current) => ({ ...current, license_no: value }))}
                placeholder="Enter license number"
              />

              <div className="sm:col-span-2 flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!hasChanges || saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <FiSave className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
                <p className="text-sm text-slate-500">Role, permissions, and status are controlled by privileged admin workflows.</p>
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
                  className="block rounded-md border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-emerald-300 hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{item.title}</p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Open</span>
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

function FormField({ icon: Icon, label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="rounded-3xl border border-slate-200 bg-white p-4">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-3 w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
      />
    </label>
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
