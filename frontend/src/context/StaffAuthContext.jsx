/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { adminAuthApi } from '../api/adminAuthApi'

const StaffAuthContext = createContext(null)
const STAFF_PROFILE_CACHE_KEY = 'admin_auth_profile'

function readStaffCache() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(STAFF_PROFILE_CACHE_KEY) || window.localStorage.getItem(STAFF_PROFILE_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStaffCache(value) {
  if (typeof window === 'undefined') return

  const serialized = JSON.stringify(value)
  window.sessionStorage.setItem(STAFF_PROFILE_CACHE_KEY, serialized)
  window.localStorage.setItem(STAFF_PROFILE_CACHE_KEY, serialized)
}

function clearStaffCache() {
  if (typeof window === 'undefined') return

  window.sessionStorage.removeItem(STAFF_PROFILE_CACHE_KEY)
  window.localStorage.removeItem(STAFF_PROFILE_CACHE_KEY)
}

function isAuthFailure(error) {
  const status = error?.response?.status

  return status === 401 || status === 403
}

export function StaffAuthProvider({ children }) {
  const [staff, setStaff] = useState(() => readStaffCache())
  const [loading, setLoading] = useState(() => {
    const hasToken = Boolean(localStorage.getItem('staff_token'))
    const cachedStaff = readStaffCache()

    return hasToken && !cachedStaff
  })

  useEffect(() => {
    if (!localStorage.getItem('staff_token')) {
      setStaff(null)
      clearStaffCache()
      setLoading(false)
      return
    }

    const cachedStaff = readStaffCache()

    if (cachedStaff) {
      setStaff(cachedStaff)
      setLoading(false)
    }

    adminAuthApi.me()
      .then(({ data }) => {
        setStaff(data.data)
        writeStaffCache(data.data)
      })
      .catch((error) => {
        if (!isAuthFailure(error)) {
          return
        }

        localStorage.removeItem('staff_token')
        setStaff(null)
        clearStaffCache()
      })
      .finally(() => setLoading(false))
  }, [])

  const refreshProfile = async () => {
    const { data } = await adminAuthApi.me()
    setStaff(data.data)
    writeStaffCache(data.data)
    return data.data
  }

  const updateProfileState = (nextStaff) => {
    setStaff(nextStaff)
    writeStaffCache(nextStaff)
  }

  const login = async (payload) => {
    const { data } = await adminAuthApi.login(payload)
    if (data.data?.requires_2fa) {
      return data.data
    }

    localStorage.setItem('staff_token', data.data.token)
    setStaff(data.data.staff)
    writeStaffCache(data.data.staff)
    return data.data
  }

  const verifyTwoFactor = async (payload) => {
    const { data } = await adminAuthApi.verifyTwoFactor(payload)
    localStorage.setItem('staff_token', data.data.token)
    setStaff(data.data.staff)
    writeStaffCache(data.data.staff)
    return data.data
  }

  const logout = async () => {
    await adminAuthApi.logout().catch(() => {})
    localStorage.removeItem('staff_token')
    setStaff(null)
    clearStaffCache()
  }

  return <StaffAuthContext.Provider value={{ staff, loading, login, verifyTwoFactor, logout, refreshProfile, updateProfileState }}>{children}</StaffAuthContext.Provider>
}

export const useStaffAuth = () => useContext(StaffAuthContext)
