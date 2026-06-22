import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiCamera, FiFileText, FiHeart, FiMapPin, FiMessageSquare } from 'react-icons/fi'
import { notificationApi } from '../../api/notificationApi'
import { orderApi } from '../../api/orderApi'
import { prescriptionApi } from '../../api/prescriptionApi'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { readCustomerCache, writeCustomerCache } from '../../utils/customerDataCache'
import { date } from '../../utils/formatters'
import { getOrderPath } from '../../utils/orderRouting'
import { getOrderStatusLabel, getPaymentStatusLabel } from '../../utils/statusLabels'

const ACCOUNT_ORDERS_CACHE_KEY = 'orders_list'
const ACCOUNT_NOTIFICATIONS_CACHE_KEY = 'notifications_list'
const ACCOUNT_PRESCRIPTIONS_CACHE_KEY = 'prescriptions_list'

function formFromCustomer(customer) {
  return {
    full_name: customer?.full_name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    date_of_birth: customer?.date_of_birth || '',
    gender: customer?.gender || '',
  }
}

export default function Account() {
  const { customer, updateProfile } = useCustomerAuth()
  const { isBangla } = useLanguage()
  const t = (bn, en) => (isBangla ? bn : en)
  const locale = isBangla ? 'bn-BD' : 'en-US'
  const banglaFontClass = isBangla ? 'font-bangla' : ''
  const fileInputRef = useRef(null)
  const previewUrlRef = useRef('')
  const [form, setForm] = useState(() => formFromCustomer(customer))
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(customer?.avatar || '')
  const [saving, setSaving] = useState(false)
  const [orders, setOrders] = useState(() => readCustomerCache(ACCOUNT_ORDERS_CACHE_KEY, []))
  const [notifications, setNotifications] = useState(() => readCustomerCache(ACCOUNT_NOTIFICATIONS_CACHE_KEY, []))
  const [prescriptions, setPrescriptions] = useState(() => readCustomerCache(ACCOUNT_PRESCRIPTIONS_CACHE_KEY, []))
  const quickLinks = useMemo(() => ([
    { to: '/addresses', title: t('সেভ করা ঠিকানা', 'Saved addresses'), body: t('দ্রুত চেকআউটের জন্য ডিফল্ট ডেলিভারি ঠিকানা ম্যানেজ করুন।', 'Manage default delivery addresses for quicker checkout.'), icon: FiMapPin, tone: 'emerald' },
    { to: '/prescriptions', title: t('প্রেসক্রিপশন', 'Prescriptions'), body: t('আপলোড করা প্রেসক্রিপশন ও ফার্মাসিস্ট রিভিউ ট্র্যাক করুন।', 'Track uploaded prescription files and pharmacist review.'), icon: FiFileText, tone: 'amber' },
    { to: '/support', title: t('সাপোর্ট টিকিট', 'Support tickets'), body: t('সমস্যা জানান, প্রশ্ন করুন, এবং সাপোর্ট থ্রেড চালিয়ে যান।', 'Open complaints, ask questions, and continue support threads.'), icon: FiMessageSquare, tone: 'violet' },
    { to: '/rewards', title: t('রিওয়ার্ড সেন্টার', 'Rewards center'), body: t('অর্ডার অ্যাক্টিভিটি থেকে আপনার মেম্বার পয়েন্ট সামারি দেখুন।', 'View your member points summary from order activity.'), icon: FiHeart, tone: 'rose' },
  ]), [isBangla])

  useEffect(() => {
    setForm(formFromCustomer(customer))

    if (!avatarFile) {
      setAvatarPreview(customer?.avatar || '')
    }
  }, [avatarFile, customer])

  useEffect(() => {
    Promise.allSettled([orderApi.list(), notificationApi.list(), prescriptionApi.list()]).then((results) => {
      const [ordersResult, notificationsResult, prescriptionsResult] = results

      if (ordersResult.status === 'fulfilled') {
        const nextOrders = ordersResult.value.data.data?.data || []
        setOrders(nextOrders)
        writeCustomerCache(ACCOUNT_ORDERS_CACHE_KEY, nextOrders)
      }
      if (notificationsResult.status === 'fulfilled') {
        const nextNotifications = notificationsResult.value.data.data?.data || []
        setNotifications(nextNotifications)
        writeCustomerCache(ACCOUNT_NOTIFICATIONS_CACHE_KEY, nextNotifications)
      }
      if (prescriptionsResult.status === 'fulfilled') {
        const nextPrescriptions = prescriptionsResult.value.data.data?.data || []
        setPrescriptions(nextPrescriptions)
        writeCustomerCache(ACCOUNT_PRESCRIPTIONS_CACHE_KEY, nextPrescriptions)
      }
    })
  }, [])

  useEffect(() => () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  const stats = useMemo(() => {
    const activeOrders = orders.filter((order) => !['delivered', 'cancelled', 'returned', 'refunded'].includes(order.order_status)).length
    const unreadNotifications = notifications.filter((item) => item.status !== 'read').length
    const approvedPrescriptions = prescriptions.filter((item) => item.status === 'approved').length

    return {
      activeOrders,
      unreadNotifications,
      approvedPrescriptions,
      addressCount: customer?.addresses?.length || 0,
    }
  }, [customer?.addresses?.length, notifications, orders, prescriptions])

  const revokePreviewUrl = () => {
    if (!previewUrlRef.current) {
      return
    }

    URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = ''
  }

  const openAvatarPicker = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0] || null

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error(t('একটি সঠিক ছবি ফাইল নির্বাচন করুন।', 'Please choose a valid image file.'))
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('ছবির সাইজ ৫ MB বা কম হতে হবে।', 'Image size must be 5 MB or less.'))
      event.target.value = ''
      return
    }

    revokePreviewUrl()

    const objectUrl = URL.createObjectURL(file)
    previewUrlRef.current = objectUrl

    setAvatarFile(file)
    setAvatarPreview(objectUrl)
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)

    try {
      const payload = new FormData()
      payload.append('full_name', form.full_name)
      payload.append('phone', form.phone)
      payload.append('email', form.email || '')
      payload.append('date_of_birth', form.date_of_birth || '')
      payload.append('gender', form.gender || '')

      if (avatarFile) {
        payload.append('avatar', avatarFile)
      }

      const updatedCustomer = await updateProfile(payload)

      revokePreviewUrl()
      setAvatarFile(null)
      setAvatarPreview(updatedCustomer?.avatar || '')

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      toast.success(t('প্রোফাইল সফলভাবে আপডেট হয়েছে।', 'Profile updated successfully.'))
    } catch (error) {
      toast.error(error.response?.data?.message || t('প্রোফাইল আপডেট করা যায়নি।', 'Profile could not be updated.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={banglaFontClass}>
      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="relative isolate overflow-hidden border border-sky-200 bg-[linear-gradient(180deg,#fdfefe_0%,#eef8ff_100%)] shadow-[0_24px_60px_-42px_rgba(14,116,144,0.28)]">
          <BubbleBackdrop tone="sky" />
          <div className="relative flex flex-col items-start gap-4 border-b border-sky-100/80 p-4 sm:flex-row sm:items-center sm:p-6">
            <div className="shrink-0">
              <button
                type="button"
                onClick={openAvatarPicker}
                className="group relative block h-12 w-12 overflow-hidden rounded-full border border-sky-200 bg-white/90 shadow-[0_18px_30px_-24px_rgba(14,116,144,0.5)] focus:outline-none focus:ring-2 focus:ring-sky-300/40"
                aria-label={t('প্রোফাইল ছবি আপলোড করুন', 'Upload profile photo')}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt={form.full_name || customer?.full_name || t('কাস্টমার অ্যাভাটার', 'Customer avatar')} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-slate-100 text-xl font-semibold uppercase text-slate-700">
                    {initials(form.full_name || customer?.full_name || 'Customer')}
                  </span>
                )}

                <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/55 group-hover:opacity-100 group-focus-visible:bg-slate-950/55 group-focus-visible:opacity-100">
                  <FiCamera className="h-5 w-5" />
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">{t('অ্যাকাউন্ট সেন্টার', 'Account center')}</p>
              <h2 className="truncate text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl lg:text-3xl">{form.full_name || customer?.full_name || t('কাস্টমার অ্যাকাউন্ট', 'Customer account')}</h2>
              
            </div>
          </div>

          <form onSubmit={submit} className="relative grid gap-4 p-4 sm:p-6 md:grid-cols-2">
            <Field label={t('পুরো নাম', 'Full name')} value={form.full_name} onChange={(value) => setForm({ ...form, full_name: value })} />
            <Field label={t('ফোন নম্বর', 'Phone number')} value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <Field label={t('ইমেইল ঠিকানা', 'Email address')} value={form.email} onChange={(value) => setForm({ ...form, email: value })} type="email" />
            <Field label={t('জন্ম তারিখ', 'Date of birth')} value={form.date_of_birth} onChange={(value) => setForm({ ...form, date_of_birth: value })} type="date" />
            <div>
              <label className="text-sm font-medium text-slate-700">{t('লিঙ্গ', 'Gender')}</label>
              <select
                value={form.gender}
                onChange={(event) => setForm({ ...form, gender: event.target.value })}
                className="mt-2 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none"
              >
                <option value="">{t('লিঙ্গ নির্বাচন করুন', 'Select gender')}</option>
                <option value="male">{t('পুরুষ', 'Male')}</option>
                <option value="female">{t('নারী', 'Female')}</option>
                <option value="other">{t('অন্যান্য', 'Other')}</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button disabled={saving} className="bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                {saving ? t('প্রোফাইল সেভ হচ্ছে...', 'Saving profile...') : t('প্রোফাইল আপডেট করুন', 'Update profile')}
              </button>
            </div>
          </form>
        </section>

        <section className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t('চলমান অর্ডার', 'Active orders')} value={stats.activeOrders.toLocaleString(locale)} tone="sky" />
            <StatCard label={t('সেভ করা ঠিকানা', 'Saved addresses')} value={stats.addressCount.toLocaleString(locale)} tone="emerald" />
            <StatCard label={t('অনুমোদিত প্রেসক্রিপশন', 'Approved prescriptions')} value={stats.approvedPrescriptions.toLocaleString(locale)} tone="amber" />
            <StatCard label={t('অপঠিত আপডেট', 'Unread updates')} value={stats.unreadNotifications.toLocaleString(locale)} tone="violet" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
            {quickLinks.map((item) => {
              const Icon = item.icon

              return (
                <Link key={item.to} to={item.to} className={`relative isolate overflow-hidden ${toneSurfaceClass(item.tone)} p-4 transition hover:-translate-y-0.5 sm:p-5`}>
                  <BubbleBackdrop tone={item.tone} />
                  <div className="relative flex items-start gap-3">
                    <div className={`inline-flex h-9 w-9 shrink-0 items-center justify-center ${toneIconClass(item.tone)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-950 sm:text-lg">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
                    </div>
                  </div>

                  <div className="relative mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    {t('খুলুন', 'Open')}
                    <FiArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-5 sm:mt-10 sm:gap-6 lg:grid-cols-2">
        <div className="relative isolate overflow-hidden border border-emerald-200 bg-[linear-gradient(180deg,#fcfffd_0%,#effcf6_100%)] p-4 shadow-[0_24px_60px_-42px_rgba(5,150,105,0.26)] sm:p-6">
          <BubbleBackdrop tone="emerald" />
          <div className="relative flex flex-col items-start justify-between gap-3 border-b border-emerald-100/80 pb-4 sm:flex-row sm:items-center sm:gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">{t('সাম্প্রতিক অর্ডার', 'Recent orders')}</p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{t('সর্বশেষ অ্যাকাউন্ট অ্যাক্টিভিটি।', 'Latest account activity.')}</h3>
            </div>
            <Link to="/orders" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
              {t('সব দেখুন', 'View all')}
            </Link>
          </div>
          <div className="relative mt-4 space-y-3">
            {orders.slice(0, 3).map((order) => (
              <Link key={order.id} to={getOrderPath(order)} className="block border border-white/70 bg-white/80 p-3 shadow-[0_18px_35px_-30px_rgba(5,150,105,0.36)] transition hover:border-emerald-300 sm:p-4">
                <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950">{order.order_number}</p>
                    <p className="mt-1 text-sm text-slate-500">{date(order.order_date, locale)} • {getOrderStatusLabel(order.order_status, isBangla)}</p>
                  </div>
                  <div className="text-sm font-semibold text-slate-950">{getPaymentStatusLabel(order.payment_status, isBangla)}</div>
                </div>
              </Link>
            ))}
            {orders.length === 0 ? <p className="text-sm text-slate-500">{t('এখনও কোনো অর্ডার নেই।', 'No orders yet.')}</p> : null}
          </div>
        </div>

        <div className="relative isolate overflow-hidden border border-violet-200 bg-[linear-gradient(180deg,#fefeff_0%,#f5f3ff_100%)] p-4 shadow-[0_24px_60px_-42px_rgba(124,58,237,0.24)] sm:p-6">
          <BubbleBackdrop tone="violet" />
          <div className="relative flex flex-col items-start justify-between gap-3 border-b border-violet-100/80 pb-4 sm:flex-row sm:items-center sm:gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">{t('নোটিফিকেশন', 'Notifications')}</p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{t('অ্যাকাউন্ট ও ফার্মেসি আপডেট।', 'Account and pharmacy updates.')}</h3>
            </div>
            <Link to="/notifications" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
              {t('সব দেখুন', 'View all')}
            </Link>
          </div>
          <div className="relative mt-4 space-y-3">
            {notifications.slice(0, 3).map((item) => (
              <div key={item.id} className="border border-white/70 bg-white/85 p-3 shadow-[0_18px_35px_-30px_rgba(124,58,237,0.34)] sm:p-4">
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.message}</p>
                  </div>
                  <span className={`shrink-0 border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${item.status === 'read' ? 'border-slate-200 bg-white text-slate-500' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                    {notificationStatusLabel(item.status, isBangla)}
                  </span>
                </div>
              </div>
            ))}
            {notifications.length === 0 ? <p className="text-sm text-slate-500">{t('এখনও কোনো নোটিফিকেশন নেই।', 'No notifications yet.')}</p> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function notificationStatusLabel(status, isBangla = false) {
  const labels = {
    read: isBangla ? 'পড়া হয়েছে' : 'Read',
    unread: isBangla ? 'নতুন' : 'Unread',
  }

  return labels[status] || status || (isBangla ? 'নতুন' : 'Unread')
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-white/80 bg-white/80 px-3 py-3 text-sm text-slate-900 shadow-[0_14px_28px_-24px_rgba(14,116,144,0.35)] outline-none sm:px-4"
      />
    </div>
  )
}

function StatCard({ label, value, tone = 'sky' }) {
  return (
    <div className={`relative isolate overflow-hidden ${toneSurfaceClass(tone)} p-3 sm:p-4`}>
      <BubbleBackdrop tone={tone} />
      <div className="relative">
        <p className="text-sm text-slate-500">{label}</p>
        <div className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">{value}</div>
      </div>
    </div>
  )
}

function BubbleBackdrop({ tone = 'sky' }) {
  const toneMap = {
    sky: {
      ring: 'rgba(14,165,233,0.18)',
      ringSoft: 'rgba(56,189,248,0.16)',
      dots: 'rgba(14,165,233,0.1)',
    },
    emerald: {
      ring: 'rgba(16,185,129,0.18)',
      ringSoft: 'rgba(52,211,153,0.16)',
      dots: 'rgba(16,185,129,0.1)',
    },
    amber: {
      ring: 'rgba(245,158,11,0.18)',
      ringSoft: 'rgba(251,191,36,0.16)',
      dots: 'rgba(245,158,11,0.1)',
    },
    violet: {
      ring: 'rgba(139,92,246,0.18)',
      ringSoft: 'rgba(167,139,250,0.16)',
      dots: 'rgba(139,92,246,0.1)',
    },
    rose: {
      ring: 'rgba(244,63,94,0.18)',
      ringSoft: 'rgba(251,113,133,0.16)',
      dots: 'rgba(244,63,94,0.1)',
    },
  }

  const palette = toneMap[tone] || toneMap.sky

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full border" style={{ borderColor: palette.ring, backgroundColor: 'rgba(255,255,255,0.26)' }} />
      <div className="absolute bottom-4 right-7 h-14 w-14 rounded-full border" style={{ borderColor: palette.ringSoft, backgroundColor: 'rgba(255,255,255,0.32)' }} />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: `radial-gradient(circle at 18% 22%, ${palette.dots} 0, ${palette.dots} 6px, transparent 6.5px), radial-gradient(circle at 82% 26%, ${palette.dots} 0, ${palette.dots} 4px, transparent 4.5px), radial-gradient(circle at 66% 76%, ${palette.dots} 0, ${palette.dots} 8px, transparent 8.5px)`,
        }}
      />
    </div>
  )
}

function toneSurfaceClass(tone) {
  const classes = {
    sky: 'border border-sky-200 bg-[linear-gradient(180deg,#ffffff_0%,#eef8ff_100%)] shadow-[0_24px_50px_-40px_rgba(14,116,144,0.3)]',
    emerald: 'border border-emerald-200 bg-[linear-gradient(180deg,#ffffff_0%,#eefcf5_100%)] shadow-[0_24px_50px_-40px_rgba(5,150,105,0.28)]',
    amber: 'border border-amber-200 bg-[linear-gradient(180deg,#fffefb_0%,#fff7e8_100%)] shadow-[0_24px_50px_-40px_rgba(217,119,6,0.24)]',
    violet: 'border border-violet-200 bg-[linear-gradient(180deg,#ffffff_0%,#f5f3ff_100%)] shadow-[0_24px_50px_-40px_rgba(124,58,237,0.24)]',
    rose: 'border border-rose-200 bg-[linear-gradient(180deg,#fffefe_0%,#fff1f2_100%)] shadow-[0_24px_50px_-40px_rgba(225,29,72,0.22)]',
  }

  return classes[tone] || classes.sky
}

function toneIconClass(tone) {
  const classes = {
    sky: 'border border-sky-200 bg-sky-100/80 text-sky-700',
    emerald: 'border border-emerald-200 bg-emerald-100/80 text-emerald-700',
    amber: 'border border-amber-200 bg-amber-100/80 text-amber-700',
    violet: 'border border-violet-200 bg-violet-100/80 text-violet-700',
    rose: 'border border-rose-200 bg-rose-100/80 text-rose-700',
  }

  return classes[tone] || classes.sky
}

function initials(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
