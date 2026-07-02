import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiCheckCircle, FiClock, FiCpu, FiFileText, FiMessageSquare, FiPackage, FiUpload } from 'react-icons/fi'
import { supportApi } from '../../api/supportApi'
import PageHeader from '../../components/common/PageHeader'
import { useLanguage } from '../../context/LanguageContext'
import { customerQueryKeys, useCustomerAiConfigQuery, useSupportTicketsQuery } from '../../queries/customerQueries'
import { date } from '../../utils/formatters'

export default function Support() {
  const { isBangla } = useLanguage()
  const t = (bn, en) => (isBangla ? bn : en)
  const locale = isBangla ? 'bn-BD' : 'en-US'
  const queryClient = useQueryClient()
  const aiConfigQuery = useCustomerAiConfigQuery()
  const ticketsQuery = useSupportTicketsQuery({ placeholderData: (previous) => previous })
  const aiSupportDraftEnabled = Boolean(aiConfigQuery.data?.features?.support_assistant)
  const tickets = useMemo(() => ticketsQuery.data || [], [ticketsQuery.data])
  const loading = ticketsQuery.isLoading
  const [submitting, setSubmitting] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [aiDraft, setAiDraft] = useState(null)
  const [aiDraftError, setAiDraftError] = useState('')
  const [form, setForm] = useState({ subject: '', description: '', order_id: '', attachment: null })

  useEffect(() => {
    if (ticketsQuery.isError) {
      toast.error(t('সাপোর্ট টিকিট লোড করা যায়নি।', 'Support tickets could not be loaded.'))
    }
  }, [ticketsQuery.isError, t])

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
      await queryClient.invalidateQueries({ queryKey: customerQueryKeys.supportTickets })
    } catch (error) {
      const validationErrors = error.response?.data?.errors
      const firstError = validationErrors ? Object.values(validationErrors).flat()[0] : null
      toast.error(firstError || error.response?.data?.message || t('টিকিট তৈরি করা যায়নি।', 'Ticket could not be created.'))
    } finally {
      setSubmitting(false)
    }
  }

  const generateDraft = async () => {
    const description = form.description.trim()

    if (!aiSupportDraftEnabled) return

    if (description.length < 10) {
      toast.error(t('AI ড্রাফটের জন্য আগে সমস্যার বিস্তারিত লিখুন।', 'Write a few issue details before generating an AI draft.'))
      return
    }

    setDrafting(true)
    setAiDraft(null)
    setAiDraftError('')

    try {
      const { data } = await supportApi.draft({
        subject: form.subject.trim(),
        description,
        order_id: form.order_id.trim(),
      })

      setAiDraft(data.data)
    } catch (error) {
      const message = error.response?.data?.message || t('AI সাপোর্ট ড্রাফট এখন পাওয়া যাচ্ছে না।', 'AI support draft is not available right now.')
      setAiDraftError(message)
      toast.error(message)
    } finally {
      setDrafting(false)
    }
  }

  const applyDraft = () => {
    if (!aiDraft) return

    setForm((current) => ({
      ...current,
      subject: aiDraft.subject || current.subject,
      description: aiDraft.draft_message || current.description,
    }))
    toast.success(t('AI ড্রাফট ফর্মে বসানো হয়েছে।', 'AI draft applied to the form.'))
  }

  return (
    <>
      <PageHeader
        title={t('সাপোর্ট সেন্টার', 'Support center')}
      />

      <div className="grid gap-6">
        <section className="grid grid-cols-2 gap-4 md:hidden">
          <StatCard label={t('ওপেন টিকিট', 'Open tickets')} value={stats.open.toLocaleString(locale)} icon={FiClock} tone="amber" />
          <StatCard label={t('সমাধান হয়েছে', 'Resolved')} value={stats.resolved.toLocaleString(locale)} icon={FiCheckCircle} tone="emerald" />
        </section>

        <section className="hidden gap-4 md:grid md:grid-cols-3">
          <StatCard label={t('ওপেন টিকিট', 'Open tickets')} value={stats.open.toLocaleString(locale)} />
          <StatCard label={t('চলমান', 'In progress')} value={stats.inProgress.toLocaleString(locale)} />
          <StatCard label={t('সমাধান হয়েছে', 'Resolved')} value={stats.resolved.toLocaleString(locale)} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <form onSubmit={submit} className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <div className="border-b border-slate-200 pb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">{t('নতুন অভিযোগ বা প্রশ্ন', 'New complain or question')}</p>
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
              {aiSupportDraftEnabled ? (
                <div className="border border-[#b7d5d2] bg-[#f4fffd] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#0e6574]">
                        <FiCpu className="h-4 w-4" />
                        {t('AI সাপোর্ট ড্রাফট', 'AI support draft')}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {t('আপনার লেখা থেকে পরিষ্কার সাপোর্ট মেসেজ সাজিয়ে দেবে।', 'Turns your notes into a clearer support message.')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={generateDraft}
                      disabled={drafting}
                      className="inline-flex items-center justify-center gap-2 border border-[#13b8b0] bg-[#13b8b0] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#0ea8a1] hover:bg-[#0ea8a1] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FiCpu className="h-4 w-4" />
                      {drafting ? t('ড্রাফট হচ্ছে...', 'Drafting...') : t('ড্রাফট বানান', 'Generate draft')}
                    </button>
                  </div>

                  {aiDraftError ? (
                    <div className="mt-3 border border-rose-100 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">
                      {aiDraftError}
                    </div>
                  ) : null}

                  {aiDraft ? (
                    <div className="mt-4 border border-[#d7ebe8] bg-white">
                      <div className="border-b border-slate-100 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="border border-[#b7d5d2] bg-[#e7f8f6] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0e6574]">
                            {aiDraft.priority || 'normal'}
                          </span>
                          <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                            {aiDraft.category || 'general'}
                          </span>
                        </div>
                        <h3 className="mt-3 text-sm font-semibold text-slate-950">{aiDraft.subject}</h3>
                        <p className="mt-2 text-xs leading-5 text-slate-500">{aiDraft.summary}</p>
                      </div>
                      <div className="px-4 py-3">
                        <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{aiDraft.draft_message}</p>
                        {aiDraft.missing_information?.length ? (
                          <div className="mt-3 border border-amber-100 bg-amber-50 px-3 py-2">
                            <p className="text-xs font-semibold text-amber-800">{t('আরও তথ্য দিলে ভালো হবে', 'Useful extra details')}</p>
                            <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-800">
                              {aiDraft.missing_information.map((item) => <li key={item}>- {item}</li>)}
                            </ul>
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={applyDraft}
                          className="mt-4 border border-slate-950 bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          {t('এই ড্রাফট ব্যবহার করুন', 'Use this draft')}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
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
                {t('এখনো কোনো সাপোর্ট টিকিট নেই।', 'No support tickets yet.')}
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

function StatCard({ label, value, icon: Icon, tone = 'slate' }) {
  const normalizedLabel = String(label || '').toLowerCase()
  const fallbackPreset = normalizedLabel.includes('open') || normalizedLabel.includes('ওপেন')
    ? { icon: FiClock, tone: 'amber' }
    : normalizedLabel.includes('progress') || normalizedLabel.includes('চলমান')
      ? { icon: FiMessageSquare, tone: 'sky' }
      : normalizedLabel.includes('resolved') || normalizedLabel.includes('সমাধান')
        ? { icon: FiCheckCircle, tone: 'emerald' }
        : null

  const ResolvedIcon = Icon || fallbackPreset?.icon
  const resolvedTone = tone === 'slate' && fallbackPreset?.tone ? fallbackPreset.tone : tone
  const tones = {
    amber: {
      card: 'border-amber-200 bg-amber-50/70',
      iconWrap: 'text-amber-700',
    },
    sky: {
      card: 'border-sky-200 bg-sky-50/70',
      iconWrap: 'text-sky-700',
    },
    emerald: {
      card: 'border-emerald-200 bg-emerald-50/70',
      iconWrap: 'text-emerald-700',
    },
    slate: {
      card: 'border-slate-200 bg-white',
      iconWrap: 'text-slate-700',
    },
  }

  const palette = tones[resolvedTone] || tones.slate

  return (
    <div className={`border p-3.5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] sm:p-5 ${palette.card}`}>
      <div className="flex items-center justify-between gap-2.5 sm:gap-3">
        <div>
          <div className="text-[11px] leading-4 text-slate-600 sm:text-sm">{label}</div>
          <div className="mt-1 text-xl font-semibold text-slate-950 sm:mt-2 sm:text-3xl">{value}</div>
        </div>
        {ResolvedIcon ? (
          <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center sm:h-11 sm:w-11 ${palette.iconWrap}`}>
            <ResolvedIcon className="h-4 w-4 sm:h-6 sm:w-6" />
          </span>
        ) : null}
      </div>
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
      <div className="flex items-center gap-2">
        <div className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-slate-950">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      </div>
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
