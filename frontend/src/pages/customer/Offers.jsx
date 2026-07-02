import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiClock, FiGift, FiTag } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useOffersQuery } from '../../queries/customerQueries'
import { getLocalizedOffer, getOfferTimeLeft } from '../../utils/offerDisplay'

export default function Offers() {
  const { isBangla } = useLanguage()
  const offersQuery = useOffersQuery()
  const records = useMemo(() => offersQuery.data || [], [offersQuery.data])
  const loading = offersQuery.isLoading
  const [nowTick, setNowTick] = useState(0)
  const t = (bn, en) => (isBangla ? bn : en)

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick((current) => current + 1), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const offers = useMemo(() => records
    .map((item) => ({ ...item, localized: getLocalizedOffer(item, isBangla) }))
    .filter((item) => item.localized.title), [records, isBangla])

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-72 animate-pulse rounded-lg border border-slate-200 bg-white" />
          ))}
        </div>
      ) : offers.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} isBangla={isBangla} nowTick={nowTick} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <FiGift className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-4 text-lg font-semibold text-slate-950">{t('এখন কোনো অফার নেই', 'No active offers right now')}</h2>
          <p className="mt-2 text-sm text-slate-500">{t('নতুন অফার এলে এখানে দেখা যাবে।', 'New offers will appear here when available.')}</p>
        </div>
      )}
    </div>
  )
}

function OfferCard({ offer, isBangla, nowTick }) {
  const t = (bn, en) => (isBangla ? bn : en)
  const localized = offer.localized
  const timeLeft = nowTick >= 0 ? getOfferTimeLeft(localized.endsAt, isBangla) : null
  const discountValue = Number(offer.discount_value || 0).toLocaleString(isBangla ? 'bn-BD' : 'en-US')
  const discountLabel = offer.discount_type === 'fixed'
    ? t(`৳${discountValue} ছাড়`, `Tk ${discountValue} off`)
    : t(`${discountValue}% ছাড়`, `${discountValue}% off`)
  const scopeLabel = {
    all: t('সব পণ্য', 'All products'),
    category: t('ক্যাটাগরি অফার', 'Category offer'),
    manufacturer: t('ব্র্যান্ড অফার', 'Brand offer'),
    products: t('নির্বাচিত পণ্য', 'Selected products'),
  }[offer.applies_to || 'all']

  return (
    <article className="group overflow-hidden border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#9de8e1] hover:shadow-[0_24px_60px_-38px_rgba(14,101,116,0.45)]">
      <div className="relative h-52 overflow-hidden bg-[#e9fbf8]">
        {localized.image ? (
          <img src={localized.image} alt={localized.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-[#0e6574]">
            <FiGift className="h-14 w-14" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 via-slate-950/5 to-transparent" />
        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
          <span className="inline-flex max-w-[65%] items-center gap-2 rounded-full bg-white/92 px-3 py-1 text-xs font-bold text-[#0e6574] shadow-sm">
            <FiTag className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{discountLabel}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50/95 px-3 py-1 text-xs font-bold text-amber-700 shadow-sm">
            <FiClock className="h-3.5 w-3.5" />
            {timeLeft?.label || t('০০:০০:০০', '00:00:00')}
          </span>
        </div>
      </div>

      <div className="flex min-h-60 flex-col p-5">
        <div className="flex flex-wrap gap-2">
          <span className=" bg-[#e9fbf8] px-3 py-1 text-xs font-bold text-[#0e6574]">{scopeLabel}</span>
          {localized.label ? <span className=" bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{localized.label}</span> : null}
        </div>
        <h2 className="mt-4 line-clamp-2 text-xl font-bold leading-snug text-slate-950">{localized.title}</h2>
        {localized.body ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{localized.body}</p> : null}
        <div className="mt-auto pt-5">
          <Link to={localized.linkUrl} className="inline-flex w-full items-center justify-center gap-2  bg-[#0e6574] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0b5360]">
            {localized.buttonLabel || t('অফার দেখুন', 'View offer')}
            <FiArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}
