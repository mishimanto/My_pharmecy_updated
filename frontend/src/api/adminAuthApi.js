import api from './axios'
import { queryClient } from '../lib/queryClient'
import { clearAdminResourceCache } from '../utils/adminResourceCache'
import { clearAdminSessionCaches } from '../utils/adminCacheRegistry'

function clearAfter(request) {
  return request.then((response) => {
    clearAdminResourceCache()
    clearAdminSessionCaches()
    queryClient.invalidateQueries({ queryKey: ['admin'] })
    return response
  })
}

export const adminAuthApi = {
  login: (payload) => clearAfter(api.post('/admin/login', payload)),
  verifyTwoFactor: (payload) => clearAfter(api.post('/admin/login/2fa', payload)),
  forgotPassword: (payload) => api.post('/admin/forgot-password', payload),
  resetPassword: (payload) => api.post('/admin/reset-password', payload),
  me: () => api.get('/admin/profile'),
  updateProfile: (payload) => clearAfter(api.put('/admin/profile', payload)),
  changePassword: (payload) => clearAfter(api.put('/admin/profile/password', payload)),
  logout: () => clearAfter(api.post('/admin/logout')),
}
