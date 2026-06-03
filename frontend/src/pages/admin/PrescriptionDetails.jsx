import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import { adminApi } from '../../api/adminApi'
import { date } from '../../utils/formatters'

const labels = { pending: 'পেন্ডিং', approved: 'অনুমোদিত', rejected: 'বাতিল', need_clarification: 'তথ্য প্রয়োজন' }

export default function PrescriptionDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [prescription, setPrescription] = useState(null)
  const [form, setForm] = useState({ review_status: 'approved', review_note: '' })

  useEffect(() => {
    adminApi.show('prescriptions', id).then(({ data }) => setPrescription(data.data)).catch(() => toast.error('প্রেসক্রিপশন পাওয়া যায়নি'))
  }, [id])

  const submit = async (event) => {
    event.preventDefault()
    const result = await Swal.fire({ title: 'রিভিউ সেভ করবেন?', showCancelButton: true, confirmButtonText: 'সেভ', cancelButtonText: 'বাতিল' })
    if (!result.isConfirmed) return
    try {
      await adminApi.reviewPrescription(id, form)
      toast.success('রিভিউ সেভ হয়েছে')
      navigate('/admin/prescriptions')
    } catch (error) {
      toast.error(error.response?.data?.message || 'রিভিউ সেভ করা যায়নি')
    }
  }

  if (!prescription) return <p className="p-4 text-slate-500">লোড হচ্ছে...</p>

  return (
    <>
      <PageHeader title={`প্রেসক্রিপশন #${prescription.id}`} subtitle={`${prescription.user?.full_name || '-'} - ${labels[prescription.status] || prescription.status}`} />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="rounded border bg-white p-5">
          <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
            <p><strong>কাস্টমার:</strong> {prescription.user?.full_name}</p>
            <p><strong>ফোন:</strong> {prescription.user?.phone}</p>
            <p><strong>রোগী:</strong> {prescription.patient_name || '-'}</p>
            <p><strong>ডাক্তার:</strong> {prescription.doctor_name || '-'}</p>
            <p><strong>আপলোড:</strong> {date(prescription.uploaded_at || prescription.created_at)}</p>
            <p><strong>স্ট্যাটাস:</strong> {labels[prescription.status] || prescription.status}</p>
          </div>
          {prescription.file_url && <a className="inline-flex rounded bg-emerald-600 px-4 py-2 text-white" href={prescription.file_url} target="_blank">ফাইল দেখুন</a>}
          <h2 className="mt-6 font-semibold">রিভিউ ইতিহাস</h2>
          <div className="mt-2 space-y-2">
            {(prescription.reviews || []).map((review) => <div key={review.id} className="rounded bg-slate-50 p-3 text-sm"><strong>{labels[review.review_status] || review.review_status}</strong><p>{review.review_note || '-'}</p><span className="text-slate-500">{review.reviewer?.full_name} - {date(review.reviewed_at)}</span></div>)}
          </div>
        </section>
        <form className="rounded border bg-white p-5" onSubmit={submit}>
          <h2 className="mb-3 font-semibold">Pharmacist Review</h2>
          <select className="mb-3 w-full rounded border px-3 py-2" value={form.review_status} onChange={(e) => setForm({ ...form, review_status: e.target.value })}>
            <option value="approved">অনুমোদন</option>
            <option value="rejected">বাতিল</option>
            <option value="need_clarification">তথ্য প্রয়োজন</option>
          </select>
          <textarea className="mb-3 min-h-32 w-full rounded border px-3 py-2" placeholder="রিভিউ নোট" value={form.review_note} onChange={(e) => setForm({ ...form, review_note: e.target.value })} />
          <button className="w-full rounded bg-slate-950 px-4 py-2 text-white">রিভিউ সেভ করুন</button>
        </form>
      </div>
    </>
  )
}

