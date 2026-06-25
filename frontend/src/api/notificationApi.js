import api from './axios'

export const notificationApi = {
  list: () => api.get('/customer/notifications'),
  read: (id) => api.patch(`/customer/notifications/${id}/read`),
  adminList: (params) => api.get('/admin/notifications', { params }),
  adminRead: (id) => api.patch(`/admin/notifications/${id}/read`),
}
