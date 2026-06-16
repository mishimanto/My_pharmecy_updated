import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiCopy, FiPhone, FiSmartphone, FiUpload, FiX } from 'react-icons/fi'
import PageHeader from '../../components/common/PageHeader'
import { useLanguage } from '../../context/LanguageContext'
import { orderApi } from '../../api/orderApi'
import { money } from '../../utils/formatters'
import { getOrderPath } from '../../utils/orderRouting'
import { getOrderStatusLabel, getPaymentStatusLabel } from '../../utils/statusLabels'
import { readCustomerCache, writeCustomerCache } from '../../utils/customerDataCache'

export default function OrderPayment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isBangla } = useLanguage()
  const t = useCallback((bn, en) => (isBangla ? bn : en), [isBangla])
  const locale = isBangla ? 'bn-BD' : 'en-US'
  const cacheKey = `order_payment_${id}`
  const [order, setOrder] = useState(() => readCustomerCache(cacheKey, null))
  const [loading, setLoading] = useState(() => readCustomerCache(cacheKey, null) === null)
  const [submitting, setSubmitting] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [screenshot, setScreenshot] = useState(null)

  const PAYMENT_BRANDS = {
    BKASH: {
      logoUrl: 'https://cdn.brandfetch.io/id_4D40okd/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1773019907118',
      badge: 'bK',
      brandClass: 'text-[#e2136e]',
    },
    NAGAD: {
      logoUrl: 'https://cdn.brandfetch.io/idPKXOsXfF/w/512/h/512/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1778051284059',
      badge: 'N',
      brandClass: 'text-[#f28c16]',
    },
  }

  useEffect(() => {
    let mounted = true
    setLoading((prev) => (prev || readCustomerCache(cacheKey, null) === null))

    orderApi.show(id)
      .then((response) => {
        if (!mounted) return
        const orderData = response.data.data
        setOrder(orderData)
        writeCustomerCache(cacheKey, orderData)
      })
      .catch(() => mounted && toast.error(t('পেমেন্ট পেজ লোড করা যায়নি।', 'The payment page could not be loaded.')))
      .finally(() => mounted && setLoading(false))

    return () => { mounted = false }
  }, [id, t, cacheKey])

  const screenshotUrl = useMemo(() => (screenshot ? URL.createObjectURL(screenshot) : ''), [screenshot])
  const isBkash = order?.payment_method === 'BKASH'
  const paymentLabel = isBkash ? 'bKash' : 'Nagad'
  const paymentNumber = order?.payment_number || '01700000000'
  const dialCode = order?.payment_dial_code || (isBkash ? '*247#' : '*167#')
  const accent = isBkash
    ? {
      badge: 'text-[#e2136e]',
      soft: 'bg-[linear-gradient(135deg,#fff1f7,#ffe3ef)]',
      card: 'border-[#f7bfd6]',
      strong: 'bg-[#e2136e] text-white',
      muted: 'bg-[#fff4f8] text-[#b80f58]',
    }
    : {
      badge: 'text-[#f28c16]',
      soft: 'bg-[linear-gradient(135deg,#fff6e9,#ffe5c4)]',
      card: 'border-[#f6cc95]',
      strong: 'bg-[#f28c16] text-white',
      muted: 'bg-[#fff7ed] text-[#c56d0d]',
    }

  const appSteps = [
    t(`আপনার ${paymentLabel} app খুলুন।`, `Open your ${paymentLabel} app.`),
    t('Send Money সিলেক্ট করুন।', 'Choose Send Money.'),
    t(`Receiver number হিসেবে ${paymentNumber} দিন এবং মোট টাকার পুরো পেমেন্ট করুন।`, `Use ${paymentNumber} as the receiver number and pay the full amount.`),
    t('পেমেন্ট শেষ হলে Transaction ID কপি করুন এবং screenshot নিন।', 'After payment, copy the Transaction ID and take a screenshot.'),
  ]

  const dialSteps = [
    t(`মোবাইলে ${dialCode} ডায়াল করুন।`, `Dial ${dialCode} on your phone.`),
    t('Send Money সিলেক্ট করুন।', 'Choose Send Money.'),
    t(`Receiver number হিসেবে ${paymentNumber} দিন, তারপর amount লিখুন, তারপর PIN দিন।`, `Enter ${paymentNumber} as the receiver number, then enter the amount, then your PIN.`),
    t('কনফার্ম SMS থেকে Transaction ID নিয়ে এই পেজে জমা দিন।', 'Take the Transaction ID from the confirmation SMS and submit it here.'),
  ]

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(paymentNumber)
      toast.success(t('পেমেন্ট নাম্বার কপি হয়েছে।', 'Payment number copied.'))
    } catch {
      toast.error(t('নাম্বার কপি করা যায়নি।', 'Could not copy the number.'))
    }
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!transactionId.trim()) {
      toast.error(t('ট্রানজ্যাকশন আইডি দিতে হবে।', 'Transaction ID is required.'))
      return
    }

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('transaction_id', transactionId.trim())

      if (screenshot) {
        formData.append('payment_screenshot', screenshot)
      }

      const response = await orderApi.submitPaymentProof(id, formData)
      setOrder(response.data.data)
      toast.success(t('পেমেন্ট প্রুফ জমা হয়েছে। অ্যাডমিন রিভিউ করবে।', 'Payment proof submitted. The admin will review it.'))
      navigate(getOrderPath(order || id))
    } catch (error) {
      toast.error(error.response?.data?.message || t('পেমেন্ট প্রুফ জমা দেয়া যায়নি।', 'Payment proof could not be submitted.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-70 items-center justify-center">
        <div className="inline-flex items-center gap-3 px-4 py-3 text-md font-medium text-slate-700">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
          {t('অনুগ্রহ করে অপেক্ষা করুন...', 'Please wait...')}
        </div>
      </div>
    )
  }

  if (!order) {
    return <p className="text-sm text-slate-500">{t('অর্ডার পাওয়া যায়নি।', 'Order not found.')}</p>
  }

  if (order.payment_method === 'COD') {
    return (
      <>
        <PageHeader
          title={t('ক্যাশ অন ডেলিভারি', 'Cash on delivery')}
          subtitle={t('এই অর্ডারে আগাম পেমেন্ট লাগবে না। ডেলিভারির সময় ইনভয়েস দেয়া হবে।', 'No advance payment is required for this order. The invoice will be given during delivery.')}
        />
        <Link to={getOrderPath(order)} className="inline-flex items-center gap-2 bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
          {t('অর্ডার ডিটেইলে যান', 'Go to order details')}
          <FiArrowRight className="h-4 w-4" />
        </Link>
      </>
    )
  }

  return (
    <>
      {/* <PageHeader
        title={t('ম্যানুয়াল পেমেন্ট', 'Manual payment')}
        subtitle={t(
          'বাম পাশে app/dial payment instruction আছে, ডান পাশে transaction ID আর screenshot submit করুন।',
          'App and dial payment instructions are on the left, while the transaction ID and screenshot form stays on the right.',
        )}
      /> */}

      <div className="grid gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1.08fr)_400px]">
        <section className="space-y-6">
          <div className={`overflow-hidden border ${accent.card} ${accent.soft} p-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)] sm:p-6`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                {/* <div className={`text-sm font-semibold uppercase tracking-[0.18em] ${accent.badge}`}>
                  {t('পেমেন্ট রিসিভার', 'Payment receiver')}
                </div> */}
                <h2 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  {order?.payment_method && PAYMENT_BRANDS[order.payment_method] ? (
                    <img src={PAYMENT_BRANDS[order.payment_method].logoUrl} alt={order.payment_method} className="h-10 w-10" />
                  ) : null}
                  {paymentLabel}
                </h2>
                {/* <p className="mt-2 text-sm text-slate-600">{accountName}</p> */}
              </div>
              <div className={`w-full px-4 py-2 text-center text-sm font-semibold sm:w-auto ${accent.strong}`}>
                {order.order_number}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="border border-white/70 bg-white/90 p-4 backdrop-blur sm:p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {t('পেমেন্ট নাম্বার', 'Payment number')}
                </div>
                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <div className="min-w-0 break-all text-2xl font-semibold text-slate-950 sm:text-3xl sm:tracking-[0.06em]">
                    <span className={`inline-flex items-center gap-3`}>{/* logo + number */}
                      <span>{paymentNumber}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={copyNumber}
                    className="inline-flex w-full shrink-0 items-center justify-center gap-2 border border-gay/80 bg-gray-100 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-auto sm:py-4"
                  >
                    <FiCopy className="h-4 w-4" />
                    {t('নাম্বার কপি', 'Copy number')}
                  </button>
                </div>
              </div>
              
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <HeroStat label={t('মোট টাকা', 'Total amount')} value={money(order.total_amount, locale)} />
              <HeroStat label={t('পেমেন্ট স্ট্যাটাস', 'Payment status')} value={<StatusText status={order.payment_status} type="payment" isBangla={isBangla} />} />
              <HeroStat label={t('অর্ডার স্ট্যাটাস', 'Order status')} value={<StatusText status={order.order_status} type="order" isBangla={isBangla} />} />
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <InstructionCard
              icon={FiSmartphone}
              title={t('অ্যাপ দিয়ে পেমেন্ট', 'Pay using the app')}
              steps={appSteps}
              accent={accent}
            />
            <InstructionCard
              icon={FiPhone}
              title={t('ডায়াল করে পেমেন্ট', 'Pay by dial code')}
              steps={dialSteps}
              accent={accent}
            />
          </div>

          {/* <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-10 w-10 items-center justify-center border ${accent.card} bg-white text-slate-900`}>
                  <FiCheckCircle className="h-5 w-5" />
                </span>
                <div>
                  <div className={`text-sm font-semibold uppercase tracking-[0.18em] ${accent.badge}`}>{t('প্রুফ সাবমিট', 'Proof checklist')}</div>
                  <h3 className="mt-1 text-xl font-semibold text-slate-950">{t('এই দুইটি জিনিস অবশ্যই দিন', 'Please submit these two items')}</h3>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <RequirementRow
                  icon={FiHash}
                  title={t('ট্রানজ্যাকশন আইডি', 'Transaction ID')}
                  body={t('SMS বা app history থেকে exact ID কপি করুন।', 'Copy the exact ID from the SMS or app history.')}
                />
                <RequirementRow
                  icon={FiImage}
                  title={t('পেমেন্ট স্ক্রিনশট', 'Payment screenshot')}
                  body={t('Amount, receiver number, আর transaction ID যেন clear দেখা যায়।', 'Make sure the amount, receiver number, and transaction ID are clearly visible.')}
                />
              </div>
            </div>

            <div className={`border ${accent.card} ${accent.muted} p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]`}>
              <div className="text-sm font-semibold uppercase tracking-[0.18em]">
                {t('গুরুত্বপূর্ণ', 'Important')}
              </div>
              <div className="mt-3 space-y-3 text-sm leading-7">
                <p>{t('ভুল নাম্বারে পেমেন্ট করলে admin verify করতে পারবে না।', 'If you pay the wrong number, the admin cannot verify it.')}</p>
                <p>{t('প্রুফ জমা দিলেও order আগে admin review করবে।', 'Even after proof submission, the order will still be reviewed by admin first.')}</p>
                <p>{t('পেমেন্ট verify হলে memo ইমেইলে যাবে।', 'Once the payment is verified, the memo will be sent by email.')}</p>
              </div>
            </div>
          </div> */}
        </section>

        <aside>
          <form onSubmit={submit} className="border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] sm:p-6 xl:sticky xl:top-24">
            <div className="border-b border-slate-200 pb-4">
              <p className={`text-sm text-center font-semibold uppercase tracking-[0.18em] ${accent.badge}`}>{t('পেমেন্ট ডিটেইলস', 'Payment details')}</p>
              {/* <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{t('প্রুফ জমা দিন', 'Submit your proof')}</h2> */}
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700">{t('ট্রানজ্যাকশন আইডি', 'Transaction ID')}</label>
                <input
                  value={transactionId}
                  onChange={(event) => setTransactionId(event.target.value)}
                  className="mt-2 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none"
                  placeholder={t('যেমন: B8K7R4T2', 'For example: B8K7R4T2')}
                />
              </div>

              <label className={`block cursor-pointer border border-dashed ${accent.card} bg-slate-50 p-4 transition hover:bg-white sm:p-6`}>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => setScreenshot(event.target.files?.[0] || null)}
                />
                <div className="flex flex-col items-center justify-center text-center">
                  <span className={`inline-flex h-12 w-12 items-center justify-center border ${accent.card} bg-white text-slate-900`}>
                    <FiUpload className="h-5 w-5" />
                  </span>
                  <div className="mt-4 text-sm font-semibold text-slate-950 sm:text-base">
                    {screenshot ? t('নতুন স্ক্রিনশট দিতে ক্লিক করুন', 'Click to choose a new screenshot') : t('পেমেন্ট স্ক্রিনশট আপলোড করুন (ঐচ্ছিক)', 'Upload the payment screenshot (optional)')}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">{t('JPG, PNG অথবা WebP', 'JPG, PNG, or WebP')}</div>
                </div>
              </label>

              {screenshot ? (
                <div className="border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 break-all text-sm font-semibold text-slate-950">{screenshot.name}</div>
                    <button type="button" onClick={() => setScreenshot(null)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-slate-300 bg-white text-slate-700">
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                  <img src={screenshotUrl} alt={t('পেমেন্ট স্ক্রিনশট', 'Payment screenshot')} className="max-h-[280px] w-full object-contain sm:max-h-[340px]" />
                </div>
              ) : null}

              <button disabled={submitting} className={`w-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${accent.strong}`}>
                {submitting ? t('জমা হচ্ছে...', 'Submitting...') : t('পেমেন্টের তথ্য জমা দিন', 'Submit Payment Details')}
              </button>

              <Link to={getOrderPath(order)} className="flex items-center justify-between border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
                {t('অর্ডার ডিটেইলসে ফিরে যান', 'Back to order details')}
                <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </form>
        </aside>
      </div>
    </>
  )
}

function InstructionCard({ icon: Icon, title, steps, accent }) {
  return (
    <div className={`border ${accent.card} bg-white p-4 shadow-[0_18px_45px_-42px_rgba(15,23,42,0.28)] sm:p-5`}>
      <div className={`inline-flex h-11 w-11 items-center justify-center ${accent.strong}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
      <div className="mt-4 space-y-3">
        {steps.map((step, index) => (
          <div key={step} className="flex items-start gap-3 text-sm leading-7 text-slate-600">
            <span className={`inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${accent.muted}`}>
              {index + 1}
            </span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HeroStat({ label, value }) {
  return (
    <div className="border border-white/80 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-slate-950">{value}</div>
    </div>
  )
}

function StatusText({ status, type = 'payment', isBangla = false }) {
  const cls = (() => {
    if (type === 'payment') {
      if (status === 'awaiting_proof') return 'text-rose-600'
      if (status === 'paid') return 'text-emerald-600'
      if (status === 'under_review') return 'text-amber-600'
      return 'text-slate-700'
    }

    // order status
    switch (status) {
      case 'pending_confirmation':
      case 'pending':
        return 'text-amber-600'
      case 'processing':
      case 'packed':
      case 'out_for_delivery':
        return 'text-sky-600'
      case 'delivered':
        return 'text-emerald-600'
      case 'cancelled':
      case 'returned':
        return 'text-rose-600'
      default:
        return 'text-slate-700'
    }
  })()

  const label = type === 'payment' ? getPaymentStatusLabel(status, isBangla) : getOrderStatusLabel(status, isBangla)

  return <span className={`font-semibold ${cls}`}>{label}</span>
}
