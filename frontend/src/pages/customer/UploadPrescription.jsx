import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import { prescriptionApi } from '../../api/prescriptionApi'
import { useCustomerAuth } from '../../context/CustomerAuthContext'

export default function UploadPrescription() {
  const { ensureGuestToken } = useCustomerAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ patient_name: '', doctor_name: '', notes: '' })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (!file) {
      toast.error('ফাইল নির্বাচন করুন')
      return
    }
    setLoading(true)
    const body = new FormData()
    body.append('prescription_file', file)
    Object.entries(form).forEach(([key, value]) => body.append(key, value || ''))

    try {
      ensureGuestToken()
      await prescriptionApi.create(body)
      toast.success('প্রেসক্রিপশন আপলোড হয়েছে')
      navigate('/prescriptions')
    } catch (error) {
      toast.error(error.response?.data?.message || 'আপলোড করা যায়নি')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader title="প্রেসক্রিপশন আপলোড" subtitle="ছবি অথবা PDF আপলোড করুন। প্রেসক্রিপশন ফাইল WebP-তে convert করা হবে না।" />
      <form className="grid gap-4 rounded border bg-white p-5 md:grid-cols-2" onSubmit={submit}>
        <input className="rounded border px-3 py-2" placeholder="রোগীর নাম" value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder="ডাক্তারের নাম" value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} />
        <textarea className="rounded border px-3 py-2 md:col-span-2" placeholder="নোট" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <input className="rounded border px-3 py-2 md:col-span-2" type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button disabled={loading} className="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-60 md:col-span-2">{loading ? 'আপলোড হচ্ছে...' : 'আপলোড করুন'}</button>
      </form>
    </>
  )
}
