import { Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { CustomerAuthProvider } from './context/CustomerAuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { StaffAuthProvider } from './context/StaffAuthContext'
import { StorefrontProvider } from './context/StorefrontContext'
import CustomerRoutes from './routes/CustomerRoutes'
import AdminRoutes from './routes/AdminRoutes'
import Login from './pages/customer/Login'
import Register from './pages/customer/Register'
import ForgotPassword from './pages/customer/ForgotPassword'
import ResetPassword from './pages/customer/ResetPassword'
import AdminLogin from './pages/admin/AdminLogin'

export default function App() {
  return (
    <LanguageProvider>
      <CustomerAuthProvider>
        <StorefrontProvider>
          <StaffAuthProvider>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/*" element={<AdminRoutes />} />
              <Route path="/*" element={<CustomerRoutes />} />
            </Routes>
            <Toaster position="top-right" toastOptions={{ duration: 2800 }} />
          </StaffAuthProvider>
        </StorefrontProvider>
      </CustomerAuthProvider>
    </LanguageProvider>
  )
}
