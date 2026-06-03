import api from './axios'

export const orderApi = {
  list: () => api.get('/customer/orders'),
  show: (id) => api.get(`/customer/orders/${id}`),
  checkout: (payload) => api.post('/customer/checkout', payload),
  cancel: (id) => api.post(`/customer/orders/${id}/cancel`),
  codPayment: (id) => api.post(`/customer/orders/${id}/payment/cod`),
  tracking: (id) => api.get(`/customer/orders/${id}/tracking`),
}
