export function getOrderRouteKey(orderOrKey) {
  if (orderOrKey == null) {
    return ''
  }

  if (typeof orderOrKey === 'object') {
    return String(orderOrKey.order_number || orderOrKey.id || '')
  }

  return String(orderOrKey)
}

export function getOrderPath(orderOrKey, suffix = '') {
  const key = getOrderRouteKey(orderOrKey)
  const normalizedSuffix = suffix ? `/${String(suffix).replace(/^\/+/, '')}` : ''

  return key ? `/orders/${encodeURIComponent(key)}${normalizedSuffix}` : `/orders${normalizedSuffix}`
}
