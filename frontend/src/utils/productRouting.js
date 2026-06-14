export function getProductRouteKey(productOrKey) {
  if (productOrKey == null) {
    return ''
  }

  if (typeof productOrKey === 'object') {
    return String(productOrKey.slug || productOrKey.id || '')
  }

  return String(productOrKey)
}

export function getProductPath(productOrKey) {
  const key = getProductRouteKey(productOrKey)
  return key ? `/products/${encodeURIComponent(key)}` : '/products'
}
