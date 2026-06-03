import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supportApi } from '../../api/supportApi'
import PageHeader from '../../components/common/PageHeader'
import { date } from '../../utils/formatters'

export default function Support() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ subject: '', description: '', order_id: '', attachment: null })

  const load = () => {
    supportApi.list()
      .then((res) => setTickets(res.data.data?.data || []))
      .catch(() => toast.error('সাপোর্ট টিকিট লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    const payload = new FormData()
    payload.append('subject', form.subject)
    payload.append('description', form.description)
    if (form.order_id) payload.append('order_id', form.order_id)
    if (form.attachment) payload.append('attachment', form.attachment)

    try {
      await supportApi.create(payload)
      toast.success('সাপোর্ট টিকিট তৈরি হয়েছে।')
      setForm({ subject: '', description: '', order_id: '', attachment: null })
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'টিকিট তৈরি করা যায়নি।')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader title="সাপোর্ট" subtitle="সমস্যা জানাতে টিকিট তৈরি করুন এবং উত্তর দেখুন।" />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-950">নতুন টিকিট</h2>
          <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} required placeholder="বিষয়" className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input value={form.order_id} onChange={(event) => setForm({ ...form, order_id: event.target.value })} placeholder="অর্ডার আইডি (ঐচ্ছিক)" className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required placeholder="বিস্তারিত লিখুন" className="mt-3 min-h-32 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input type="file" onChange={(event) => setForm({ ...form, attachment: event.target.files?.[0] || null })} className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <button disabled={submitting} className="mt-4 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">{submitting ? 'পাঠানো হচ্ছে...' : 'টিকিট তৈরি করুন'}</button>
        </form>

        <section className="space-y-3">
          {loading ? <p className="text-sm text-slate-600">লোড হচ্ছে...</p> : null}
          {!loading && !tickets.length ? <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">কোনো টিকিট নেই।</p> : null}
          {tickets.map((ticket) => (
            <Link key={ticket.id} to={`/support/${ticket.id}`} className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-emerald-300">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-950">{ticket.subject}</p>
                  <p className="text-sm text-slate-500">{date(ticket.created_at)} - {ticket.status}</p>
                </div>
                <span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">{ticket.status}</span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </>
  )
}
