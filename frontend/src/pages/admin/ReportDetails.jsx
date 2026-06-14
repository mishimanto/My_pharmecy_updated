import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import PageHeader from '../../components/common/PageHeader'

const titles = {
  sales: 'Sales Report',
  orders: 'Order Report',
  inventory: 'Inventory Report',
  payments: 'Payment Report',
  prescriptions: 'Prescription Report',
  deliveries: 'Delivery Report',
  refunds: 'Refund Report',
}

export default function ReportDetails() {
  const { type } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.report(type)
      .then((res) => setReport(res.data.data || {}))
      .catch(() => toast.error('Unable to load report data.'))
      .finally(() => setLoading(false))
  }, [type])

  return (
    <>
      <PageHeader title={titles[type] || 'Report'} subtitle="Review the report data below." />
      {loading ? <p className="text-sm text-slate-600">Loading...</p> : null}
      {report && Object.entries(report).map(([key, value]) => <ReportSection key={key} title={key} rows={Array.isArray(value) ? value : []} />)}
    </>
  )
}

function ReportSection({ title, rows }) {
  const columns = rows[0] ? Object.keys(rows[0]).slice(0, 6) : []
  return (
    <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-950">{title.replaceAll('_', ' ')}</h2>
      {!rows.length ? <p className="text-sm text-slate-500">No data found.</p> : (
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
