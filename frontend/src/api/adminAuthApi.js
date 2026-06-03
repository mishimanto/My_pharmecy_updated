import api from './axios'

export const adminAuthApi = {
  login: (payload) => api.post('/admin/login', payload),
  me: () => api.get('/admin/profile'),
  logout: () => api.post('/admin/logout'),
}
