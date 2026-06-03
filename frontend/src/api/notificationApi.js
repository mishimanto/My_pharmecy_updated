import api from './axios'

export const notificationApi = {
  list: () => api.get('/customer/notifications'),
  read: (id) => api.patch(`/customer/notifications/${id}/read`),
}
