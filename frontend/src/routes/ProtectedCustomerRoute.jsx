import { Navigate, useLocation } from 'react-router-dom'
import { useCustomerAuth } from '../context/CustomerAuthContext'

export default function ProtectedCustomerRoute({ children }) {
  const { customer, loading } = useCustomerAuth()
  const location = useLocation()

  if (loading) return <div className="p-6">লোড হচ্ছে...</div>

  return customer
    ? children
    : <Navigate to={`/login?returnTo=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />
}
