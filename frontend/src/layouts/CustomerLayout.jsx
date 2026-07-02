import { Outlet, useLocation } from 'react-router-dom'
import CustomerFooter from '../components/customer/CustomerFooter'
import CustomerHeader from '../components/customer/CustomerHeader'
import CustomerMarketingPopup from '../components/customer/CustomerMarketingPopup'

export default function CustomerLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="customer-app min-h-screen bg-[#f4f6f8] text-slate-900">
      <CustomerHeader />

      <main className={isHome ? '' : 'mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8'}>
        <Outlet />
      </main>

      <CustomerFooter />
      <CustomerMarketingPopup />
    </div>
  )
}
