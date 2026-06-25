import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiBell, FiCheckCircle, FiExternalLink } from 'react-icons/fi'
import { notificationApi } from '../../api/notificationApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import EmptyState from '../../components/common/EmptyState'
import { adminQueryKeys } from '../../queries/adminQueries'
import { date } from '../../utils/formatters'

const statuses = ['', 'unread', 'read']

function typeLabel(type) {
  return (type || 'notification')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function typeTone(type) {
  if (type === 'new_order') return 'border-sky-200 bg-sky-50 text-sky-700'
  if (type === 'new_prescription') return 'border-violet-200 bg-violet-50 text-violet-700'
  if (type?.includes('support')) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

export default function AdminNotifications() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params, setParams] = useState({ status: '', page: 1, per_page: 15 })
  const notificationsQuery = useQuery({
    queryKey: adminQueryKeys.notifications(params),
    queryFn: () => notificationApi.adminList(params).then((response) => response.data.data || null),
  })
  const meta = notificationsQuery.data || null
  const notifications = useMemo(() => meta?.data || [], [meta?.data])
  const loading = notificationsQuery.isLoading
  const updating = notificationsQuery.isFetching && !notificationsQuery.isLoading

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.status !== 'read').length,
    [notifications],
  )

  useEffect(() => {
    if (notificationsQuery.isError) {
      toast.error('Unable to load notifications.')
    }
  }, [notificationsQuery.isError])

  const markRead = async (notification) => {
    if (notification.status === 'read') return

    try {
      await notificationApi.adminRead(notification.id)
      queryClient.setQueryData(adminQueryKeys.notifications(params), (current) => {
        if (!current?.data) return current

        return {
          ...current,
          data: current.data.map((item) => (
            item.id === notification.id ? { ...item, status: 'read', read_at: new Date().toISOString() } : item
          )),
        }
      })
    } catch {
      toast.error('Notification could not be marked as read.')
    }
  }

  const openNotification = async (notification) => {
    await markRead(notification)
    navigate(notification.metadata?.link || '/admin/notifications')
  }

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{meta?.total || notifications.length}</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <FiBell className="h-4 w-4" />
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-teal-200 bg-teal-50/70 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">Unread On Page</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{unreadCount}</p>
        </div>
        <select
          value={params.status}
          onChange={(event) => setParams({ ...params, status: event.target.value, page: 1 })}
          className="h-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-medium outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
        >
          {statuses.map((status) => (
            <option key={status || 'all'} value={status}>
              {status ? typeLabel(status) : 'All Notifications'}
            </option>
          ))}
        </select>
      </div>

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && notifications.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && notifications.length === 0 ? (
        <EmptyState title="No notifications found" text="New orders, prescriptions, and support tickets will appear here." />
      ) : null}

      {notifications.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <div key={notification.id} className={`p-4 transition ${notification.status !== 'read' ? 'bg-teal-50/45' : 'bg-white'}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-slate-950">{notification.title}</h3><span></span>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>
                    <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                      {date(notification.created_at, 'en-US')}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start justify-between gap-5 lg:items-end">
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${typeTone(notification.notification_type)}`}>
                        {typeLabel(notification.notification_type)}
                      </span>
                      {notification.status !== 'read' ? (
                        <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">Unread</span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {notification.status !== 'read' ? (
                        <button
                          type="button"
                          onClick={() => markRead(notification)}
                          className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 transition hover:border-teal-300"
                        >
                          <FiCheckCircle className="h-4 w-4" />
                          Mark read
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openNotification(notification)}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                      >
                        <FiExternalLink className="h-4 w-4" />
                        Open
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {meta?.last_page > 1 ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Page {meta.current_page || params.page} / {meta.last_page}</span>
          <div className="flex justify-end gap-2">
            <button
              disabled={params.page <= 1}
              onClick={() => setParams({ ...params, page: params.page - 1 })}
              className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={params.page >= meta.last_page}
              onClick={() => setParams({ ...params, page: params.page + 1 })}
              className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

    </>
  )
}
