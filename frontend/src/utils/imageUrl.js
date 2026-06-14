const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://my_pharmecy.test/api').replace(/\/api\/?$/, '')

export const MEDICINE_PLACEHOLDER_SRC = '/images/medicine-placeholder.webp'

export function resolveImageUrl(path, fallback = MEDICINE_PLACEHOLDER_SRC) {
  if (!path) return fallback
  return path.startsWith('http') ? path : new URL(path, `${API_ORIGIN}/`).toString()
}

export function handleImageFallback(event, fallback = MEDICINE_PLACEHOLDER_SRC) {
  const target = event?.currentTarget
  if (!target || target.dataset.fallbackApplied === 'true') return

  target.dataset.fallbackApplied = 'true'
  target.src = fallback
}

export function getProductImage(product, fallback = MEDICINE_PLACEHOLDER_SRC) {
  return resolveImageUrl(product?.primary_image?.image_url || product?.images?.[0]?.image_url, fallback)
}

export function getManufacturerImage(manufacturer, fallback = MEDICINE_PLACEHOLDER_SRC) {
  return resolveImageUrl(manufacturer?.logo_url, fallback)
}
