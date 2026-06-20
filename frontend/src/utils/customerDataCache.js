const CACHE_PREFIX = 'customer_data_cache_v1:'
const DEFAULT_TTL = 1000 * 60 * 10

function currentScope() {
  if (typeof window === 'undefined') return 'server'

  const customerToken = window.localStorage.getItem('customer_token')
  if (customerToken) return `customer:${customerToken.slice(-24)}`

  const guestToken = window.localStorage.getItem('guest_token')
  if (guestToken) return `guest:${guestToken.slice(-48)}`

  return 'guest:anonymous'
}

function cacheKey(key) {
  return `${CACHE_PREFIX}${currentScope()}:${key}`
}

function readStorage(key) {
  if (typeof window === 'undefined') return null

  return window.sessionStorage.getItem(key) || window.localStorage.getItem(key)
}

function writeStorage(key, value) {
  if (typeof window === 'undefined') return

  window.sessionStorage.setItem(key, value)
  window.localStorage.setItem(key, value)
}

function removeStorage(key) {
  if (typeof window === 'undefined') return

  window.sessionStorage.removeItem(key)
  window.localStorage.removeItem(key)
}

export function readCustomerCache(key, fallback = null, ttl = DEFAULT_TTL) {
  try {
    const raw = readStorage(cacheKey(key))

    if (!raw) {
      return fallback
    }

    const payload = JSON.parse(raw)
    const savedAt = Number(payload?.savedAt || 0)

    if (savedAt && Date.now() - savedAt > ttl) {
      removeCustomerCache(key)
      return fallback
    }

    return payload?.value ?? fallback
  } catch {
    return fallback
  }
}

export function writeCustomerCache(key, value) {
  try {
    writeStorage(cacheKey(key), JSON.stringify({
      savedAt: Date.now(),
      value,
    }))
  } catch {
    // Ignore storage and serialization failures.
  }
}

export function removeCustomerCache(key) {
  removeStorage(cacheKey(key))
}

export function clearCustomerCaches() {
  if (typeof window === 'undefined') return

  const clearMatchingKeys = (storage) => {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index)

      if (key?.startsWith(CACHE_PREFIX)) {
        storage.removeItem(key)
      }
    }
  }

  clearMatchingKeys(window.sessionStorage)
  clearMatchingKeys(window.localStorage)
}
