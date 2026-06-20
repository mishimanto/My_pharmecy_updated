import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { FiAlertCircle } from 'react-icons/fi'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'
import { getDeliveryStatusLabel, getOrderStatusLabel, getPaymentStatusLabel } from '../../utils/statusLabels'

const orderStatuses = ['pending_confirmation', 'prescription_review', 'confirmed', 'processing', 'delivered', 'cancelled', 'returned', 'refunded']
const statusTransitions = {
  pending_confirmation: ['confirmed', 'cancelled'],
  prescription_review: ['pending_confirmation', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['delivered'],
  delivered: ['returned', 'refunded'],
  returned: ['refunded'],
  cancelled: [],
  refunded: [],
}
const statusTones = {
  pending_confirmation: 'text-amber-600',
  prescription_review: 'text-violet-600',
  confirmed: 'text-sky-600',
  processing: 'text-blue-600',
  delivered: 'text-emerald-600',
  cancelled: 'text-rose-600',
  returned: 'text-orange-600',
  refunded: 'text-slate-600',
}
const paymentStatusStyles = {
  awaiting_proof: 'border-amber-200 bg-amber-50 text-amber-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  under_review: 'border-sky-200 bg-sky-50 text-sky-700',
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  failed: 'border-rose-200 bg-rose-50 text-rose-700',
  cancelled: 'border-slate-200 bg-slate-50 text-slate-600',
  refunded: 'border-violet-200 bg-violet-50 text-violet-700',
}
const deliveryStatusStyles = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  delivered: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  failed: 'border-rose-200 bg-rose-50 text-rose-700',
  returned: 'border-orange-200 bg-orange-50 text-orange-700',
}
const metricStyles = {
  status: {
    panel: 'border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#d1fae5_100%)] shadow-[0_18px_45px_-34px_rgba(16,185,129,0.9)]',
    bubble: 'from-white/80 via-emerald-100 to-emerald-300/80 shadow-[-14px_18px_34px_-24px_rgba(5,150,105,0.9),inset_12px_-12px_24px_rgba(5,150,105,0.22),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
  },
  payment: {
    panel: 'border-sky-200 bg-[linear-gradient(135deg,#f0f9ff_0%,#dbeafe_100%)] shadow-[0_18px_45px_-34px_rgba(14,165,233,0.9)]',
    bubble: 'from-white/80 via-sky-100 to-sky-300/80 shadow-[-14px_18px_34px_-24px_rgba(2,132,199,0.9),inset_12px_-12px_24px_rgba(2,132,199,0.22),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
  },
  total: {
    panel: 'border-violet-200 bg-[linear-gradient(135deg,#f5f3ff_0%,#ede9fe_100%)] shadow-[0_18px_45px_-34px_rgba(139,92,246,0.9)]',
    bubble: 'from-white/80 via-violet-100 to-violet-300/80 shadow-[-14px_18px_34px_-24px_rgba(124,58,237,0.9),inset_12px_-12px_24px_rgba(124,58,237,0.22),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
  },
  prescription: {
    panel: 'border-amber-200 bg-[linear-gradient(135deg,#fffbeb_0%,#fef3c7_100%)] shadow-[0_18px_45px_-34px_rgba(245,158,11,0.9)]',
    bubble: 'from-white/80 via-amber-100 to-amber-300/80 shadow-[-14px_18px_34px_-24px_rgba(217,119,6,0.9),inset_12px_-12px_24px_rgba(217,119,6,0.22),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
  },
}
const prescriptionLabels = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  need_clarification: 'Needs clarification',
}
const matchLabels = {
  pending: 'Pending match check',
  matched: 'Matched',
  mismatch: 'Mismatch',
  need_clarification: 'Need clarification',
}

export default function OrderDetails() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [reviewForm, setReviewForm] = useState({ prescription_match_status: 'matched', prescription_match_note: '' })
  const [emergencyForm, setEmergencyForm] = useState({ order_status: '', note: '' })
  const [savingReview, setSavingReview] = useState(false)
  const [savingEmergency, setSavingEmergency] = useState(false)

  const load = () => {
    setLoading(true)
    adminApi.show('orders', id)
      .then((res) => {
        setOrder(res.data.data)
        setStatus(res.data.data.order_status)
        setEmergencyForm({ order_status: res.data.data.order_status, note: '' })
      })
      .catch(() => toast.error('Unable to load order details.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  useEffect(() => {
    if (!order) return

    setReviewForm({
      prescription_match_status: ['matched', 'mismatch', 'need_clarification'].includes(order.prescription_match_status)
        ? order.prescription_match_status
        : 'matched',
      prescription_match_note: order.prescription_match_note || '',
    })
    setEmergencyForm((current) => ({ ...current, order_status: order.order_status }))
  }, [order])

  const requiresPrescription = useMemo(
    () => Boolean(order?.prescription) || order?.items?.some((item) => item.product?.requires_prescription),
    [order],
  )

  const canConfirmPrescription = !requiresPrescription
    || (order?.prescription_match_status === 'matched' && order?.prescription?.status === 'approved')
  const hasPendingPrescriptionReview = order?.prescription?.status === 'pending'
  const requiresPaidVerification = ['BKASH', 'NAGAD'].includes(String(order?.payment_method || '').toUpperCase())
  const canConfirmPayment = !requiresPaidVerification || order?.payment_status === 'paid'
  const canConfirmOrder = canConfirmPrescription && canConfirmPayment

  const nextStatuses = useMemo(() => {
    const allowed = statusTransitions[order?.order_status] || []

    if (requiresPrescription && !canConfirmPrescription) {
      return []
    }

    return allowed.filter((item) => {
      if (requiresPrescription && order?.order_status === 'prescription_review' && item !== 'pending_confirmation') return false
      if (item === 'confirmed' && !canConfirmOrder) return false
      if (item === 'delivered' && !canMarkOrderDelivered(order)) return false
      return true
    })
  }, [canConfirmOrder, canConfirmPrescription, order, requiresPrescription])

  const selectableStatuses = useMemo(
    () => [order?.order_status, ...nextStatuses].filter(Boolean),
    [nextStatuses, order?.order_status],
  )
  const quickNextStatus = nextStatuses[0] || ''
  const deliveryFlowMessage = useMemo(() => getOrderDeliveryFlowMessage(order), [order])

  const updateStatus = async (targetStatus = status) => {
    if (!targetStatus || targetStatus === order.order_status) return

    const result = await Swal.fire({
      title: 'Update order status?',
      input: 'textarea',
      inputLabel: targetStatus === 'cancelled' ? 'Cancellation reason' : 'Admin note (optional)',
      inputPlaceholder: targetStatus === 'cancelled' ? 'Explain why this order is being cancelled' : 'Add a short note if needed',
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (targetStatus === 'cancelled' && !value.trim()) {
          return 'A cancellation reason is required.'
        }
        return undefined
      },
    })

    if (!result.isConfirmed) return

    try {
      const res = await adminApi.patch('orders', id, 'status', { order_status: targetStatus, note: result.value || '' })
      setOrder(res.data.data)
      setStatus(res.data.data.order_status)
      toast.success('Order status updated.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update order status.')
    }
  }

  const savePrescriptionReview = async () => {
    if (!order?.prescription) return
    if (['mismatch', 'need_clarification'].includes(reviewForm.prescription_match_status) && !reviewForm.prescription_match_note.trim()) {
      toast.error('Add a note for mismatch or clarification.')
      return
    }

    const result = await Swal.fire({
      title: 'Save prescription match review?',
      text: 'This will update the RX verification state for this order.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
    })

    if (!result.isConfirmed) return

    setSavingReview(true)
    try {
      const res = await adminApi.reviewOrderPrescriptionMatch(id, reviewForm)
      setOrder(res.data.data)
      setStatus(res.data.data.order_status)
      toast.success('Prescription review saved.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save prescription review.')
    } finally {
      setSavingReview(false)
    }
  }

  const createDelivery = async () => {
    const result = await Swal.fire({
      title: 'Create a delivery?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Create',
      cancelButtonText: 'Cancel',
    })
    if (!result.isConfirmed) return
    try {
      await adminApi.createOrderDelivery(id)
      load()
      toast.success('Delivery created.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create delivery.')
    }
  }

  const saveEmergencyCorrection = async () => {
    if (!emergencyForm.order_status || emergencyForm.order_status === order.order_status) {
      toast.error('Choose a different status.')
      return
    }

    if (!emergencyForm.note.trim()) {
      toast.error('Add a reason for emergency correction.')
      return
    }

    const result = await Swal.fire({
      title: 'Apply emergency correction?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Apply Correction',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    })

    if (!result.isConfirmed) return

    setSavingEmergency(true)
    try {
      const res = await adminApi.patch('orders', id, 'force-status', emergencyForm)
      setOrder(res.data.data)
      setStatus(res.data.data.order_status)
      setEmergencyForm({ order_status: res.data.data.order_status, note: '' })
      toast.success('Emergency correction saved.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save emergency correction.')
    } finally {
      setSavingEmergency(false)
    }
  }

  if (loading) return <AdminLoadingState className="py-8" />
  if (!order) return <p className="text-sm text-slate-600">Order not found.</p>

  return (
    <>
      <PageHeader title={order.order_number} subtitle={`${order.customer_name || 'Customer'} - ${date(order.order_date, 'en-US')}`} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Order status" value={getOrderStatusLabel(order.order_status)} tone={statusTones[order.order_status]} variant="status" />
        <Metric label="Payment" value={getPaymentStatusLabel(order.payment_status)} tone={getPaymentStatusTextColor(order.payment_status)} variant="payment" />
        <Metric label="Total" value={money(order.total_amount)} variant="total" />
        <Metric label="Prescription" value={requiresPrescription ? 'Review required' : 'Not required'} tone={requiresPrescription ? 'text-violet-600' : 'text-emerald-600'} variant="prescription" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <section className="space-y-6">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-300 bg-slate-50/70 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-950">Ordered medicines</h2>
            </div>
            {order.items?.map((item) => (
              <div key={item.id} className="border-b border-slate-300 p-5 last:border-b-0">
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{item.product?.product_name}</p>
                      {item.product?.requires_prescription ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                          Prescription Required
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-500">{item.product?.generic_name} {item.product?.strength}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {item.quantity} {item.purchase_unit || 'piece'} x {money(item.unit_price)} ({item.piece_quantity || item.quantity} pieces)
                    </p>
                  </div>
                  <p className="font-semibold text-slate-950">{money(item.subtotal)}</p>
                </div>
                <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                  {item.batches?.map((allocation) => (
                    <div key={allocation.id} className="flex justify-between">
                      <span>{allocation.batch?.batch_number}</span>
                      <span>{allocation.quantity} pieces allocated</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {requiresPrescription ? (
            <div className="overflow-hidden rounded-lg border border-violet-200 bg-violet-50/40 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-violet-100 bg-white/80 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Prescription review</h2>
                  
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getMatchTone(order.prescription_match_status)}`}>
                  {matchLabels[order.prescription_match_status] || 'Pending match check'}
                </span>
              </div>

              <div className="p-5">
                {!canConfirmPrescription ? (
                  <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-800">
                    <FiAlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{getPrescriptionBlockMessage(order)}</span>
                  </div>
                ) : (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                    This RX order is ready for confirmation.
                  </div>
                )}

                {order.prescription ? (
                  <div className="mt-4 rounded-md border border-slate-200 bg-white">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-950">{order.prescription.prescription_code || `Linked prescription #${order.prescription.id}`}</p>
                        <p className="mt-1 text-xs text-slate-500">Uploaded {date(order.prescription.uploaded_at || order.prescription.created_at, 'en-US')}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getPrescriptionTone(order.prescription.status)}`}>
                        {prescriptionLabels[order.prescription.status] || order.prescription.status}
                      </span>
                    </div>
                    <div className="grid gap-3 px-4 py-3 text-sm text-slate-700 sm:grid-cols-2">
                      <Info label="Patient" value={order.prescription.patient_name || '-'} />
                      <Info label="Doctor" value={order.prescription.doctor_name || '-'} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-4 py-3">
                      {hasPendingPrescriptionReview ? (
                        <Link to={`/admin/prescriptions/${order.prescription.id}`} className="inline-flex items-center justify-center rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800 transition hover:border-amber-300 hover:bg-amber-100">
                          Review prescription
                        </Link>
                      ) : null}
                      {order.prescription.file_url ? (
                        <a href={order.prescription.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300">
                          View file
                        </a>
                      ) : null}
                      <Link to={`/admin/prescriptions/${order.prescription.id}`} className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
                        Open details
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                    No prescription is linked to this RX order yet.
                  </div>
                )}

                {order.prescription_match_note ? (
                  <div className="mt-4 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
                    <span className="font-semibold text-slate-950">Latest review note:</span> {order.prescription_match_note}
                  </div>
                ) : null}

                <div className="mt-5 grid gap-3 border-t border-violet-100 pt-5 lg:grid-cols-[240px_minmax(0,1fr)]">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Match decision</label>
                    <select
                      value={reviewForm.prescription_match_status}
                      onChange={(event) => setReviewForm((current) => ({ ...current, prescription_match_status: event.target.value }))}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="matched">Matched with ordered items</option>
                      <option value="mismatch">Prescription does not match</option>
                      <option value="need_clarification">Need clarification</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Internal note</label>
                    <textarea
                      value={reviewForm.prescription_match_note}
                      onChange={(event) => setReviewForm((current) => ({ ...current, prescription_match_note: event.target.value }))}
                      className="min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="Add why it mismatches, what needs clarification, or any internal note."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={savePrescriptionReview}
                    disabled={!order.prescription || savingReview}
                    className="w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 lg:col-span-2"
                  >
                    {savingReview ? 'Saving...' : 'Save Prescription Review'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm shadow-sm">
            <div className="border-b border-slate-300 pb-4">
              <h2 className="text-base font-semibold text-slate-950">Customer and delivery info</h2>
            </div>
            <div className="mt-4 grid gap-4 text-slate-700 sm:grid-cols-2">
              <Info label="Customer" value={order.customer_name || '-'} />
              <Info label="Phone" value={order.customer_phone || '-'} />
              <Info label="Delivery area" value={`${order.delivery_area?.area_name || '-'}${order.delivery_area?.city ? `, ${order.delivery_area.city}` : ''}`} />
              <Info label="Shipping address" value={order.shipping_address || '-'} />
            </div>
            {order.delivery ? (
              <div className="mt-4 bg-emerald-50 p-3 text-sm text-emerald-900">
                <span className="font-semibold">Delivery number:</span>{' '}
                <Link to={`/admin/deliveries/${order.delivery.id}`} className="font-semibold underline">
                  {order.delivery.tracking_no || `Delivery #${order.delivery.id}`}
                </Link>
              </div>
            ) : null}
            {order.notes ? <Note label="Customer note" value={order.notes} /> : null}
            {order.memo_number ? <Note label="Invoice number" value={order.memo_number} /> : null}
          </div>

          {(order.admin_note || order.cancellation_reason) ? (
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm shadow-sm">
              <div className="border-b border-slate-300 pb-4">
                <h2 className="text-base font-semibold text-slate-950">Internal notes</h2>
                <p className="mt-1 text-xs text-slate-500">Staff-only notes and correction history for operational context.</p>
              </div>
              {order.admin_note ? <Note label="Admin note" value={order.admin_note} /> : null}
              {order.cancellation_reason ? <Note label="Cancellation reason" value={order.cancellation_reason} tone="text-rose-700" /> : null}
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-300 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Order status</h2>
              </div>
              <span className={`shrink-0 text-xs font-semibold ${statusTones[order.order_status] || 'text-slate-600'}`}>
                {getOrderStatusLabel(order.order_status)}
              </span>
            </div>

            {!canConfirmOrder ? (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {getConfirmationBlockMessage(order, {
                  canConfirmPrescription,
                  canConfirmPayment,
                  requiresPaidVerification,
                })}
              </div>
            ) : null}

            {deliveryFlowMessage ? (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span>{deliveryFlowMessage}</span>
                  {order.delivery ? (
                    <Link to={`/admin/deliveries/${order.delivery.id}`} className="font-semibold text-amber-900 underline">
                      Open delivery
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}

            {nextStatuses.length ? (
              <>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Update status</label>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100">
                    {selectableStatuses.map((item) => <option key={item} value={item}>{getOrderStatusLabel(item)}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => updateStatus(quickNextStatus)}
                    disabled={!quickNextStatus}
                    className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
                  >
                    {quickNextStatus ? getOrderStatusLabel(quickNextStatus) : 'No next step'}
                  </button>
                </div>
                <button onClick={() => updateStatus()} disabled={status === order.order_status} className="mt-3 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">
                  Update Status
                </button>
              </>
            ) : (
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                {requiresPrescription && !canConfirmPrescription
                  ? 'Complete prescription review before updating this order status.'
                  : deliveryFlowMessage
                  ? 'This order is waiting for the delivery step before the next status can be used.'
                  : 'This order is in a final state. No further status action is available.'}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm shadow-sm">
            <div className="border-b border-slate-300 pb-4">
              <h2 className="text-lg font-semibold text-slate-950">Payment summary</h2>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-medium text-slate-900">{money(order.subtotal_amount)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Delivery</span><span className="font-medium text-slate-900">{money(order.delivery_charge)}</span></div>
              {Number(order.discount_amount || 0) > 0 ? <div className="flex justify-between text-emerald-700"><span>Coupon discount</span><span className="font-medium">-{money(order.discount_amount)}</span></div> : null}
              <div className="flex justify-between border-y border-slate-200 py-3 text-base font-semibold text-slate-950"><span>Total</span><span>{money(order.total_amount)}</span></div>
              <StatusSummaryRow
                label="Status"
                value={getPaymentStatusLabel(order.payment_status)}
                className={paymentStatusStyles[order.payment_status]}
                action={order.payment && order.payment_status === 'under_review' ? (
                  <Link
                    to={`/admin/payments?search=${encodeURIComponent(order.payment.transaction_id || order.order_number)}`}
                    className="font-semibold text-sky-800 underline"
                  >
                    Review payment
                  </Link>
                ) : null}
              />
              <div className="flex items-center justify-between gap-3 bg-slate-100 px-3 py-2 text-slate-600">
                <span>Method</span>
                <span className="font-semibold text-slate-900">{getPaymentMethodLabel(order.payment_method)}</span>
              </div>
              {order.payment?.payment_proof_url ? <a href={order.payment.payment_proof_url} target="_blank" rel="noreferrer" className="inline-flex text-emerald-700 underline">View payment screenshot</a> : null}
              {order.payment?.reviewed_note ? <div className="border border-slate-100 bg-slate-50 p-3 text-slate-600">Payment note: <span className="font-medium text-slate-900">{order.payment.reviewed_note}</span></div> : null}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm shadow-sm">
            <div className="border-b border-slate-300 pb-4">
              <h2 className="text-lg font-semibold text-slate-950">Delivery summary</h2>
            </div>
            <div className="mt-4 space-y-3">
              <StatusSummaryRow label="Delivery" value={getDeliveryStatusLabel(order.delivery?.delivery_status)} className={deliveryStatusStyles[order.delivery?.delivery_status]} />
              {order.delivery ? (
                <div className="bg-emerald-50 p-3 text-slate-700">
                  Delivery number:{' '}
                  <Link to={`/admin/deliveries/${order.delivery.id}`} className="font-semibold text-emerald-800 underline">
                    {order.delivery.tracking_no || `Delivery #${order.delivery.id}`}
                  </Link>
                </div>
              ) : (
                <div className="border border-slate-200 bg-slate-50 p-3 text-slate-600">
                  No delivery has been created for this order yet.
                </div>
              )}
            </div>
            {!order.delivery && ['confirmed', 'processing'].includes(order.order_status) && (
              <button onClick={createDelivery} className="mt-4 w-full rounded-md bg-emerald-600 px-4 py-3 text-md font-semibold text-white">Create Delivery</button>
            )}
          </div>

          <div className="rounded-lg border border-rose-200 bg-[linear-gradient(135deg,#fff1f2_0%,#ffe4e6_100%)] p-5 shadow-sm">
            <div className="border-b border-rose-200/70 pb-4">
              <h2 className="text-lg font-semibold text-rose-950">Emergency correction</h2>
            </div>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">Update status</label>
            <select
              value={emergencyForm.order_status}
              onChange={(event) => setEmergencyForm((current) => ({ ...current, order_status: event.target.value }))}
              className="mt-2 w-full rounded-md border border-rose-200 bg-white px-3 py-2 text-sm shadow-xs focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
            >
              {orderStatuses.map((item) => <option key={item} value={item}>{getOrderStatusLabel(item)}</option>)}
            </select>
            <textarea
              value={emergencyForm.note}
              onChange={(event) => setEmergencyForm((current) => ({ ...current, note: event.target.value }))}
              className="mt-3 min-h-24 w-full rounded-md border border-rose-200 bg-white px-3 py-2 text-sm shadow-xs focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
              placeholder="Required: explain what happened and why this correction is needed."
            />
            <button
              type="button"
              onClick={saveEmergencyCorrection}
              disabled={savingEmergency || emergencyForm.order_status === order.order_status}
              className="mt-3 w-full rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
            >
              {savingEmergency ? 'Saving...' : 'Apply Correction'}
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}

function Metric({ label, value, tone = 'text-slate-950', variant = 'status' }) {
  const style = metricStyles[variant] || metricStyles.status

  return (
    <div className={`relative overflow-hidden rounded-lg border p-4 ${style.panel}`}>
      <span className={`pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-linear-to-br ${style.bubble}`}>
        <span className="absolute left-5 top-5 h-5 w-5 rounded-full bg-white/70 blur-[1px]" />
      </span>
      <p className="relative text-xs font-medium text-slate-500">{label}</p>
      <p className={`relative mt-2 text-base font-semibold ${tone}`}>{value}</p>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 font-medium text-slate-800">{value}</p>
    </div>
  )
}

function Note({ label, value, tone = 'text-slate-700' }) {
  return (
    <div className={`mt-3 bg-slate-100 p-3 text-sm ${tone}`}>
      <span className="font-semibold">{label}:</span> {value}
    </div>
  )
}

function StatusSummaryRow({ label, value, action = null, className = 'border-slate-200 bg-slate-50 text-slate-700' }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-3 py-2 ${className}`}>
      <span className="text-slate-600">{label}</span>
      <div className="flex items-center gap-3">
        {action}
        <span className="font-semibold">{value}</span>
      </div>
    </div>
  )
}

function getPaymentMethodLabel(method) {
  const normalized = String(method || '').toUpperCase()
  const labels = {
    COD: 'Cash on delivery',
    BKASH: 'bKash',
    NAGAD: 'Nagad',
    NOGOD: 'Nagad',
  }

  return labels[normalized] || method || '-'
}

function getPaymentStatusTextColor(status) {
  const colors = {
    awaiting_proof: 'text-amber-700',
    pending: 'text-amber-700',
    under_review: 'text-sky-700',
    paid: 'text-emerald-700',
    failed: 'text-rose-700',
    cancelled: 'text-slate-600',
    refunded: 'text-violet-700',
  }

  return colors[status] || 'text-slate-950'
}

function canMarkOrderDelivered(order) {
  if (!order?.delivery) return false

  return ['pending', 'delivered'].includes(order.delivery?.delivery_status)
}

function getOrderDeliveryFlowMessage(order) {
  if (!order) return ''

  if (order.order_status === 'processing') {
    if (!order.delivery) return 'Create a delivery record before marking this order delivered.'
    if (!canMarkOrderDelivered(order)) return 'Keep the delivery active before marking this order delivered.'
  }

  return ''
}

function getConfirmationBlockMessage(order, flags) {
  if (flags.requiresPaidVerification && !flags.canConfirmPayment) {
    return 'Order confirmation is pending payment verification.'
  }

  if (!flags.canConfirmPrescription) {
    return getPrescriptionBlockMessage(order)
  }

  return 'This order is not ready for confirmation yet.'
}

function getPrescriptionTone(status) {
  if (status === 'approved') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (status === 'rejected') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  if (status === 'need_clarification') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border-sky-200 bg-sky-50 text-sky-700'
}

function getMatchTone(status) {
  if (status === 'matched') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (status === 'mismatch') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  if (status === 'need_clarification') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border-sky-200 bg-sky-50 text-sky-700'
}

function getPrescriptionBlockMessage(order) {
  if (!order?.prescription) {
    return 'Link an uploaded prescription to this order before moving it forward.'
  }

  if (order.prescription?.status !== 'approved') {
    return 'Approve prescription first.'
  }

  if (order.prescription_match_status !== 'matched') {
    return 'Mark the prescription as matched first.'
  }

  return 'This order is ready for confirmation.'
}
