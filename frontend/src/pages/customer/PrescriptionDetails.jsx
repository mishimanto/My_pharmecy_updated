import { useCallback, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiCalendar, FiExternalLink, FiFileText, FiUser } from 'react-icons/fi'
import EmptyState from '../../components/common/EmptyState'
import { useLanguage } from '../../context/LanguageContext'
import { usePrescriptionQuery, usePrescriptionsQuery } from '../../queries/customerQueries'
import { date } from '../../utils/formatters'
import { prescriptionIndexFromSlug } from '../../utils/prescriptionDisplay'

function getPreviewKind(fileUrl = '') {
  const url = fileUrl.toLowerCase().split('?')[0]

  if (url.endsWith('.pdf')) return 'pdf'
  if (url.match(/\.(jpg|jpeg|png|webp|gif)$/)) return 'image'

  return 'file'
}

function localizedNumber(value, isBangla) {
  return Number(value || 0).toLocaleString(isBangla ? 'bn-BD' : 'en-US')
}

function fallbackPrescriptionName(index, id, isBangla) {
  if (index >= 0) {
    return isBangla ? `প্রেসক্রিপশন ${localizedNumber(index + 1, true)}` : `Prescription ${index + 1}`
  }

  return isBangla ? `প্রেসক্রিপশন #${localizedNumber(id, true)}` : `Prescription #${id}`
}

export default function PrescriptionDetails() {
  const { id: routeKey } = useParams()
  const { isBangla } = useLanguage()
  const t = useCallback((bn, en) => (isBangla ? bn : en), [isBangla])
  const locale = isBangla ? 'bn-BD' : 'en-US'
  const routeIndex = prescriptionIndexFromSlug(routeKey)
  const isNumericRoute = /^\d+$/.test(String(routeKey || ''))
  const prescriptionsQuery = usePrescriptionsQuery({
    enabled: !isNumericRoute,
    placeholderData: (previous) => previous,
  })
  const matchedPrescription = useMemo(() => {
    if (isNumericRoute) return null
    const prescriptions = prescriptionsQuery.data || []
    return prescriptions[routeIndex] || null
  }, [isNumericRoute, prescriptionsQuery.data, routeIndex])
  const prescriptionId = isNumericRoute ? routeKey : matchedPrescription?.id
  const itemQuery = usePrescriptionQuery(prescriptionId, {
    enabled: Boolean(prescriptionId),
    placeholderData: (previous) => previous,
  })
  const item = itemQuery.data || null
  const loading = (!isNumericRoute && prescriptionsQuery.isLoading) || itemQuery.isLoading
  const title = useMemo(() => {
    if (!item) return routeIndex >= 0 ? fallbackPrescriptionName(routeIndex, routeKey, isBangla) : t('প্রেসক্রিপশন', 'Prescription')
    return fallbackPrescriptionName(routeIndex, item.id, isBangla)
  }, [isBangla, item, routeIndex, routeKey, t])
  const previewKind = getPreviewKind(item?.file_url)

  useEffect(() => {
    if (prescriptionsQuery.isError || itemQuery.isError) {
      toast.error(t('প্রেসক্রিপশনের বিস্তারিত লোড করা যায়নি।', 'Prescription details could not be loaded.'))
    }
  }, [itemQuery.isError, prescriptionsQuery.isError, t])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="border border-slate-200 bg-white p-5 sm:p-6">
          <div className="animate-pulse">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="h-8 w-56 bg-slate-200 sm:w-72" />
                <div className="mt-3 h-4 w-40 bg-slate-100" />
              </div>
              <div className="h-5 w-32 bg-slate-100" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[460px_minmax(0,1fr)]">
          <aside className="space-y-4">
            {[1, 2, 3].map((section) => (
              <div key={section} className="border border-slate-200 bg-white p-5">
                <div className="animate-pulse">
                  <div className="h-4 w-24 bg-slate-200" />
                  <div className="mt-5 space-y-3">
                    {section === 1 ? (
                      <>
                        <div className="border border-slate-100 bg-slate-50 p-4">
                          <div className="h-3 w-20 bg-slate-200" />
                          <div className="mt-3 h-4 w-32 bg-slate-100" />
                        </div>
                        <div className="border border-slate-100 bg-slate-50 p-4">
                          <div className="h-3 w-20 bg-slate-200" />
                          <div className="mt-3 h-4 w-28 bg-slate-100" />
                        </div>
                        <div className="border border-slate-100 bg-slate-50 p-4">
                          <div className="h-3 w-20 bg-slate-200" />
                          <div className="mt-3 h-4 w-36 bg-slate-100" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-4 w-full bg-slate-100" />
                        <div className="h-4 w-5/6 bg-slate-100" />
                        <div className="h-4 w-2/3 bg-slate-100" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </aside>

          <section className="overflow-hidden border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="h-4 w-40 animate-pulse bg-slate-200" />
              <div className="h-4 w-20 animate-pulse bg-slate-100" />
            </div>

            <div className="bg-slate-50 p-4">
              <div className="flex min-h-[620px] items-center justify-center border border-slate-200 bg-white">
                <div className="animate-pulse">
                  <div className="h-[32rem] w-[22rem] max-w-full bg-slate-100 sm:h-[38rem] sm:w-[28rem]" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="border border-slate-200 bg-white p-6">
        <EmptyState
          title={t('প্রেসক্রিপশন পাওয়া যায়নি', 'Prescription not found')}
          text={t('প্রেসক্রিপশনটি ডিলিট করা হয়েছে অথবা আর পাওয়া যাচ্ছে না।', 'The prescription may have been deleted or is no longer available.')}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-white p-5 sm:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <FiCalendar className="h-4 w-4" />
            {t('আপলোড হয়েছে', 'Uploaded')} {date(item.uploaded_at || item.created_at, locale)}
          </div>
        </div>
        <Link to="/prescriptions" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 transition hover:text-slate-950 hover:underline">
          <FiArrowLeft className="h-4 w-4" />
          {t('সব প্রেসক্রিপশন', 'All prescriptions')}
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0e6574]">{t('বিস্তারিত', 'Details')}</div>
            <div className="mt-5 grid gap-3">
              <InfoRow icon={FiUser} label={t('রোগী', 'Patient')} value={item.patient_name || '-'} />
              <InfoRow icon={FiUser} label={t('ডাক্তার', 'Doctor')} value={item.doctor_name || '-'} />
              <InfoRow icon={FiCalendar} label={t('আপলোড', 'Uploaded')} value={date(item.uploaded_at || item.created_at, locale)} />
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0e6574]">{t('নোট', 'Notes')}</div>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.notes || t('কোনো নোট যোগ করা হয়নি।', 'No note added.')}</p>
          </div>

          <div className="border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0e6574]">{t('রিভিউ নোট', 'Review note')}</div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {item.reviews?.[0]?.review_note || t('এখনও কোনো রিভিউ নোট যোগ করা হয়নি।', 'No review note added yet.')}
            </p>
          </div>
        </aside>

        <section className="overflow-hidden border border-slate-200 bg-white">
          <div className="flex justify-between border-b border-slate-200 px-5 py-4">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0e6574]">{t('প্রেসক্রিপশন প্রিভিউ', 'Prescription Preview')}</div>
            {item.file_url ? (
              <a
                href={item.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold transition hover:text-slate-800 hover:underline"
              >
                {t('ফাইল খুলুন', 'Open file')}
                <FiExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>

          <div className="bg-slate-50 p-4">
            <div className="flex min-h-[620px] items-center justify-center border border-slate-200 bg-white">
              {previewKind === 'image' && item.file_url ? (
                <img src={item.file_url} alt={title} className="max-h-[760px] w-full object-contain p-3" />
              ) : previewKind === 'pdf' && item.file_url ? (
                <iframe src={item.file_url} title={title} className="h-[760px] w-full" />
              ) : (
                <div className="max-w-[280px] text-center">
                  <span className="inline-flex h-14 w-14 items-center justify-center border border-slate-200 bg-slate-50 text-slate-800">
                    <FiFileText className="h-6 w-6" />
                  </span>
                  <div className="mt-4 text-base font-semibold text-slate-950">{t('প্রিভিউ পাওয়া যাচ্ছে না', 'Preview is not available')}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{t('প্রেসক্রিপশন দেখতে মূল ফাইলটি খুলুন।', 'Open the original file to review this prescription.')}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  )
}
