import api from './axios'

const BANNER_IMAGES_CACHE_KEY = 'storefront_banner_images_v1'
const BANNER_IMAGES_CACHE_TTL = 1000 * 60 * 10

export function readCachedBannerImages() {
  if (typeof window === 'undefined') return null

  try {
    const payload = JSON.parse(window.sessionStorage.getItem(BANNER_IMAGES_CACHE_KEY) || 'null')
    if (!payload || Date.now() - Number(payload.saved_at || 0) > BANNER_IMAGES_CACHE_TTL) return null
    return payload.data || null
  } catch {
    return null
  }
}

function writeCachedBannerImages(data) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(BANNER_IMAGES_CACHE_KEY, JSON.stringify({
      saved_at: Date.now(),
      data,
    }))
  } catch {
    // Ignore cache failures.
  }
}

export const bannerImageApi = {
  list: (params = { placement: 'homepage' }) => api.get('/banner-images', { params }).then((response) => {
    writeCachedBannerImages(response.data.data || [])
    return response
  }),
}
