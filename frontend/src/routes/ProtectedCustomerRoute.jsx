import { Navigate } from 'react-router-dom'
import { useCustomerAuth } from '../context/CustomerAuthContext'

export default function ProtectedCustomerRoute({ children }) {
  const { customer, loading } = useCustomerAuth()
  if (loading) return <div className="p-6">লোড হচ্ছে...</div>
  return customer ? children : <Navigate to="/login" replace />
}
