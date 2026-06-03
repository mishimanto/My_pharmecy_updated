import { Navigate } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'

export default function ProtectedAdminRoute({ children }) {
  const { staff, loading } = useStaffAuth()
  if (loading) return <div className="p-6">লোড হচ্ছে...</div>
  return staff ? children : <Navigate to="/admin/login" replace />
}
