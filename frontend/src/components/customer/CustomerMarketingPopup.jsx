import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiClock, FiGift, FiX } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { marketingPopupApi, readCachedMarketingPopup } from '../../api/marketingPopupApi'
import { useLanguage } from '../../context/LanguageContext'
import { getLocalizedOffer, getOfferTimeLeft } from '../../utils/offerDisplay'

const POPUP_CLOSED_KEY = 'storefront_marketing_popup_closed_v1'

export default function CustomerMarketingPopup() {
  const { isBangla } = useLanguage()
  const [record, setRecord] = useState(() => readCachedMarketingPopup())
  const [isVisible, setIsVisible] = useState(false)
  const [nowTick, setNowTick] = useState(0)
  const t = (bn, en) => (isBangla ? bn : en)

  useEffect(() => {
    marketingPopupApi.show().then((response) => setRecord(response.data.data || null)).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick((current) => current + 1), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const popup = useMemo(() => (record ? getLocalizedOffer(record, isBangla) : null), [isBangla, record])
  const timeLeft = nowTick >= 0 ? getOfferTimeLeft(popup?.endsAt) : null

  useEffect(() => {
    if (!popup) return undefined
    if (window.sessionStorage.getItem(POPUP_CLOSED_KEY) === String(popup.id)) return undefined

    const timer = window.setTimeout(() => setIsVisible(true), 2000)
    return () => window.clearTimeout(timer)
  }, [popup])

  const close = () => {
    if (popup) window.sessionStorage.setItem(POPUP_CLOSED_KEY, String(popup.id))
    setIsVisible(false)
  }

  if (!popup || !isVisible) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <article className="relative h-[560px] w-full max-w-2xl overflow-hidden bg-slate-900 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.75)] sm:h-[620px]">
        <button
          type="button"
          onClick={close}
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center bg-white/92 text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-slate-950"
          aria-label={t('বন্ধ করুন', 'Close')}
        >
          <FiX className="h-5 w-5" />
        </button>

        {popup.image ? (
          <img src={popup.image} alt={popup.title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#e9fbf8] text-[#0e6574]">
            <FiGift className="h-20 w-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-slate-950/5" />

        <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
          <span className="inline-flex w-fit items-center gap-2 bg-white/92 px-3 py-1 text-xs font-bold text-[#0e6574]">
            <FiGift className="h-3.5 w-3.5" />
            {popup.label || t('বিশেষ অফার', 'Special offer')}
          </span>
          <h2 className="mt-4 max-w-lg text-3xl font-bold leading-tight sm:text-4xl">{popup.title}</h2>
          {popup.body ? <p className="mt-3 max-w-lg text-sm leading-6 text-slate-100 sm:text-base">{popup.body}</p> : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="inline-flex items-center justify-center gap-2 bg-white/92 px-4 py-3 text-sm font-bold text-[#0e6574]">
              <FiClock className="h-4 w-4" />
              {timeLeft?.label || '00:00:00'}
            </span>
            <Link
              to={popup.linkUrl}
              onClick={close}
              className="inline-flex items-center justify-center gap-2 bg-[#13b8b0] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0e6574]"
            >
              {popup.buttonLabel || t('অফার দেখুন', 'View offer')}
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}
