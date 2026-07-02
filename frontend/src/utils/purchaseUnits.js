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

const UNIT_COPY = {
  piece: { bn: 'পিস', en: 'Piece', enPlural: 'Pieces' },
  strip: { bn: 'পাতা', en: 'Strip', enPlural: 'Strips' },
  box: { bn: 'বক্স', en: 'Box', enPlural: 'Boxes' },
  pack: { bn: 'প্যাক', en: 'Pack', enPlural: 'Packs' },
  packet: { bn: 'প্যাকেট', en: 'Packet', enPlural: 'Packets' },
  bottle: { bn: 'বোতল', en: 'Bottle', enPlural: 'Bottles' },
  kit: { bn: 'কিট', en: 'Kit', enPlural: 'Kits' },
  device: { bn: 'ডিভাইস', en: 'Device', enPlural: 'Devices' },
  tube: { bn: 'টিউব', en: 'Tube', enPlural: 'Tubes' },
  jar: { bn: 'জার', en: 'Jar', enPlural: 'Jars' },
  unit: { bn: 'ইউনিট', en: 'Unit', enPlural: 'Units' },
}

const PACKAGE_UNIT_CODES = new Set(['pack', 'packet', 'bottle', 'kit', 'device', 'tube', 'jar', 'unit'])

function resolveUnitCopy(code) {
  return UNIT_COPY[code] || UNIT_COPY.unit
}

export function getUnitLabel(code, isBangla = false) {
  const copy = resolveUnitCopy(code)
  return isBangla ? copy.bn : copy.en
}

export function getUnitPluralLabel(code, isBangla = false) {
  const copy = resolveUnitCopy(code)
  return isBangla ? copy.bn : copy.enPlural
}

export function getOptionUnitLabel(option, isBangla = false) {
  if (!option) {
    return ''
  }

  return isBangla ? getUnitLabel(option.code, true) : option.label || getUnitLabel(option.code, false)
}

export function getLocalizedConversionLabel(option, isBangla = false) {
  if (!option) {
    return ''
  }

  const piecesPerUnit = Number(option.pieces_per_unit || 0)
  const usesPackageLabel = PACKAGE_UNIT_CODES.has(option.code) || (option.code === 'box' && piecesPerUnit <= 1)

  if (usesPackageLabel && option.conversion_label) {
    return option.conversion_label
  }

  const unitLabel = getUnitLabel(option.code, isBangla)

  if (!piecesPerUnit) {
    return isBangla ? `১ ${unitLabel}` : `1 ${unitLabel}`
  }

  if (isBangla) {
    return `১ ${unitLabel} = ${piecesPerUnit.toLocaleString('bn-BD')} পিস`
  }

  return `1 ${unitLabel} = ${piecesPerUnit} ${piecesPerUnit === 1 ? 'piece' : 'pieces'}`
}

export function getUnitSummary(quantity, unitCode, isBangla = false) {
  const count = Number(quantity || 0)
  const label = count === 1 ? getUnitLabel(unitCode, isBangla) : getUnitPluralLabel(unitCode, isBangla)
  const formattedCount = count.toLocaleString(isBangla ? 'bn-BD' : 'en-US')

  return `${formattedCount} ${label}`
}

export function getOptionUnitSummary(quantity, option, isBangla = false) {
  if (!option) {
    return ''
  }

  const count = Number(quantity || 0)
  const formattedCount = count.toLocaleString(isBangla ? 'bn-BD' : 'en-US')

  if (isBangla || count === 1) {
    return `${formattedCount} ${getOptionUnitLabel(option, isBangla)}`
  }

  return `${formattedCount} ${getUnitPluralLabel(option.code, false)}`
}
