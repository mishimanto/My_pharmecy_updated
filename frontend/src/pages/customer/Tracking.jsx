import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiClock, FiPackage, FiTruck, FiUser } from 'react-icons/fi'
import { orderApi } from '../../api/orderApi'
import PageHeader from '../../components/common/PageHeader'
import { useLanguage } from '../../context/LanguageContext'
import { getDeliveryStatusLabel, getOrderStatusLabel } from '../../utils/statusLabels'

export default function Tracking() {
  const { id } = useParams()
  const { isBangla } = useLanguage()
  const t = useCallback((bn, en) => (isBangla ? bn : en), [isBangla])
  const [tracking, setTracking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    orderApi.tracking(id)
      .then((res) => setTracking(res.data.data))
      .catch(() => toast.error(t('ট্র্যাকিং তথ্য লোড করা যায়নি।', 'Tracking information could not be loaded.')))
      .finally(() => setLoading(false))
  }, [id, t])

  if (loading) return <p className="text-sm text-slate-500">{t('ট্র্যাকিং লোড হচ্ছে...', 'Loading tracking...')}</p>
  if (!tracking) return <p className="text-sm text-slate-500">{t('ট্র্যাকিং তথ্য পাওয়া যায়নি।', 'Tracking information not found.')}</p>

  const delivery = tracking.delivery

  return (
    <>
      <PageHeader
        title={t('ডেলিভারি ট্র্যাকিং', 'Delivery tracking')}
        subtitle={`${tracking.order_number} • ${getOrderStatusLabel(tracking.order_status, isBangla)}`}
        action={<Link to="/support" className="border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">{t('সাহায্য লাগবে?', 'Need help?')}</Link>}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">{t('ট্র্যাকিং স্টেট', 'Tracking state')}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{t('বর্তমান ডেলিভারি অবস্থা', 'Current delivery visibility.')}</h2>
          </div>

          {!delivery ? (
            <div className="mt-5 border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-500">
              {t(
                'এই অর্ডারের জন্য এখনো ডেলিভারি তৈরি হয়নি। অর্ডারটি এখনো রিভিউ, কনফার্মেশন বা প্যাকিং পর্যায়ে থাকতে পারে।',
                'Delivery has not been created for this order yet. The order can still be under review, confirmation, or packing.',
              )}
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <TrackingBlock label={t('ট্র্যাকিং নাম্বার', 'Tracking number')} value={delivery.tracking_no} icon={FiPackage} />
              <TrackingBlock label={t('ডেলিভারি স্ট্যাটাস', 'Delivery status')} value={getDeliveryStatusLabel(delivery.delivery_status, isBangla)} icon={FiTruck} tone={getDeliveryStatusTone(delivery.delivery_status)} />
              <TrackingBlock label={t('অ্যাসাইন্ড রাইডার', 'Assigned rider')} value={delivery.rider?.full_name || t('এখনো অ্যাসাইন হয়নি', 'Not assigned')} icon={FiUser} />
              <TrackingBlock label={t('অর্ডার স্ট্যাটাস', 'Order status')} value={getOrderStatusLabel(tracking.order_status, isBangla)} icon={FiClock} tone={getOrderStatusTone(tracking.order_status)} />
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">{t('পরের ধাপ', 'What to do next')}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{t('ডেলিভারি ও সাপোর্ট কাছে রাখুন', 'Keep delivery and support close.')}</h2>
            <p className="mt-3 text-sm leading-8 text-slate-500">
              {t(
                'ডেলিভারি দেরি হলে বা ট্র্যাকিং স্টেট আপনার প্রত্যাশার সাথে না মিললে সাপোর্ট খুলে এই অর্ডার রেফারেন্স দিন।',
                'If delivery is delayed or the tracking state does not match what you expected, open support and include this order reference.',
              )}
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Link to="/support" className="flex items-center justify-between bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                {t('সাপোর্ট সেন্টার খুলুন', 'Open support center')}
                <FiArrowRight className="h-4 w-4" />
              </Link>
              <Link to={`/orders/${id}`} className="flex items-center justify-between border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
                {t('অর্ডার ডিটেইলসে ফিরে যান', 'Back to order details')}
                <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}

function TrackingBlock({ label, value, icon: Icon, tone = 'slate' }) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    slate: 'border-slate-200 bg-white text-slate-950',
  }

  return (
    <div className="border border-slate-200 bg-slate-50 p-5">
      <div className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-white text-slate-950">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-sm text-slate-500">{label}</div>
      <div className={`mt-3 inline-flex border px-3 py-2 text-base font-semibold ${tones[tone] || tones.slate}`}>{value}</div>
    </div>
  )
}

function getOrderStatusTone(status) {
  if (['delivered'].includes(status)) return 'emerald'
  if (['cancelled', 'returned', 'refunded'].includes(status)) return 'rose'
  if (['confirmed', 'processing', 'packed', 'out_for_delivery'].includes(status)) return 'sky'
  if (['prescription_review', 'pending_confirmation', 'pending'].includes(status)) return 'amber'
  return 'slate'
}

function getDeliveryStatusTone(status) {
  if (['delivered'].includes(status)) return 'emerald'
  if (['failed', 'returned'].includes(status)) return 'rose'
  if (['assigned', 'picked', 'picked_up', 'out_for_delivery'].includes(status)) return 'sky'
  if (['pending'].includes(status)) return 'amber'
  return 'slate'
}
