import api from './axios'

const PAYMENT_METHODS_CACHE_KEY = 'storefront_payment_methods_v1'
const PAYMENT_METHODS_CACHE_TTL = 1000 * 60 * 10

export function readCachedPaymentMethods() {
  if (typeof window === 'undefined') return null
  try {
    const payload = JSON.parse(window.sessionStorage.getItem(PAYMENT_METHODS_CACHE_KEY) || 'null')
    if (!payload || Date.now() - Number(payload.saved_at || 0) > PAYMENT_METHODS_CACHE_TTL) return null
    return payload.data || null
  } catch {
    return null
  }
}

function writeCachedPaymentMethods(data) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(PAYMENT_METHODS_CACHE_KEY, JSON.stringify({ saved_at: Date.now(), data }))
  } catch {
    // Ignore cache failures.
  }
}

export const paymentMethodApi = {
  list: () => api.get('/payment-methods').then((response) => {
    writeCachedPaymentMethods(response.data.data || [])
    return response
  }),
}
