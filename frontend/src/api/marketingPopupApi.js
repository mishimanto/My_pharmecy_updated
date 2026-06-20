import api from './axios'

const POPUP_CACHE_KEY = 'storefront_marketing_popup_v1'
const POPUP_CACHE_TTL = 1000 * 60 * 10

export function readCachedMarketingPopup() {
  if (typeof window === 'undefined') return null
  try {
    const payload = JSON.parse(window.sessionStorage.getItem(POPUP_CACHE_KEY) || 'null')
    if (!payload || Date.now() - Number(payload.saved_at || 0) > POPUP_CACHE_TTL) return null
    return payload.data || null
  } catch {
    return null
  }
}

function writeCachedMarketingPopup(data) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(POPUP_CACHE_KEY, JSON.stringify({ saved_at: Date.now(), data }))
  } catch {
    // Ignore cache failures.
  }
}

export const marketingPopupApi = {
  show: () => api.get('/marketing-popup').then((response) => {
    writeCachedMarketingPopup(response.data.data || null)
    return response
  }),
}
