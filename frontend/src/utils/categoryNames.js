export function getCategoryName(category, isBangla = false, fallback = null) {
  const effectiveFallback = fallback ?? (isBangla ? 'স্বাস্থ্যসেবা' : 'Healthcare')
  if (!category) return effectiveFallback

  const categoryName = typeof category === 'string'
    ? String(category).trim()
    : String(category.category_name || '').trim()

  if (!categoryName) return effectiveFallback

  if (!isBangla) {
    return categoryName
  }

  if (typeof category === 'object') {
    const banglaName = String(category.category_name_bn || '').trim()
    if (banglaName) {
      return banglaName
    }
  }

  return categoryName
}

export function getCategorySlug(category) {
  if (!category) return ''

  const explicitSlug = typeof category === 'object' ? category.slug || category.category_slug : ''
  const source = explicitSlug || (typeof category === 'string' ? category : category.category_name || category.name || '')
  const slug = slugifyCatalogValue(source)

  return slug || String(typeof category === 'object' ? category.id || '' : '')
}

export function getManufacturerSlug(manufacturer) {
  if (!manufacturer) return ''

  const explicitSlug = typeof manufacturer === 'object' ? manufacturer.slug || manufacturer.manufacturer_slug : ''
  const source = explicitSlug || (typeof manufacturer === 'string' ? manufacturer : manufacturer.manufacturer_name || manufacturer.name || '')
  const slug = slugifyCatalogValue(source)

  return slug || String(typeof manufacturer === 'object' ? manufacturer.id || '' : '')
}

export function getCategoryProductsPath(category) {
  const slug = getCategorySlug(category)
  return slug ? `/products?category=${encodeURIComponent(slug)}` : '/products'
}

export function getManufacturerProductsPath(manufacturer) {
  const slug = getManufacturerSlug(manufacturer)
  return slug ? `/products?manufacturer=${encodeURIComponent(slug)}` : '/products'
}

export function slugifyCatalogValue(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}
