import api from './axios'

export const customerAuthApi = {
  login: (payload) => api.post('/customer/login', payload),
  register: (payload) => api.post('/customer/register', payload),
  me: () => api.get('/customer/profile'),
  logout: () => api.post('/customer/logout'),
}
