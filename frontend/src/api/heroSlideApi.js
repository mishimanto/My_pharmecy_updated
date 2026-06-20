import api from './axios'

const HERO_SLIDES_CACHE_KEY = 'storefront_hero_slides_v1'
const HERO_SLIDES_CACHE_TTL = 1000 * 60 * 10

export function readCachedHeroSlides() {
  if (typeof window === 'undefined') return null

  try {
    const payload = JSON.parse(window.sessionStorage.getItem(HERO_SLIDES_CACHE_KEY) || 'null')
    if (!payload || Date.now() - Number(payload.saved_at || 0) > HERO_SLIDES_CACHE_TTL) return null
    return payload.data || null
  } catch {
    return null
  }
}

function writeCachedHeroSlides(data) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(HERO_SLIDES_CACHE_KEY, JSON.stringify({
      saved_at: Date.now(),
      data,
    }))
  } catch {
    // Ignore cache failures.
  }
}

export const heroSlideApi = {
  list: () => api.get('/hero-slides').then((response) => {
    writeCachedHeroSlides(response.data.data || [])
    return response
  }),
}
