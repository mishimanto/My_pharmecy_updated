import { Navigate, useLocation } from 'react-router-dom'
import CustomerLoader from '../components/customer/CustomerLoader'
import { useCustomerAuth } from '../context/CustomerAuthContext'

export default function ProtectedCustomerRoute({ children }) {
  const { customer, loading } = useCustomerAuth()
  const location = useLocation()

  if (loading) {
    return <CustomerLoader message="Checking your account" />
  }

  return customer
    ? children
    : <Navigate to={`/login?returnTo=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />
}
