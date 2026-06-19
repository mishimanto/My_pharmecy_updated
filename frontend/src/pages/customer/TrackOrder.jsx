import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiMapPin } from 'react-icons/fi'
import { orderApi } from '../../api/orderApi'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { getDeliveryStatusLabel, getOrderStatusLabel } from '../../utils/statusLabels'

export default function TrackOrder() {
  const { ensureGuestToken, customer } = useCustomerAuth()
  const { isBangla } = useLanguage()
  const t = useCallback((bn, en) => (isBangla ? bn : en), [isBangla])
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [tracking, setTracking] = useState(null)

  const submit = async (event) => {
    event.preventDefault()
    if (!orderId.trim()) return

    ensureGuestToken()
    setLoading(true)

    try {
      const res = await orderApi.tracking(orderId.trim())
      setTracking(res.data.data)
    } catch (error) {
      setTracking(null)
      toast.error(error.response?.data?.message || t('ট্র্যাকিং তথ্য লোড করা যায়নি।', 'Tracking information could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }

  const delivery = tracking?.delivery
  const orderStatusLabel = tracking ? getOrderStatusLabel(tracking.order_status, isBangla) : ''
  const deliveryStatusLabel = getDeliveryStatusLabel(delivery?.delivery_status, isBangla)

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <section className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">{t('ট্র্যাকিং সার্চ', 'Tracking lookup')}</p>
          </div>

          <form onSubmit={submit} className="mt-5">
            <label className="text-sm font-medium text-slate-700">{t('অর্ডার আইডি', 'Order ID')}</label>
            <input
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              className="mt-2 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none"
              placeholder={t('আপনার অর্ডার আইডি লিখুন', 'Enter your order ID')}
            />
            <button disabled={loading} className="mt-4 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
              {loading ? t('ট্র্যাকিং দেখা হচ্ছে...', 'Checking tracking...') : t('এই অর্ডার ট্র্যাক করুন', 'Track this order')}
            </button>
          </form>
        </section>

        <section className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">{t('ট্র্যাকিং রেজাল্ট', 'Tracking result')}</p>
          </div>

          {!tracking && !loading ? (
            <div className="mt-5 border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-500">
              {t(
                'ট্র্যাকিং তথ্য দেখতে একটি অর্ডার আইডি দিন।',
                'Enter an order ID to load tracking data.',
              )}{' '}
              {customer
                ? t('আপনার অর্ডার হিস্টোরি থেকেও ট্র্যাকিং খুলতে পারবেন।', 'You can also open tracking from your order history.')
                : t('গেস্ট হিসেবে অর্ডার করলে একই ব্রাউজার সেশন ব্যবহার করুন।', 'If you ordered as a guest, use the same browser session that placed the order.')}
            </div>
          ) : null}

          {tracking ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <TrackingCard label={t('অর্ডার নাম্বার', 'Order number')} value={tracking.order_number} />
                <TrackingCard
                  label={t('অর্ডার স্ট্যাটাস', 'Order status')}
                  value={orderStatusLabel}
                  tone={getOrderStatusTone(tracking.order_status)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <TrackingCard
                  label={t('ট্র্যাকিং নাম্বার', 'Tracking number')}
                  value={delivery?.tracking_no || t('এখনো তৈরি হয়নি', 'Not created yet')}
                />
                <TrackingCard
                  label={t('ডেলিভারি স্ট্যাটাস', 'Delivery status')}
                  value={deliveryStatusLabel}
                  tone={getDeliveryStatusTone(delivery?.delivery_status)}
                />
              </div>

              <div className="border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  <FiMapPin className="h-4 w-4" />
                  {t('ট্র্যাকিং গাইড', 'Tracking guidance')}
                </div>
                <p className="mt-3 text-sm leading-8 text-slate-600">
                  {t(
                    `এই অর্ডার নিয়ে বেশি সাহায্য বা ডেলিভারি ব্যাখ্যা লাগলে সাপোর্ট সেন্টারে গিয়ে অর্ডার আইডি ${orderId} উল্লেখ করুন।`,
                    `If this order needs more attention or delivery clarification, open the support center and reference order ID ${orderId}.`,
                  )}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link to="/support" className="inline-flex items-center gap-2 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                    {t('সাপোর্টে যোগাযোগ করুন', 'Contact support')}
                    <FiArrowRight className="h-4 w-4" />
                  </Link>
                  {customer ? (
                    <Link to="/orders" className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
                      {t('অর্ডার হিস্টোরি খুলুন', 'Open order history')}
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </>
  )
}

function TrackingCard({ label, value, tone = 'slate' }) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-950',
  }

  return (
    <div className="border border-slate-200 bg-slate-50 p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-3 inline-flex border px-3 py-2 text-base font-semibold ${tones[tone] || tones.slate}`}>{value}</div>
    </div>
  )
}

function getOrderStatusTone(status) {
  if (['delivered'].includes(status)) return 'emerald'
  if (['cancelled', 'returned', 'refunded'].includes(status)) return 'rose'
  if (['confirmed', 'processing'].includes(status)) return 'sky'
  if (['prescription_review', 'pending_confirmation', 'pending'].includes(status)) return 'amber'
  return 'slate'
}

function getDeliveryStatusTone(status) {
  if (['delivered'].includes(status)) return 'emerald'
  if (['failed', 'returned'].includes(status)) return 'rose'
  if (['pending'].includes(status)) return 'amber'
  return 'slate'
}
