import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { FiArchive, FiBell, FiCheckCircle, FiExternalLink, FiMail, FiRefreshCw, FiRotateCcw, FiSliders, FiTrash2 } from 'react-icons/fi'
import { LuMailOpen } from "react-icons/lu";
import { notificationApi } from '../../api/notificationApi'
import AdminFilterBar from '../../components/admin/AdminFilterBar'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import AdminStatCard from '../../components/admin/AdminStatCard'
import EmptyState from '../../components/common/EmptyState'
import { adminQueryKeys } from '../../queries/adminQueries'
import { date } from '../../utils/formatters'

const statuses = ['', 'unread', 'read', 'archived']
const initialParams = { search: '', status: '', notification_type: '', date_from: '', date_to: '', page: 1, per_page: 15 }

function typeLabel(type) {
  return (type || 'notification')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function typeTone(type) {
  if (type === 'new_order') return 'text-sky-700'
  if (type === 'new_prescription') return 'text-violet-700'
  if (type?.includes('support')) return 'text-amber-700'
  if (type?.includes('system')) return 'text-rose-700'
  return 'text-slate-600'
}

function actionButtonClass(tone = 'slate') {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300',
    rose: 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300',
    slate: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
  }

  return `inline-flex h-9 w-9 items-center justify-center rounded-md border transition disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone] || tones.slate}`
}

export default function AdminNotifications() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params, setParams] = useState(initialParams)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [disabledTypes, setDisabledTypes] = useState([])

  const notificationsQuery = useQuery({
    queryKey: adminQueryKeys.notifications(params),
    queryFn: () => notificationApi.adminList(cleanParams(params)).then((response) => response.data.data || null),
  })
  const preferencesQuery = useQuery({
    queryKey: ['admin', 'notifications', 'preferences'],
    queryFn: () => notificationApi.adminPreferences().then((response) => response.data.data || { types: [], disabled_types: [] }),
  })

  const meta = notificationsQuery.data || null
  const notifications = useMemo(() => meta?.data || [], [meta?.data])
  const types = preferencesQuery.data?.types || []
  const loading = notificationsQuery.isLoading
  const updating = notificationsQuery.isFetching && !notificationsQuery.isLoading
  const selectedCount = selectedIds.length
  const allPageSelected = notifications.length > 0 && notifications.every((item) => selectedIds.includes(item.id))

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.status !== 'read' && notification.status !== 'archived').length,
    [notifications],
  )
  const readCount = useMemo(
    () => notifications.filter((notification) => notification.status === 'read').length,
    [notifications],
  )
  const archivedCount = useMemo(
    () => notifications.filter((notification) => notification.status === 'archived').length,
    [notifications],
  )
  const rowOffset = ((meta?.current_page || params.page || 1) - 1) * (meta?.per_page || params.per_page || 15)
  const statItems = [
    { label: 'Total Notifications', value: meta?.total || notifications.length, variant: 'slate', icon: FiBell },
    { label: 'Unread On Page', value: unreadCount, variant: 'amber', icon: FiMail },
    { label: 'Read On Page', value: readCount, variant: 'emerald', icon: LuMailOpen },
    { label: 'Archived On Page', value: archivedCount, variant: 'rose', icon: FiArchive },
  ]
  const hasActiveFilters = Boolean(search || params.status || params.notification_type || params.date_from || params.date_to)
  const filterOptions = [
    {
      key: 'status',
      value: params.status,
      onChange: (value) => setParams((current) => ({ ...current, status: value, page: 1 })),
      options: statuses.map((status) => ({
        value: status,
        label: status ? typeLabel(status) : 'Active Notifications',
      })),
    },
    {
      key: 'notification_type',
      value: params.notification_type,
      onChange: (value) => setParams((current) => ({ ...current, notification_type: value, page: 1 })),
      options: [
        { value: '', label: 'All Types' },
        ...types.map((type) => ({ value: type.value, label: type.label })),
      ],
    },
  ]

  useEffect(() => {
    if (notificationsQuery.isError) {
      toast.error('Unable to load notifications.')
    }
  }, [notificationsQuery.isError])

  useEffect(() => {
    setDisabledTypes(preferencesQuery.data?.disabled_types || [])
  }, [preferencesQuery.data?.disabled_types])

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => notifications.some((item) => item.id === id)))
  }, [notifications])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setParams((current) => current.search === search ? current : { ...current, search, page: 1 })
    }, 350)

    return () => clearTimeout(timeout)
  }, [search])

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
  }

  const clearFilters = () => {
    setSearch('')
    setParams(initialParams)
  }

  const markRead = async (notification) => {
    if (notification.status === 'read') return

    try {
      await notificationApi.adminRead(notification.id)
      invalidateNotifications()
    } catch {
      toast.error('Notification could not be marked as read.')
    }
  }

  const markAllRead = async () => {
    try {
      const response = await notificationApi.adminMarkAllRead(cleanParams(params))
      toast.success(`${response.data.data?.updated || 0} notification(s) marked as read.`)
      invalidateNotifications()
    } catch {
      toast.error('Notifications could not be marked as read.')
    }
  }

  const bulkAction = async (action, ids = selectedIds) => {
    if (!ids.length) return

    if (action === 'delete') {
      const result = await Swal.fire({
        title: 'Delete selected notifications?',
        text: `${ids.length} notification(s) will be permanently deleted.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc2626',
      })

      if (!result.isConfirmed) return
    }

    try {
      const response = await notificationApi.adminBulk({ action, ids })
      toast.success(`${response.data.data?.affected || 0} notification(s) updated.`)
      setSelectedIds([])
      invalidateNotifications()
    } catch {
      toast.error('Bulk action could not be completed.')
    }
  }

  const openNotification = async (notification) => {
    await markRead(notification)
    navigate(notification.metadata?.link || '/admin/notifications')
  }

  const toggleSelected = (id) => {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id])
  }

  const togglePageSelection = () => {
    setSelectedIds(allPageSelected ? [] : notifications.map((item) => item.id))
  }

  const savePreferences = async () => {
    try {
      const response = await notificationApi.adminUpdatePreferences({ disabled_types: disabledTypes })
      setDisabledTypes(response.data.data?.disabled_types || [])
      toast.success('Notification preferences saved.')
      invalidateNotifications()
    } catch {
      toast.error('Preferences could not be saved.')
    }
  }

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statItems.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} variant={item.variant} icon={item.icon} />
        ))}
      </div>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title, message, type, or status"
        filters={filterOptions}
        hasActiveFilters={hasActiveFilters}
      >
        <button
          type="button"
          onClick={() => setPreferencesOpen((current) => !current)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
        >
          <FiSliders className="h-4 w-4" />
          Preferences
        </button>
      </AdminFilterBar>

      <div className="mb-4 flex flex-wrap items-center gap-3 border border-slate-200 bg-slate-100 p-3 shadow-sm">
        {selectedCount > 0 ? (
          <div className="mr-auto flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">{selectedCount} selected</span>
            <button type="button" onClick={() => bulkAction('read')} className="inline-flex h-10 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300">
              <FiCheckCircle className="h-4 w-4" />
              Mark read
            </button>
            <button type="button" onClick={() => bulkAction('archive')} className="inline-flex h-10 items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-700 transition hover:border-amber-300">
              <FiArchive className="h-4 w-4" />
              Archive
            </button>
            <button type="button" onClick={() => bulkAction('delete')} className="inline-flex h-10 items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300">
              <FiTrash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        ) : null}

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <input
            type="date"
            value={params.date_from}
            onChange={(event) => setParams((current) => ({ ...current, date_from: event.target.value, page: 1 }))}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 sm:w-44"
          />
          <input
            type="date"
            value={params.date_to}
            onChange={(event) => setParams((current) => ({ ...current, date_to: event.target.value, page: 1 }))}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 sm:w-44"
          />
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRotateCcw className="h-4 w-4" />
            Clear
          </button>
          <button
            type="button"
            onClick={() => notificationsQuery.refetch()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            <FiRefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={markAllRead}
            disabled={loading || !meta?.total}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <FiCheckCircle className="h-4 w-4" />
            Mark all filtered as read
          </button>
        </div>
      </div>

      {preferencesOpen ? (
        <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Notification preferences</h2>
              <p className="mt-1 text-sm text-slate-500">Disable notification types you do not want to see in your admin panel.</p>
            </div>
            <button
              type="button"
              onClick={savePreferences}
              disabled={preferencesQuery.isLoading}
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Save preferences
            </button>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {types.map((type) => {
              const disabled = disabledTypes.includes(type.value)

              return (
                <label key={type.value} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-700">{type.label}</span>
                  <input
                    type="checkbox"
                    checked={!disabled}
                    onChange={(event) => {
                      setDisabledTypes((current) => event.target.checked
                        ? current.filter((item) => item !== type.value)
                        : [...new Set([...current, type.value])])
                    }}
                    className="h-4 w-4 accent-emerald-600"
                  />
                </label>
              )
            })}
          </div>
        </section>
      ) : null}

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && notifications.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && notifications.length === 0 ? (
        <EmptyState title="No notifications found" text="New orders, prescriptions, and support tickets will appear here." />
      ) : null}

      {notifications.length > 0 ? (
        <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-300 divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3 text-center">
                  <input type="checkbox" checked={allPageSelected} onChange={togglePageSelection} className="h-4 w-4 accent-emerald-600" />
                </th>
                <th className="px-4 py-3 text-center">#</th>
                <th className="px-4 py-3">Notification</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Created</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notifications.map((notification, index) => (
                <tr key={notification.id} className={`transition hover:bg-slate-50/80 ${notification.status !== 'read' && notification.status !== 'archived' ? 'bg-amber-50/35' : 'bg-white'}`}>
                  <td className="px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(notification.id)}
                      onChange={() => toggleSelected(notification.id)}
                      className="h-4 w-4 accent-emerald-600"
                    />
                  </td>
                  <td className="px-4 py-4 text-center font-semibold text-slate-500">{rowOffset + index + 1}.</td>
                  <td className="px-4 py-4">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => openNotification(notification)}
                        className="text-left font-semibold text-slate-950 transition hover:text-emerald-700 hover:underline"
                      >
                        {notification.title}
                      </button>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{notification.message}</p>
                    </div>
                  </td>
                  <td className={`px-4 py-4 font-semibold ${typeTone(notification.notification_type)}`}>
                    {typeLabel(notification.notification_type)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`font-semibold ${statusTone(notification.status)}`}>
                      {typeLabel(notification.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-600">{date(notification.created_at, 'en-US')}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-3">
                      {notification.status !== 'read' && notification.status !== 'archived' ? (
                        <button
                          type="button"
                          onClick={() => markRead(notification)}
                          className={actionButtonClass('emerald')}
                          title="Mark read"
                        >
                          <FiCheckCircle className="h-4 w-4" />
                        </button>
                      ) : null}
                      {notification.status !== 'archived' ? (
                        <button
                          type="button"
                          onClick={() => {
                            bulkAction('archive', [notification.id])
                          }}
                          className={actionButtonClass('amber')}
                          title="Archive"
                        >
                          <FiArchive className="h-4 w-4" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openNotification(notification)}
                        className={actionButtonClass('slate')}
                        title="Open notification"
                      >
                        <FiExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

function statusTone(status) {
  if (status === 'read') return 'text-emerald-700'
  if (status === 'archived') return 'text-slate-500'
  return 'text-rose-600'
}

function cleanParams(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined))
}
