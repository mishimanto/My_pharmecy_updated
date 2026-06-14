const PREFERRED_PRESCRIPTION_STORAGE_KEY = 'preferred_prescription_id'

export function readPreferredPrescriptionId() {
  if (typeof window === 'undefined') return ''

  return window.localStorage.getItem(PREFERRED_PRESCRIPTION_STORAGE_KEY) || ''
}

export function writePreferredPrescriptionId(value) {
  if (typeof window === 'undefined') return

  if (!value) {
    window.localStorage.removeItem(PREFERRED_PRESCRIPTION_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(PREFERRED_PRESCRIPTION_STORAGE_KEY, String(value))
}

export function clearPreferredPrescriptionId() {
  writePreferredPrescriptionId('')
}
