import { Navigate } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'
import AdminLoader from '../components/admin/AdminLoader'

export default function ProtectedAdminRoute({ children }) {
  const { staff, loading } = useStaffAuth()
  if (loading) return <AdminLoader />
  return staff ? children : <Navigate to="/admin/login" replace />
}
