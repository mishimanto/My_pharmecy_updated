const MANUFACTURERS_CACHE_KEY = 'admin_manufacturers_payload_v2'
const MANUFACTURERS_CACHE_TTL = 2 * 60 * 1000

export function manufacturerCacheKey(params) {
  return JSON.stringify({
    search: params.search || '',
    status: params.status || '',
    page: params.page || 1,
  })
}

export function readManufacturersCache(params) {
  if (typeof window === 'undefined') return null

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(MANUFACTURERS_CACHE_KEY) || '{}')
    const cached = cache[manufacturerCacheKey(params)]
    if (!cached || Date.now() - cached.cachedAt > MANUFACTURERS_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

export function writeManufacturersCache(params, payload) {
  if (typeof window === 'undefined') return

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(MANUFACTURERS_CACHE_KEY) || '{}')
    cache[manufacturerCacheKey(params)] = { payload, cachedAt: Date.now() }
    window.sessionStorage.setItem(MANUFACTURERS_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

export function clearManufacturersCache() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(MANUFACTURERS_CACHE_KEY)
  }
}
