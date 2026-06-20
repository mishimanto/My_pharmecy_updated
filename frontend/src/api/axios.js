import axios from 'axios'

const SIGNED_GUEST_TOKEN_PATTERN = /^gst\.[A-Za-z0-9_-]{32,}\.\d+\.[a-f0-9]{64}$/

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://my_pharmecy.test/api',
})

api.interceptors.request.use((config) => {
  const staffToken = localStorage.getItem('staff_token')
  const customerToken = localStorage.getItem('customer_token')
  const guestToken = localStorage.getItem('guest_token')
  const token = config.url?.startsWith('/admin') ? staffToken : customerToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (!config.url?.startsWith('/admin') && SIGNED_GUEST_TOKEN_PATTERN.test(guestToken || '')) {
    config.headers['X-Guest-Session'] = guestToken
  }
  return config
})

export default api
