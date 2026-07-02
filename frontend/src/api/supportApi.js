import api from './axios'

export const supportApi = {
  list: () => api.get('/customer/support-tickets'),
  show: (id) => api.get(`/customer/support-tickets/${id}`),
  create: (formData) => api.post('/customer/support-tickets', formData),
  reply: (id, formData) => api.post(`/customer/support-tickets/${id}/replies`, formData),
  draft: (payload) => api.post('/customer/ai/support/draft', payload),
}
