import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiEye,
  FiFileText,
  FiHash,
  FiPhone,
  FiShoppingBag,
  FiUser,
  FiXCircle,
} from 'react-icons/fi'
import { FaUserDoctor } from "react-icons/fa6";
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import { adminApi } from '../../api/adminApi'
import { date } from '../../utils/formatters'

const labels = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  need_clarification: 'Needs Clarification',
}

const statusMeta = {
  pending: {
    label: 'Pending',
    chip: 'border-amber-200 bg-amber-50 text-amber-700',
    accent: 'bg-amber-500',
    soft: 'bg-amber-50 text-amber-700',
    icon: FiClock,
  },
  approved: {
    label: 'Approved',
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    accent: 'bg-emerald-500',
    soft: 'bg-emerald-50 text-emerald-700',
    icon: FiCheckCircle,
  },
  rejected: {
    label: 'Rejected',
    chip: 'border-rose-200 bg-rose-50 text-rose-700',
    accent: 'bg-rose-500',
    soft: 'bg-rose-50 text-rose-700',
    icon: FiXCircle,
  },
  need_clarification: {
    label: 'Needs Clarification',
    chip: 'border-violet-200 bg-violet-50 text-violet-700',
    accent: 'bg-violet-500',
    soft: 'bg-violet-50 text-violet-700',
    icon: FiAlertCircle,
  },
}

const matchLabels = {
  matched: 'Matched with order items',
  mismatch: 'Prescription mismatch',
  need_clarification: 'Needs clarification',
}

const reviewOptions = ['approved', 'rejected', 'need_clarification']

function SummaryTile({ label, value, icon: Icon }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <p className="wrap-break-word text-sm font-semibold text-slate-950">{value || '-'}</p>
        </div>
      </div>
    </div>
  )
}

function SectionCard({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function PreviewPanel({ fileUrl, prescriptionTitle }) {
  const extension = useMemo(() => {
    const cleanUrl = (fileUrl || '').split('?')[0].toLowerCase()
    return cleanUrl.split('.').pop() || ''
  }, [fileUrl])

  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)
  const isPdf = extension === 'pdf'

  if (!fileUrl) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-2lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        No prescription file is available.
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden border border-slate-200 bg-slate-950">
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className="absolute inset-0 z-10"
        aria-label={`Open ${prescriptionTitle}`}
      />

      {isImage ? (
        <div className="aspect-[4/5] min-h-[420px] bg-slate-950 pt-16">
          <img src={fileUrl} alt={prescriptionTitle} className="h-full w-full object-contain" />
        </div>
      ) : isPdf ? (
        <div className="min-h-[520px] bg-white pt-16">
          <iframe title={prescriptionTitle} src={fileUrl} className="h-[520px] w-full border-0" />
        </div>
      ) : (
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 px-6 pt-16 text-center text-white">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-white/10">
            <FiFileText className="h-8 w-8" />
          </span>
          <div>
            <p className="text-base font-semibold">Preview is not available for this file type.</p>
            <p className="mt-2 text-sm text-slate-300">Click anywhere on this panel to open the prescription file.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PrescriptionDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [prescription, setPrescription] = useState(null)
  const [form, setForm] = useState({ review_status: 'approved', review_note: '' })

  useEffect(() => {
    adminApi.show('prescriptions', id).then(({ data }) => setPrescription(data.data)).catch(() => toast.error('Prescription not found.'))
  }, [id])

  useEffect(() => {
    if (!prescription) return

    setForm((current) => ({
      review_status: reviewOptions.includes(prescription.status) ? prescription.status : current.review_status,
      review_note: current.review_note,
    }))
  }, [prescription])

  const submit = async (event) => {
    event.preventDefault()
    const result = await Swal.fire({ title: 'Save this review?', showCancelButton: true, confirmButtonText: 'Save', cancelButtonText: 'Cancel' })
    if (!result.isConfirmed) return

    try {
      await adminApi.reviewPrescription(id, form)
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('admin_prescriptions_payload_v1')
      }
      toast.success('Review saved.')
      navigate('/admin/prescriptions')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save the review.')
    }
  }

  if (!prescription) return <AdminLoadingState className="py-8" />

  const prescriptionTitle = prescription.prescription_code || `Prescription #${prescription.id}`
  const customerName = prescription.user?.full_name || 'Guest customer'
  const status = statusMeta[prescription.status] || statusMeta.pending
  const StatusIcon = status.icon

  return (
    <>
      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_360px]">
        <div className="space-y-5 2xl:col-span-2">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">                
                <h2 className="text-xl font-semibold text-slate-950">{prescriptionTitle}</h2>                
              </div>
              
            </div>

            <div className="grid gap-3 border-t border-slate-200 px-5 py-5 md:grid-cols-2 xl:grid-cols-3">
              <SummaryTile label="Prescription Code" value={prescriptionTitle} icon={FiHash} />
              <SummaryTile label="Customer" value={customerName} icon={FiUser} />
              <SummaryTile label="Phone" value={prescription.user?.phone || '-'} icon={FiPhone} />
            </div>
            <div className="grid gap-3 border-t border-slate-200 px-5 py-5 md:grid-cols-2 xl:grid-cols-3">
              <SummaryTile label="Patient" value={prescription.patient_name || '-'} icon={FiUser} />
              <SummaryTile label="Doctor" value={prescription.doctor_name || '-'} icon={FaUserDoctor} />
              <SummaryTile label="Uploaded" value={date(prescription.uploaded_at || prescription.created_at, 'en-US')} icon={FiClock} />
            </div>
            <div className="px-5 pb-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Notes</p>
              <div className="mt-1 rounded-sm shadow-md border border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-700">
                {prescription.notes || 'No notes were added with this prescription.'}
              </div>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <SectionCard
              title="Prescription Preview"
              action={prescription.file_url ? (
                <a
                  href={prescription.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
                >
                  <FiExternalLink className="h-4 w-4" />
                  Open file
                </a>
              ) : null}
            >
              <PreviewPanel fileUrl={prescription.file_url} prescriptionTitle={prescriptionTitle} />
            </SectionCard>

            <SectionCard
              title="Linked Order"
              action={prescription.order ? (
                <Link
                  to={`/admin/orders/${prescription.order.id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                >
                  <FiShoppingBag className="h-4 w-4" />
                  Open order
                </Link>
              ) : null}
            >
              {prescription.order ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Order Number</p>
                        <p className="mt-1 text-base font-semibold text-slate-950">{prescription.order.order_number}</p>
                      </div>
                      {prescription.order.prescription_match_status ? (
                        <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                          {matchLabels[prescription.order.prescription_match_status] || prescription.order.prescription_match_status}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Ordered Medicines</p>
                    <div className="mt-3 space-y-3">
                      {prescription.order.items?.length ? (
                        prescription.order.items.map((item) => (
                          <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-950">
                                  {item.product?.product_name || item.product?.generic_name || 'Medicine item'}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Quantity {item.quantity ?? 0}
                                  {item.piece_quantity ? ` | ${item.piece_quantity} pieces` : ''}
                                </p>
                              </div>
                              <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                RX linked item
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                          No order items are attached to this prescription yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No order is linked to this prescription yet.
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard
            title="Review History"
          >
            {(prescription.reviews || []).length ? (
              <div className="space-y-3">
                {prescription.reviews.map((review) => {
                  const reviewStatus = statusMeta[review.review_status] || statusMeta.pending

                  return (
                    <div key={review.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${reviewStatus.chip}`}>
                            {labels[review.review_status] || review.review_status}
                          </span>
                          <p className="mt-3 text-sm leading-6 text-slate-700">{review.review_note || 'No note added for this review.'}</p>
                        </div>
                        <div className="shrink-0 text-xs text-slate-500 lg:text-right">
                          <p>by <span className="font-semibold text-slate-700">{review.reviewer?.full_name || 'Pharmacist'}</span></p>
                          <p className="mt-1">{date(review.reviewed_at, 'en-US')}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No review history is available for this prescription yet.
              </div>
            )}
          </SectionCard>
        </div>

        <form className="self-start rounded-lg border border-slate-200 bg-white shadow-sm 2xl:sticky 2xl:top-5" onSubmit={submit}>
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base text-center font-semibold text-slate-950">Review Status</h2>
          </div>

          <div className="space-y-5 p-5">
            <div className={`rounded-lg border p-3 ${status.chip}`}>
              <div className="flex items-center gap-1">
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg ${status.soft}`}>
                  <StatusIcon className="h-4 w-4" />
                </span>
                <div className="inline-flex flex-row gap-2">
                  <p className="text-sm font-semibold tracking-[0.14em]">Current Status: </p>
                  <p className="text-sm font-semibold uppercase">{labels[prescription.status] || prescription.status}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Review decision</label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                value={form.review_status}
                onChange={(e) => setForm({ ...form, review_status: e.target.value })}
              >
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
                <option value="need_clarification">Needs Clarification</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Internal note</label>
              <textarea
                className="min-h-40 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                placeholder="Add why this prescription is approved, rejected, or needs clarification."
                value={form.review_note}
                onChange={(e) => setForm({ ...form, review_note: e.target.value })}
              />
            </div>

            <button className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Save Review
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
