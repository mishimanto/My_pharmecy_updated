import api from './axios'

const PRODUCT_CACHE_KEY = 'storefront_product_cache_v5'
const PRODUCT_CACHE_TTL = 1000 * 60 * 30
const productCache = new Map()
const listCache = new Map()
let categoryCache = null
let manufacturerCache = null

const inflightLists = new Map()
const inflightProducts = new Map()
let inflightCategories = null
let inflightManufacturers = null

function readCache() {
  if (typeof window === 'undefined') return null

  try {
    const raw =
      window.localStorage.getItem(PRODUCT_CACHE_KEY)
      || window.sessionStorage.getItem(PRODUCT_CACHE_KEY)

    if (!raw) return null

    const payload = JSON.parse(raw)
    const savedAt = Number(payload?.saved_at || 0)

    if (savedAt && Date.now() - savedAt > PRODUCT_CACHE_TTL) {
      clearCacheStorage()
      return null
    }

    return payload
  } catch {
    return null
  }
}

function clearCacheStorage() {
  if (typeof window === 'undefined') return

  window.sessionStorage.removeItem(PRODUCT_CACHE_KEY)
  window.sessionStorage.removeItem('storefront_product_cache_v1')
  window.sessionStorage.removeItem('storefront_product_cache_v2')
  window.sessionStorage.removeItem('storefront_product_cache_v3')
  window.sessionStorage.removeItem('storefront_product_cache_v4')
  window.localStorage.removeItem(PRODUCT_CACHE_KEY)
  window.localStorage.removeItem('storefront_product_cache_v1')
  window.localStorage.removeItem('storefront_product_cache_v2')
  window.localStorage.removeItem('storefront_product_cache_v3')
  window.localStorage.removeItem('storefront_product_cache_v4')
}

function writeCache() {
  if (typeof window === 'undefined') return

  try {
    const payload = {
      saved_at: Date.now(),
      products: Array.from(productCache.entries()).slice(-72),
      lists: Array.from(listCache.entries()).slice(-12),
      categories: categoryCache,
      manufacturers: manufacturerCache,
    }

    const serialized = JSON.stringify(payload)

    window.sessionStorage.setItem(PRODUCT_CACHE_KEY, serialized)
    window.localStorage.setItem(PRODUCT_CACHE_KEY, serialized)
  } catch {
    // Ignore storage quota and serialization failures.
  }
}

function hydrateCache() {
  const payload = readCache()
  if (!payload) return

  payload.products?.forEach(([key, value]) => productCache.set(key, value))
  payload.lists?.forEach(([key, value]) => listCache.set(key, value))
  categoryCache = payload.categories || null
  manufacturerCache = payload.manufacturers || null
}

hydrateCache()

function normalizeParams(params = {}) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
}

function normalizeCacheScope(options = {}) {
  return options.cacheScope ? String(options.cacheScope) : 'default'
}

function listKey(params = {}, options = {}) {
  return JSON.stringify({
    scope: normalizeCacheScope(options),
    params: normalizeParams(params),
  })
}

function productCacheKey(prefix, value, options = {}) {
  return `${normalizeCacheScope(options)}:${prefix}:${value}`
}

function setProductCache(product, options = {}) {
  if (!product) return

  if (product.id != null) {
    productCache.set(productCacheKey('id', product.id, options), product)
  }

  if (product.slug) {
    productCache.set(productCacheKey('slug', product.slug, options), product)
  }
}

function getCachedProductByKey(idOrSlug, options = {}) {
  const key = String(idOrSlug)
  return productCache.get(productCacheKey('slug', key, options)) || productCache.get(productCacheKey('id', key, options)) || null
}

function primeProducts(products, options = {}) {
  products.forEach((product) => {
    setProductCache(product, options)
  })
}

function storeList(key, payload, options = {}) {
  primeProducts(payload?.data || [], options)
  listCache.set(key, payload || null)
  writeCache()
}

function responseFromPayload(payload) {
  return { data: { data: payload } }
}

function fetchList(params = {}, options = {}) {
  const key = listKey(params, options)

  if (inflightLists.has(key)) {
    return inflightLists.get(key)
  }

  const request = api.get('/products', { params }).then((response) => {
    storeList(key, response.data?.data || null, options)
    return response
  }).finally(() => {
    inflightLists.delete(key)
  })

  inflightLists.set(key, request)
  return request
}

function fetchProduct(idOrSlug, options = {}) {
  const key = `${normalizeCacheScope(options)}:${String(idOrSlug)}`

  if (inflightProducts.has(key)) {
    return inflightProducts.get(key)
  }

  const request = api.get(`/products/${encodeURIComponent(String(idOrSlug))}`).then((response) => {
    if (response.data?.data) {
      setProductCache(response.data.data, options)
      writeCache()
    }

    return response
  }).finally(() => {
    inflightProducts.delete(key)
  })

  inflightProducts.set(key, request)
  return request
}

function fetchCategories() {
  if (inflightCategories) {
    return inflightCategories
  }

  inflightCategories = api.get('/categories').then((response) => {
    categoryCache = response.data?.data || []
    writeCache()
    return response
  }).finally(() => {
    inflightCategories = null
  })

  return inflightCategories
}

function fetchManufacturers() {
  if (inflightManufacturers) {
    return inflightManufacturers
  }

  inflightManufacturers = api.get('/manufacturers').then((response) => {
    manufacturerCache = response.data?.data || []
    writeCache()
    return response
  }).finally(() => {
    inflightManufacturers = null
  })

  return inflightManufacturers
}

export const productApi = {
  list: (params = {}, options = {}) => fetchList(params, options),
  show: (idOrSlug, options = {}) => fetchProduct(idOrSlug, options),
  categories: () => fetchCategories(),
  manufacturers: () => fetchManufacturers(),
  categoryProducts: (id, params) => api.get(`/categories/${id}/products`, { params }),
  getCachedProduct: (idOrSlug, options = {}) => getCachedProductByKey(idOrSlug, options),
  getCachedList: (params = {}, options = {}) => listCache.get(listKey(params, options)) || null,
  getCachedCategories: () => categoryCache || [],
  getCachedManufacturers: () => manufacturerCache || [],
  primeProduct: (product, options = {}) => {
    if (product?.id != null || product?.slug) {
      setProductCache(product, options)
      writeCache()
    }
  },
  primeList: (params = {}, payload = null, options = {}) => {
    storeList(listKey(params, options), payload, options)
  },
  prefetch: async (idOrSlug, options = {}) => {
    const cached = getCachedProductByKey(idOrSlug, options)
    if (cached) return cached

    try {
      const response = await fetchProduct(idOrSlug, options)
      return response.data?.data || null
    } catch {
      return null
    }
  },
  prefetchList: async (params = {}, options = {}) => {
    const cached = listCache.get(listKey(params, options))
    if (cached) return cached

    try {
      const response = await fetchList(params, options)
      return response.data?.data || null
    } catch {
      return null
    }
  },
  prefetchCategories: async () => {
    if (categoryCache?.length) return categoryCache

    try {
      const response = await fetchCategories()
      return response.data?.data || []
    } catch {
      return []
    }
  },
  prefetchManufacturers: async () => {
    if (manufacturerCache?.length) return manufacturerCache

    try {
      const response = await fetchManufacturers()
      return response.data?.data || []
    } catch {
      return []
    }
  },
  getCachedListResponse: (params = {}, options = {}) => {
    const payload = listCache.get(listKey(params, options))
    return payload ? responseFromPayload(payload) : null
  },
  clearCache: () => {
    productCache.clear()
    listCache.clear()
    categoryCache = null
    manufacturerCache = null
    clearCacheStorage()
  },
}
