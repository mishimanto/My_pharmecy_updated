const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://my_pharmecy.test/api').replace(/\/api\/?$/, '')

export const MEDICINE_PLACEHOLDER_SRC = '/images/medicine-placeholder.webp'

export function resolveImageUrl(path, fallback = MEDICINE_PLACEHOLDER_SRC) {
  if (!path) return fallback
  if (path.startsWith('http')) {
    try {
      const source = new URL(path)
      const api = new URL(API_ORIGIN)
      if (source.hostname === 'my_pharmecy.test' && api.hostname !== source.hostname) {
        source.protocol = api.protocol
        source.host = api.host
        return source.toString()
      }
    } catch {
      return path
    }

    return path
  }

  return new URL(path, `${API_ORIGIN}/`).toString()
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

export function getProductThumbnail(product, fallback = MEDICINE_PLACEHOLDER_SRC) {
  const image = product?.primary_image || product?.images?.[0]
  return resolveImageUrl(
    image?.thumbnail_url
      || image?.image_thumbnail_url
      || image?.thumbnail_src
      || image?.thumbnail_path
      || image?.image_webp_url
      || image?.image_url,
    fallback,
  )
}

export function getManufacturerImage(manufacturer, fallback = MEDICINE_PLACEHOLDER_SRC) {
  return resolveImageUrl(manufacturer?.logo_url, fallback)
}

export function getCategoryImage(category, fallback = MEDICINE_PLACEHOLDER_SRC) {
  return resolveImageUrl(category?.image_url, fallback)
}
