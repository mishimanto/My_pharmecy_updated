import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { hasPermission } from '../../utils/permissions'
import { date } from '../../utils/formatters'

const settingsLinks = [
  { to: '/admin/staff', title: 'স্টাফ ম্যানেজমেন্ট', description: 'স্টাফ তালিকা, status, edit এবং team access দেখুন।', permission: 'staff.view' },
  { to: '/admin/roles', title: 'রোল ও পারমিশন', description: 'কোন role কী access পাবে সেটা এখান থেকে নিয়ন্ত্রণ করুন।', permission: 'role.manage' },
  { to: '/admin/reports', title: 'রিপোর্ট সেন্টার', description: 'Sales, orders, inventory, delivery আর refund report খুলুন।', permission: 'report.view' },
  { to: '/admin/activity-logs', title: 'অ্যাক্টিভিটি লগ', description: 'Admin action history review করার জন্য shortcut।', permission: 'activity-log.view' },
]

const statusTone = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  inactive: 'bg-slate-100 text-slate-700 ring-slate-200',
  suspended: 'bg-amber-50 text-amber-700 ring-amber-100',
}

export default function AdminProfile() {
  const { staff } = useStaffAuth()

  const visibleLinks = settingsLinks.filter((item) => hasPermission(staff, item.permission))
  const roleNames = staff?.roles?.map((role) => role.name).join(', ') || 'No assigned role'
  const permissionCount = staff?.permissions?.length || 0
  const statusClass = statusTone[staff?.status] || statusTone.inactive

  return (
    <>
      <PageHeader title="আমার প্রোফাইল" subtitle="Admin account overview, assigned access এবং quick settings shortcuts." />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 px-6 py-7 text-white">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-xl font-semibold">
                  {initials(staff?.full_name)}
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-emerald-200/75">Admin Account</p>
                  <h2 className="mt-2 text-2xl font-semibold">{staff?.full_name || 'Admin User'}</h2>
                  <p className="mt-2 text-sm text-slate-300">{staff?.email || 'No email available'}</p>
                </div>
              </div>
              <div className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClass}`}>
                {labelForStatus(staff?.status)}
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-6 md:grid-cols-3">
            <MetricCard label="Assigned Roles" value={staff?.roles?.length || 0} note={roleNames} />
            <MetricCard label="Permissions" value={permissionCount} note="Current account access scope" />
            <MetricCard label="Last Login" value={staff?.last_login_at ? date(staff.last_login_at) : 'N/A'} note="Most recent recorded session" />
          </div>

          <div className="border-t border-slate-200 px-6 py-6">
            <h3 className="text-lg font-semibold text-slate-950">Account details</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailCard label="Full name" value={staff?.full_name || '-'} />
              <DetailCard label="Email address" value={staff?.email || '-'} />
              <DetailCard label="Phone number" value={staff?.phone || '-'} />
              <DetailCard label="License no" value={staff?.license_no || '-'} />
              <DetailCard label="Primary roles" value={roleNames} />
              <DetailCard label="Status" value={labelForStatus(staff?.status)} />
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Quick settings</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Header dropdown থেকে যেসব admin settings খুলছেন, সেগুলোর shortcut এখানে একসাথে রাখা হলো।
            </p>

            <div className="mt-5 space-y-3">
              {visibleLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-emerald-300 hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Open</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Access summary</h3>
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
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{note}</p>
    </div>
  )
}

function DetailCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-950">{value}</p>
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
