import api from './axios'

export const customerAuthApi = {
  login: (payload) => api.post('/customer/login', payload),
  register: (payload) => api.post('/customer/register', payload),
  guestSession: () => api.post('/customer/guest-session'),
  forgotPassword: (payload) => api.post('/customer/forgot-password', payload),
  resetPassword: (payload) => api.post('/customer/reset-password', payload),
  me: () => api.get('/customer/profile'),
  updateProfile: (payload) => {
    if (payload instanceof FormData) {
      if (!payload.has('_method')) {
        payload.append('_method', 'PUT')
      }

      return api.post('/customer/profile', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }

    return api.put('/customer/profile', payload)
  },
  changePassword: (payload) => api.put('/customer/profile/password', payload),
  logout: () => api.post('/customer/logout'),
}
