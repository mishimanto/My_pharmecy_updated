import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiClock, FiFileText, FiHeadphones, FiMessageSquare, FiPaperclip, FiSend, FiUpload } from 'react-icons/fi'
import { BiSupport } from "react-icons/bi";
import { supportApi } from '../../api/supportApi'
import PageHeader from '../../components/common/PageHeader'
import { useLanguage } from '../../context/LanguageContext'
import { date } from '../../utils/formatters'

export default function SupportDetails() {
  const { reference } = useParams()
  const { isBangla } = useLanguage()
  const t = (bn, en) => (isBangla ? bn : en)
  const locale = isBangla ? 'bn-BD' : 'en-US'
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [attachment, setAttachment] = useState(null)

  const load = () => {
    supportApi.show(reference)
      .then((res) => setTicket(res.data.data))
      .catch(() => toast.error(t('সাপোর্ট থ্রেড লোড করা যায়নি।', 'Support thread could not be loaded.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [reference])

  const timeline = useMemo(() => {
    if (!ticket) return []

    return [
      {
        id: `ticket-${ticket.id}`,
        author: t('আপনি', 'You'),
        role: t('মূল অনুরোধ', 'Original request'),
        message: ticket.description,
        created_at: ticket.created_at,
        attachment_url: null,
        tone: 'customer',
      },
      ...(ticket.replies || []).map((reply) => ({
        id: `reply-${reply.id}`,
        author: reply.staff ? reply.staff.full_name : t('আপনি', 'You'),
        role: reply.staff ? t('সাপোর্ট টিম', 'Support team') : t('গ্রাহক রিপ্লাই', 'Customer reply'),
        message: reply.message,
        created_at: reply.created_at,
        attachment_url: reply.attachment_url,
        tone: reply.staff ? 'staff' : 'customer',
      })),
    ]
  }, [ticket, t])

  const submit = async (event) => {
    event.preventDefault()
    const nextMessage = message.trim()

    if (!nextMessage) {
      toast.error(t('রিপ্লাই লিখুন।', 'Write a reply first.'))
      return
    }

    setSubmitting(true)
    const payload = new FormData()
    payload.append('message', nextMessage)
    if (attachment) payload.append('attachment', attachment)

    try {
      await supportApi.reply(reference, payload)
      toast.success(t('রিপ্লাই পাঠানো হয়েছে।', 'Reply sent successfully.'))
      setMessage('')
      setAttachment(null)
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || t('রিপ্লাই পাঠানো যায়নি।', 'Reply could not be sent.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">{t('সাপোর্ট থ্রেড লোড হচ্ছে...', 'Loading support thread...')}</p>
  if (!ticket) return <p className="text-sm text-slate-500">{t('সাপোর্ট টিকিট পাওয়া যায়নি।', 'Support ticket not found.')}</p>

  const status = supportStatusMeta(ticket.status, isBangla)
  const canReply = !['resolved', 'closed'].includes(ticket.status)

  return (
    <>
      <PageHeader
        title={t('সাপোর্ট থ্রেড', 'Support thread')}
        action={(
          <Link to="/support" className="inline-flex items-center gap-2 border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            <FiArrowLeft className="h-4 w-4" />
            {t('সব টিকিট', 'All tickets')}
          </Link>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`border px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                  <span className="border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {t('টিকিট', 'Ticket')} #{Number(ticket.id || 0).toString(36).toUpperCase()}
                  </span>
                </div>
                <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{ticket.subject}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-600">{ticket.description}</p>
              </div>
              <div className="grid min-w-55 gap-3 border border-slate-200 bg-slate-50 p-4 text-sm">
                <MetaItem icon={FiClock} label={t('খোলা হয়েছে', 'Opened')} value={date(ticket.created_at, locale)} />
                <MetaItem icon={FiMessageSquare} label={t('মোট মেসেজ', 'Messages')} value={timeline.length.toLocaleString(locale)} />
                <MetaItem icon={FiFileText} label={t('সম্পর্কিত অর্ডার', 'Related order')} value={ticket.order?.order_number || t('নেই', 'None')} />
              </div>
            </div>
          </div>

          <div className="border border-slate-200 bg-white shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <div className="border-b border-slate-200 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">{t('কথোপকথন', 'Conversation')}</p>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              {timeline.map((item) => (
                <article key={item.id} className="grid gap-3 sm:grid-cols-[44px_1fr]">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold ${item.tone === 'staff' ? 'border-emerald-200 bg-emerald-100 shadow-sm shadow-emerald-100' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                    {item.tone === 'staff' ? <BiSupport className="h-5 w-5" /> : 'Me'}
                  </div>
                  <div className={`border rounded-lg p-4 ${item.tone === 'staff' ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
                    <div className="flex flex-col gap-1 border-b border-slate-200/80 pb-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        {/* <h2 className="text-sm font-semibold text-slate-950">{item.author}</h2> */}
                        <p className="text-xs text-slate-500">{item.role}</p>
                      </div>
                      <time className="text-xs font-medium text-slate-500">{date(item.created_at, locale)}</time>
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-8 text-slate-700">{item.message}</p>
                    {item.attachment_url ? (
                      <a href={item.attachment_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                        <FiPaperclip className="h-4 w-4" />
                        {t('অ্যাটাচমেন্ট দেখুন', 'View attachment')}
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <form onSubmit={submit} className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <div className="border-b border-slate-200 pb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">{t('রিপ্লাই', 'Reply')}</p>
            </div>

            {canReply ? (
              <>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                  className="mt-5 min-h-40 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
                  placeholder={t('আপনার আপডেট, ডেলিভারি সমস্যা বা পরবর্তী প্রশ্ন লিখুন', 'Write your update, delivery issue, or follow-up question')}
                />

                <label className="mt-4 flex cursor-pointer items-center gap-3 border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500 transition hover:border-slate-400 hover:bg-slate-50">
                  <FiUpload className="h-4 w-4" />
                  <span className="min-w-0 truncate">{attachment?.name || t('ছবি, PDF বা ডকুমেন্ট যুক্ত করুন', 'Attach image, PDF, or document')}</span>
                  <input type="file" className="hidden" onChange={(event) => setAttachment(event.target.files?.[0] || null)} />
                </label>

                <button disabled={submitting} className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                  <FiSend className="h-4 w-4" />
                  {submitting ? t('রিপ্লাই পাঠানো হচ্ছে...', 'Sending reply...') : t('রিপ্লাই পাঠান', 'Send reply')}
                </button>
              </>
            ) : (
              <p className="mt-5 text-sm leading-7 text-slate-600">
                {t('এই টিকিটটি সমাধান বা বন্ধ করা হয়েছে, তাই নতুন রিপ্লাই পাঠানো যাবে না।', 'This ticket has been resolved or closed, so new replies cannot be sent.')}
              </p>
            )}
          </form>

          <div className="border border-slate-200 bg-slate-300 p-5 text-sm leading-7 text-slate-600">
            {t('নোট: সাপোর্ট টিম আপনার আপডেট দেখলে এই থ্রেডেই উত্তর দেবে। প্রয়োজন হলে ছবি বা ডকুমেন্ট যুক্ত করুন।', 'Note: The support team will reply in this thread after reviewing your update. Attach images or documents when useful.')}
          </div>
        </aside>
      </div>
    </>
  )
}

function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-700">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-xs text-slate-500">{label}</span>
        <span className="block font-semibold text-slate-950">{value}</span>
      </span>
    </div>
  )
}

function supportStatusMeta(status, isBangla = false) {
  const labels = {
    open: {
      label: isBangla ? 'ওপেন' : 'Open',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    in_progress: {
      label: isBangla ? 'চলমান' : 'In progress',
      className: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    resolved: {
      label: isBangla ? 'সমাধান হয়েছে' : 'Resolved',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    closed: {
      label: isBangla ? 'বন্ধ' : 'Closed',
      className: 'border-slate-200 bg-slate-50 text-slate-700',
    },
  }

  return labels[status] || {
    label: String(status || '-').replace(/_/g, ' '),
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  }
}
