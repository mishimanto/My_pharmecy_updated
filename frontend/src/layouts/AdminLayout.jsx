import { NavLink, Outlet } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'
import { hasPermission } from '../utils/permissions'

const menu = [
  ['/admin/dashboard', 'ড্যাশবোর্ড', 'report.view'],
  ['/admin/users', 'কাস্টমার', 'user.view'],
  ['/admin/staff', 'স্টাফ', 'staff.view'],
  ['/admin/roles', 'রোল', 'role.manage'],
  ['/admin/categories', 'ক্যাটাগরি', 'product.view'],
  ['/admin/manufacturers', 'ম্যানুফ্যাকচারার', 'product.view'],
  ['/admin/products', 'প্রোডাক্ট', 'product.view'],
  ['/admin/suppliers', 'সাপ্লায়ার', 'inventory.view'],
  ['/admin/inventory', 'ইনভেন্টরি', 'inventory.view'],
  ['/admin/inventory/batches', 'ব্যাচ', 'inventory.view'],
  ['/admin/inventory/transactions', 'স্টক লেনদেন', 'inventory.view'],
  ['/admin/inventory/low-stock', 'লো স্টক', 'inventory.view'],
  ['/admin/inventory/near-expiry', 'নিয়ার এক্সপায়ারি', 'inventory.view'],
  ['/admin/orders', 'অর্ডার', 'order.view'],
  ['/admin/prescriptions', 'প্রেসক্রিপশন', 'prescription.view'],
  ['/admin/payments', 'পেমেন্ট', 'payment.view'],
  ['/admin/delivery-areas', 'ডেলিভারি এলাকা', 'delivery.manage'],
  ['/admin/riders', 'রাইডার', 'delivery.manage'],
  ['/admin/deliveries', 'ডেলিভারি', 'delivery.manage'],
  ['/admin/support', 'সাপোর্ট', 'support.manage'],
  ['/admin/returns', 'রিটার্ন', 'return.manage'],
  ['/admin/refunds', 'রিফান্ড', 'refund.approve'],
  ['/admin/reports', 'রিপোর্ট', 'report.view'],
  ['/admin/activity-logs', 'অ্যাক্টিভিটি লগ', 'activity-log.view'],
]

export default function AdminLayout() {
  const { staff, logout } = useStaffAuth()
  const visible = menu.filter(([, , permission]) => hasPermission(staff, permission))

  return (
    <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
      <aside className="border-r border-slate-200 bg-slate-950 p-4 text-white">
        <div className="mb-5 text-lg font-semibold">ফার্মেসি অ্যাডমিন</div>
        <nav className="flex flex-col gap-1">
          {visible.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `rounded px-3 py-2 text-sm ${isActive ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <button className="mt-6 rounded border border-slate-700 px-3 py-2 text-sm" onClick={logout}>লগআউট</button>
      </aside>
      <main className="p-5"><Outlet /></main>
    </div>
  )
}
