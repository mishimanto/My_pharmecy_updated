import api from './axios'
import {
  clearAdminResourceCache,
  getCachedResponse,
  responseKey,
  setCachedResponse,
} from '../utils/adminResourceCache'

function cachedGet(url, params, options = {}) {
  const key = responseKey(url, params)
  const cached = options.fresh ? null : getCachedResponse(key)

  if (cached) {
    return Promise.resolve({ data: cached, cached: true })
  }

  return api.get(url, params ? { params } : undefined).then((response) => {
    setCachedResponse(key, response.data)
    return response
  })
}

function clearAfter(request) {
  return request.then((response) => {
    clearAdminResourceCache()
    return response
  })
}

export const adminApi = {
  dashboard: () => cachedGet('/admin/dashboard', undefined, { fresh: true }),
  dashboardSummary: () => cachedGet('/admin/dashboard/summary', undefined, { fresh: true }),
  dashboardRecentOrders: () => cachedGet('/admin/dashboard/recent-orders', undefined, { fresh: true }),
  dashboardPendingPrescriptions: () => cachedGet('/admin/dashboard/pending-prescriptions', undefined, { fresh: true }),
  dashboardLowStock: () => cachedGet('/admin/dashboard/low-stock', undefined, { fresh: true }),
  dashboardNearExpiry: () => cachedGet('/admin/dashboard/near-expiry', undefined, { fresh: true }),
  securitySummary: () => cachedGet('/admin/security/summary', undefined, { fresh: true }),
  loginHistory: (params) => cachedGet('/admin/security/login-history', params, { fresh: true }),
  updateTwoFactor: (payload) => clearAfter(api.patch('/admin/security/2fa', payload)),
  revokeStaffSession: (id) => clearAfter(api.post(`/admin/security/staff-sessions/${id}/revoke`)),
  userHistory: (id, type) => cachedGet(`/admin/users/${id}/${type}`),
  report: (type, params, options) => cachedGet(`/admin/reports/${type}`, params, options),
  reportPdf: (type, params, download = false) => api.get(`/admin/reports/${type}/pdf`, {
    params: download ? { ...params, download: 1 } : params,
    responseType: 'blob',
  }),
  list: (resource, params) => cachedGet(`/admin/${resource}`, params),
  listFresh: (resource, params) => cachedGet(`/admin/${resource}`, params, { fresh: true }),
  show: (resource, id) => cachedGet(`/admin/${resource}/${id}`),
  create: (resource, payload) => clearAfter(api.post(`/admin/${resource}`, payload)),
  update: (resource, id, payload) => clearAfter(api.put(`/admin/${resource}/${id}`, payload)),
  createHeroSlide: (payload) => clearAfter(api.post('/admin/hero-slides', payload, { headers: { 'Content-Type': 'multipart/form-data' } })),
  updateHeroSlide: (id, payload) => {
    if (payload instanceof FormData && !payload.has('_method')) {
      payload.append('_method', 'PUT')
    }

    return clearAfter(api.post(`/admin/hero-slides/${id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } }))
  },
  createBannerImage: (payload) => clearAfter(api.post('/admin/banner-images', payload, { headers: { 'Content-Type': 'multipart/form-data' } })),
  updateBannerImage: (id, payload) => {
    if (payload instanceof FormData && !payload.has('_method')) {
      payload.append('_method', 'PUT')
    }

    return clearAfter(api.post(`/admin/banner-images/${id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } }))
  },
  createOffer: (payload) => clearAfter(api.post('/admin/offers', payload, { headers: { 'Content-Type': 'multipart/form-data' } })),
  updateOffer: (id, payload) => {
    if (payload instanceof FormData && !payload.has('_method')) {
      payload.append('_method', 'PUT')
    }

    return clearAfter(api.post(`/admin/offers/${id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } }))
  },
  createMarketingPopup: (payload) => clearAfter(api.post('/admin/marketing-popups', payload, { headers: { 'Content-Type': 'multipart/form-data' } })),
  updateMarketingPopup: (id, payload) => {
    if (payload instanceof FormData && !payload.has('_method')) {
      payload.append('_method', 'PUT')
    }

    return clearAfter(api.post(`/admin/marketing-popups/${id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } }))
  },
  createManufacturer: (payload) => clearAfter(api.post('/admin/manufacturers', payload)),
  updateManufacturer: (id, payload) => clearAfter(api.post(`/admin/manufacturers/${id}`, payload)),
  patch: (resource, id, action, payload) => clearAfter(api.patch(`/admin/${resource}/${id}/${action}`, payload)),
  remove: (resource, id) => clearAfter(api.delete(`/admin/${resource}/${id}`)),
  uploadProductImages: (id, payload) => clearAfter(api.put(`/admin/products/${id}/images`, payload)),
  uploadProductImageChunk: (id, params) => api.get(`/admin/products/${id}/images/chunk`, { params }),
  deleteProductImage: (id) => clearAfter(api.delete(`/admin/product-images/${id}`)),
  generateProductDescriptionDraft: (id) => clearAfter(api.post(`/admin/products/${id}/description-draft`)),
  publishProductDescriptionDraft: (id, payload) => clearAfter(api.post(`/admin/products/${id}/description-draft/publish`, payload)),
  discardProductDescriptionDraft: (id) => clearAfter(api.delete(`/admin/products/${id}/description-draft`)),
  reviewPrescription: (id, payload) => clearAfter(api.post(`/admin/prescriptions/${id}/review`, payload)),
  reviewOrderPrescriptionMatch: (id, payload) => clearAfter(api.patch(`/admin/orders/${id}/prescription-match`, payload)),
  orderMemo: (id, download = false) => api.get(`/admin/orders/${id}/memo`, {
    params: download ? { download: 1 } : undefined,
    responseType: 'blob',
  }),
  createOrderDelivery: (id) => clearAfter(api.post(`/admin/orders/${id}/delivery`)),
  replySupportTicket: (id, formData) => clearAfter(api.post(`/admin/support-tickets/${id}/replies`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })),
  permissions: () => cachedGet('/admin/permissions'),
  syncRolePermissions: (id, permissions) => clearAfter(api.post(`/admin/roles/${id}/permissions`, { permissions })),
  siteSettings: () => cachedGet('/admin/site-settings'),
  updateSiteSettings: (payload) => clearAfter(api.put('/admin/site-settings', payload)),
}
