import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://my_pharmecy.test/api',
})

api.interceptors.request.use((config) => {
  const staffToken = localStorage.getItem('staff_token')
  const customerToken = localStorage.getItem('customer_token')
  const guestToken = localStorage.getItem('guest_token')
  const token = config.url?.startsWith('/admin') ? staffToken : customerToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (!config.url?.startsWith('/admin') && guestToken) config.headers['X-Guest-Session'] = guestToken
  return config
})

export default api
