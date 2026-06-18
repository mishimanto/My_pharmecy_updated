import api from './axios'

const PRESCRIPTION_CACHE_KEY = 'storefront_prescription_cache_v1'
const PRESCRIPTION_CACHE_TTL = 1000 * 60 * 10
const listCache = new Map()
const inflightLists = new Map()

function normalizeListPayload(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function getScopeKey() {
  if (typeof window === 'undefined') return 'server'

  const customerToken = window.localStorage.getItem('customer_token')
  if (customerToken) {
    return `customer:${customerToken.slice(-24)}`
  }

  const guestToken = window.localStorage.getItem('guest_token')
  if (guestToken) {
    return `guest:${guestToken}`
  }

  return 'guest:anonymous'
}

function clearCacheStorage() {
  if (typeof window === 'undefined') return

  window.sessionStorage.removeItem(PRESCRIPTION_CACHE_KEY)
  window.localStorage.removeItem(PRESCRIPTION_CACHE_KEY)
}

function readCache() {
  if (typeof window === 'undefined') return null

  try {
    const raw =
      window.localStorage.getItem(PRESCRIPTION_CACHE_KEY)
      || window.sessionStorage.getItem(PRESCRIPTION_CACHE_KEY)

    if (!raw) return null

    const payload = JSON.parse(raw)
    const savedAt = Number(payload?.saved_at || 0)

    if (savedAt && Date.now() - savedAt > PRESCRIPTION_CACHE_TTL) {
      clearCacheStorage()
      return null
    }

    return payload
  } catch {
    return null
  }
}

function writeCache() {
  if (typeof window === 'undefined') return

  try {
    const payload = {
      saved_at: Date.now(),
      scopes: Array.from(listCache.entries()).slice(-6),
    }

    const serialized = JSON.stringify(payload)
    window.sessionStorage.setItem(PRESCRIPTION_CACHE_KEY, serialized)
    window.localStorage.setItem(PRESCRIPTION_CACHE_KEY, serialized)
  } catch {
    // Ignore storage quota and serialization failures.
  }
}

function hydrateCache() {
  const payload = readCache()
  if (!payload) return

  payload.scopes?.forEach(([scopeKey, prescriptions]) => {
    listCache.set(scopeKey, prescriptions)
  })
}

hydrateCache()

function responseFromPayload(payload) {
  return { data: { data: { data: payload } } }
}

function cacheListForScope(scopeKey, payload) {
  listCache.set(scopeKey, normalizeListPayload(payload))
  writeCache()
}

function fetchList() {
  const scopeKey = getScopeKey()

  if (inflightLists.has(scopeKey)) {
    return inflightLists.get(scopeKey)
  }

  const request = api.get('/customer/prescriptions').then((response) => {
    const payload = response.data?.data?.data || response.data?.data || []
    cacheListForScope(scopeKey, payload)
    return response
  }).finally(() => {
    inflightLists.delete(scopeKey)
  })

  inflightLists.set(scopeKey, request)
  return request
}

export const prescriptionApi = {
  list: () => {
    const cached = listCache.get(getScopeKey())
    return cached ? Promise.resolve(responseFromPayload(cached)) : fetchList()
  },
  refreshList: () => fetchList(),
  show: (id) => api.get(`/customer/prescriptions/${id}`),
  destroy: async (id) => {
    const scopeKey = getScopeKey()
    const response = await api.delete(`/customer/prescriptions/${id}`)
    const currentItems = listCache.get(scopeKey) || []

    cacheListForScope(scopeKey, currentItems.filter((item) => String(item?.id) !== String(id)))

    return response
  },
  create: async (payload) => {
    const scopeKey = getScopeKey()
    const response = await api.post('/customer/prescriptions', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
    const createdPrescription = response.data?.data

    if (createdPrescription) {
      const currentItems = listCache.get(scopeKey) || []
      const nextItems = [
        createdPrescription,
        ...currentItems.filter((item) => String(item?.id) !== String(createdPrescription.id)),
      ]

      cacheListForScope(scopeKey, nextItems)
    } else {
      listCache.delete(scopeKey)
      writeCache()
    }

    return response
  },
  getCachedList: () => listCache.get(getScopeKey()) || [],
  getCachedListResponse: () => {
    const cached = listCache.get(getScopeKey())
    return cached ? responseFromPayload(cached) : null
  },
  clearCache: () => {
    listCache.clear()
    clearCacheStorage()
  },
}
