import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiBell, FiChevronDown, FiCheckCircle, FiLogOut, FiMenu } from 'react-icons/fi'
import { notificationApi } from '../../api/notificationApi'
import { adminQueryKeys } from '../../queries/adminQueries'
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications'
import { date } from '../../utils/formatters'

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AD'
}

export default function AdminHeader({
  setSidebarOpen,
  settingsOpen,
  setSettingsOpen,
  activeItem,
  roleNames,
  staff,
  visibleSettings,
  logout,
}) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationsRef = useRef(null)
  const settingsRef = useRef(null)
  const staffToken = typeof window !== 'undefined' ? window.localStorage.getItem('staff_token') : null
  const notificationParams = useMemo(() => ({ per_page: 8 }), [])
  const notificationsQuery = useQuery({
    queryKey: adminQueryKeys.notifications(notificationParams),
    queryFn: () => notificationApi.adminList(notificationParams).then((response) => response.data.data?.data || []),
    enabled: Boolean(staffToken),
    refetchInterval: 120000,
  })
  const preferencesQuery = useQuery({
    queryKey: ['admin', 'notifications', 'preferences'],
    queryFn: () => notificationApi.adminPreferences().then((response) => response.data.data || { disabled_types: [] }),
    enabled: Boolean(staffToken),
    staleTime: 60000,
  })
  const notifications = notificationsQuery.data || []
  const unreadCount = notifications.filter((item) => item.status !== 'read').length
  const disabledNotificationTypes = preferencesQuery.data?.disabled_types || []

  const handleRealtimeNotification = useCallback(
    (notification) => {
      if (disabledNotificationTypes.includes(notification?.notification_type)) {
        return
      }

      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.notifications(notificationParams) })

      if (notification?.title) {
        toast.success(notification.title)
      }
    },
    [disabledNotificationTypes, notificationParams, queryClient],
  )

  useRealtimeNotifications({
    type: 'staff',
    id: staff?.id,
    token: staffToken,
    enabled: Boolean(staff?.id && staffToken),
    includeStaffBroadcast: true,
    onNotification: handleRealtimeNotification,
  })

  useEffect(() => {
    if (!notificationsOpen && !settingsOpen) return undefined

    const handlePointerDown = (event) => {
      if (notificationsOpen && !notificationsRef.current?.contains(event.target)) {
        setNotificationsOpen(false)
      }

      if (settingsOpen && !settingsRef.current?.contains(event.target)) {
        setSettingsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [notificationsOpen, setSettingsOpen, settingsOpen])

  const openNotification = async (notification) => {
    if (notification.status !== 'read') {
      await notificationApi.adminRead(notification.id).catch(() => {})
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.notifications(notificationParams) })
    }

    setNotificationsOpen(false)
    navigate(notification.metadata?.link || '/admin/notifications')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-gray-400/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 lg:hidden"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <span className="sr-only">Open sidebar</span>
            <FiMenu className="h-4 w-4" />
          </button>

          <div className="min-w-0">                  
            <h2 className="truncate text-xl font-semibold text-slate-950">{activeItem?.label || 'Admin Panel'}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 xl:flex">
            <span className="rounded-full bg-slate-100/60 px-3 py-1.5 text-xs font-medium text-slate-600">
              {roleNames}
            </span>                  
          </div>

          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((open) => !open)
                setSettingsOpen(false)
              }}
              className="relative inline-flex h-8 w-8 items-center justify-center text-slate-700 transition hover:text-teal-700"
              aria-label="Open notifications"
            >
              <FiBell className="h-6 w-6" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-bold leading-5 text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="absolute right-0 mt-3 w-92 overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_24px_70px_-28px_rgba(15,23,42,0.35)]">
                {/* <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Notifications</p>
                    <p className="text-xs text-slate-500">{unreadCount} unread update{unreadCount === 1 ? '' : 's'}</p>
                  </div>
                  <Link
                    to="/admin/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                  >
                    View all
                  </Link>
                </div> */}

                <div className="max-h-96 overflow-y-auto p-2">
                  {notificationsQuery.isLoading ? (
                    <p className="px-3 py-4 text-sm text-slate-500">Loading notifications...</p>
                  ) : null}
                  {!notificationsQuery.isLoading && notifications.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-slate-500">No notifications yet.</p>
                  ) : null}
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => openNotification(notification)}
                      className={`mb-1 flex w-full gap-3 rounded-md px-3 py-3 text-left transition last:mb-0 ${
                        notification.status !== 'read' ? 'bg-teal-50 hover:bg-teal-100' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className={`mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${notification.status !== 'read' ? 'bg-teal-600' : 'bg-slate-300'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-950">{notification.title} - {date(notification.created_at, 'en-US')}</span>
                        <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-slate-600">{notification.message}</span>
                        {/* <span className="mt-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                          {notification.notification_type?.replace(/_/g, ' ')} 
                        </span> */}
                      </span>
                    </button>
                  ))}
                </div>

                {notifications.length > 0 ? (
                  <div className="border-t border-slate-100 px-4 py-2">
                    <Link
                      to="/admin/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold transition hover:underline"
                    >
                      <FiCheckCircle className="h-3.5 w-3.5" />
                      View all notifications
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div ref={settingsRef} className="relative">
            <button
              type="button"
              className="flex items-center gap-3 px-3 py-1.5 shadow-sm transition hover:border-slate-300"
              onClick={() => {
                setSettingsOpen((open) => !open)
                setNotificationsOpen(false)
              }}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                {initials(staff?.full_name)}
              </span>
              <span className="hidden min-w-0 text-left md:block">
                <span className="block truncate text-sm font-semibold text-slate-950">{staff?.full_name || 'Admin User'}</span>
              </span>
              <FiChevronDown className={`h-4 w-4 text-slate-700 transition ${settingsOpen ? 'rotate-180' : ''}`} />
            </button>

            {settingsOpen ? (
              <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-md border border-slate-200 bg-white p-2 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.35)]">
                <div className="mt-2 space-y-1">
                  {visibleSettings.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-slate-400" />
                        <span>{item.label}</span>
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="mt-2 border-t border-slate-200 pt-2">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    onClick={logout}
                  >
                    <span className="flex items-center gap-3">
                      <FiLogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
