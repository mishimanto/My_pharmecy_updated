import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FiCalendar,
  FiFileText,
  FiHeadphones,
  FiMail,
  FiMapPin,
  FiPhone,
  FiRotateCcw,
  FiShield,
  FiShoppingBag,
} from 'react-icons/fi'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'
import { getOrderStatusLabel, getPaymentStatusLabel } from '../../utils/statusLabels'

const tabs = [
  ['orders', 'Orders'],
  ['prescriptions', 'Prescriptions'],
  ['support-tickets', 'Support'],
  ['returns', 'Returns'],
]

const tabIcons = {
  orders: FiShoppingBag,
  prescriptions: FiFileText,
  'support-tickets': FiHeadphones,
  returns: FiRotateCcw,
}

export default function UserDetails() {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [active, setActive] = useState('orders')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.show('users', id)
      .then((res) => setUser(res.data.data))
      .catch(() => toast.error('Unable to load customer details.'))
  }, [id])

  useEffect(() => {
    adminApi.userHistory(id, active)
      .then((res) => setRows(res.data.data?.data || []))
      .catch(() => toast.error('Unable to load customer history.'))
      .finally(() => setLoading(false))
  }, [id, active])

  if (!user) return <AdminLoadingState className="py-8" />

  return (
    <>
      <PageHeader title="User Details" subtitle="Profile, account status, and activity history in one view." />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 px-5 py-6 text-white sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/12 text-xl font-semibold backdrop-blur">
                {getInitials(user.full_name)}
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">{user.full_name}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-200">
                  <span className="inline-flex items-center gap-2">
                    <FiPhone className="h-4 w-4" />
                    {user.phone || '-'}
                  </span>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusPillClass(user.status)}`}>
                    <FiShield className="h-3.5 w-3.5" />
                    {formatStatus(user.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="Joined" value={date(user.created_at, 'en-US')} icon={FiCalendar} />
              <MetricCard label="Email" value={user.email || '-'} icon={FiMail} />
              <MetricCard
                label="Address"
                value={user.default_address ? `${user.default_address.area}, ${user.default_address.city}` : '-'}
                icon={FiMapPin}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-slate-200 bg-slate-50/70 px-5 py-5 sm:grid-cols-3 sm:px-6">
          <Info label="User ID" value={`#${user.id}`} />
          <Info label="Default Address" value={user.default_address ? `${user.default_address.area}, ${user.default_address.city}` : 'No default address'} />
          <Info label="Account Email" value={user.email || 'No email added'} />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map(([key, label]) => {
              const Icon = tabIcons[key]
              const isActive = active === key

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setLoading(true); setActive(key) }}
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h3 className="text-sm font-semibold text-slate-950">{historyTitle(active)}</h3>
          <p className="mt-1 text-sm text-slate-500">{historySubtitle(active)}</p>
        </div>

        {loading ? <AdminLoadingState className="py-8" /> : null}
        {!loading && !rows.length ? (
          <div className="px-5 py-10 text-center sm:px-6">
            <p className="text-sm font-medium text-slate-700">No {historyTitle(active).toLowerCase()} found.</p>
            <p className="mt-1 text-sm text-slate-500">This user does not have any records in this section yet.</p>
          </div>
        ) : null}
        {!loading && rows.map((row) => <HistoryRow key={row.id} type={active} row={row} />)}
      </div>
    </>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-950">{value}</p>
    </div>
  )
}

function HistoryRow({ type, row }) {
  let title = `#${row.id}`
  let meta = row.status || row.order_status || row.payment_status || '-'
  let value = date(row.created_at || row.order_date || row.uploaded_at, 'en-US')
  if (type === 'orders') {
    title = row.order_number
    meta = getOrderStatusLabel(row.order_status)
    value = money(row.total_amount)
  }
  if (type === 'prescriptions') {
    title = `Prescription #${row.id}`
    meta = row.status
  }
  if (type === 'support-tickets') {
    title = row.subject
  }
  if (type === 'returns') {
    title = row.order?.order_number || `Return #${row.id}`
  }

  if (type !== 'orders' && row.payment_status) {
    meta = getPaymentStatusLabel(row.payment_status)
  }

  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 text-sm last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-950">{title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${rowMetaClass(type, row, meta)}`}>
            {formatMeta(meta)}
          </span>
          <span className="text-xs text-slate-400">{historyMetaLabel(type)}</span>
        </div>
      </div>
      <div className="text-sm font-semibold text-slate-700">{value}</div>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  )
}

function getInitials(name) {
  return String(name || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U'
}

function formatStatus(status) {
  if (!status) return 'Unknown'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatMeta(meta) {
  if (!meta) return '-'
  return String(meta)
}

function statusPillClass(status) {
  if (status === 'active') return 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100'
  if (status === 'blocked') return 'border-rose-300/40 bg-rose-400/15 text-rose-100'
  if (status === 'inactive') return 'border-slate-300/40 bg-slate-200/10 text-slate-100'
  return 'border-white/20 bg-white/10 text-white'
}

function rowMetaClass(type, row, meta) {
  const source = type === 'orders'
    ? row.order_status
    : type === 'prescriptions'
      ? row.status
      : row.payment_status || row.status || meta

  const normalized = String(source || '').toLowerCase()

  if (['delivered', 'approved', 'resolved', 'completed', 'paid', 'active'].includes(normalized)) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (['pending', 'processing', 'open'].includes(normalized)) {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }
  if (['blocked', 'cancelled', 'rejected', 'failed', 'inactive'].includes(normalized)) {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function historyTitle(type) {
  if (type === 'orders') return 'Order history'
  if (type === 'prescriptions') return 'Prescription history'
  if (type === 'support-tickets') return 'Support history'
  if (type === 'returns') return 'Return history'
  return 'History'
}

function historySubtitle(type) {
  if (type === 'orders') return 'Track orders, order amounts, and current fulfillment state.'
  if (type === 'prescriptions') return 'Review uploaded prescriptions and their approval status.'
  if (type === 'support-tickets') return 'See support communication and ticket progress.'
  if (type === 'returns') return 'Monitor return requests and related order references.'
  return 'Review activity records for this user.'
}

function historyMetaLabel(type) {
  if (type === 'orders') return 'Current order status'
  if (type === 'prescriptions') return 'Prescription status'
  if (type === 'support-tickets') return 'Ticket state'
  if (type === 'returns') return 'Return state'
  return 'Status'
}
