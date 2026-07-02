import { safeCustomerPath } from './safeCustomerPath'

const ORDER_NUMBER_PATTERN = /\bORD-[A-Z0-9-]+\b/i
const CUSTOMER_NOTIFICATION_LINK_ROOTS = [
  '/orders',
  '/prescriptions',
  '/support',
  '/returns',
  '/notifications',
  '/account',
]

const statusLabelsBn = {
  pending_confirmation: '\u0995\u09a8\u09ab\u09be\u09b0\u09cd\u09ae\u09c7\u09b6\u09a8\u09c7\u09b0 \u0985\u09aa\u09c7\u0995\u09cd\u09b7\u09be\u09af\u09bc',
  prescription_review: '\u09aa\u09cd\u09b0\u09c7\u09b8\u0995\u09cd\u09b0\u09bf\u09aa\u09b6\u09a8 \u09b0\u09bf\u09ad\u09bf\u0989\u09a4\u09c7',
  confirmed: '\u0995\u09a8\u09ab\u09be\u09b0\u09cd\u09ae \u09b9\u09af\u09bc\u09c7\u099b\u09c7',
  processing: '\u09aa\u09cd\u09b0\u09b8\u09c7\u09b8\u09bf\u0982 \u09b9\u099a\u09cd\u099b\u09c7',
  delivered: '\u09a1\u09c7\u09b2\u09bf\u09ad\u09be\u09b0 \u09b9\u09af\u09bc\u09c7\u099b\u09c7',
  cancelled: '\u09ac\u09be\u09a4\u09bf\u09b2 \u09b9\u09af\u09bc\u09c7\u099b\u09c7',
  returned: '\u09b0\u09bf\u099f\u09be\u09b0\u09cd\u09a8 \u09b9\u09af\u09bc\u09c7\u099b\u09c7',
  refunded: '\u09b0\u09bf\u09ab\u09be\u09a8\u09cd\u09a1 \u09b9\u09af\u09bc\u09c7\u099b\u09c7',
  awaiting_proof: '\u09aa\u09c7\u09ae\u09c7\u09a8\u09cd\u099f \u09aa\u09cd\u09b0\u09c1\u09ab\u09c7\u09b0 \u0985\u09aa\u09c7\u0995\u09cd\u09b7\u09be\u09af\u09bc',
  under_review: '\u09b0\u09bf\u09ad\u09bf\u0989\u09a4\u09c7 \u0986\u099b\u09c7',
  paid: '\u09aa\u09c7\u0987\u09a1',
  rejected: '\u09b0\u09bf\u099c\u09c7\u0995\u09cd\u099f\u09c7\u09a1',
  failed: '\u09ab\u09c7\u0987\u09b2\u09a1',
}

const customerNotificationTypeLabels = {
  order_status_update: ['\u0985\u09b0\u09cd\u09a1\u09be\u09b0 \u0986\u09aa\u09a1\u09c7\u099f', 'Order update'],
  new_order: ['\u0985\u09b0\u09cd\u09a1\u09be\u09b0 \u0986\u09aa\u09a1\u09c7\u099f', 'Order update'],
  prescription_review: ['\u09aa\u09cd\u09b0\u09c7\u09b8\u0995\u09cd\u09b0\u09bf\u09aa\u09b6\u09a8 \u09b0\u09bf\u09ad\u09bf\u0989', 'Prescription review'],
  prescription_clarification: ['\u09aa\u09cd\u09b0\u09c7\u09b8\u0995\u09cd\u09b0\u09bf\u09aa\u09b6\u09a8 \u09a4\u09a5\u09cd\u09af \u09aa\u09cd\u09b0\u09af\u09bc\u09cb\u099c\u09a8', 'Prescription clarification'],
  payment_update: ['\u09aa\u09c7\u09ae\u09c7\u09a8\u09cd\u099f \u0986\u09aa\u09a1\u09c7\u099f', 'Payment update'],
  support_reply: ['\u09b8\u09be\u09aa\u09cb\u09b0\u09cd\u099f \u09b0\u09bf\u09aa\u09cd\u09b2\u09be\u0987', 'Support reply'],
  return_status_update: ['\u09b0\u09bf\u099f\u09be\u09b0\u09cd\u09a8 \u0986\u09aa\u09a1\u09c7\u099f', 'Return update'],
  refund_update: ['\u09b0\u09bf\u09ab\u09be\u09a8\u09cd\u09a1 \u0986\u09aa\u09a1\u09c7\u099f', 'Refund update'],
}

const customerNotificationTitleLabels = {
  prescription_clarification: ['\u09aa\u09cd\u09b0\u09c7\u09b8\u0995\u09cd\u09b0\u09bf\u09aa\u09b6\u09a8 \u09a8\u09bf\u09af\u09bc\u09c7 \u0986\u09b0\u0993 \u09a4\u09a5\u09cd\u09af \u09aa\u09cd\u09b0\u09af\u09bc\u09cb\u099c\u09a8', 'Prescription clarification needed'],
  prescription_review: ['\u09aa\u09cd\u09b0\u09c7\u09b8\u0995\u09cd\u09b0\u09bf\u09aa\u09b6\u09a8 \u09b0\u09bf\u09ad\u09bf\u0989 \u0986\u09aa\u09a1\u09c7\u099f', 'Prescription review update'],
  order_status_update: ['\u0985\u09b0\u09cd\u09a1\u09be\u09b0 \u09b8\u09cd\u099f\u09cd\u09af\u09be\u099f\u09be\u09b8 \u0986\u09aa\u09a1\u09c7\u099f', 'Order status updated'],
  new_order: ['\u0985\u09b0\u09cd\u09a1\u09be\u09b0 \u0997\u09cd\u09b0\u09b9\u09a3 \u09b9\u09af\u09bc\u09c7\u099b\u09c7', 'Order received'],
  support_reply: ['\u09b8\u09be\u09aa\u09cb\u09b0\u09cd\u099f \u099f\u09bf\u0995\u09bf\u099f\u09c7 \u09b0\u09bf\u09aa\u09cd\u09b2\u09be\u0987 \u0986\u09b8\u09c7\u099b\u09c7', 'Support reply received'],
  return_status_update: ['\u09b0\u09bf\u099f\u09be\u09b0\u09cd\u09a8 \u09b8\u09cd\u099f\u09cd\u09af\u09be\u099f\u09be\u09b8 \u0986\u09aa\u09a1\u09c7\u099f', 'Return status updated'],
  refund_update: ['\u09b0\u09bf\u09ab\u09be\u09a8\u09cd\u09a1 \u0986\u09aa\u09a1\u09c7\u099f', 'Refund updated'],
}

function labelStatus(value) {
  return statusLabelsBn[value] || String(value || '').replace(/_/g, ' ')
}

function cleanPath(path) {
  const safePath = safeCustomerPath(path, '')

  if (!safePath) {
    return ''
  }

  return CUSTOMER_NOTIFICATION_LINK_ROOTS.some((root) => safePath === root || safePath.startsWith(`${root}/`))
    ? safePath
    : ''
}

function orderNumberFromText(...values) {
  const text = values.filter(Boolean).join(' ')
  const match = text.match(ORDER_NUMBER_PATTERN)

  return match?.[0] || ''
}

function supportSubjectFromText(notification) {
  const metadataSubject = String(notification?.metadata?.ticket_subject || '').trim()
  if (metadataSubject) {
    return metadataSubject
  }

  const rawTitle = String(notification?.title || '').trim()
  const rawMessage = String(notification?.message || '').trim()

  const banglaMatch = rawMessage.match(/আপনার ['"]?(.+?)['"]? টিকিটে নতুন উত্তর দেওয়া হয়েছে/u)
  if (banglaMatch?.[1]) {
    return banglaMatch[1].trim()
  }

  const englishMatch = rawMessage.match(/support ticket:\s*(.+?)\.?$/i)
  if (englishMatch?.[1]) {
    return englishMatch[1].trim()
  }

  if (!/support reply/i.test(rawTitle) && !/সাপোর্ট/.test(rawTitle) && rawTitle) {
    return rawTitle
  }

  return ''
}

function cleanEnglishMessage(rawMessage) {
  return rawMessage
    .replace(/\s+by the admin team/gi, '')
    .replace(/\s+by admin team/gi, '')
    .replace(/the admin team will verify it\./gi, 'We will verify it shortly.')
    .replace(/the admin will review it\./gi, 'We will review it shortly.')
    .replace(/waiting for admin confirmation/gi, 'waiting for confirmation')
    .replace(/admin confirmation/gi, 'confirmation')
    .replace(/\s+\./g, '.')
    .replace(/\.{2,}/g, '.')
    .trim()
}

export function getCustomerNotificationTypeLabel(type, isBangla = false) {
  const labels = customerNotificationTypeLabels[type] || ['\u09a8\u09cb\u099f\u09bf\u09ab\u09bf\u0995\u09c7\u09b6\u09a8', 'Notification']
  return isBangla ? labels[0] : labels[1]
}

export function getCustomerNotificationTitle(notification, isBangla = false) {
  const item = notification || {}
  const rawTitle = String(item.title || '').trim()

  if (item.notification_type === 'payment_update') {
    if (isBangla) {
      return /verified/i.test(rawTitle)
        ? '\u09aa\u09c7\u09ae\u09c7\u09a8\u09cd\u099f \u09af\u09be\u099a\u09be\u0987 \u09b9\u09af\u09bc\u09c7\u099b\u09c7'
        : '\u09aa\u09c7\u09ae\u09c7\u09a8\u09cd\u099f \u0986\u09aa\u09a1\u09c7\u099f'
    }

    return rawTitle || 'Payment update'
  }

  const labels = customerNotificationTitleLabels[item.notification_type]
  if (labels) {
    return isBangla ? labels[0] : labels[1]
  }

  return rawTitle || getCustomerNotificationTypeLabel(item.notification_type, isBangla)
}

export function getCustomerNotificationLink(notification) {
  const metadata = notification?.metadata || {}
  const metadataLink = cleanPath(metadata.link)

  if (metadataLink) {
    return metadataLink
  }

  if (metadata.resource === 'orders' && metadata.resource_id) {
    return `/orders/${encodeURIComponent(metadata.order_number || metadata.resource_id)}`
  }

  if (metadata.order_number) {
    return `/orders/${encodeURIComponent(metadata.order_number)}`
  }

  if (metadata.prescription_id) {
    return `/prescriptions/${encodeURIComponent(metadata.prescription_id)}`
  }

  if (metadata.ticket_reference) {
    return `/support/${encodeURIComponent(metadata.ticket_reference)}`
  }

  const orderNumber = orderNumberFromText(notification?.title, notification?.message)
  if (orderNumber) {
    return `/orders/${encodeURIComponent(orderNumber)}`
  }

  if (String(notification?.notification_type || '').includes('prescription')) {
    return '/prescriptions'
  }

  if (String(notification?.notification_type || '').includes('support')) {
    return '/support'
  }

  return ''
}

export function getCustomerNotificationMessage(notification, isBangla = false) {
  const rawMessage = cleanEnglishMessage(String(notification?.message || ''))
  const supportSubject = supportSubjectFromText(notification)
  const orderNumber = orderNumberFromText(notification?.title, rawMessage)

  if (String(notification?.notification_type || '') === 'support_reply') {
    if (isBangla) {
      return supportSubject
        ? `আপনার '${supportSubject}' সাপোর্ট টিকিটে নতুন রিপ্লাই এসেছে।`
        : 'আপনার সাপোর্ট টিকিটে নতুন রিপ্লাই এসেছে।'
    }

    return supportSubject
      ? `You received a new reply on your support ticket: ${supportSubject}.`
      : 'You received a new reply on your support ticket.'
  }

  if (isBangla && orderNumber) {
    if (/payment for .* has been verified/i.test(rawMessage)) {
      return `\u0986\u09aa\u09a8\u09be\u09b0 ${orderNumber} \u0985\u09b0\u09cd\u09a1\u09be\u09b0\u09c7\u09b0 \u09aa\u09c7\u09ae\u09c7\u09a8\u09cd\u099f \u09af\u09be\u099a\u09be\u0987 \u09b9\u09af\u09bc\u09c7\u099b\u09c7\u0964`
    }

    const paymentStatus = rawMessage.match(/payment status is now ([a-z_]+)/i)?.[1]
    if (paymentStatus) {
      return `\u0986\u09aa\u09a8\u09be\u09b0 ${orderNumber} \u0985\u09b0\u09cd\u09a1\u09be\u09b0\u09c7\u09b0 \u09aa\u09c7\u09ae\u09c7\u09a8\u09cd\u099f \u09b8\u09cd\u099f\u09cd\u09af\u09be\u099f\u09be\u09b8 \u098f\u0996\u09a8 ${labelStatus(paymentStatus)}\u0964`
    }

    const orderStatus = rawMessage.match(/order .* is now ([a-z_]+)/i)?.[1]
    if (orderStatus) {
      return `\u0986\u09aa\u09a8\u09be\u09b0 ${orderNumber} \u0985\u09b0\u09cd\u09a1\u09be\u09b0 \u098f\u0996\u09a8 ${labelStatus(orderStatus)}\u0964`
    }

    if (/has been confirmed/i.test(rawMessage)) {
      return `\u0986\u09aa\u09a8\u09be\u09b0 ${orderNumber} \u0985\u09b0\u09cd\u09a1\u09be\u09b0 \u0995\u09a8\u09ab\u09be\u09b0\u09cd\u09ae \u09b9\u09af\u09bc\u09c7\u099b\u09c7\u0964`
    }

    if (/has been cancelled/i.test(rawMessage)) {
      return `\u0986\u09aa\u09a8\u09be\u09b0 ${orderNumber} \u0985\u09b0\u09cd\u09a1\u09be\u09b0 \u09ac\u09be\u09a4\u09bf\u09b2 \u09b9\u09af\u09bc\u09c7\u099b\u09c7\u0964`
    }

    if (/waiting for confirmation/i.test(rawMessage)) {
      return `\u0986\u09aa\u09a8\u09be\u09b0 ${orderNumber} \u0985\u09b0\u09cd\u09a1\u09be\u09b0 \u0995\u09a8\u09ab\u09be\u09b0\u09cd\u09ae\u09c7\u09b6\u09a8\u09c7\u09b0 \u0985\u09aa\u09c7\u0995\u09cd\u09b7\u09be\u09af\u09bc \u0986\u099b\u09c7\u0964`
    }
  }

  return rawMessage
}
