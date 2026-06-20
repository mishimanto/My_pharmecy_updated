/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { customerAuthApi } from '../api/customerAuthApi'
import { clearCustomerCaches, readCustomerCache, writeCustomerCache } from '../utils/customerDataCache'

const CustomerAuthContext = createContext(null)
const CUSTOMER_PROFILE_CACHE_KEY = 'auth_profile'
const SIGNED_GUEST_TOKEN_PATTERN = /^gst\.[A-Za-z0-9_-]{32,}\.\d+\.[a-f0-9]{64}$/

function readGuestToken() {
  if (typeof window === 'undefined') return null

  const token = localStorage.getItem('guest_token')
  return token && SIGNED_GUEST_TOKEN_PATTERN.test(token) ? token : null
}

function clearGuestToken() {
  if (typeof window === 'undefined') return

  localStorage.removeItem('guest_token')
}

function isAuthFailure(error) {
  const status = error?.response?.status

  return status === 401 || status === 403
}

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => readCustomerCache(CUSTOMER_PROFILE_CACHE_KEY, null))
  const [guestToken, setGuestToken] = useState(() => readGuestToken())
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      .catch((error) => {
        if (!isAuthFailure(error)) {
          return
        }

        localStorage.removeItem('customer_token')
        setCustomer(null)
        clearCustomerCaches()
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (payload) => {
    const { data } = await customerAuthApi.login(payload)
    localStorage.setItem('customer_token', data.data.token)
    clearGuestToken()
    setGuestToken(null)
    setCustomer(data.data.user)
    writeCustomerCache(CUSTOMER_PROFILE_CACHE_KEY, data.data.user)
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await customerAuthApi.register(payload)
    localStorage.setItem('customer_token', data.data.token)
    clearGuestToken()
    setGuestToken(null)
    setCustomer(data.data.user)
    writeCustomerCache(CUSTOMER_PROFILE_CACHE_KEY, data.data.user)
  }, [])

  const updateProfile = useCallback(async (payload) => {
    const { data } = await customerAuthApi.updateProfile(payload)
    setCustomer(data.data)
    writeCustomerCache(CUSTOMER_PROFILE_CACHE_KEY, data.data)
    return data.data
  }, [])

  const ensureGuestToken = useCallback(async () => {
    if (localStorage.getItem('customer_token')) {
      return null
    }

    const existingToken = readGuestToken()

    if (existingToken) {
      setGuestToken(existingToken)
      return existingToken
    }

    clearGuestToken()

    const { data } = await customerAuthApi.guestSession()
    const token = data.data.guest_token
    localStorage.setItem('guest_token', token)
    setGuestToken(token)

    return token
  }, [])

  const logout = useCallback(async () => {
    await customerAuthApi.logout().catch(() => {})
    localStorage.removeItem('customer_token')
    clearGuestToken()
    setGuestToken(null)
    setCustomer(null)
    clearCustomerCaches()
  }, [])

  return (
    <CustomerAuthContext.Provider value={{ customer, guestToken, loading, login, register, updateProfile, refreshProfile, ensureGuestToken, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  )
}

export const useCustomerAuth = () => useContext(CustomerAuthContext)
