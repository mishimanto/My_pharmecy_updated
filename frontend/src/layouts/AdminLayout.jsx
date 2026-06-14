import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  FiActivity,
  FiAlertCircle,
  FiBox,
  FiChevronDown,
  FiCreditCard,
  FiFileText,
  FiGrid,
  FiHeadphones,
  FiHome,
  FiLayers,
  FiList,
  FiLogOut,
  FiMapPin,
  FiMenu,
  FiPackage,
  FiPieChart,
  FiSettings,
  FiShield,
  FiShoppingBag,
  FiTag,
  FiTruck,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { useStaffAuth } from '../context/StaffAuthContext'
import { hasPermission } from '../utils/permissions'

const navigationGroups = [
  {
    title: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', permission: 'report.view', icon: FiHome },
      { to: '/admin/orders', label: 'Orders', permission: 'order.view', icon: FiShoppingBag },
      { to: '/admin/prescriptions', label: 'Prescriptions', permission: 'prescription.view', icon: FiFileText },
      { to: '/admin/payments', label: 'Payments', permission: 'payment.view', icon: FiCreditCard },
      { to: '/admin/deliveries', label: 'Deliveries', permission: 'delivery.manage', icon: FiTruck },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { to: '/admin/categories', label: 'Categories', permission: 'product.view', icon: FiGrid },
      { to: '/admin/manufacturers', label: 'Manufacturers', permission: 'product.view', icon: FiTag },
      { to: '/admin/products', label: 'Products', permission: 'product.view', icon: FiBox },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { to: '/admin/suppliers', label: 'Suppliers', permission: 'inventory.view', icon: FiUsers },
      { to: '/admin/inventory', label: 'Inventory', permission: 'inventory.view', icon: FiPackage },
      { to: '/admin/inventory/batches', label: 'Batches', permission: 'inventory.view', icon: FiLayers },
      { to: '/admin/inventory/transactions', label: 'Stock Transactions', permission: 'inventory.view', icon: FiList },
      { to: '/admin/inventory/low-stock', label: 'Low Stock', permission: 'inventory.view', icon: FiAlertCircle },
      { to: '/admin/inventory/near-expiry', label: 'Near Expiry', permission: 'inventory.view', icon: FiActivity },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/admin/users', label: 'Customers', permission: 'user.view', icon: FiUser },
      { to: '/admin/delivery-areas', label: 'Delivery Areas', permission: 'delivery.manage', icon: FiMapPin },
      { to: '/admin/riders', label: 'Riders', permission: 'delivery.manage', icon: FiTruck },
      { to: '/admin/support', label: 'Support', permission: 'support.manage', icon: FiHeadphones },
      { to: '/admin/returns', label: 'Returns', permission: 'return.manage', icon: FiPackage },
      { to: '/admin/refunds', label: 'Refunds', permission: 'refund.approve', icon: FiCreditCard },
    ],
  },
]

const settingsItems = [
  { to: '/admin/profile', label: 'My Profile', permission: null, icon: FiUser },
  { to: '/admin/staff', label: 'Staff', permission: 'staff.view', icon: FiUsers },
  { to: '/admin/roles', label: 'Roles & Permissions', permission: 'role.manage', icon: FiShield },
  { to: '/admin/reports', label: 'Reports', permission: 'report.view', icon: FiPieChart },
  { to: '/admin/activity-logs', label: 'Activity Logs', permission: 'activity-log.view', icon: FiActivity },
]

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AD'
}

function formatToday() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date())
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
          items: group.items.filter((item) => !item.permission || hasPermission(staff, item.permission)),
        }))
        .filter((group) => group.items.length > 0),
    [staff],
  )

  const visibleSettings = useMemo(
    () => settingsItems.filter((item) => !item.permission || hasPermission(staff, item.permission)),
    [staff],
  )

  const activeItem = useMemo(
    () =>
      [...visibleGroups.flatMap((group) => group.items), ...visibleSettings].find(
        (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
      ),
    [location.pathname, visibleGroups, visibleSettings],
  )

  const roleNames = staff?.roles?.map((role) => role.name).join(', ') || 'Staff Access'
  const statusLabel = staff?.status ? staff.status[0].toUpperCase() + staff.status.slice(1) : 'Unknown'
  const todayLabel = useMemo(() => formatToday(), [])

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
                <h1 className="mt-2 text-xl font-semibold">Admin Panel</h1>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Manage orders, inventory, customer support, and daily operations from one workspace.
                </p>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-5">
              <div className="space-y-6">
                {visibleGroups.map((group) => (
                  <div key={group.title}>
                    <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{group.title}</p>
                    <div className="mt-3 space-y-1.5">
                      {group.items.map((item) => (
                        <NavItem key={item.to} item={item} />
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
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 lg:hidden"
                  onClick={() => setSidebarOpen((open) => !open)}
                >
                  <span className="sr-only">Open sidebar</span>
                  <FiMenu className="h-4 w-4" />
                </button>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Admin Workspace</p>
                    <span className="hidden text-slate-300 sm:inline">/</span>
                    <p className="text-xs font-medium text-slate-500">{todayLabel}</p>
                  </div>
                  <h2 className="truncate text-xl font-semibold text-slate-950">{activeItem?.label || 'Admin Panel'}</h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 xl:flex">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                    {roleNames}
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                    {statusLabel}
                  </span>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-slate-300"
                    onClick={() => setSettingsOpen((open) => !open)}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
                      {initials(staff?.full_name)}
                    </span>
                    <span className="hidden min-w-0 text-left md:block">
                      <span className="block truncate text-sm font-semibold text-slate-950">{staff?.full_name || 'Admin User'}</span>
                      <span className="block truncate text-xs text-slate-500">{staff?.email || 'No email available'}</span>
                    </span>
                    <FiChevronDown className={`h-4 w-4 text-slate-400 transition ${settingsOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {settingsOpen ? (
                    <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.35)]">
                      <div className="rounded-xl bg-slate-50 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-950">{staff?.full_name || 'Admin User'}</p>
                        <p className="mt-1 text-xs text-slate-500">{staff?.email || 'No email available'}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">{roleNames}</span>
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">{statusLabel}</span>
                        </div>
                      </div>

                      <div className="mt-2 space-y-1">
                        {visibleSettings.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                              `flex items-center justify-between rounded-xl px-4 py-3 text-sm transition ${
                                isActive ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-100'
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <span className="flex items-center gap-3">
                                  <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                  <span>{item.label}</span>
                                </span>
                                <span className="text-xs opacity-70">Open</span>
                              </>
                            )}
                          </NavLink>
                        ))}
                      </div>

                      <div className="mt-2 border-t border-slate-200 pt-2">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                          onClick={logout}
                        >
                          <span className="flex items-center gap-3">
                            <FiLogOut className="h-4 w-4" />
                            <span>Log out</span>
                          </span>
                          <span className="text-xs uppercase tracking-[0.2em]">Exit</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
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

function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
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
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}
