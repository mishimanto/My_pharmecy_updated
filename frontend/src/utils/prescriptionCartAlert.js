import Swal from 'sweetalert2'

export function requiresPrescriptionLogin(product, customer) {
  return Boolean(product?.requires_prescription && !customer)
}

export async function showPrescriptionLoginRequiredAlert(isBangla) {
  await Swal.fire({
    icon: 'info',
    title: isBangla ? 'প্রেসক্রিপশন প্রয়োজন' : 'Prescription required',
    text: isBangla
      ? 'এই পণ্যটি অর্ডার করতে আগে লগইন করে প্রেসক্রিপশন আপলোড বা সিলেক্ট করতে হবে।'
      : 'Please login first, then upload or select a prescription before ordering this product.',
    confirmButtonText: isBangla ? 'ঠিক আছে' : 'OK',
    confirmButtonColor: '#0f172a',
  })
}

export function isPrescriptionLoginRequiredError(error) {
  return error?.response?.status === 403
    && String(error?.response?.data?.message || '').toLowerCase().includes('prescription')
}
