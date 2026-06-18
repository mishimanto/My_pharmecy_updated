const SUPPLIERS_CACHE_KEY = 'admin_suppliers_payload_v1'
const SUPPLIERS_CACHE_TTL = 2 * 60 * 1000

export function supplierCacheKey(params) {
  return JSON.stringify({
    search: params.search || '',
    status: params.status || '',
    page: params.page || 1,
  })
}

export function readSuppliersCache(params) {
  if (typeof window === 'undefined') return null

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(SUPPLIERS_CACHE_KEY) || '{}')
    const cached = cache[supplierCacheKey(params)]
    if (!cached || Date.now() - cached.cachedAt > SUPPLIERS_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

export function writeSuppliersCache(params, payload) {
  if (typeof window === 'undefined') return

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(SUPPLIERS_CACHE_KEY) || '{}')
    cache[supplierCacheKey(params)] = { payload, cachedAt: Date.now() }
    window.sessionStorage.setItem(SUPPLIERS_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

export function clearSuppliersCache() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(SUPPLIERS_CACHE_KEY)
  }
}
