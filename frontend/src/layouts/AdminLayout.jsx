import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
  FiActivity,
  FiAlertCircle,
  FiBell,
  FiBox,
  FiCreditCard,
  FiFileText,
  FiGift,
  FiGrid,
  FiHeadphones,
  FiHome,
  FiImage,
  FiLayers,
  FiList,
  FiMapPin,
  FiPackage,
  FiPercent,
  FiPieChart,
  FiLock,
  FiShield,
  FiShoppingBag,
  FiSettings,
  FiTag,
  FiTruck,
  FiUser,
  FiUsers,
  FiSliders,
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
      { to: '/admin/payment-methods', label: 'Payment Methods', permission: null, icon: FiCreditCard },
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
    title: 'Marketing',
    items: [
      { to: '/admin/coupons', label: 'Coupons', permission: null, icon: FiPercent },
      { to: '/admin/offers', label: 'Offers', permission: null, icon: FiGift },
      { to: '/admin/popups', label: 'Popups', permission: null, icon: FiGift },
      { to: '/admin/hero-images', label: 'Hero Images', permission: null, icon: FiImage },
      { to: '/admin/banner-images', label: 'Banner Images', permission: null, icon: FiImage },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { to: '/admin/suppliers', label: 'Suppliers', permission: 'inventory.view', icon: FiUsers },
      {
        label: 'Inventory',
        permission: 'inventory.view',
        icon: FiPackage,
        children: [
          { to: '/admin/inventory/batches', label: 'Batches', permission: 'inventory.view', icon: FiLayers },
          { to: '/admin/inventory/stock-adjustments', label: 'Stock Adjustments', permission: 'inventory.view', icon: FiSliders },
          { to: '/admin/inventory/transactions', label: 'Stock Transactions', permission: 'inventory.view', icon: FiList },
          { to: '/admin/inventory/low-stock', label: 'Low Stock', permission: 'inventory.view', icon: FiAlertCircle },
          { to: '/admin/inventory/near-expiry', label: 'Near Expiry', permission: 'inventory.view', icon: FiActivity },
        ],
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/admin/users', label: 'Users', permission: 'user.view', icon: FiUser },
      { to: '/admin/delivery-areas', label: 'Delivery Areas', permission: 'delivery.manage', icon: FiMapPin },
      { to: '/admin/riders', label: 'Riders', permission: 'delivery.manage', icon: FiTruck },
      { to: '/admin/support', label: 'Support', permission: 'support.manage', icon: FiHeadphones },
      { to: '/admin/returns', label: 'Returns', permission: 'return.manage', icon: FiPackage },
      { to: '/admin/refunds', label: 'Refunds', permission: 'refund.approve', icon: FiCreditCard },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/admin/site-settings', label: 'Site Settings', permission: 'role.manage', icon: FiSettings },
      { to: '/admin/staff', label: 'Staff', permission: 'staff.view', icon: FiUsers },
      { to: '/admin/roles', label: 'Roles & Permissions', permission: 'role.manage', icon: FiShield },
      { to: '/admin/reports', label: 'Reports', permission: 'report.view', icon: FiPieChart },
      { to: '/admin/activity-logs', label: 'Activity Logs', permission: 'activity-log.view', icon: FiActivity },
      { to: '/admin/security', label: 'Audit & Security', permission: 'activity-log.view', icon: FiLock },
      { to: '/admin/notifications', label: 'Notifications', permission: null, icon: FiBell },
    ],
  },
]

const settingsItems = [
  { to: '/admin/profile', label: 'My Profile', permission: null, icon: FiUser },
  { to: '/admin/profile/password', label: 'Change Password', permission: null, icon: FiLock },
]

function matchesPath(pathname, item) {
  if (!item?.to) {
    return false
  }

  if (item.end) {
    return pathname === item.to
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

function filterNavItem(item, staff) {
  if (item.children?.length) {
    const children = item.children.filter((child) => filterNavItem(child, staff))

    if ((!item.permission || hasPermission(staff, item.permission)) && children.length > 0) {
      return { ...item, children }
    }

    return null
  }

  return !item.permission || hasPermission(staff, item.permission) ? item : null
}

function flattenNavItems(items) {
  return items.flatMap((item) => [item, ...(item.children ? flattenNavItems(item.children) : [])])
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
          items: group.items.map((item) => filterNavItem(item, staff)).filter(Boolean),
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
      [...flattenNavItems(visibleGroups.flatMap((group) => group.items)), ...visibleSettings].find(
        (item) => matchesPath(location.pathname, item),
      ),
    [location.pathname, visibleGroups, visibleSettings],
  )

  const roleNames = staff?.roles?.map((role) => role.name).join(', ') || 'Staff Access'
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSidebarOpen(false)
      setSettingsOpen(false)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [location.pathname])

  return (
    <div className="admin-app min-h-screen bg-slate-200 text-slate-950">
      <div className="flex min-h-screen">
        <AdminSidebar sidebarOpen={sidebarOpen} visibleGroups={visibleGroups} />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader
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

