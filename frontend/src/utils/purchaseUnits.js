export function getPurchaseOptions(product) {
  return product?.purchase_options || []
}

export function getPurchaseOption(product, code) {
  return getPurchaseOptions(product).find((option) => option.code === code) || null
}

export function getDefaultPurchaseOption(product) {
  const options = getPurchaseOptions(product)
  const explicit = options.find((option) => option.code === product?.default_purchase_unit && option.is_available)
  if (explicit) return explicit
  return options.find((option) => option.is_available) || options[0] || null
}

export function getUnitLabel(code) {
  return { piece: 'Piece', strip: 'Strip', box: 'Box' }[code] || 'Unit'
}

export function getUnitSummary(quantity, unitLabel) {
  if (quantity === 1) {
    return `${quantity} ${unitLabel}`
  }

  if (unitLabel === 'Box') {
    return `${quantity} Boxes`
  }

  return `${quantity} ${unitLabel}s`
}
