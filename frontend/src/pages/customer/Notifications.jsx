import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { notificationApi } from '../../api/notificationApi'
import PageHeader from '../../components/common/PageHeader'
import { date } from '../../utils/formatters'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    notificationApi.list()
      .then((res) => setNotifications(res.data.data?.data || []))
      .catch(() => toast.error('নোটিফিকেশন লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const markRead = async (id) => {
    try {
      await notificationApi.read(id)
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, status: 'read', read_at: new Date().toISOString() } : item))
      toast.success('নোটিফিকেশন পড়া হয়েছে।')
    } catch {
      toast.error('নোটিফিকেশন আপডেট করা যায়নি।')
    }
  }

  return (
    <>
      <PageHeader title="নোটিফিকেশন" subtitle="অর্ডার, প্রেসক্রিপশন, ডেলিভারি, সাপোর্ট ও রিফান্ড আপডেট।" />
      <div className="space-y-3">
        {loading ? <p className="text-sm text-slate-600">লোড হচ্ছে...</p> : null}
        {!loading && !notifications.length ? <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">কোনো নোটিফিকেশন নেই।</p> : null}
        {notifications.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                <p className="mt-2 text-xs text-slate-500">{item.notification_type} - {date(item.created_at)} - {item.channel}</p>
              </div>
              {item.status !== 'read' && <button onClick={() => markRead(item.id)} className="rounded-md border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700">পড়া হয়েছে</button>}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
