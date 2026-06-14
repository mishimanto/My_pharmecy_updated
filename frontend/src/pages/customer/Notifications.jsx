import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { notificationApi } from '../../api/notificationApi'
import PageHeader from '../../components/common/PageHeader'
import { readCustomerCache, writeCustomerCache } from '../../utils/customerDataCache'
import { date } from '../../utils/formatters'

const NOTIFICATIONS_CACHE_KEY = 'notifications_list'

export default function Notifications() {
  const [notifications, setNotifications] = useState(() => readCustomerCache(NOTIFICATIONS_CACHE_KEY, []))
  const [loading, setLoading] = useState(() => readCustomerCache(NOTIFICATIONS_CACHE_KEY, null) === null)

  const load = () => {
    notificationApi.list()
      .then((res) => {
        const nextNotifications = res.data.data?.data || []
        setNotifications(nextNotifications)
        writeCustomerCache(NOTIFICATIONS_CACHE_KEY, nextNotifications)
      })
      .catch(() => toast.error('Notifications could not be loaded.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const markRead = async (id) => {
    try {
      await notificationApi.read(id)
      setNotifications((current) => {
        const nextNotifications = current.map((item) => item.id === id ? { ...item, status: 'read', read_at: new Date().toISOString() } : item)
        writeCustomerCache(NOTIFICATIONS_CACHE_KEY, nextNotifications)
        return nextNotifications
      })
      toast.success('Notification marked as read.')
    } catch {
      toast.error('Notification could not be updated.')
    }
  }

  return (
    <>
      <PageHeader title="Notifications" subtitle="Order, prescription, delivery, support, and refund updates from your account." />
      <div className="space-y-3">
        {loading ? <p className="text-sm text-slate-600">Loading notifications...</p> : null}
        {!loading && !notifications.length ? <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">No notifications yet.</p> : null}
        {notifications.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                <p className="mt-2 text-xs text-slate-500">{item.notification_type} - {date(item.created_at)} - {item.channel}</p>
              </div>
              {item.status !== 'read' ? (
                <button onClick={() => markRead(item.id)} className="rounded-md border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700">
                  Mark as read
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
