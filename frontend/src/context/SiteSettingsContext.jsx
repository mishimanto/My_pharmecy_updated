import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { customerQueryKeys, useSiteSettingsQuery } from '../queries/customerQueries'

const SITE_SETTINGS_CACHE_KEY = 'site_settings_payload_v1'
const SITE_SETTINGS_CACHE_TTL = 7 * 24 * 60 * 60 * 1000
const SITE_SETTINGS_UPDATED_EVENT = 'site-settings-updated'
const DEFAULT_FAVICON = '/favicon.svg'

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

function preloadImage(src, timeout = 1200) {
  if (typeof window === 'undefined' || !src) return Promise.resolve()

  return new Promise((resolve) => {
    const image = new Image()
    const timer = window.setTimeout(resolve, timeout)

    image.onload = image.onerror = () => {
      window.clearTimeout(timer)
      resolve()
    }

    image.decoding = 'async'
    image.src = src
  })
}

function upsertImagePreload(id, href) {
  if (typeof document === 'undefined' || !href) return

  let link = document.getElementById(id)
  if (!link) {
    link = document.createElement('link')
    link.id = id
    link.rel = 'preload'
    link.as = 'image'
    document.head.appendChild(link)
  }

  if (link.href !== href) {
    link.href = href
  }
}

function mergeSettings(payload) {
  return { ...defaultSettings, ...(payload || {}) }
}

export function SiteSettingsProvider({ children }) {
  const [cached] = useState(() => readCache())
  const queryClient = useQueryClient()
  const [forcedLoading, setForcedLoading] = useState(false)
  const [brandAssetsReady, setBrandAssetsReady] = useState(false)
  const settingsQuery = useSiteSettingsQuery({
    initialData: cached || undefined,
  })
  const settings = useMemo(() => mergeSettings(settingsQuery.data || cached), [cached, settingsQuery.data])
  const loading = forcedLoading || (settingsQuery.isLoading && !settingsQuery.data)

  const updateSettingsState = useCallback((payload) => {
    const merged = mergeSettings(payload)
    queryClient.setQueryData(customerQueryKeys.siteSettings, merged)
    writeCache(merged)
    window.dispatchEvent(new CustomEvent(SITE_SETTINGS_UPDATED_EVENT, { detail: merged }))
    setForcedLoading(false)
    return merged
  }, [queryClient])

  const refreshSettings = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setForcedLoading(true)
    }

    const response = await settingsQuery.refetch()
    setForcedLoading(false)

    if (response.error) {
      throw response.error
    }

    return updateSettingsState(response.data)
  }, [settingsQuery, updateSettingsState])

  useEffect(() => {
    if (!settingsQuery.data) return

    let active = true
    const merged = mergeSettings(settingsQuery.data)
    writeCache(merged)

    Promise.all([
      preloadImage(merged.logo_url),
      preloadImage(merged.favicon_url || DEFAULT_FAVICON),
    ]).finally(() => {
      if (active) setBrandAssetsReady(true)
    })

    return () => {
      active = false
    }
  }, [settingsQuery.data])

  useEffect(() => {
    if (settingsQuery.isError) {
      setBrandAssetsReady(true)
    }
  }, [settingsQuery.isError])

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== SITE_SETTINGS_CACHE_KEY || !event.newValue) return

      try {
        const cachedSettings = JSON.parse(event.newValue)
        queryClient.setQueryData(customerQueryKeys.siteSettings, mergeSettings(cachedSettings.payload))
        setForcedLoading(false)
      } catch {
        // Ignore malformed cache payloads.
      }
    }

    const handleSettingsUpdated = (event) => {
      queryClient.setQueryData(customerQueryKeys.siteSettings, mergeSettings(event.detail))
      setForcedLoading(false)
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(SITE_SETTINGS_UPDATED_EVENT, handleSettingsUpdated)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(SITE_SETTINGS_UPDATED_EVENT, handleSettingsUpdated)
    }
  }, [queryClient])

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

    const faviconUrl = settings?.favicon_url || DEFAULT_FAVICON
    favicon.href = faviconUrl

    upsertImagePreload('site-logo-preload', settings?.logo_url)
    upsertImagePreload('site-favicon-preload', faviconUrl)
    preloadImage(settings?.logo_url)
    preloadImage(faviconUrl)
  }, [settings?.favicon_url, settings?.logo_url])

  const value = useMemo(() => ({
    settings,
    loading,
    brandAssetsReady,
    refreshSettings,
    updateSettingsState,
  }), [brandAssetsReady, loading, refreshSettings, settings, updateSettingsState])

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSiteSettings() {
  const context = useContext(SiteSettingsContext)

  if (!context) {
    return {
      settings: defaultSettings,
      loading: false,
      brandAssetsReady: true,
      refreshSettings: async () => defaultSettings,
      updateSettingsState: (payload) => mergeSettings(payload),
    }
  }

  return context
}
