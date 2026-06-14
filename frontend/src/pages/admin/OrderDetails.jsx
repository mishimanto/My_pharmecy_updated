import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'
import { getDeliveryStatusLabel, getOrderStatusLabel, getPaymentStatusLabel } from '../../utils/statusLabels'

const statuses = ['pending_confirmation', 'prescription_review', 'confirmed', 'processing', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded']
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
  const [savingReview, setSavingReview] = useState(false)

  const load = () => {
    setLoading(true)
    adminApi.show('orders', id)
      .then((res) => {
        setOrder(res.data.data)
        setStatus(res.data.data.order_status)
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
  }, [order])

  const requiresPrescription = useMemo(
    () => Boolean(order?.prescription) || order?.items?.some((item) => item.product?.requires_prescription),
    [order],
  )

  const canConfirmPrescription = !requiresPrescription
    || (order?.prescription_match_status === 'matched' && order?.prescription?.status === 'approved')

  const updateStatus = async () => {
    if (!status || status === order.order_status) return

    const result = await Swal.fire({
      title: 'Update order status?',
      input: 'textarea',
      inputLabel: status === 'cancelled' ? 'Cancellation reason' : 'Admin note (optional)',
      inputPlaceholder: status === 'cancelled' ? 'Explain why this order is being cancelled' : 'Add a short note if needed',
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (status === 'cancelled' && !value.trim()) {
          return 'A cancellation reason is required.'
        }
        return undefined
      },
    })

    if (!result.isConfirmed) return

    try {
      const res = await adminApi.patch('orders', id, 'status', { order_status: status, note: result.value || '' })
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

  if (loading) return <p className="text-sm text-slate-600">Loading...</p>
  if (!order) return <p className="text-sm text-slate-600">Order not found.</p>

  return (
    <>
      <PageHeader title={order.order_number} subtitle={`${order.customer_name || 'Customer'} - ${date(order.order_date, 'en-US')}`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white">
            {order.items?.map((item) => (
              <div key={item.id} className="border-b border-slate-100 p-4 last:border-b-0">
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
                <div className="mt-3 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
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

          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <div><span className="font-semibold">Delivery area:</span> {order.delivery_area?.area_name || '-'}{order.delivery_area?.city ? `, ${order.delivery_area.city}` : ''}</div>
            <div className="mt-2"><span className="font-semibold">Shipping address:</span> {order.shipping_address || '-'}</div>
            {order.notes ? <div className="mt-2"><span className="font-semibold">Customer note:</span> {order.notes}</div> : null}
            {order.admin_note ? <div className="mt-2"><span className="font-semibold">Admin note:</span> {order.admin_note}</div> : null}
            {order.cancellation_reason ? <div className="mt-2 text-rose-700"><span className="font-semibold">Cancellation reason:</span> {order.cancellation_reason}</div> : null}
            {order.memo_number ? <div className="mt-2"><span className="font-semibold">Memo number:</span> {order.memo_number}</div> : null}
          </div>
        </section>

        <aside className="space-y-4">
          {requiresPrescription ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Prescription review</h2>
                  <p className="mt-1 text-sm text-slate-500">Match the uploaded prescription with the ordered RX medicines before confirmation.</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getMatchTone(order.prescription_match_status)}`}>
                  {matchLabels[order.prescription_match_status] || 'Pending match check'}
                </span>
              </div>

              {!canConfirmPrescription ? (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {getPrescriptionBlockMessage(order)}
                </div>
              ) : (
                <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  This RX order is ready for confirmation.
                </div>
              )}

              {order.prescription ? (
                <div className="mt-4 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">Linked prescription #{order.prescription.id}</p>
                      <p className="text-xs text-slate-500">Uploaded {date(order.prescription.uploaded_at || order.prescription.created_at, 'en-US')}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getPrescriptionTone(order.prescription.status)}`}>
                      {prescriptionLabels[order.prescription.status] || order.prescription.status}
                    </span>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div><span className="font-semibold">Patient:</span> {order.prescription.patient_name || '-'}</div>
                    <div><span className="font-semibold">Doctor:</span> {order.prescription.doctor_name || '-'}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {order.prescription.file_url ? (
                      <a href={order.prescription.file_url} target="_blank" rel="noreferrer" className="inline-flex text-emerald-700 underline">
                        View prescription file
                      </a>
                    ) : null}
                    <Link to={`/admin/prescriptions/${order.prescription.id}`} className="inline-flex text-slate-700 underline">
                      Open prescription details
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  No prescription is linked to this RX order yet.
                </div>
              )}

              {order.prescription_match_note ? (
                <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <span className="font-semibold">Latest review note:</span> {order.prescription_match_note}
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                <select
                  value={reviewForm.prescription_match_status}
                  onChange={(event) => setReviewForm((current) => ({ ...current, prescription_match_status: event.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="matched">Matched with ordered items</option>
                  <option value="mismatch">Prescription does not match</option>
                  <option value="need_clarification">Need clarification</option>
                </select>
                <textarea
                  value={reviewForm.prescription_match_note}
                  onChange={(event) => setReviewForm((current) => ({ ...current, prescription_match_note: event.target.value }))}
                  className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Add why it mismatches, what needs clarification, or any internal note."
                />
                <button
                  onClick={savePrescriptionReview}
                  disabled={!order.prescription || savingReview}
                  className="w-full rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
                >
                  {savingReview ? 'Saving...' : 'Save Prescription Review'}
                </button>
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-950">Status</h2>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              {statuses.map((item) => <option key={item} value={item}>{getOrderStatusLabel(item)}</option>)}
            </select>
            <button onClick={updateStatus} disabled={status === order.order_status} className="mt-3 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">
              Update Status
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h2 className="text-lg font-semibold text-slate-950">Summary</h2>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotal_amount)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{money(order.delivery_charge)}</span></div>
              {Number(order.discount_amount || 0) > 0 ? <div className="flex justify-between text-emerald-700"><span>Coupon discount</span><span>-{money(order.discount_amount)}</span></div> : null}
              <div className="flex justify-between font-semibold text-slate-950"><span>Total</span><span>{money(order.total_amount)}</span></div>
              <div className="pt-3 text-slate-600">Payment: {getPaymentStatusLabel(order.payment_status)} ({order.payment_method})</div>
              <div className="text-slate-600">Delivery: {getDeliveryStatusLabel(order.delivery?.delivery_status)}</div>
              {order.payment?.transaction_id ? <div className="text-slate-600">Transaction ID: {order.payment.transaction_id}</div> : null}
              {order.payment?.payment_proof_url ? <a href={order.payment.payment_proof_url} target="_blank" rel="noreferrer" className="inline-flex text-emerald-700 underline">View payment screenshot</a> : null}
              {order.payment?.reviewed_note ? <div className="text-slate-600">Payment note: {order.payment.reviewed_note}</div> : null}
            </div>
            {!order.delivery && ['confirmed', 'processing', 'packed', 'out_for_delivery'].includes(order.order_status) && (
              <button onClick={createDelivery} className="mt-4 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Create Delivery</button>
            )}
          </div>
        </aside>
      </div>
    </>
  )
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
    return 'Approve the linked prescription first. After that, mark whether it actually matches the ordered medicines.'
  }

  if (order.prescription_match_status !== 'matched') {
    return 'This order stays in prescription review until staff marks the linked prescription as matched with the ordered medicines.'
  }

  return 'This order is ready for confirmation.'
}
