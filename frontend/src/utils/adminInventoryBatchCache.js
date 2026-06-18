const INVENTORY_BATCHES_CACHE_KEY = 'admin_inventory_batches_payload_v1'
const INVENTORY_BATCHES_CACHE_TTL = 2 * 60 * 1000

export function inventoryBatchCacheKey(params) {
  return JSON.stringify({
    search: params.search || '',
    product_id: params.product_id || '',
    supplier_id: params.supplier_id || '',
    status: params.status || '',
    stock_state: params.stock_state || '',
    page: params.page || 1,
  })
}

export function readInventoryBatchesCache(params) {
  if (typeof window === 'undefined') return null

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(INVENTORY_BATCHES_CACHE_KEY) || '{}')
    const cached = cache[inventoryBatchCacheKey(params)]
    if (!cached || Date.now() - cached.cachedAt > INVENTORY_BATCHES_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

export function writeInventoryBatchesCache(params, payload) {
  if (typeof window === 'undefined') return

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(INVENTORY_BATCHES_CACHE_KEY) || '{}')
    cache[inventoryBatchCacheKey(params)] = { payload, cachedAt: Date.now() }
    window.sessionStorage.setItem(INVENTORY_BATCHES_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

export function clearInventoryBatchesCache() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(INVENTORY_BATCHES_CACHE_KEY)
  }
}
