import { Outlet, useLocation } from 'react-router-dom'
import CustomerFooter from '../components/customer/CustomerFooter'
import CustomerHeader from '../components/customer/CustomerHeader'

export default function CustomerLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <CustomerHeader />

      <main className={isHome ? '' : 'mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'}>
        <Outlet />
      </main>

      <CustomerFooter />
    </div>
  )
}

function initials(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
