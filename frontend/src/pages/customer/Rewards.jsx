import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FiArrowRight,
  FiAward,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiGift,
  FiPackage,
  FiShield,
  FiStar,
  FiTag,
} from 'react-icons/fi'
import { RiInformation2Line } from "react-icons/ri";
import { rewardApi } from '../../api/rewardApi'
import { customerQueryKeys, useRewardsQuery } from '../../queries/customerQueries'
import { useLanguage } from '../../context/LanguageContext'
import { date, money } from '../../utils/formatters'
import { getOrderPath } from '../../utils/orderRouting'
import { getOrderStatusLabel } from '../../utils/statusLabels'

export default function Rewards() {
  const queryClient = useQueryClient()
  const { isBangla } = useLanguage()
  const t = (bn, en) => (isBangla ? bn : en)
  const locale = isBangla ? 'bn-BD' : 'en-US'
  const { data: summary, isLoading } = useRewardsQuery()
  const [claimingId, setClaimingId] = useState('')
  const [openOptionId, setOpenOptionId] = useState('')

  const benefits = useMemo(() => ([
    {
      icon: FiPackage,
      title: t('অর্ডারভিত্তিক আয়', 'Order-based earning'),
      body: t('ডেলিভার হওয়া অর্ডারের উপর ভিত্তি করে পয়েন্ট যোগ হয়, তাই reward progress real order activity থেকেই তৈরি হয়।', 'Points are added from delivered orders, so reward progress comes directly from real order activity.'),
      tone: 'emerald',
    },
    {
      icon: FiGift,
      title: t('সহজ কুপন ক্লেইম', 'Simple coupon claiming'),
      body: t('যথেষ্ট পয়েন্ট থাকলে reward coupon claim করুন, তারপর checkout-এ code apply করলেই হবে।', 'Claim a reward coupon once you have enough points, then apply the code at checkout.'),
      tone: 'sky',
    },
    {
      icon: FiShield,
      title: t('নিরাপদ অ্যাকাউন্ট ফ্লো', 'Account-safe flow'),
      body: t('প্রতিটি claimed coupon আপনার account-এর জন্যই তৈরি হয়, তাই flow পরিষ্কার এবং নিরাপদ থাকে।', 'Each claimed coupon is created for your own account, keeping the flow clean and safe.'),
      tone: 'violet',
    },
  ]), [isBangla])

  const handleClaim = async (optionId) => {
    try {
      setClaimingId(optionId)
      const response = await rewardApi.claim({ option_id: optionId })
      const couponCode = response.data?.data?.coupon?.code
      toast.success(
        couponCode
          ? t(`রিওয়ার্ড কুপন ${couponCode} তৈরি হয়েছে।`, `Reward coupon ${couponCode} is ready.`)
          : t('রিওয়ার্ড কুপন সফলভাবে তৈরি হয়েছে।', 'Reward coupon claimed successfully.')
      )
      await queryClient.invalidateQueries({ queryKey: customerQueryKeys.rewards })
    } catch (error) {
      const message = error?.response?.data?.errors?.option_id?.[0]
        || error?.response?.data?.errors?.rewards?.[0]
        || error?.response?.data?.message
        || t('রিওয়ার্ড কুপন ক্লেইম করা যায়নি।', 'Reward coupon could not be claimed.')
      toast.error(message)
    } finally {
      setClaimingId('')
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:gap-6">
        <div className="grid gap-4 lg:gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="animate-pulse border border-slate-200 bg-white p-4 sm:p-6 lg:p-8">
            <div className="h-12 w-12 bg-slate-100" />
            <div className="mt-5 h-3 w-28 bg-slate-100" />
            <div className="mt-3 h-10 w-56 bg-slate-100" />
            <div className="mt-4 h-20 w-full bg-slate-100" />
            <div className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
              {[...Array(3)].map((_, index) => <div key={index} className="h-24 bg-slate-100" />)}
            </div>
          </div>
          <div className="grid gap-3 sm:gap-4">
            {[...Array(3)].map((_, index) => <div key={index} className="h-36 animate-pulse border border-slate-200 bg-white sm:h-40" />)}
          </div>
        </div>
        <div className="animate-pulse border border-slate-200 bg-white p-4 sm:p-6">
          {[...Array(4)].map((_, index) => <div key={index} className="mt-3 h-20 bg-slate-100 first:mt-0" />)}
        </div>
      </div>
    )
  }

  const tierTitle = isBangla ? summary?.tier?.title_bn : summary?.tier?.title
  const pointsLabel = t('পয়েন্ট', 'Points')
  const claimOptions = summary?.claim_options || []
  const claimedCoupons = summary?.claimed_coupons || []
  const latestDelivered = summary?.latest_delivered || []
  const recentTransactions = summary?.recent_transactions || []

  return (
    <div className="grid gap-4 sm:gap-6">
      <section className="grid gap-4 lg:gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="relative isolate overflow-hidden border border-amber-200 bg-[linear-gradient(135deg,#0f172a_0%,#111827_55%,#1f2937_100%)] p-4 text-white shadow-[0_24px_70px_-46px_rgba(15,23,42,0.48)] sm:p-6 lg:p-8">
          <HeroBackdrop />
          <div className="relative">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                  {t('মেম্বার টিয়ার', 'Member tier')}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                  {tierTitle}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-[15px]">
                  {t(
                    'প্রতি ২০০ টাকায় ১ পয়েন্ট অর্জন করুন, তারপর সেই পয়েন্ট দিয়ে ব্যক্তিগত reward coupon claim করুন।',
                    'Earn 1 point for every Tk 200 spent, then use those points to claim personal reward coupons.'
                  )}
                </p>
              </div>

              <div className={`inline-flex w-fit items-center gap-2 self-start whitespace-nowrap border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${badgeTone(summary?.tier?.tone)}`}>
                <FiAward className="h-4 w-4" />
                {(summary?.available_points || 0).toLocaleString(locale)} {pointsLabel}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
              <RewardStat label={t('ব্যবহারযোগ্য পয়েন্ট', 'Available points')} value={(summary?.available_points || 0).toLocaleString(locale)} icon={FiStar} />
              <RewardStat label={t('মোট অর্জিত পয়েন্ট', 'Lifetime earned')} value={(summary?.lifetime_earned_points || 0).toLocaleString(locale)} icon={FiPackage} />
              <RewardStat label={t('ক্লেইম করা পয়েন্ট', 'Claimed points')} value={(summary?.claimed_points || 0).toLocaleString(locale)} icon={FiGift} />
            </div>

            <div className="mt-4 border border-white/10 bg-white/5 p-4 sm:mt-6 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-white">
                  {t('পরবর্তী টিয়ারের অগ্রগতি', 'Next tier progress')}
                </p>
                <p className="text-sm text-slate-300">
                  {summary?.tier?.next_points
                    ? t(`${(summary?.next_gap || 0).toLocaleString(locale)} পয়েন্ট বাকি`, `${(summary?.next_gap || 0).toLocaleString(locale)} points remaining`)
                    : t('সর্বোচ্চ টিয়ারে পৌঁছে গেছেন', 'Top tier already reached')}
                </p>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden bg-white/10">
                <div className="h-full bg-emerald-400 transition-all" style={{ width: `${summary?.progress_percent || 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4">
          {benefits.map((item) => (
            <BenefitCard key={item.title} icon={item.icon} title={item.title} body={item.body} tone={item.tone} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] sm:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                {t('ক্লেইম অপশন', 'Claim options')}
              </p>              
            </div>
            <div className="text-sm text-slate-500">
              {t('চেকআউটে কুপন কোড ব্যবহার করুন', 'Use the coupon code at checkout')}
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {claimOptions.map((option) => {
              const loading = claimingId === option.id
              const isOpen = openOptionId === option.id

              return (
                <div
                  key={option.id}
                  className="border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fffe_100%)] p-4 transition hover:border-emerald-300 hover:shadow-[0_18px_45px_-38px_rgba(15,23,42,0.28)] sm:p-5"
                >
                  <button
                    type="button"
                    onClick={() => setOpenOptionId((current) => current === option.id ? '' : option.id)}
                    className="flex w-full items-start justify-between gap-3 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-emerald-200 bg-emerald-50 text-emerald-700">
                          <FiGift className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-950">
                            {isBangla ? option.title_bn : option.title}
                          </h4>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">
                              {option.points_cost.toLocaleString(locale)} {pointsLabel}
                            </p>
                            {/* {!isOpen ? (
                              <p className="text-xs text-slate-500">
                                {t('বিস্তারিত দেখতে ক্লিক করুন', 'Click to view details')}
                              </p>
                            ) : null} */}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* <span className="shrink-0 border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                        {money(option.coupon_amount, locale)}
                      </span> */}
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-slate-200 bg-white text-slate-500">
                        {isOpen ? <RiInformation2Line className="h-4.5 w-4.5" /> : <RiInformation2Line className="h-4.5 w-4.5" />}
                      </span>
                    </div>
                  </button>

                  {isOpen ? (
                    <>
                      <div className="mt-4 grid gap-2 text-sm text-slate-600">
                        <DetailRow
                          label={t('কুপন ভ্যালু', 'Coupon value')}
                          value={money(option.coupon_amount, locale)}
                        />
                        <DetailRow
                          label={t('মিনিমাম অর্ডার', 'Minimum order')}
                          value={money(option.min_subtotal, locale)}
                        />
                        <DetailRow
                          label={t('মেয়াদ', 'Validity')}
                          value={t(`${option.expires_in_days} দিন`, `${option.expires_in_days} days`)}
                        />
                      </div>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className={`text-xs font-medium ${option.can_claim ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {option.can_claim
                            ? t('এই অপশনটি এখনই ক্লেইম করা যাবে', 'This option is ready to claim')
                            : t('এই reward claim করতে আরও পয়েন্ট লাগবে', 'You need more points for this claim')}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleClaim(option.id)}
                          disabled={!option.can_claim || loading}
                          className="inline-flex w-full min-w-33 items-center justify-center border border-slate-950 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500 sm:w-auto"
                        >
                          {loading
                            ? t('তৈরি হচ্ছে...', 'Creating...')
                            : option.can_claim
                              ? t('ক্লেইম করুন', 'Claim now')
                              : t('পয়েন্ট যথেষ্ট নয়', 'Not enough points')}
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        <div className="border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] sm:p-6">
          <div className="flex items-end justify-between border-b border-slate-200 pb-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">
                {t('আপনার রিওয়ার্ড কুপন', 'Your reward coupons')}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {claimedCoupons.length ? claimedCoupons.map((coupon) => (
              <div key={coupon.id} className="border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex max-w-full items-center gap-2 border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-950">
                        <FiTag className="h-4 w-4 text-emerald-600" />
                        <span className="truncate">{coupon.code}</span>
                      </span>
                      <span className={`px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${couponStatusTone(coupon.redemption_status)}`}>
                        {couponStatusLabel(coupon.redemption_status, t)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {isBangla ? (coupon.label_bn || coupon.label) : coupon.label}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {t(
                        `ডিসকাউন্ট ${money(coupon.amount, locale)} | ন্যূনতম অর্ডার ${money(coupon.min_subtotal, locale)}`,
                        `Discount ${money(coupon.amount, locale)} | Minimum order ${money(coupon.min_subtotal, locale)}`
                      )}
                    </p>
                  </div>

                  <div className="text-sm text-slate-500 sm:text-right">
                    <div className="inline-flex items-center gap-2">
                      <FiClock className="h-4 w-4" />
                      {coupon.ends_at ? date(coupon.ends_at, locale) : '-'}
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                {t('এখনও কোনো রিওয়ার্ড কুপন ক্লেইম করা হয়নি।', 'No reward coupons claimed yet.')}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] sm:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
              {t('সাম্প্রতিক সম্পন্ন অর্ডারসমূহ', 'Recent completed orders')}
            </p>
          </div>
          <Link to="/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950 hover:underline">
            {t('অর্ডার হিস্ট্রি খুলুন', 'Open order history')}
            <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 grid gap-3">
          {latestDelivered.map((order) => (
            <Link
              key={order.id}
              to={getOrderPath(order)}
              className="block border border-slate-200 bg-slate-50/80 p-4 transition hover:border-emerald-300 hover:bg-white sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-950">{order.order_number}</p>
                    <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                      {getOrderStatusLabel(order.order_status, isBangla)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{date(order.order_date, locale)}</p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {t('অর্ডার ভ্যালু', 'Order value')}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">{money(order.total_amount, locale)}</div>
                </div>
              </div>
            </Link>
          ))}

          {latestDelivered.length === 0 ? (
            <div className="border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
              {t('এখনও কোনো ডেলিভার হওয়া অর্ডার নেই। প্রথম অর্ডার সম্পন্ন হলেই রিওয়ার্ডস অগ্রগতি দেখা যাবে।', 'No delivered orders yet. Complete your first order to start building rewards progress.')}
            </div>
          ) : null}
        </div>
      </section>

      <section className="border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] sm:p-6">
        <div className="flex items-end justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">
              {t('রিওয়ার্ডস হিস্ট্রি', 'Rewards history')}
            </p>

          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {recentTransactions.length ? recentTransactions.map((item) => (
            <div key={item.id} className="border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-2 border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${transactionTone(item.type)}`}>
                      <FiStar className="h-3.5 w-3.5" />
                      {transactionLabel(item.type, t)}
                    </span>
                    <span className="text-sm font-semibold text-slate-950">
                      {item.type === 'reversed' ? '-' : '+'}{item.points.toLocaleString(locale)} {pointsLabel}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-slate-950">
                    {isBangla ? (item.title_bn || item.title) : item.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {isBangla ? (item.description_bn || item.description) : item.description}
                  </p>
                </div>

                <div className="text-sm text-slate-500 sm:text-right">
                  <div>{date(item.created_at, locale)}</div>
                  {item.coupon?.code ? <div className="mt-1 font-medium text-slate-700">{item.coupon.code}</div> : null}
                </div>
              </div>
            </div>
          )) : (
            <div className="border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
              {t('এখনও কোনো রিওয়ার্ড ট্রানজ্যাকশন নেই।', 'No reward transactions yet.')}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function RewardStat({ label, value, icon: Icon }) {
  return (
    <div className="border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm sm:p-4">
      <div className="flex items-center justify-between gap-1.5">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-300">{label}</div>
          <div className="mt-1 text-lg font-semibold text-white sm:text-2xl">{value}</div>
        </div>
        <span className="inline-flex h-7 w-7 items-center justify-center text-slate-100">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
      </div>
    </div>
  )
}

function BenefitCard({ icon: Icon, title, body, tone = 'emerald' }) {
  return (
    <div className={`border bg-white p-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] sm:p-6 ${surfaceTone(tone)}`}>
      <div className="flex items-center gap-3">
        <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center ${iconTone(tone)}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-slate-950 sm:text-lg">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500 sm:leading-7">{body}</p>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border border-slate-200 bg-slate-50 px-3 py-2">
      <span>{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  )
}

function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -right-12 -top-10 h-36 w-36 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
      <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-emerald-400/10 blur-3xl" />
    </div>
  )
}

function badgeTone(tone) {
  const tones = {
    amber: 'border-amber-300/20 bg-amber-400/10 text-amber-200',
    slate: 'border-slate-300/20 bg-slate-100/10 text-slate-200',
    emerald: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200',
  }

  return tones[tone] || tones.emerald
}

function surfaceTone(tone) {
  const tones = {
    emerald: 'border-emerald-200 bg-[linear-gradient(180deg,#ffffff_0%,#effcf6_100%)]',
    sky: 'border-sky-200 bg-[linear-gradient(180deg,#ffffff_0%,#eef8ff_100%)]',
    violet: 'border-violet-200 bg-[linear-gradient(180deg,#ffffff_0%,#f5f3ff_100%)]',
  }

  return tones[tone] || tones.emerald
}

function iconTone(tone) {
  const tones = {
    emerald: 'border border-emerald-200 bg-emerald-100/80 text-emerald-700',
    sky: 'border border-sky-200 bg-sky-100/80 text-sky-700',
    violet: 'border border-violet-200 bg-violet-100/80 text-violet-700',
  }

  return tones[tone] || tones.emerald
}

function couponStatusTone(status) {
  if (status === 'used') return 'border border-slate-200 bg-slate-100 text-slate-700'
  if (status === 'expired') return 'border border-rose-200 bg-rose-50 text-rose-700'
  return 'border border-emerald-200 bg-emerald-50 text-emerald-700'
}

function couponStatusLabel(status, t) {
  if (status === 'used') return t('ব্যবহৃত', 'Used')
  if (status === 'expired') return t('মেয়াদোত্তীর্ণ', 'Expired')
  return t('ব্যবহারযোগ্য', 'Available')
}

function transactionTone(type) {
  if (type === 'claimed') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (type === 'reversed') return 'border-rose-200 bg-rose-50 text-rose-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function transactionLabel(type, t) {
  if (type === 'claimed') return t('ক্লেইম', 'Claimed')
  if (type === 'reversed') return t('সমন্বয়', 'Reversed')
  return t('অর্জিত', 'Earned')
}
