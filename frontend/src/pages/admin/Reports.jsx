import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'

const reports = [
  ['sales', 'Sales Report', 'Daily and monthly sales, plus top-selling medicines'],
  ['orders', 'Order Report', 'Order statuses and recent orders'],
  ['inventory', 'Inventory Report', 'Low stock and near-expiry inventory'],
  ['payments', 'Payment Report', 'Payment statuses and methods'],
  ['prescriptions', 'Prescription Report', 'Prescription review statuses'],
  ['deliveries', 'Delivery Report', 'Rider delivery performance'],
  ['refunds', 'Refund Report', 'Refund and return statuses'],
]

export default function Reports() {
  return (
    <>
      <PageHeader title="Reports" subtitle="Sales, order, stock, payment, prescription, delivery, and refund reports." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map(([type, title, subtitle]) => (
          <Link key={type} to={`/admin/reports/${type}`} className="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-emerald-300">
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
          </Link>
        ))}
      </div>
    </>
  )
}
