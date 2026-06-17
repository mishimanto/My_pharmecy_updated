import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
  FiActivity,
  FiAlertCircle,
  FiBox,
  FiCreditCard,
  FiFileText,
  FiGrid,
  FiHeadphones,
  FiHome,
  FiLayers,
  FiList,
  FiMapPin,
  FiPackage,
  FiPieChart,
  FiShield,
  FiShoppingBag,
  FiTag,
  FiTruck,
  FiUser,
  FiUsers,
} from 'react-icons/fi'
import { useStaffAuth } from '../context/StaffAuthContext'
import { hasPermission } from '../utils/permissions'
import AdminHeader from '../components/admin/AdminHeader'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminFooter from '../components/admin/AdminFooter'

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
    <div className="min-h-screen bg-slate-200 text-slate-950">
      <div className="flex min-h-screen">
        <AdminSidebar sidebarOpen={sidebarOpen} visibleGroups={visibleGroups} />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
            activeItem={activeItem}
            roleNames={roleNames}
            staff={staff}
            visibleSettings={visibleSettings}
            logout={logout}
          />

          <main className="flex-1 px-5 py-5">
            <Outlet />
          </main>

          <AdminFooter />
        </div>
      </div>

      {sidebarOpen ? <button type="button" className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden" onClick={() => setSidebarOpen(false)} /> : null}
      {settingsOpen ? <button type="button" className="fixed inset-0 z-20 cursor-default bg-transparent" onClick={() => setSettingsOpen(false)} /> : null}
    </div>
  )
}

