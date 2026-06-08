import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'
import { hasPermission } from '../utils/permissions'

const navigationGroups = [
  {
    title: 'Overview',
    items: [
      ['/admin/dashboard', 'ড্যাশবোর্ড', 'report.view'],
      ['/admin/orders', 'অর্ডার', 'order.view'],
      ['/admin/prescriptions', 'প্রেসক্রিপশন', 'prescription.view'],
      ['/admin/payments', 'পেমেন্ট', 'payment.view'],
      ['/admin/deliveries', 'ডেলিভারি', 'delivery.manage'],
    ],
  },
  {
    title: 'Catalog',
    items: [
      ['/admin/categories', 'ক্যাটাগরি', 'product.view'],
      ['/admin/manufacturers', 'ম্যানুফ্যাকচারার', 'product.view'],
      ['/admin/products', 'প্রোডাক্ট', 'product.view'],
    ],
  },
  {
    title: 'Inventory',
    items: [
      ['/admin/suppliers', 'সাপ্লায়ার', 'inventory.view'],
      ['/admin/inventory', 'ইনভেন্টরি', 'inventory.view'],
      ['/admin/inventory/batches', 'ব্যাচ', 'inventory.view'],
      ['/admin/inventory/transactions', 'স্টক লেনদেন', 'inventory.view'],
      ['/admin/inventory/low-stock', 'লো স্টক', 'inventory.view'],
      ['/admin/inventory/near-expiry', 'নিয়ার এক্সপায়ারি', 'inventory.view'],
    ],
  },
  {
    title: 'Operations',
    items: [
      ['/admin/users', 'কাস্টমার', 'user.view'],
      ['/admin/delivery-areas', 'ডেলিভারি এলাকা', 'delivery.manage'],
      ['/admin/riders', 'রাইডার', 'delivery.manage'],
      ['/admin/support', 'সাপোর্ট', 'support.manage'],
      ['/admin/returns', 'রিটার্ন', 'return.manage'],
      ['/admin/refunds', 'রিফান্ড', 'refund.approve'],
    ],
  },
]

const settingsItems = [
  ['/admin/profile', 'আমার প্রোফাইল', null],
  ['/admin/staff', 'স্টাফ', 'staff.view'],
  ['/admin/roles', 'রোল ও পারমিশন', 'role.manage'],
  ['/admin/reports', 'রিপোর্ট', 'report.view'],
  ['/admin/activity-logs', 'অ্যাক্টিভিটি লগ', 'activity-log.view'],
]

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AD'
}

export default function AdminLayout() {
  const { staff, logout } = useStaffAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const visibleGroups = useMemo(
    () =>
      navigationGroups
        .map((group) => ({
          ...group,
          items: group.items.filter(([, , permission]) => !permission || hasPermission(staff, permission)),
        }))
        .filter((group) => group.items.length > 0),
    [staff],
  )

  const visibleSettings = useMemo(
    () => settingsItems.filter(([, , permission]) => !permission || hasPermission(staff, permission)),
    [staff],
  )

  const allVisibleLinks = useMemo(
    () => [...visibleGroups.flatMap((group) => group.items), ...visibleSettings],
    [visibleGroups, visibleSettings],
  )

  const activeLabel =
    allVisibleLinks.find(([to]) => location.pathname === to || location.pathname.startsWith(`${to}/`))?.[1] || 'Admin Panel'

  const roleNames = staff?.roles?.map((role) => role.name).join(', ') || 'Staff Access'

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSidebarOpen(false)
      setSettingsOpen(false)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-800 bg-slate-950 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-5 py-5">
              <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/18 via-teal-400/10 to-slate-900 p-4 shadow-[0_24px_60px_-32px_rgba(16,185,129,0.85)]">
                <p className="text-xs uppercase tracking-[0.28em] text-emerald-200/80">My Pharmecy</p>
                <h1 className="mt-2 text-xl font-semibold">Admin Console</h1>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  অর্ডার, ইনভেন্টরি, কাস্টমার সাপোর্ট আর daily operations এক জায়গা থেকে ম্যানেজ করুন।
                </p>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-5">
              <div className="space-y-6">
                {visibleGroups.map((group) => (
                  <div key={group.title}>
                    <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{group.title}</p>
                    <div className="mt-3 space-y-1.5">
                      {group.items.map(([to, label]) => (
                        <NavItem key={to} to={to} label={label} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </nav>

            <div className="border-t border-white/10 px-4 py-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-sm font-medium text-white">{staff?.full_name || 'Admin User'}</p>
                <p className="mt-1 text-xs text-slate-400">{roleNames}</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 lg:hidden"
                  onClick={() => setSidebarOpen((open) => !open)}
                >
                  <span className="sr-only">Open sidebar</span>
                  <span className="space-y-1.5">
                    <span className="block h-0.5 w-5 rounded-full bg-current" />
                    <span className="block h-0.5 w-5 rounded-full bg-current" />
                    <span className="block h-0.5 w-5 rounded-full bg-current" />
                  </span>
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Admin Workspace</p>
                  <h2 className="truncate text-xl font-semibold text-slate-950">{activeLabel}</h2>
                </div>
              </div>

              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-slate-300"
                  onClick={() => setSettingsOpen((open) => !open)}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                    {initials(staff?.full_name)}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm font-semibold text-slate-950">{staff?.full_name || 'Admin User'}</span>
                    <span className="block text-xs text-slate-500">Settings & account</span>
                  </span>
                  <span className={`text-slate-400 transition ${settingsOpen ? 'rotate-180' : ''}`}>⌄</span>
                </button>

                {settingsOpen ? (
                  <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.35)]">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-950">{staff?.full_name || 'Admin User'}</p>
                      <p className="mt-1 text-xs text-slate-500">{staff?.email || 'No email available'}</p>
                      <p className="mt-2 text-xs font-medium text-emerald-700">{roleNames}</p>
                    </div>

                    <div className="mt-2 space-y-1">
                      {visibleSettings.map(([to, label]) => (
                        <NavLink
                          key={to}
                          to={to}
                          className={({ isActive }) =>
                            `flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition ${
                              isActive ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-100'
                            }`
                          }
                        >
                          <span>{label}</span>
                          <span className="text-xs opacity-70">Open</span>
                        </NavLink>
                      ))}
                    </div>

                    <div className="mt-2 border-t border-slate-200 pt-2">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                        onClick={logout}
                      >
                        <span>লগআউট</span>
                        <span className="text-xs uppercase tracking-[0.2em]">Exit</span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>

      {sidebarOpen ? <button type="button" className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden" onClick={() => setSidebarOpen(false)} /> : null}
      {settingsOpen ? <button type="button" className="fixed inset-0 z-20 cursor-default bg-transparent" onClick={() => setSettingsOpen(false)} /> : null}
    </div>
  )
}

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
          isActive
            ? 'bg-white text-slate-950 shadow-[0_16px_32px_-24px_rgba(255,255,255,0.9)]'
            : 'text-slate-300 hover:bg-white/8 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`h-2.5 w-2.5 rounded-full transition ${isActive ? 'bg-emerald-500' : 'bg-slate-600 group-hover:bg-slate-400'}`} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}
