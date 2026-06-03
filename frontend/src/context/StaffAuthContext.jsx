/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { adminAuthApi } from '../api/adminAuthApi'

const StaffAuthContext = createContext(null)

export function StaffAuthProvider({ children }) {
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('staff_token')))

  useEffect(() => {
    if (!localStorage.getItem('staff_token')) return
    adminAuthApi.me().then(({ data }) => setStaff(data.data)).catch(() => {
      localStorage.removeItem('staff_token')
      setStaff(null)
    }).finally(() => setLoading(false))
  }, [])

  const login = async (payload) => {
    const { data } = await adminAuthApi.login(payload)
    localStorage.setItem('staff_token', data.data.token)
    localStorage.removeItem('customer_token')
    setStaff(data.data.staff)
  }

  const logout = async () => {
    await adminAuthApi.logout().catch(() => {})
    localStorage.removeItem('staff_token')
    setStaff(null)
  }

  return <StaffAuthContext.Provider value={{ staff, loading, login, logout }}>{children}</StaffAuthContext.Provider>
}

export const useStaffAuth = () => useContext(StaffAuthContext)
