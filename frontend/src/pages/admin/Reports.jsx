import { Link } from 'react-router-dom'
import { FiArrowRight, FiBarChart2, FiCreditCard, FiDatabase, FiFileText, FiPackage, FiRefreshCw, FiShoppingBag, FiTruck, FiUploadCloud } from 'react-icons/fi'

const reports = [
  { type: 'sales', title: 'Sales Report', subtitle: 'Daily revenue, monthly revenue, and top-selling products.', icon: FiBarChart2, tone: 'emerald', group: 'Finance', tables: 3 },
  { type: 'orders', title: 'Order Report', subtitle: 'Order status, payment status, and recent order activity.', icon: FiShoppingBag, tone: 'sky', group: 'Operations', tables: 3 },
  { type: 'inventory', title: 'Inventory Report', subtitle: 'Low stock, near-expiry batches, and stock value.', icon: FiPackage, tone: 'amber', group: 'Inventory', tables: 3 },
  { type: 'payments', title: 'Payment Report', subtitle: 'Payment status, methods, and recent transactions.', icon: FiCreditCard, tone: 'emerald', group: 'Finance', tables: 3 },
  { type: 'prescriptions', title: 'Prescription Report', subtitle: 'Prescription statuses and review activity.', icon: FiUploadCloud, tone: 'sky', group: 'Clinical', tables: 3 },
  { type: 'deliveries', title: 'Delivery Report', subtitle: 'Delivery status and rider performance.', icon: FiTruck, tone: 'amber', group: 'Operations', tables: 3 },
  { type: 'refunds', title: 'Refund Report', subtitle: 'Refund totals, return statuses, and recent refunds.', icon: FiRefreshCw, tone: 'emerald', group: 'Finance', tables: 3 },
]

const tones = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  sky: 'border-sky-200 bg-sky-50 text-sky-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
}

export default function Reports() {
  const financeCount = reports.filter((report) => report.group === 'Finance').length
  const operationCount = reports.filter((report) => report.group === 'Operations').length
  const tableCount = reports.reduce((total, report) => total + report.tables, 0)

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={FiFileText} label="Report Types" value={reports.length} tone="slate" />
        <SummaryCard icon={FiCreditCard} label="Financial" value={financeCount} tone="emerald" />
        <SummaryCard icon={FiTruck} label="Operations" value={operationCount} tone="sky" />
        <SummaryCard icon={FiDatabase} label="Data Tables" value={tableCount} tone="amber" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon

          return (
            <Link
              key={report.type}
              to={`/admin/reports/${report.type}`}
              className="group block rounded-lg border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${tones[report.tone]}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="truncate text-lg font-semibold text-slate-950">{report.title}</h2>
                </div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-emerald-100 bg-white text-emerald-700 transition group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:translate-x-0.5">
                  <FiArrowRight className="h-4 w-4" />
                </span>
              </div>

              <div className="mt-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                <span>{report.group}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>{report.tables} tables</span>
              </div>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{report.subtitle}</p>
            </Link>
          )
        })}
      </div>
    </>
  )
}

function SummaryCard({ icon: Icon, label, value, tone = 'slate' }) {
  const cardTones = {
    slate: 'border-slate-200 bg-white text-slate-700',
    emerald: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    sky: 'border-sky-200 bg-sky-50/70 text-sky-700',
    amber: 'border-amber-200 bg-amber-50/70 text-amber-700',
  }

  return (
    <div className={`rounded-lg border px-4 py-4 ${cardTones[tone] || cardTones.slate}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}
