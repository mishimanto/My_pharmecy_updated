import api from './axios'

const PRODUCT_CACHE_KEY = 'storefront_product_cache_v4'
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
  window.localStorage.removeItem(PRODUCT_CACHE_KEY)
  window.localStorage.removeItem('storefront_product_cache_v1')
  window.localStorage.removeItem('storefront_product_cache_v2')
  window.localStorage.removeItem('storefront_product_cache_v3')
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

function listKey(params = {}) {
  return JSON.stringify(normalizeParams(params))
}

function setProductCache(product) {
  if (!product) return

  if (product.id != null) {
    productCache.set(`id:${product.id}`, product)
  }

  if (product.slug) {
    productCache.set(`slug:${product.slug}`, product)
  }
}

function getCachedProductByKey(idOrSlug) {
  const key = String(idOrSlug)
  return productCache.get(`slug:${key}`) || productCache.get(`id:${key}`) || null
}

function primeProducts(products) {
  products.forEach((product) => {
    setProductCache(product)
  })
}

function storeList(key, payload) {
  primeProducts(payload?.data || [])
  listCache.set(key, payload || null)
  writeCache()
}

function responseFromPayload(payload) {
  return { data: { data: payload } }
}

function fetchList(params = {}) {
  const key = listKey(params)

  if (inflightLists.has(key)) {
    return inflightLists.get(key)
  }

  const request = api.get('/products', { params }).then((response) => {
    storeList(key, response.data?.data || null)
    return response
  }).finally(() => {
    inflightLists.delete(key)
  })

  inflightLists.set(key, request)
  return request
}

function fetchProduct(idOrSlug) {
  const key = String(idOrSlug)

  if (inflightProducts.has(key)) {
    return inflightProducts.get(key)
  }

  const request = api.get(`/products/${encodeURIComponent(key)}`).then((response) => {
    if (response.data?.data) {
      setProductCache(response.data.data)
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
  list: (params = {}) => fetchList(params),
  show: (idOrSlug) => fetchProduct(idOrSlug),
  categories: () => fetchCategories(),
  manufacturers: () => fetchManufacturers(),
  categoryProducts: (id, params) => api.get(`/categories/${id}/products`, { params }),
  getCachedProduct: (idOrSlug) => getCachedProductByKey(idOrSlug),
  getCachedList: (params = {}) => listCache.get(listKey(params)) || null,
  getCachedCategories: () => categoryCache || [],
  getCachedManufacturers: () => manufacturerCache || [],
  primeProduct: (product) => {
    if (product?.id != null || product?.slug) {
      setProductCache(product)
      writeCache()
    }
  },
  primeList: (params = {}, payload = null) => {
    storeList(listKey(params), payload)
  },
  prefetch: async (idOrSlug) => {
    const cached = getCachedProductByKey(idOrSlug)
    if (cached) return cached

    try {
      const response = await fetchProduct(idOrSlug)
      return response.data?.data || null
    } catch {
      return null
    }
  },
  prefetchList: async (params = {}) => {
    const cached = listCache.get(listKey(params))
    if (cached) return cached

    try {
      const response = await fetchList(params)
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
  getCachedListResponse: (params = {}) => {
    const payload = listCache.get(listKey(params))
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
