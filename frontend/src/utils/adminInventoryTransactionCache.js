const INVENTORY_TRANSACTIONS_CACHE_KEY = 'admin_inventory_transactions_payload_v1'
const INVENTORY_TRANSACTIONS_CACHE_TTL = 2 * 60 * 1000

function inventoryTransactionCacheKey(params) {
  return JSON.stringify({
    search: params.search || '',
    page: params.page || 1,
  })
}

export function readInventoryTransactionsCache(params) {
  if (typeof window === 'undefined') return null

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(INVENTORY_TRANSACTIONS_CACHE_KEY) || '{}')
    const cached = cache[inventoryTransactionCacheKey(params)]
    if (!cached || Date.now() - cached.cachedAt > INVENTORY_TRANSACTIONS_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

export function writeInventoryTransactionsCache(params, payload) {
  if (typeof window === 'undefined') return

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(INVENTORY_TRANSACTIONS_CACHE_KEY) || '{}')
    cache[inventoryTransactionCacheKey(params)] = { payload, cachedAt: Date.now() }
    window.sessionStorage.setItem(INVENTORY_TRANSACTIONS_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

export function clearInventoryTransactionsCache() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(INVENTORY_TRANSACTIONS_CACHE_KEY)
  }
}
