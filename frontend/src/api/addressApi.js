import api from './axios'

export const addressApi = {
  list: () => api.get('/customer/addresses'),
  create: (payload) => api.post('/customer/addresses', payload),
  update: (id, payload) => api.put(`/customer/addresses/${id}`, payload),
  remove: (id) => api.delete(`/customer/addresses/${id}`),
  setDefault: (id) => api.patch(`/customer/addresses/${id}/default`),
}
