import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
})

api.interceptors.request.use((config) => {
  const staffToken = localStorage.getItem('staff_token')
  const customerToken = localStorage.getItem('customer_token')
  const token = config.url?.startsWith('/admin') ? staffToken : customerToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api

