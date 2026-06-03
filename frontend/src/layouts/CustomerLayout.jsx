import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '../context/CustomerAuthContext'

const nav = [['/', 'হোম'], ['/products', 'ওষুধ'], ['/cart', 'কার্ট'], ['/orders', 'অর্ডার'], ['/prescriptions', 'প্রেসক্রিপশন'], ['/support', 'সাপোর্ট'], ['/returns', 'রিটার্ন'], ['/notifications', 'নোটিফিকেশন']]

export default function CustomerLayout() {
  const { customer, logout } = useCustomerAuth()
  const navigate = useNavigate()
  const signOut = async () => {
    await logout()
    navigate('/login')
  }
  return (
    <div>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <Link to="/" className="text-xl font-semibold text-emerald-700">আমার ফার্মেসি</Link>
          <nav className="flex flex-wrap gap-2 text-sm">
            {nav.map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => `rounded px-3 py-2 ${isActive ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</NavLink>)}
          </nav>
          {customer ? <button className="rounded border border-slate-300 px-3 py-2 text-sm" onClick={signOut}>লগআউট</button> : <Link to="/login" className="rounded bg-emerald-600 px-3 py-2 text-sm text-white">লগইন</Link>}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6"><Outlet /></main>
    </div>
  )
}
