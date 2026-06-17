import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import { adminApi } from '../../api/adminApi'
import { date } from '../../utils/formatters'

const labels = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', need_clarification: 'Needs Clarification' }

export default function PrescriptionDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [prescription, setPrescription] = useState(null)
  const [form, setForm] = useState({ review_status: 'approved', review_note: '' })

  useEffect(() => {
    adminApi.show('prescriptions', id).then(({ data }) => setPrescription(data.data)).catch(() => toast.error('Prescription not found.'))
  }, [id])

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

  return (
    <>
      <PageHeader title={`Prescription #${prescription.id}`} subtitle={`${prescription.user?.full_name || '-'} - ${labels[prescription.status] || prescription.status}`} />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="rounded border bg-white p-5">
          <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
            <p><strong>Customer:</strong> {prescription.user?.full_name}</p>
            <p><strong>Phone:</strong> {prescription.user?.phone}</p>
            <p><strong>Patient:</strong> {prescription.patient_name || '-'}</p>
            <p><strong>Doctor:</strong> {prescription.doctor_name || '-'}</p>
            <p><strong>Uploaded:</strong> {date(prescription.uploaded_at || prescription.created_at, 'en-US')}</p>
            <p><strong>Status:</strong> {labels[prescription.status] || prescription.status}</p>
          </div>
          {prescription.order ? (
            <div className="mb-4 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <span className="font-semibold">Linked order:</span>{' '}
              <Link to={`/admin/orders/${prescription.order.id}`} className="text-emerald-700 underline">
                {prescription.order.order_number}
              </Link>
            </div>
          ) : null}
          {prescription.file_url && <a className="inline-flex rounded bg-emerald-600 px-4 py-2 text-white" href={prescription.file_url} target="_blank">View File</a>}
          <h2 className="mt-6 font-semibold">Review History</h2>
          <div className="mt-2 space-y-2">
            {(prescription.reviews || []).map((review) => <div key={review.id} className="rounded bg-slate-50 p-3 text-sm"><strong>{labels[review.review_status] || review.review_status}</strong><p>{review.review_note || '-'}</p><span className="text-slate-500">{review.reviewer?.full_name} - {date(review.reviewed_at, 'en-US')}</span></div>)}
          </div>
        </section>
        <form className="rounded border bg-white p-5" onSubmit={submit}>
          <h2 className="mb-3 font-semibold">Pharmacist Review</h2>
          <select className="mb-3 w-full rounded border px-3 py-2" value={form.review_status} onChange={(e) => setForm({ ...form, review_status: e.target.value })}>
            <option value="approved">Approve</option>
            <option value="rejected">Reject</option>
            <option value="need_clarification">Needs Clarification</option>
          </select>
          <textarea className="mb-3 min-h-32 w-full rounded border px-3 py-2" placeholder="Review note" value={form.review_note} onChange={(e) => setForm({ ...form, review_note: e.target.value })} />
          <button className="w-full rounded bg-slate-950 px-4 py-2 text-white">Save Review</button>
        </form>
      </div>
    </>
  )
}
