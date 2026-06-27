import axios from 'axios'
import Swal from 'sweetalert2'

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const needsPassword = error.response?.status === 423
      && error.response?.data?.data?.password_confirmation_required
      && !originalRequest?._passwordConfirmRetry

    if (!needsPassword) {
      return Promise.reject(error)
    }

    const result = await Swal.fire({
      title: 'Confirm your password',
      text: 'This sensitive admin action needs a recent password confirmation.',
      input: 'password',
      inputPlaceholder: 'Enter your admin password',
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#059669',
      inputValidator: (value) => (!value ? 'Password is required.' : undefined),
    })

    if (!result.isConfirmed) {
      return Promise.reject(error)
    }

    originalRequest._passwordConfirmRetry = true
    await api.post('/admin/security/password-confirm', { password: result.value })

    return api(originalRequest)
  },
)

export default api
