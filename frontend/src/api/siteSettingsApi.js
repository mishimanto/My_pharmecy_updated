import api from './axios'

export const siteSettingsApi = {
  show: () => api.get('/site-settings'),
}
