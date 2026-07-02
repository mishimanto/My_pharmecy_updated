import api from './axios'

export const rewardApi = {
  summary: () => api.get('/customer/rewards'),
  claim: (payload) => api.post('/customer/rewards/claim', payload),
}
