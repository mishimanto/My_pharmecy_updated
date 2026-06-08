import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiFileText, FiHeart, FiMapPin, FiMessageSquare, FiPackage, FiUser } from 'react-icons/fi'
import PageHeader from '../../components/common/PageHeader'
import { notificationApi } from '../../api/notificationApi'
import { orderApi } from '../../api/orderApi'
import { prescriptionApi } from '../../api/prescriptionApi'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { date } from '../../utils/formatters'

const quickLinks = [
  { to: '/orders', title: 'My orders', body: 'Review order progress, delivery, and payment status.', icon: FiPackage },
  { to: '/addresses', title: 'Saved addresses', body: 'Manage default delivery addresses for quicker checkout.', icon: FiMapPin },
  { to: '/prescriptions', title: 'Prescriptions', body: 'Track uploaded prescription files and pharmacist review.', icon: FiFileText },
  { to: '/support', title: 'Support tickets', body: 'Open complaints, ask questions, and continue support threads.', icon: FiMessageSquare },
  { to: '/rewards', title: 'Rewards center', body: 'View your member points summary from order activity.', icon: FiHeart },
]

export default function Account() {
  const { customer, updateProfile } = useCustomerAuth()
  const [form, setForm] = useState({
    full_name: customer?.full_name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    date_of_birth: customer?.date_of_birth || '',
    gender: customer?.gender || '',
  })
  const [saving, setSaving] = useState(false)
  const [orders, setOrders] = useState([])
  const [notifications, setNotifications] = useState([])
  const [prescriptions, setPrescriptions] = useState([])

  useEffect(() => {
    Promise.allSettled([orderApi.list(), notificationApi.list(), prescriptionApi.list()]).then((results) => {
      const [ordersResult, notificationsResult, prescriptionsResult] = results

      if (ordersResult.status === 'fulfilled') {
        setOrders(ordersResult.value.data.data?.data || [])
      }
      if (notificationsResult.status === 'fulfilled') {
        setNotifications(notificationsResult.value.data.data?.data || [])
      }
      if (prescriptionsResult.status === 'fulfilled') {
        setPrescriptions(prescriptionsResult.value.data.data?.data || [])
      }
    })
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

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)

    try {
      await updateProfile(form)
      toast.success('Profile updated successfully.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Profile could not be updated.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="My account" subtitle="Manage your customer details, delivery information, prescriptions, rewards, and support access from one pharmacy account center." />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="border border-slate-200 bg-white shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
          <div className="border-b border-slate-200 p-6">
            <div className="inline-flex h-12 w-12 items-center justify-center border border-slate-200 bg-slate-50 text-slate-950">
              <FiUser className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{customer?.full_name || 'Customer account'}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Keep your core pharmacy account information updated for delivery, support, and prescription-linked orders.
            </p>
          </div>

          <form onSubmit={submit} className="grid gap-4 p-6 md:grid-cols-2">
            <Field label="Full name" value={form.full_name} onChange={(value) => setForm({ ...form, full_name: value })} />
            <Field label="Phone number" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <Field label="Email address" value={form.email} onChange={(value) => setForm({ ...form, email: value })} type="email" />
            <Field label="Date of birth" value={form.date_of_birth} onChange={(value) => setForm({ ...form, date_of_birth: value })} type="date" />
            <div>
              <label className="text-sm font-medium text-slate-700">Gender</label>
              <select
                value={form.gender}
                onChange={(event) => setForm({ ...form, gender: event.target.value })}
                className="mt-2 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button disabled={saving} className="bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                {saving ? 'Saving profile...' : 'Update profile'}
              </button>
            </div>
          </form>
        </section>

        <section className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Active orders" value={stats.activeOrders} />
            <StatCard label="Saved addresses" value={stats.addressCount} />
            <StatCard label="Approved prescriptions" value={stats.approvedPrescriptions} />
            <StatCard label="Unread updates" value={stats.unreadNotifications} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quickLinks.map((item) => {
              const Icon = item.icon

              return (
                <Link key={item.to} to={item.to} className="border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5">
                  <div className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-slate-50 text-slate-950">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{item.body}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    Open
                    <FiArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Recent orders</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Latest account activity.</h3>
                </div>
                <Link to="/orders" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
                  View all
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {orders.slice(0, 3).map((order) => (
                  <Link key={order.id} to={`/orders/${order.id}`} className="block border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-400">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{order.order_number}</p>
                        <p className="mt-1 text-sm text-slate-500">{date(order.order_date)} • {order.order_status}</p>
                      </div>
                      <div className="text-sm font-semibold text-slate-950">{order.payment_status}</div>
                    </div>
                  </Link>
                ))}
                {orders.length === 0 ? <p className="text-sm text-slate-500">No orders yet.</p> : null}
              </div>
            </div>

            <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Notifications</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Account and pharmacy updates.</h3>
                </div>
                <Link to="/notifications" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
                  View all
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {notifications.slice(0, 3).map((item) => (
                  <div key={item.id} className="border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.message}</p>
                      </div>
                      <span className={`border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${item.status === 'read' ? 'border-slate-200 bg-white text-slate-500' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 ? <p className="text-sm text-slate-500">No notifications yet.</p> : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none"
      />
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-2 text-3xl font-semibold text-slate-950">{value}</div>
    </div>
  )
}
