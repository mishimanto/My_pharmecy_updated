import api from './axios'

const PRODUCT_CACHE_KEY = 'storefront_product_cache_v10'

const inflightLists = new Map()
const inflightProducts = new Map()
let inflightCategories = null
let inflightManufacturers = null

function clearCacheStorage() {
  if (typeof window === 'undefined') return

  window.sessionStorage.removeItem(PRODUCT_CACHE_KEY)
  window.sessionStorage.removeItem('storefront_product_cache_v1')
  window.sessionStorage.removeItem('storefront_product_cache_v2')
  window.sessionStorage.removeItem('storefront_product_cache_v3')
  window.sessionStorage.removeItem('storefront_product_cache_v4')
  window.sessionStorage.removeItem('storefront_product_cache_v5')
  window.sessionStorage.removeItem('storefront_product_cache_v6')
  window.sessionStorage.removeItem('storefront_product_cache_v7')
  window.sessionStorage.removeItem('storefront_product_cache_v8')
  window.sessionStorage.removeItem('storefront_product_cache_v9')
}

clearCacheStorage()

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

function fetchList(params = {}, options = {}) {
  const key = listKey(params, options)

  if (inflightLists.has(key)) {
    return inflightLists.get(key)
  }

  const request = api.get('/products', { params }).then((response) => {
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
    return response
  }).finally(() => {
    inflightProducts.delete(key)
  })

  inflightProducts.set(key, request)
  return request
}

function categoryParamsKey(params = {}) {
  return JSON.stringify(normalizeParams(params))
}

function fetchCategories(params = {}) {
  const key = categoryParamsKey(params)

  if (inflightCategories?.has(key)) {
    return inflightCategories.get(key)
  }

  if (!inflightCategories) {
    inflightCategories = new Map()
  }

  const request = api.get('/categories', { params }).then((response) => {
    return response
  }).finally(() => {
    inflightCategories.delete(key)
  })

  inflightCategories.set(key, request)
  return request
}

function fetchManufacturers() {
  if (inflightManufacturers) {
    return inflightManufacturers
  }

  inflightManufacturers = api.get('/manufacturers').then((response) => {
    return response
  }).finally(() => {
    inflightManufacturers = null
  })

  return inflightManufacturers
}

export const productApi = {
  list: (params = {}, options = {}) => fetchList(params, options),
  show: (idOrSlug, options = {}) => fetchProduct(idOrSlug, options),
  aiConfig: () => api.get('/customer/ai/config'),
  askProductQuestion: (idOrSlug, question) => api.post(`/customer/ai/products/${encodeURIComponent(String(idOrSlug))}/question`, { question }),
  aiSearch: (query, limit = 8) => api.post('/customer/ai/search', { query, limit }),
  categories: (params = {}) => fetchCategories(params),
  manufacturers: () => fetchManufacturers(),
  categoryProducts: (id, params) => api.get(`/categories/${id}/products`, { params }),
  prefetch: async (idOrSlug, options = {}) => {
    try {
      const response = await fetchProduct(idOrSlug, options)
      return response.data?.data || null
    } catch {
      return null
    }
  },
  prefetchList: async (params = {}, options = {}) => {
    try {
      const response = await fetchList(params, options)
      return response.data?.data || null
    } catch {
      return null
    }
  },
  prefetchCategories: async (params = {}) => {
    try {
      const response = await fetchCategories(params)
      return response.data?.data || []
    } catch {
      return []
    }
  },
  prefetchManufacturers: async () => {
    try {
      const response = await fetchManufacturers()
      return response.data?.data || []
    } catch {
      return []
    }
  },
  clearCache: () => {
    clearCacheStorage()
  },
}
