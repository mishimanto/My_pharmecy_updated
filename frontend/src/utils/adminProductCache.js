const PRODUCTS_CACHE_KEY = 'admin_products_payload_v2'
const PRODUCTS_CACHE_TTL = 2 * 60 * 1000

export function productCacheKey(params) {
  return JSON.stringify({
    search: params.search || '',
    category_id: params.category_id || '',
    manufacturer_id: params.manufacturer_id || '',
    status: params.status || '',
    prescription: params.prescription || '',
    page: params.page || 1,
  })
}

export function readProductsCache(params) {
  if (typeof window === 'undefined') return null

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(PRODUCTS_CACHE_KEY) || '{}')
    const cached = cache[productCacheKey(params)]
    if (!cached || Date.now() - cached.cachedAt > PRODUCTS_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

export function writeProductsCache(params, payload) {
  if (typeof window === 'undefined') return

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(PRODUCTS_CACHE_KEY) || '{}')
    cache[productCacheKey(params)] = { payload, cachedAt: Date.now() }
    window.sessionStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

export function clearProductsCache() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(PRODUCTS_CACHE_KEY)
  }
}
