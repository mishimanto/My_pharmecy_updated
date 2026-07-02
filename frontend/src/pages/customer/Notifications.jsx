import { useCallback, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiBell, FiCheckCircle, FiClock, FiExternalLink, FiFileText, FiPackage, FiRefreshCw } from 'react-icons/fi'
import { notificationApi } from '../../api/notificationApi'
import { useLanguage } from '../../context/LanguageContext'
import {
  customerQueryKeys,
  markNotificationReadInQueryData,
  normalizeNotifications,
  setNotificationsQueryData,
  useNotificationsQuery,
} from '../../queries/customerQueries'
import { getCustomerNotificationLink, getCustomerNotificationMessage, getCustomerNotificationTitle, getCustomerNotificationTypeLabel } from '../../utils/customerNotificationDisplay'
import { date } from '../../utils/formatters'

function localizedNumber(value, isBangla) {
  return Number(value || 0).toLocaleString(isBangla ? 'bn-BD' : 'en-US')
}

function notificationIcon(type) {
  if (String(type || '').includes('prescription')) return FiFileText
  if (String(type || '').includes('order')) return FiPackage
  if (String(type || '').includes('payment') || String(type || '').includes('refund')) return FiCheckCircle
  return FiBell
}

function notificationLink(item) {
  return getCustomerNotificationLink(item)
}

export default function Notifications() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isBangla } = useLanguage()
  const t = useCallback((bn, en) => (isBangla ? bn : en), [isBangla])
  const notificationsQuery = useNotificationsQuery({
    placeholderData: (previous) => previous,
  })
  const notifications = useMemo(() => normalizeNotifications(notificationsQuery.data), [notificationsQuery.data])
  const unreadNotifications = useMemo(() => notifications.filter((item) => item.status !== 'read'), [notifications])
  const readNotifications = notifications.length - unreadNotifications.length
  const loading = notificationsQuery.isLoading
  const refreshing = notificationsQuery.isFetching && !loading

  const updateNotificationCache = useCallback((nextNotifications) => {
    setNotificationsQueryData(queryClient, nextNotifications)
  }, [queryClient])

  useEffect(() => {
    if (notificationsQuery.isError) {
      toast.error(t('নোটিফিকেশন লোড করা যায়নি।', 'Notifications could not be loaded.'))
    }
  }, [notificationsQuery.isError, t])

  const markRead = async (id) => {
    try {
      await notificationApi.read(id)
      markNotificationReadInQueryData(queryClient, id)
      toast.success(t('নোটিফিকেশন পড়া হয়েছে।', 'Notification marked as read.'))
    } catch {
      toast.error(t('নোটিফিকেশন আপডেট করা যায়নি।', 'Notification could not be updated.'))
    }
  }

  const openNotification = async (item) => {
    const link = notificationLink(item)

    if (item.status !== 'read') {
      try {
        await notificationApi.read(item.id)
        markNotificationReadInQueryData(queryClient, item.id)
      } catch {
        queryClient.invalidateQueries({ queryKey: customerQueryKeys.notifications })
      }
    }

    if (link) {
      navigate(link)
    }
  }

  const markAllRead = async () => {
    if (!unreadNotifications.length) return

    try {
      await Promise.all(unreadNotifications.map((item) => notificationApi.read(item.id)))
      const readAt = new Date().toISOString()
      updateNotificationCache(notifications.map((item) => ({ ...item, status: 'read', read_at: item.read_at || readAt })))
      toast.success(t('সব নোটিফিকেশন পড়া হয়েছে।', 'All notifications marked as read.'))
    } catch {
      toast.error(t('সব নোটিফিকেশন আপডেট করা যায়নি।', 'Notifications could not be updated.'))
    }
  }

  return (
    <div className="space-y-6">
      <section className="border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-md font-semibold uppercase tracking-[0.18em] text-[#0e6574]">
              {t('নোটিফিকেশন', 'Notifications')}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => notificationsQuery.refetch()}
              className="inline-flex items-center gap-2 border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {t('রিফ্রেশ', 'Refresh')}
            </button>
            <button
              type="button"
              onClick={markAllRead}
              disabled={!unreadNotifications.length}
              className="inline-flex items-center gap-2 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <FiCheckCircle className="h-4 w-4" />
              {t('সব পড়া হয়েছে', 'Mark all read')}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <SummaryCard label={t('মোট', 'Total')} value={localizedNumber(notifications.length, isBangla)} icon={FiBell} />
          <SummaryCard label={t('নতুন', 'Unread')} value={localizedNumber(unreadNotifications.length, isBangla)} icon={FiClock} tone="red" />
          <SummaryCard label={t('পড়া হয়েছে', 'Read')} value={localizedNumber(readNotifications, isBangla)} icon={FiCheckCircle} tone="green" />
        </div>
      </section>

      <section className="border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="text-sm font-semibold text-slate-950">{t('সাম্প্রতিক আপডেট', 'Recent updates')}</div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-24 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : null}

        {!loading && !notifications.length ? (
          <div className="px-5 py-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center border border-slate-200 bg-slate-50 text-slate-500">
              <FiBell className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-950">{t('এখনো কোনো নোটিফিকেশন নেই', 'No notifications yet')}</h2>
            <p className="mt-2 text-sm text-slate-500">{t('অর্ডার বা প্রেসক্রিপশন আপডেট এলে এখানে দেখাবে।', 'Order or prescription updates will appear here.')}</p>
          </div>
        ) : null}

        {!loading && notifications.length ? (
          <div className="divide-y divide-slate-100">
            {notifications.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                isBangla={isBangla}
                t={t}
                onRead={markRead}
                onOpen={openNotification}
              />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  return (
    <div className={`border px-4 py-3 ${tones[tone] || tones.slate}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-75">{label}</div>
          <div className="mt-1 text-xl font-semibold">{value}</div>
        </div>
        <Icon className="h-5 w-5 shrink-0" />
      </div>
    </div>
  )
}

function NotificationRow({ item, isBangla, t, onRead, onOpen }) {
  const Icon = notificationIcon(item.notification_type)
  const isUnread = item.status !== 'read'
  const link = notificationLink(item)
  const message = getCustomerNotificationMessage(item, isBangla)

  return (
    <article
      className={`p-5 transition ${isUnread ? 'bg-red-50/35' : 'bg-white'} ${link ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50'}`}
      onClick={link ? () => onOpen(item) : undefined}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center border ${isUnread ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className={`text-base font-semibold text-slate-950 ${link ? 'transition hover:text-[#0e6574] hover:underline' : ''}`}>{getCustomerNotificationTitle(item, isBangla)}</h2>
            <div className="mt-1 text-xs font-semibold text-[#0e6574]">{getCustomerNotificationTypeLabel(item.notification_type, isBangla)}</div>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{message}</p>
            <div className="mt-3 text-xs text-slate-500">
              {date(item.created_at, isBangla ? 'bn-BD' : 'en-US')}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
          {link ? (
            <Link to={link} className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#13b8b0] hover:text-[#0e6574]">
              {t('খুলুন', 'Open')}
              <FiExternalLink className="h-4 w-4" />
            </Link>
          ) : null}
          {isUnread ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onRead(item.id)
              }}
              className="inline-flex items-center gap-2 bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <FiCheckCircle className="h-4 w-4" />
              {t('পড়া হয়েছে', 'Mark read')}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
