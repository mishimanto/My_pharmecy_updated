import api from './axios'

const OFFERS_CACHE_KEY = 'storefront_offers_v1'
const OFFERS_CACHE_TTL = 1000 * 60 * 10

export function readCachedOffers() {
  if (typeof window === 'undefined') return null
  try {
    const payload = JSON.parse(window.sessionStorage.getItem(OFFERS_CACHE_KEY) || 'null')
    if (!payload || Date.now() - Number(payload.saved_at || 0) > OFFERS_CACHE_TTL) return null
    return payload.data || null
  } catch {
    return null
  }
}

function writeCachedOffers(data) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(OFFERS_CACHE_KEY, JSON.stringify({ saved_at: Date.now(), data }))
  } catch {
    // Ignore cache failures.
  }
}

export const offerApi = {
  list: () => api.get('/offers').then((response) => {
    writeCachedOffers(response.data.data || [])
    return response
  }),
}
