import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiFileText, FiMessageSquare, FiPackage, FiUpload } from 'react-icons/fi'
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
      .catch(() => toast.error('Support tickets could not be loaded.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const stats = useMemo(() => ({
    open: tickets.filter((ticket) => ticket.status === 'open').length,
    inProgress: tickets.filter((ticket) => ticket.status === 'in_progress').length,
    resolved: tickets.filter((ticket) => ['resolved', 'closed'].includes(ticket.status)).length,
  }), [tickets])

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
      toast.success('Support ticket created successfully.')
      setForm({ subject: '', description: '', order_id: '', attachment: null })
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Ticket could not be created.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader title="Support center" subtitle="Open a complaint or ask for order help, then continue the conversation with the pharmacy support team from one account area." />

      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Open tickets" value={stats.open} />
          <StatCard label="In progress" value={stats.inProgress} />
          <StatCard label="Resolved" value={stats.resolved} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <form onSubmit={submit} className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <div className="border-b border-slate-200 pb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">New complaint or question</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Start a support ticket.</h2>
            </div>

            <div className="mt-5 space-y-4">
              <FormField label="Subject">
                <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} required className="mt-2 w-full border border-slate-300 px-4 py-3 text-sm outline-none" placeholder="Short issue title" />
              </FormField>
              <FormField label="Related order ID">
                <input value={form.order_id} onChange={(event) => setForm({ ...form, order_id: event.target.value })} className="mt-2 w-full border border-slate-300 px-4 py-3 text-sm outline-none" placeholder="Optional order reference" />
              </FormField>
              <FormField label="Description">
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required className="mt-2 min-h-36 w-full border border-slate-300 px-4 py-3 text-sm outline-none" placeholder="Describe the issue, medicine concern, or delivery problem" />
              </FormField>
              <FormField label="Attachment">
                <label className="mt-2 flex cursor-pointer items-center gap-3 border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500">
                  <FiUpload className="h-4 w-4" />
                  <span>{form.attachment?.name || 'Upload image, PDF, or document'}</span>
                  <input type="file" className="hidden" onChange={(event) => setForm({ ...form, attachment: event.target.files?.[0] || null })} />
                </label>
              </FormField>
            </div>

            <button disabled={submitting} className="mt-5 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
              {submitting ? 'Submitting ticket...' : 'Create support ticket'}
            </button>
          </form>

          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <MiniHelpCard icon={FiPackage} title="Order issues" body="Late delivery, missing products, or packed-order concerns." />
              <MiniHelpCard icon={FiFileText} title="Prescription review" body="Clarify rejected or pending prescription-linked items." />
              <MiniHelpCard icon={FiMessageSquare} title="General support" body="Ask questions before or after placing medicine orders." />
            </div>

            {loading ? <p className="text-sm text-slate-500">Loading support tickets...</p> : null}
            {!loading && !tickets.length ? (
              <div className="border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
                No support tickets yet.
              </div>
            ) : null}

            {tickets.map((ticket) => (
              <Link key={ticket.id} to={`/support/${ticket.id}`} className="block border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">{ticket.subject}</h3>
                      <span className={`border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${ticket.status === 'open' ? 'border-amber-200 bg-amber-50 text-amber-700' : ticket.status === 'in_progress' ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">Opened {date(ticket.created_at)}</p>
                    <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-600">{ticket.description}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    Open thread
                    <FiArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </section>
        </section>
      </div>
    </>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-950">{value}</div>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}

function MiniHelpCard({ icon: Icon, title, body }) {
  return (
    <div className="border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
      <div className="inline-flex h-9 w-9 items-center justify-center border border-slate-200 bg-slate-50 text-slate-950">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  )
}
