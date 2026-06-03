import api from './axios'

export const cartApi = {
  get: () => api.get('/customer/cart'),
  add: (payload) => api.post('/customer/cart/items', payload),
  update: (id, payload) => api.put(`/customer/cart/items/${id}`, payload),
  remove: (id) => api.delete(`/customer/cart/items/${id}`),
  clear: () => api.delete('/customer/cart/clear'),
}
