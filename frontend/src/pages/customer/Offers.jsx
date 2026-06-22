import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiClock, FiGift } from 'react-icons/fi'
import { Link } from 'react-router-dom'
// import PageHeader from '../../components/common/PageHeader'
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
    .map((item) => getLocalizedOffer(item, isBangla))
    .filter((item) => item.title), [records, isBangla])

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
  const timeLeft = nowTick >= 0 ? getOfferTimeLeft(offer.endsAt) : null

  return (
    <article className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#9de8e1] hover:shadow-[0_24px_60px_-38px_rgba(14,101,116,0.45)]">
      <div className="relative h-52 overflow-hidden bg-[#e9fbf8]">
        {offer.image ? (
          <img src={offer.image} alt={offer.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-[#0e6574]">
            <FiGift className="h-14 w-14" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/55 via-slate-950/5 to-transparent" />
        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
          <span className="inline-flex max-w-[65%] items-center gap-2 rounded-full bg-white/92 px-3 py-1 text-xs font-bold text-[#0e6574] shadow-sm">
            <FiGift className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{offer.label || t('????? ????', 'Active offer')}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50/95 px-3 py-1 text-xs font-bold text-amber-700 shadow-sm">
            <FiClock className="h-3.5 w-3.5" />
            {timeLeft?.label ? timeLeft.label : t('????? ???', 'Limited time')}
          </span>
        </div>
      </div>

      <div className="flex min-h-56 flex-col p-5">
        <h2 className="line-clamp-2 text-xl font-bold leading-snug text-slate-950">{offer.title}</h2>
        {offer.body ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{offer.body}</p> : null}
        <div className="mt-auto pt-5">
          <Link to={offer.linkUrl} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#0e6574] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b5360]">
            {offer.buttonLabel || t('?????', 'View offer')}
            <FiArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}
