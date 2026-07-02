export function getReturnRouteKey(returnOrKey) {
  if (returnOrKey == null) {
    return ''
  }

  if (typeof returnOrKey === 'object') {
    const id = Number(returnOrKey.id || 0)
    const orderNumber = returnOrKey.order?.order_number || ''
    const suffix = orderNumber ? `-${String(orderNumber).toLowerCase()}` : ''

    return id > 0 ? `return-${id.toString(36)}${suffix}` : ''
  }

  return String(returnOrKey)
}

export function getReturnPath(returnOrKey) {
  const key = getReturnRouteKey(returnOrKey)
  return key ? `/returns/${encodeURIComponent(key)}` : '/returns'
}
