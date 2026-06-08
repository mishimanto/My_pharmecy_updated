import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiUpload } from 'react-icons/fi'
import { supportApi } from '../../api/supportApi'
import PageHeader from '../../components/common/PageHeader'
import { date } from '../../utils/formatters'

export default function SupportDetails() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [attachment, setAttachment] = useState(null)

  const load = () => {
    supportApi.show(id)
      .then((res) => setTicket(res.data.data))
      .catch(() => toast.error('Support thread could not be loaded.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    const payload = new FormData()
    payload.append('message', message)
    if (attachment) payload.append('attachment', attachment)

    try {
      await supportApi.reply(id, payload)
      toast.success('Reply sent successfully.')
      setMessage('')
      setAttachment(null)
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reply could not be sent.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading support thread...</p>
  if (!ticket) return <p className="text-sm text-slate-500">Support ticket not found.</p>

  return (
    <>
      <PageHeader title={ticket.subject} subtitle={`${date(ticket.created_at)} • ${ticket.status}`} />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Original request</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{ticket.subject}</h2>
              </div>
              <span className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                {ticket.status}
              </span>
            </div>
            <p className="mt-4 text-sm leading-8 text-slate-600">{ticket.description}</p>
          </div>

          {ticket.replies?.map((reply) => (
            <div key={reply.id} className="border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
              <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 text-xs uppercase tracking-[0.12em] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <span>{reply.staff ? `Staff: ${reply.staff.full_name}` : 'You'}</span>
                <span>{date(reply.created_at)}</span>
              </div>
              <p className="mt-4 text-sm leading-8 text-slate-700">{reply.message}</p>
              {reply.attachment_url ? (
                <a href={reply.attachment_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  View attachment
                </a>
              ) : null}
            </div>
          ))}
        </section>

        <form onSubmit={submit} className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] xl:sticky xl:top-24 xl:self-start">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Reply to support</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Continue the thread.</h2>
          </div>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
            className="mt-5 min-h-36 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none"
            placeholder="Write your update, delivery issue, or follow-up question"
          />

          <label className="mt-4 flex cursor-pointer items-center gap-3 border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500">
            <FiUpload className="h-4 w-4" />
            <span>{attachment?.name || 'Attach image, PDF, or document'}</span>
            <input type="file" className="hidden" onChange={(event) => setAttachment(event.target.files?.[0] || null)} />
          </label>

          <button disabled={submitting} className="mt-5 w-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
            {submitting ? 'Sending reply...' : 'Send reply'}
          </button>
        </form>
      </div>
    </>
  )
}
