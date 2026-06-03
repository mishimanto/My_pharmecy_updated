import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supportApi } from '../../api/supportApi'
import PageHeader from '../../components/common/PageHeader'
import { date } from '../../utils/formatters'

export default function SupportDetails() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [attachment, setAttachment] = useState(null)

  const load = () => {
    supportApi.show(id)
      .then((res) => setTicket(res.data.data))
      .catch(() => toast.error('টিকিট বিস্তারিত লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const submit = async (event) => {
    event.preventDefault()
    const payload = new FormData()
    payload.append('message', message)
    if (attachment) payload.append('attachment', attachment)
    try {
      await supportApi.reply(id, payload)
      toast.success('রিপ্লাই পাঠানো হয়েছে।')
      setMessage('')
      setAttachment(null)
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'রিপ্লাই পাঠানো যায়নি।')
    }
  }

  if (loading) return <p className="text-sm text-slate-600">লোড হচ্ছে...</p>
  if (!ticket) return <p className="text-sm text-slate-600">টিকিট পাওয়া যায়নি।</p>

  return (
    <>
      <PageHeader title={ticket.subject} subtitle={`${date(ticket.created_at)} - ${ticket.status}`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-700">{ticket.description}</p>
          </div>
          {ticket.replies?.map((reply) => (
            <div key={reply.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                <span>{reply.staff ? `স্টাফ: ${reply.staff.full_name}` : 'আপনি'}</span>
                <span>{date(reply.created_at)}</span>
              </div>
              <p className="text-sm text-slate-800">{reply.message}</p>
              {reply.attachment_url && <a href={reply.attachment_url} target="_blank" className="mt-2 inline-block text-sm font-semibold text-emerald-700">সংযুক্তি দেখুন</a>}
            </div>
          ))}
        </section>
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-950">রিপ্লাই দিন</h2>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} required className="mt-3 min-h-32 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="আপনার উত্তর" />
          <input type="file" onChange={(event) => setAttachment(event.target.files?.[0] || null)} className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <button className="mt-4 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">রিপ্লাই পাঠান</button>
        </form>
      </div>
    </>
  )
}
