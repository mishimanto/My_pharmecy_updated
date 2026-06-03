import api from './axios'

export const prescriptionApi = {
  list: () => api.get('/customer/prescriptions'),
  show: (id) => api.get(`/customer/prescriptions/${id}`),
  create: (payload) => api.post('/customer/prescriptions', payload, { headers: { 'Content-Type': 'multipart/form-data' } }),
}
