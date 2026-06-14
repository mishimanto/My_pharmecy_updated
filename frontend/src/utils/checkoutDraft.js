const CHECKOUT_DRAFT_KEY = 'storefront_checkout_draft_v1'

export function readCheckoutDraft() {
  if (typeof window === 'undefined') {
    return { deliveryAreaId: '', couponCode: '' }
  }

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_DRAFT_KEY)
    const parsed = raw ? JSON.parse(raw) : {}

    return {
      deliveryAreaId: parsed.deliveryAreaId ? String(parsed.deliveryAreaId) : '',
      couponCode: parsed.couponCode ? String(parsed.couponCode) : '',
    }
  } catch {
    return { deliveryAreaId: '', couponCode: '' }
  }
}

export function writeCheckoutDraft(patch) {
  if (typeof window === 'undefined') return

  try {
    const current = readCheckoutDraft()
    const next = {
      deliveryAreaId: patch.deliveryAreaId !== undefined ? String(patch.deliveryAreaId || '') : current.deliveryAreaId,
      couponCode: patch.couponCode !== undefined ? String(patch.couponCode || '') : current.couponCode,
    }

    window.sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage failures.
  }
}

export function clearCheckoutDraft() {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.removeItem(CHECKOUT_DRAFT_KEY)
  } catch {
    // Ignore storage failures.
  }
}
