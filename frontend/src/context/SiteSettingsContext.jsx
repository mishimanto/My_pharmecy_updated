import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { siteSettingsApi } from '../api/siteSettingsApi'

const SITE_SETTINGS_CACHE_KEY = 'site_settings_payload_v1'
const SITE_SETTINGS_CACHE_TTL = 5 * 60 * 1000
const SITE_SETTINGS_UPDATED_EVENT = 'site-settings-updated'

const defaultSettings = {
  site_name: 'My Pharmecy',
  site_tagline: 'Trusted online pharmacy support',
  support_phone: '09610-001122',
  support_email: 'support@mypharmecy.test',
  address: 'Dhaka service point',
  city: 'Dhaka',
  support_hours: '8AM to 11PM support',
  whatsapp_number: '09610-001122',
  facebook_url: '',
  instagram_url: '',
  youtube_url: '',
  map_embed_url: 'https://www.google.com/maps?q=Dhaka%2C%20Bangladesh&z=12&output=embed',
  footer_note: 'Prescription-aware online pharmacy experience',
  logo_url: '',
  logo_path: '',
  favicon_url: '',
  favicon_path: '',
}

const SiteSettingsContext = createContext(null)

function readCache() {
  if (typeof window === 'undefined') return null

  try {
    const cached = JSON.parse(window.localStorage.getItem(SITE_SETTINGS_CACHE_KEY) || 'null')
    if (!cached || Date.now() - cached.cachedAt > SITE_SETTINGS_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

function writeCache(payload) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(SITE_SETTINGS_CACHE_KEY, JSON.stringify({
      payload,
      cachedAt: Date.now(),
    }))
  } catch {
    // Ignore storage failures.
  }
}

function mergeSettings(payload) {
  return { ...defaultSettings, ...(payload || {}) }
}

export function SiteSettingsProvider({ children }) {
  const cached = readCache()
  const [settings, setSettings] = useState(() => mergeSettings(cached))
  const [loading, setLoading] = useState(() => !cached)

  const updateSettingsState = useCallback((payload) => {
    const merged = mergeSettings(payload)
    setSettings(merged)
    writeCache(merged)
    window.dispatchEvent(new CustomEvent(SITE_SETTINGS_UPDATED_EVENT, { detail: merged }))
    setLoading(false)
    return merged
  }, [])

  const refreshSettings = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading((current) => current || !settings?.site_name)
    }

    const response = await siteSettingsApi.show()
    return updateSettingsState(response.data?.data)
  }, [settings?.site_name, updateSettingsState])

  useEffect(() => {
    if (cached) return undefined

    let active = true

    siteSettingsApi.show()
      .then((response) => {
        if (!active) return
        updateSettingsState(response.data?.data)
      })
      .catch(() => {
        if (!active) return
        setLoading(false)
      })

    return () => { active = false }
  }, [cached, updateSettingsState])

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== SITE_SETTINGS_CACHE_KEY || !event.newValue) return

      try {
        const cachedSettings = JSON.parse(event.newValue)
        setSettings(mergeSettings(cachedSettings.payload))
        setLoading(false)
      } catch {
        // Ignore malformed cache payloads.
      }
    }

    const handleSettingsUpdated = (event) => {
      setSettings(mergeSettings(event.detail))
      setLoading(false)
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(SITE_SETTINGS_UPDATED_EVENT, handleSettingsUpdated)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(SITE_SETTINGS_UPDATED_EVENT, handleSettingsUpdated)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.title = settings?.site_name || defaultSettings.site_name
  }, [settings?.site_name])

  useEffect(() => {
    if (typeof document === 'undefined') return

    let favicon = document.querySelector('link[rel="icon"]')
    if (!favicon) {
      favicon = document.createElement('link')
      favicon.rel = 'icon'
      document.head.appendChild(favicon)
    }

    favicon.href = settings?.favicon_url || '/favicon.ico'
  }, [settings?.favicon_url])

  const value = useMemo(() => ({
    settings,
    loading,
    refreshSettings,
    updateSettingsState,
  }), [loading, refreshSettings, settings, updateSettingsState])

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSiteSettings() {
  const context = useContext(SiteSettingsContext)

  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider')
  }

  return context
}
