const CATEGORIES_CACHE_KEY = 'admin_categories_payload_v1'
const CATEGORIES_CACHE_TTL = 2 * 60 * 1000

export function categoryCacheKey(params) {
  return JSON.stringify({
    search: params.search || '',
    status: params.status || '',
    parent_id: params.parent_id || '',
    page: params.page || 1,
  })
}

export function readCategoriesCache(params) {
  if (typeof window === 'undefined') return null

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(CATEGORIES_CACHE_KEY) || '{}')
    const cached = cache[categoryCacheKey(params)]
    if (!cached || Date.now() - cached.cachedAt > CATEGORIES_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

export function writeCategoriesCache(params, payload) {
  if (typeof window === 'undefined') return

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(CATEGORIES_CACHE_KEY) || '{}')
    cache[categoryCacheKey(params)] = { payload, cachedAt: Date.now() }
    window.sessionStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

export function clearCategoriesCache() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(CATEGORIES_CACHE_KEY)
  }
}
