export function prescriptionDisplayName(index) {
  return `Prescription ${Number(index) + 1}`
}

export function prescriptionDisplayNameById(items, id) {
  const index = (items || []).findIndex((item) => String(item.id) === String(id))

  return index >= 0 ? prescriptionDisplayName(index) : 'Prescription'
}

export function prescriptionSlug(index) {
  return `prescription-${Number(index) + 1}`
}

export function prescriptionIndexFromSlug(value) {
  const match = String(value || '').match(/^prescription-(\d+)$/i)

  return match ? Number(match[1]) - 1 : -1
}
