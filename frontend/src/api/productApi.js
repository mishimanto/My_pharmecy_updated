import api from './axios'

export const productApi = {
  list: (params) => api.get('/products', { params }),
  show: (id) => api.get(`/products/${id}`),
  categories: () => api.get('/categories'),
  manufacturers: () => api.get('/manufacturers'),
  categoryProducts: (id, params) => api.get(`/categories/${id}/products`, { params }),
}
