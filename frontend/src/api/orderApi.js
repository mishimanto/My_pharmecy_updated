import api from './axios'

const orderKey = (id) => encodeURIComponent(String(id))

export const orderApi = {
  list: () => api.get('/customer/orders'),
  show: (id) => api.get(`/customer/orders/${orderKey(id)}`),
  quote: (payload) => api.post('/customer/checkout/quote', payload),
  checkout: (payload) => api.post('/customer/checkout', payload),
  cancel: (id) => api.post(`/customer/orders/${orderKey(id)}/cancel`),
  codPayment: (id) => api.post(`/customer/orders/${orderKey(id)}/payment/cod`),
  deliveryAreas: () => api.get('/delivery-areas'),
  submitPaymentProof: (id, formData) => api.post(`/customer/orders/${orderKey(id)}/payment-proof`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  tracking: (id) => api.get(`/customer/orders/${orderKey(id)}/tracking`),
}
