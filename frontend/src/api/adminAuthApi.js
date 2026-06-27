import api from './axios'
import { clearAdminResourceCache } from '../utils/adminResourceCache'

function clearAfter(request) {
  return request.then((response) => {
    clearAdminResourceCache()
    return response
  })
}

export const adminAuthApi = {
  login: (payload) => clearAfter(api.post('/admin/login', payload)),
  verifyTwoFactor: (payload) => clearAfter(api.post('/admin/login/2fa', payload)),
  me: () => api.get('/admin/profile'),
  updateProfile: (payload) => clearAfter(api.put('/admin/profile', payload)),
  changePassword: (payload) => clearAfter(api.put('/admin/profile/password', payload)),
  logout: () => clearAfter(api.post('/admin/logout')),
}
