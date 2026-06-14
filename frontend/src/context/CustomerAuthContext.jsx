/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { customerAuthApi } from '../api/customerAuthApi'
import { clearCustomerCaches, readCustomerCache, writeCustomerCache } from '../utils/customerDataCache'

const CustomerAuthContext = createContext(null)
const CUSTOMER_PROFILE_CACHE_KEY = 'auth_profile'

function generateGuestToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `guest-${crypto.randomUUID()}`
  }

  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(() =>
    readCustomerCache(CUSTOMER_PROFILE_CACHE_KEY, null)
  )

  const [loading, setLoading] = useState(() => {
    const hasToken = Boolean(localStorage.getItem('customer_token'))
    const cachedCustomer = readCustomerCache(CUSTOMER_PROFILE_CACHE_KEY, null)
    return hasToken && !cachedCustomer
  })

  const refreshProfile = useCallback(async () => {
    if (!localStorage.getItem('customer_token')) return null

    const { data } = await customerAuthApi.me()
    setCustomer(data.data)
    writeCustomerCache(CUSTOMER_PROFILE_CACHE_KEY, data.data)
    return data.data
  }, [])

  useEffect(() => {
    if (!localStorage.getItem('customer_token')) {
      setLoading(false)
      setCustomer(null)
      clearCustomerCaches()
      return
    }

    const cachedCustomer = readCustomerCache(CUSTOMER_PROFILE_CACHE_KEY, null)

    if (cachedCustomer) {
      setCustomer(cachedCustomer)
      setLoading(false)
    }

    customerAuthApi.me()
      .then(({ data }) => {
        setCustomer(data.data)
        writeCustomerCache(CUSTOMER_PROFILE_CACHE_KEY, data.data)
      })
      .catch(() => {
        localStorage.removeItem('customer_token')
        setCustomer(null)
        clearCustomerCaches()
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (payload) => {
    const { data } = await customerAuthApi.login(payload)
    localStorage.setItem('customer_token', data.data.token)
    localStorage.removeItem('staff_token')
    setCustomer(data.data.user)
    writeCustomerCache(CUSTOMER_PROFILE_CACHE_KEY, data.data.user)
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await customerAuthApi.register(payload)
    localStorage.setItem('customer_token', data.data.token)
    localStorage.removeItem('staff_token')
    setCustomer(data.data.user)
    writeCustomerCache(CUSTOMER_PROFILE_CACHE_KEY, data.data.user)
  }, [])

  const updateProfile = useCallback(async (payload) => {
    const { data } = await customerAuthApi.updateProfile(payload)
    setCustomer(data.data)
    writeCustomerCache(CUSTOMER_PROFILE_CACHE_KEY, data.data)
    return data.data
  }, [])

  const ensureGuestToken = useCallback(() => {
    if (localStorage.getItem('customer_token')) {
      return null
    }

    let token = localStorage.getItem('guest_token')

    if (!token) {
      token = generateGuestToken()
      localStorage.setItem('guest_token', token)
    }

    return token
  }, [])

  const logout = useCallback(async () => {
    await customerAuthApi.logout().catch(() => {})
    localStorage.removeItem('customer_token')
    setCustomer(null)
    clearCustomerCaches()
  }, [])

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        loading,
        login,
        register,
        updateProfile,
        refreshProfile,
        ensureGuestToken,
        logout,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  )
}

export const useCustomerAuth = () => useContext(CustomerAuthContext)