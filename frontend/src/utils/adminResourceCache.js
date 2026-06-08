const CACHE_KEY = 'admin_resource_cache_v1'

function readCache() {
  if (typeof window === 'undefined') {
    return { lists: {}, items: {} }
  }

  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(CACHE_KEY) || 'null')
    return parsed && typeof parsed === 'object'
      ? { lists: parsed.lists || {}, items: parsed.items || {} }
      : { lists: {}, items: {} }
  } catch {
    return { lists: {}, items: {} }
  }
}

function writeCache(cache) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

function listKey(resource, params = {}) {
  const normalized = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))

  return `${resource}:${JSON.stringify(normalized)}`
}

export function getCachedList(resource, params = {}) {
  return readCache().lists[listKey(resource, params)] || null
}

export function setCachedList(resource, params = {}, payload = null) {
  const cache = readCache()
  cache.lists[listKey(resource, params)] = payload

  if (payload?.data?.length) {
    payload.data.forEach((item) => {
      if (item?.id != null) {
        cache.items[`${resource}:${item.id}`] = item
      }
    })
  }

  writeCache(cache)
}

export function getCachedItem(resource, id) {
  return readCache().items[`${resource}:${id}`] || null
}

export function setCachedItem(resource, id, item) {
  const cache = readCache()
  cache.items[`${resource}:${id}`] = item
  writeCache(cache)
}
