import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import PageHeader from '../../components/common/PageHeader'

const titles = {
  sales: 'সেলস রিপোর্ট',
  orders: 'অর্ডার রিপোর্ট',
  inventory: 'ইনভেন্টরি রিপোর্ট',
  payments: 'পেমেন্ট রিপোর্ট',
  prescriptions: 'প্রেসক্রিপশন রিপোর্ট',
  deliveries: 'ডেলিভারি রিপোর্ট',
  refunds: 'রিফান্ড রিপোর্ট',
}

export default function ReportDetails() {
  const { type } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.report(type)
      .then((res) => setReport(res.data.data || {}))
      .catch(() => toast.error('রিপোর্ট লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }, [type])

  return (
    <>
      <PageHeader title={titles[type] || 'রিপোর্ট'} subtitle="রিপোর্ট ডাটা স্ক্যান করুন।" />
      {loading ? <p className="text-sm text-slate-600">লোড হচ্ছে...</p> : null}
      {report && Object.entries(report).map(([key, value]) => <ReportSection key={key} title={key} rows={Array.isArray(value) ? value : []} />)}
    </>
  )
}

function ReportSection({ title, rows }) {
  const columns = rows[0] ? Object.keys(rows[0]).slice(0, 6) : []
  return (
    <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-950">{title.replaceAll('_', ' ')}</h2>
      {!rows.length ? <p className="text-sm text-slate-500">ডাটা নেই।</p> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600"><tr>{columns.map((column) => <th key={column} className="px-3 py-2 font-semibold">{column}</th>)}</tr></thead>
            <tbody>{rows.map((row, index) => <tr key={row.id || index} className="border-t border-slate-100">{columns.map((column) => <td key={column} className="max-w-[220px] truncate px-3 py-2">{format(row[column])}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function format(value) {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') return value.full_name || value.product_name || value.order_number || JSON.stringify(value)
  return String(value)
}
