import api from './axios'

export const notificationApi = {
  list: () => api.get('/customer/notifications'),
  read: (id) => api.patch(`/customer/notifications/${id}/read`),
  adminList: (params) => api.get('/admin/notifications', { params }),
  adminRead: (id) => api.patch(`/admin/notifications/${id}/read`),
  adminTypes: () => api.get('/admin/notifications/types'),
  adminMarkAllRead: (params) => api.patch('/admin/notifications/read-all', null, { params }),
  adminBulk: (payload) => api.post('/admin/notifications/bulk', payload),
  adminPreferences: () => api.get('/admin/notifications/preferences'),
  adminUpdatePreferences: (payload) => api.put('/admin/notifications/preferences', payload),
}
