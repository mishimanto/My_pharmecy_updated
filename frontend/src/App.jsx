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
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 2800,
                style: {
                  borderRadius: 0,
                  boxShadow: '0 18px 45px -28px rgba(15, 23, 42, 0.45)',
                  color: '#0f172a',
                },
                success: {
                  style: {
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderLeft: '5px solid #059669',
                    color: '#065f46',
                  },
                  iconTheme: {
                    primary: '#059669',
                    secondary: '#ecfdf5',
                  },
                },
                error: {
                  style: {
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderLeft: '5px solid #dc2626',
                    color: '#991b1b',
                  },
                  iconTheme: {
                    primary: '#dc2626',
                    secondary: '#fef2f2',
                  },
                },
              }}
            />
          </StaffAuthProvider>
        </StorefrontProvider>
      </CustomerAuthProvider>
    </LanguageProvider>
  )
}
