import api from './axios'

export const returnApi = {
  list: () => api.get('/customer/returns'),
  show: (id) => api.get(`/customer/returns/${id}`),
  create: (orderId, payload) => api.post(`/customer/orders/${orderId}/return-request`, payload),
}
