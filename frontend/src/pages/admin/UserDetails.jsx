import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'

const tabs = [
  ['orders', 'অর্ডার'],
  ['prescriptions', 'প্রেসক্রিপশন'],
  ['support-tickets', 'সাপোর্ট'],
  ['returns', 'রিটার্ন'],
]

export default function UserDetails() {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [active, setActive] = useState('orders')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.show('users', id)
      .then((res) => setUser(res.data.data))
      .catch(() => toast.error('কাস্টমার বিস্তারিত লোড করা যায়নি।'))
  }, [id])

  useEffect(() => {
    adminApi.userHistory(id, active)
      .then((res) => setRows(res.data.data?.data || []))
      .catch(() => toast.error('হিস্টরি লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }, [id, active])

  if (!user) return <p className="text-sm text-slate-600">লোড হচ্ছে...</p>

  return (
    <>
      <PageHeader title={user.full_name} subtitle={`${user.phone} - ${user.status}`} />
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <div className="grid gap-4 sm:grid-cols-3">
          <Info label="ইমেইল" value={user.email || '-'} />
          <Info label="ঠিকানা" value={user.default_address ? `${user.default_address.area}, ${user.default_address.city}` : '-'} />
          <Info label="যোগদান" value={date(user.created_at)} />
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map(([key, label]) => <button key={key} onClick={() => { setLoading(true); setActive(key) }} className={`px-3 py-2 text-sm font-semibold ${active === key ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-600'}`}>{label}</button>)}
      </div>
      <div className="mt-4 rounded-lg border border-slate-200 bg-white">
        {loading ? <p className="p-5 text-sm text-slate-600">লোড হচ্ছে...</p> : null}
        {!loading && !rows.length ? <p className="p-5 text-sm text-slate-600">ডাটা নেই।</p> : null}
        {!loading && rows.map((row) => <HistoryRow key={row.id} type={active} row={row} />)}
      </div>
    </>
  )
}

function Info({ label, value }) {
  return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-medium text-slate-950">{value}</p></div>
}

function HistoryRow({ type, row }) {
  let title = `#${row.id}`
  let meta = row.status || row.order_status || row.payment_status || '-'
  let value = date(row.created_at || row.order_date || row.uploaded_at)
  if (type === 'orders') {
    title = row.order_number
    value = money(row.total_amount)
  }
  if (type === 'prescriptions') {
    title = `প্রেসক্রিপশন #${row.id}`
    meta = row.status
  }
  if (type === 'support-tickets') {
    title = row.subject
  }
  if (type === 'returns') {
    title = row.order?.order_number || `রিটার্ন #${row.id}`
  }

  return <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 text-sm last:border-b-0"><div><p className="font-semibold text-slate-950">{title}</p><p className="text-slate-500">{meta}</p></div><span className="font-medium text-slate-700">{value}</span></div>
}
