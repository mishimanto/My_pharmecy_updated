import { useEffect, useMemo, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { CustomerAuthProvider, useCustomerAuth } from './context/CustomerAuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { SiteSettingsProvider, useSiteSettings } from './context/SiteSettingsContext'
import { StaffAuthProvider } from './context/StaffAuthContext'
import { StorefrontProvider, useStorefront } from './context/StorefrontContext'
import CustomerLoader from './components/customer/CustomerLoader'
import CustomerRoutes from './routes/CustomerRoutes'
import AdminRoutes from './routes/AdminRoutes'
import Login from './pages/customer/Login'
import Register from './pages/customer/Register'
import ForgotPassword from './pages/customer/ForgotPassword'
import ResetPassword from './pages/customer/ResetPassword'
import AdminLogin from './pages/admin/AdminLogin'
import AdminForgotPassword from './pages/admin/AdminForgotPassword'
import AdminResetPassword from './pages/admin/AdminResetPassword'

const CUSTOMER_STARTUP_LOADER_MIN_MS = 1000
const CUSTOMER_STARTUP_LOADER_FADE_MS = 360

function CustomerStartupGate({ children }) {
  const { loading: settingsLoading, brandAssetsReady } = useSiteSettings()
  const { loading: authLoading } = useCustomerAuth()
  const { cartLoading, cartReady } = useStorefront()
  const [minimumElapsed, setMinimumElapsed] = useState(false)
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)

  const booting = useMemo(() => (
    settingsLoading
    || !brandAssetsReady
    || authLoading
    || (cartLoading && !cartReady)
  ), [authLoading, brandAssetsReady, cartLoading, cartReady, settingsLoading])

  useEffect(() => {
    const timer = window.setTimeout(() => setMinimumElapsed(true), CUSTOMER_STARTUP_LOADER_MIN_MS)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (booting || !minimumElapsed || !visible) return undefined

    setLeaving(true)
    const timer = window.setTimeout(() => setVisible(false), CUSTOMER_STARTUP_LOADER_FADE_MS)
    return () => window.clearTimeout(timer)
  }, [booting, minimumElapsed, visible])

  return (
    <>
      {children}
      {visible ? <CustomerLoader leaving={leaving} transition /> : null}
    </>
  )
}

function CustomerApp({ children }) {
  return (
    <SiteSettingsProvider>
      <CustomerAuthProvider>
        <StorefrontProvider>
          <CustomerStartupGate>
            {children}
          </CustomerStartupGate>
        </StorefrontProvider>
      </CustomerAuthProvider>
    </SiteSettingsProvider>
  )
}

function CustomerAuthApp({ children }) {
  return (
    <SiteSettingsProvider>
      <CustomerAuthProvider>
        {children}
      </CustomerAuthProvider>
    </SiteSettingsProvider>
  )
}

function AdminApp({ children }) {
  return (
    <StaffAuthProvider>
      {children}
    </StaffAuthProvider>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <Routes>
        <Route path="/login" element={<CustomerAuthApp><Login /></CustomerAuthApp>} />
        <Route path="/register" element={<CustomerAuthApp><Register /></CustomerAuthApp>} />
        <Route path="/forgot-password" element={<CustomerAuthApp><ForgotPassword /></CustomerAuthApp>} />
        <Route path="/reset-password" element={<CustomerAuthApp><ResetPassword /></CustomerAuthApp>} />
        <Route path="/admin/login" element={<AdminApp><AdminLogin /></AdminApp>} />
        <Route path="/admin/forgot-password" element={<AdminApp><AdminForgotPassword /></AdminApp>} />
        <Route path="/admin/reset-password" element={<AdminApp><AdminResetPassword /></AdminApp>} />
        <Route path="/admin/*" element={<AdminApp><AdminRoutes /></AdminApp>} />
        <Route path="/*" element={<CustomerApp><CustomerRoutes /></CustomerApp>} />
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
    </LanguageProvider>
  )
}
