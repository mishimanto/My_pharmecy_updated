import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiFileText, FiMessageSquare, FiPackage, FiUpload } from 'react-icons/fi'
import { supportApi } from '../../api/supportApi'
import PageHeader from '../../components/common/PageHeader'
import { useLanguage } from '../../context/LanguageContext'
import { date } from '../../utils/formatters'

export default function Support() {
  const { isBangla } = useLanguage()
  const t = (bn, en) => (isBangla ? bn : en)
  const locale = isBangla ? 'bn-BD' : 'en-US'
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ subject: '', description: '', order_id: '', attachment: null })

  const load = () => {
    supportApi.list()
      .then((res) => setTickets(res.data.data?.data || []))
      .catch(() => toast.error(t('সাপোর্ট টিকিট লোড করা যায়নি।', 'Support tickets could not be loaded.')))
      .finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [])

  const stats = useMemo(() => ({
    open: tickets.filter((ticket) => ticket.status === 'open').length,
    inProgress: tickets.filter((ticket) => ticket.status === 'in_progress').length,
    resolved: tickets.filter((ticket) => ['resolved', 'closed'].includes(ticket.status)).length,
  }), [tickets])

  const submit = async (event) => {
    event.preventDefault()
    const subject = form.subject.trim()
    const description = form.description.trim()
    const orderReference = form.order_id.trim()

    if (!subject || !description) {
      toast.error(t('বিষয় এবং বিস্তারিত লিখুন।', 'Please add a subject and description.'))
      return
    }

    setSubmitting(true)
    const payload = new FormData()
    payload.append('subject', subject)
    payload.append('description', description)
    if (orderReference) payload.append('order_id', orderReference)
    if (form.attachment) payload.append('attachment', form.attachment)

    try {
      await supportApi.create(payload)
      toast.success(t('সাপোর্ট টিকিট তৈরি হয়েছে।', 'Support ticket created successfully.'))
      setForm({ subject: '', description: '', order_id: '', attachment: null })
      load()
    } catch (error) {
      const validationErrors = error.response?.data?.errors
      const firstError = validationErrors ? Object.values(validationErrors).flat()[0] : null
      toast.error(firstError || error.response?.data?.message || t('টিকিট তৈরি করা যায়নি।', 'Ticket could not be created.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title={t('সাপোর্ট সেন্টার', 'Support center')}
      />

      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label={t('ওপেন টিকিট', 'Open tickets')} value={stats.open.toLocaleString(locale)} />
          <StatCard label={t('চলমান', 'In progress')} value={stats.inProgress.toLocaleString(locale)} />
          <StatCard label={t('সমাধান হয়েছে', 'Resolved')} value={stats.resolved.toLocaleString(locale)} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <form onSubmit={submit} className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <div className="border-b border-slate-200 pb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">{t('নতুন অভিযোগ বা প্রশ্ন', 'New complaint or question')}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{t('সাপোর্ট টিকিট শুরু করুন।', 'Start a support ticket.')}</h2>
            </div>

            <div className="mt-5 space-y-4">
              <FormField label={t('বিষয়', 'Subject')}>
                <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} required className="mt-2 w-full border border-slate-300 px-4 py-3 text-sm outline-none" placeholder={t('সংক্ষেপে সমস্যার শিরোনাম', 'Short issue title')} />
              </FormField>
              <FormField label={t('সম্পর্কিত অর্ডার', 'Related order')}>
                <input value={form.order_id} onChange={(event) => setForm({ ...form, order_id: event.target.value })} className="mt-2 w-full border border-slate-300 px-4 py-3 text-sm outline-none" placeholder={t('ঐচ্ছিক অর্ডার আইডি বা অর্ডার নম্বর', 'Optional order ID or order number')} />
              </FormField>
              <FormField label={t('বিস্তারিত', 'Description')}>
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required className="mt-2 min-h-36 w-full border border-slate-300 px-4 py-3 text-sm outline-none" placeholder={t('সমস্যা, পণ্য সংক্রান্ত প্রশ্ন বা ডেলিভারি সমস্যা লিখুন', 'Describe the issue, product concern, or delivery problem')} />
              </FormField>
              <FormField label={t('অ্যাটাচমেন্ট', 'Attachment')}>
                <label className="mt-2 flex cursor-pointer items-center gap-3 border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500">
                  <FiUpload className="h-4 w-4" />
                  <span>{form.attachment?.name || t('ছবি, PDF বা ডকুমেন্ট আপলোড করুন', 'Upload image, PDF, or document')}</span>
                  <input type="file" className="hidden" onChange={(event) => setForm({ ...form, attachment: event.target.files?.[0] || null })} />
                </label>
              </FormField>
            </div>

            <button disabled={submitting} className="mt-5 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
              {submitting ? t('টিকিট জমা হচ্ছে...', 'Submitting ticket...') : t('সাপোর্ট টিকিট তৈরি করুন', 'Create support ticket')}
            </button>
          </form>

          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <MiniHelpCard icon={FiPackage} title={t('অর্ডার সমস্যা', 'Order issues')} body={t('দেরি ডেলিভারি, মিসিং পণ্য বা প্যাকড অর্ডার নিয়ে সমস্যা।', 'Late delivery, missing products, or packed-order concerns.')} />
              <MiniHelpCard icon={FiFileText} title={t('প্রেসক্রিপশন রিভিউ', 'Prescription review')} body={t('রিজেক্টেড বা পেন্ডিং প্রেসক্রিপশন-যুক্ত পণ্য নিয়ে জানতে চান।', 'Clarify rejected or pending prescription-linked items.')} />
              <MiniHelpCard icon={FiMessageSquare} title={t('সাধারণ সাপোর্ট', 'General support')} body={t('পণ্য অর্ডারের আগে বা পরে যেকোনো প্রশ্ন করুন।', 'Ask questions before or after placing product orders.')} />
            </div>

            {loading ? <p className="text-sm text-slate-500">{t('সাপোর্ট টিকিট লোড হচ্ছে...', 'Loading support tickets...')}</p> : null}
            {!loading && !tickets.length ? (
              <div className="border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
                {t('এখনও কোনো সাপোর্ট টিকিট নেই।', 'No support tickets yet.')}
              </div>
            ) : null}

            {tickets.map((ticket) => (
              <Link key={ticket.id} to={`/support/${supportTicketReference(ticket)}`} className="block border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">{ticket.subject}</h3>
                      <span className={`border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${ticket.status === 'open' ? 'border-amber-200 bg-amber-50 text-amber-700' : ticket.status === 'in_progress' ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                        {supportStatusLabel(ticket.status, isBangla)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{t('খোলা হয়েছে', 'Opened')} {date(ticket.created_at, locale)}</p>
                    <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-600">{ticket.description}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    {t('থ্রেড খুলুন', 'Open thread')}
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

function supportStatusLabel(status, isBangla = false) {
  const labels = {
    open: isBangla ? 'ওপেন' : 'Open',
    in_progress: isBangla ? 'চলমান' : 'In progress',
    resolved: isBangla ? 'সমাধান হয়েছে' : 'Resolved',
    closed: isBangla ? 'বন্ধ' : 'Closed',
  }

  return labels[status] || String(status || '-').replace(/_/g, ' ')
}

function supportTicketReference(ticket) {
  const encodedId = Number(ticket?.id || 0).toString(36)
  const slug = String(ticket?.subject || 'support-ticket')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)

  return `ticket-${encodedId}${slug ? `-${slug}` : ''}`
}
