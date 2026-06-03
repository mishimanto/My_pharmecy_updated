/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { customerAuthApi } from '../api/customerAuthApi'

const CustomerAuthContext = createContext(null)

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('customer_token')))

  useEffect(() => {
    if (!localStorage.getItem('customer_token')) return
    customerAuthApi.me().then(({ data }) => setCustomer(data.data)).catch(() => {
      localStorage.removeItem('customer_token')
      setCustomer(null)
    }).finally(() => setLoading(false))
  }, [])

  const login = async (payload) => {
    const { data } = await customerAuthApi.login(payload)
    localStorage.setItem('customer_token', data.data.token)
    localStorage.removeItem('staff_token')
    setCustomer(data.data.user)
  }

  const register = async (payload) => {
    const { data } = await customerAuthApi.register(payload)
    localStorage.setItem('customer_token', data.data.token)
    localStorage.removeItem('staff_token')
    setCustomer(data.data.user)
  }

  const logout = async () => {
    await customerAuthApi.logout().catch(() => {})
    localStorage.removeItem('customer_token')
    setCustomer(null)
  }

  return <CustomerAuthContext.Provider value={{ customer, loading, login, register, logout }}>{children}</CustomerAuthContext.Provider>
}

export const useCustomerAuth = () => useContext(CustomerAuthContext)
