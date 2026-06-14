function humanizeStatus(status) {
  if (!status) return '-'

  return String(status)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function getOrderStatusLabel(status, isBangla = false) {
  const labels = {
    pending_confirmation: isBangla ? 'পেন্ডিং' : 'Pending',
    prescription_review: isBangla ? 'প্রেসক্রিপশন রিভিউ' : 'Prescription Review',
    confirmed: isBangla ? 'কনফার্মড' : 'Confirmed',
    processing: isBangla ? 'প্রসেসিং' : 'Processing',
    packed: isBangla ? 'প্যাকড' : 'Packed',
    out_for_delivery: isBangla ? 'ডেলিভারির পথে' : 'Out for Delivery',
    delivered: isBangla ? 'ডেলিভারড' : 'Delivered',
    cancelled: isBangla ? 'বাতিল' : 'Cancelled',
    returned: isBangla ? 'রিটার্নড' : 'Returned',
    refunded: isBangla ? 'রিফান্ডেড' : 'Refunded',
    pending: isBangla ? 'পেন্ডিং' : 'Pending',
  }

  return labels[status] || humanizeStatus(status)
}

export function getPaymentStatusLabel(status, isBangla = false) {
  const labels = {
    awaiting_proof: isBangla ? 'আনপেইড' : 'Unpaid',
    pending: isBangla ? 'পেন্ডিং' : 'Pending',
    under_review: isBangla ? 'রিভিউ হচ্ছে' : 'Under Review',
    paid: isBangla ? 'পেইড' : 'Paid',
    failed: isBangla ? 'ফেইলড' : 'Failed',
    cancelled: isBangla ? 'বাতিল' : 'Cancelled',
    refunded: isBangla ? 'রিফান্ডেড' : 'Refunded',
  }

  return labels[status] || humanizeStatus(status)
}

export function getDeliveryStatusLabel(status, isBangla = false) {
  const labels = {
    pending: isBangla ? 'পেন্ডিং' : 'Pending',
    assigned: isBangla ? 'অ্যাসাইন্ড' : 'Assigned',
    picked: isBangla ? 'পিকড' : 'Picked',
    picked_up: isBangla ? 'পিকড আপ' : 'Picked Up',
    out_for_delivery: isBangla ? 'ডেলিভারির পথে' : 'Out for Delivery',
    delivered: isBangla ? 'ডেলিভারড' : 'Delivered',
    failed: isBangla ? 'ফেইলড' : 'Failed',
    returned: isBangla ? 'রিটার্নড' : 'Returned',
  }

  return labels[status] || (status ? humanizeStatus(status) : (isBangla ? 'এখনও তৈরি হয়নি' : 'Not created'))
}
