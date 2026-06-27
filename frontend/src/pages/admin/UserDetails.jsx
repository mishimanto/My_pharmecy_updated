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
// import PageHeader from '../../components/common/PageHeader'
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
      {/* <PageHeader title="User Details" subtitle="Profile, account status, and activity history in one view." /> */}

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-xl font-semibold text-emerald-700">
                {getInitials(user.full_name)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="truncate text-2xl font-semibold tracking-tight text-slate-950">{user.full_name}</h2>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusPillClass(user.status)}`}>
                    <FiShield className="h-3.5 w-3.5" />
                    {formatStatus(user.status)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <FiPhone className="h-4 w-4" />
                    {user.phone || '-'}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <FiMail className="h-4 w-4" />
                    {user.email || 'No email added'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
              <MetricCard label="Joined" value={date(user.created_at, 'en-US')} icon={FiCalendar} />
              <MetricCard label="Addresses" value={user.addresses?.length || 0} icon={FiMapPin} />
              <MetricCard
                label="Sessions"
                value={user.sessions?.length || 0}
                icon={FiShield}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-slate-50/60 px-5 py-5 md:grid-cols-3 sm:px-6">
          <Info label="User ID" value={`#${user.id}`} />
          <Info label="Default Address" value={user.default_address ? `${user.default_address.area}, ${user.default_address.city}` : 'No default address'} />
          <Info label="Account Email" value={user.email || 'No email added'} />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-1">
            {tabs.map(([key, label]) => {
              const Icon = tabIcons[key]
              const isActive = active === key

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setLoading(true); setActive(key) }}
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
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
          <h3 className="text-md font-semibold text-slate-950">{historyTitle(active)}</h3>
          {/* <p className="mt-1 text-sm text-slate-500">{historySubtitle(active)}</p> */}
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
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 min-h-5 text-sm font-semibold text-slate-950">{value}</p>
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
    <div className="grid gap-3 border-b border-slate-100 px-5 py-4 text-sm last:border-b-0 sm:grid-cols-[minmax(0,1fr)_180px_160px] sm:items-center sm:px-6">
      <div className="min-w-0 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500">
          {historyIcon(type)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{historyMetaLabel(type)}</p>
        </div>
      </div>
      <div className="sm:text-center">
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${rowMetaClass(type, row, meta)}`}>
          {formatMeta(meta)}
        </span>
      </div>
      <div className="text-sm font-semibold text-slate-700 sm:text-right">{value}</div>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 truncate text-sm font-semibold text-slate-950">{value}</p>
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-slate-500">
          <Icon className="h-4 w-4" />
        </span>
      </div>
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
  if (status === 'active') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'blocked') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (status === 'inactive') return 'border-slate-200 bg-slate-100 text-slate-600'
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function historyIcon(type) {
  const Icon = tabIcons[type] || FiFileText
  return <Icon className="h-4 w-4" />
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

// function historySubtitle(type) {
//   if (type === 'orders') return 'Track orders, order amounts, and current fulfillment state.'
//   if (type === 'prescriptions') return 'Review uploaded prescriptions and their approval status.'
//   if (type === 'support-tickets') return 'See support communication and ticket progress.'
//   if (type === 'returns') return 'Monitor return requests and related order references.'
//   return 'Review activity records for this user.'
// }

function historyMetaLabel(type) {
  if (type === 'orders') return 'Current order status'
  if (type === 'prescriptions') return 'Prescription status'
  if (type === 'support-tickets') return 'Ticket state'
  if (type === 'returns') return 'Return state'
  return 'Status'
}
