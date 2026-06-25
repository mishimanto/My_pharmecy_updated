import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiBarChart2, FiCalendar, FiCheckCircle, FiClock, FiDownload, FiRefreshCw, FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import EmptyState from '../../components/common/EmptyState'
import { date, money } from '../../utils/formatters'

const reportMeta = {
  sales: { title: 'Sales Report', subtitle: 'Revenue, payment count, and top-selling products.' },
  orders: { title: 'Order Report', subtitle: 'Order status, payment status, and recent order activity.' },
  inventory: { title: 'Inventory Report', subtitle: 'Low stock, near expiry, and stock valuation.' },
  payments: { title: 'Payment Report', subtitle: 'Payment status, method split, and transaction activity.' },
  prescriptions: { title: 'Prescription Report', subtitle: 'Prescription status and review performance.' },
  deliveries: { title: 'Delivery Report', subtitle: 'Delivery status and rider performance.' },
  refunds: { title: 'Refund Report', subtitle: 'Refund amount, return status, and refund activity.' },
}

const moneyColumns = ['amount', 'revenue', 'sales_amount', 'total_amount', 'stock_value', 'refund_amount', 'delivery_charge']
const dateColumns = ['date', 'order_date', 'created_at', 'paid_at', 'reviewed_at', 'expiry_date']
const summaryTones = ['slate', 'emerald', 'sky', 'amber']

export default function ReportDetails() {
  const { type } = useParams()
  const meta = reportMeta[type] || { title: 'Report', subtitle: 'Generated report data.' }
  const [filters, setFilters] = useState({ date_from: '', date_to: '' })
  const [appliedFilters, setAppliedFilters] = useState(filters)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const tables = useMemo(() => report?.tables || {}, [report])
  const summary = report?.summary || []
  const totalRows = Object.values(tables).reduce((total, rows) => total + (Array.isArray(rows) ? rows.length : 0), 0)

  useEffect(() => {
    let active = true

    adminApi.report(type, cleanFilters(appliedFilters), { fresh: true })
      .then((res) => {
        if (!active) return
        setReport(res.data.data || { summary: [], tables: {} })
      })
      .catch(() => active && toast.error('Unable to generate report.'))
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [type, appliedFilters])

  const applyFilters = (event) => {
    event.preventDefault()
    setLoading(true)
    setAppliedFilters(filters)
  }

  const clearFilters = () => {
    const empty = { date_from: '', date_to: '' }
    setFilters(empty)
    setLoading(true)
    setAppliedFilters(empty)
  }

  const refresh = () => {
    setRefreshing(true)
    adminApi.report(type, cleanFilters(appliedFilters), { fresh: true })
      .then((res) => {
        setReport(res.data.data || { summary: [], tables: {} })
        toast.success('Report generated.')
      })
      .catch(() => toast.error('Unable to refresh report.'))
      .finally(() => setRefreshing(false))
  }

  const downloadCsv = () => {
    const csv = buildCsv(tables)
    if (!csv) {
      toast.error('No report rows to export.')
      return
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${type}-report.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="mb-4 border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link to="/admin/reports" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-emerald-700">
              <FiArrowLeft className="h-4 w-4" />
              Reports
            </Link>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">{meta.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{meta.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Generate
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={!totalRows}
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <FiDownload className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <InfoPill icon={FiCheckCircle} tone="emerald" label={`${Object.keys(tables).length || 0} sections`} />
          <InfoPill icon={FiBarChart2} tone="sky" label={`${totalRows} rows`} />
          <InfoPill
            icon={FiCalendar}
            tone="amber"
            label={appliedFilters.date_from || appliedFilters.date_to ? `${appliedFilters.date_from || 'Start'} to ${appliedFilters.date_to || 'Today'}` : 'All dates'}
          />
        </div>
      </div>

      <form onSubmit={applyFilters} className="mb-4">
        <div className="grid gap-3 xl:grid-cols-[180px_180px_150px_150px]">
          <input
            type="date"
            value={filters.date_from}
            onChange={(event) => setFilters((current) => ({ ...current, date_from: event.target.value }))}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <input
            type="date"
            value={filters.date_to}
            onChange={(event) => setFilters((current) => ({ ...current, date_to: event.target.value }))}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <button type="submit" className="inline-flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
            <FiSearch className="h-4 w-4" />
            Apply
          </button>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!filters.date_from && !filters.date_to && !appliedFilters.date_from && !appliedFilters.date_to}
            className="inline-flex items-center justify-center rounded-md border border-slate-500 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-gray-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Filters
          </button>
        </div>
      </form>

      {loading ? <AdminLoadingState className="py-8" /> : null}

      {!loading && report ? (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summary.length ? summary.map((item, index) => (
              <SummaryCard
                key={item.label}
                label={item.label}
                value={formatMetric(item.value, item.label)}
                tone={summaryTones[index % summaryTones.length]}
              />
            )) : <SummaryCard label="Rows" value="0" />}
          </div>

          {Object.keys(tables).length ? (
            Object.entries(tables).map(([key, rows]) => (
              <ReportSection key={key} title={key} rows={Array.isArray(rows) ? rows : []} />
            ))
          ) : (
            <EmptyState title="No report sections found" text="Try another date range or generate the report again." />
          )}
        </>
      ) : null}
    </>
  )
}

function InfoPill({ icon: Icon, label, tone }) {
  const colors = {
    emerald: 'text-emerald-600',
    sky: 'text-sky-600',
    amber: 'text-amber-600',
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5">
      <Icon className={`h-4 w-4 ${colors[tone] || 'text-slate-500'}`} />
      {label}
    </span>
  )
}

function SummaryCard({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-white text-slate-700',
    emerald: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    sky: 'border-sky-200 bg-sky-50/70 text-sky-700',
    amber: 'border-amber-200 bg-amber-50/70 text-amber-700',
  }

  return (
    <div className={`rounded-lg border px-4 py-4 ${tones[tone] || tones.slate}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm">
          <FiBarChart2 className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}

function ReportSection({ title, rows }) {
  const columns = getColumns(rows)

  return (
    <section className="mb-6">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-md font-semibold capitalize text-slate-950">{title.replaceAll('_', ' ')}</h3>
          <p className="mt-1 text-sm text-slate-500">{rows.length ? 'Database rows generated for this report section.' : 'No rows available for this section.'}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600">
          <FiClock className="h-4 w-4 text-slate-400" />
          {rows.length} rows
        </span>
      </div>

      {!rows.length ? (
        <EmptyState compact title="No data found" text="This report section has no rows for the selected filters." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-slate-300 divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-4 py-3 font-semibold capitalize">{column.replaceAll('_', ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={row.id || `${title}-${index}`} className="transition hover:bg-slate-50/80">
                  {columns.map((column) => (
                    <td key={column} className="max-w-[260px] truncate px-4 py-3 text-slate-700">
                      {formatValue(row[column], column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function getColumns(rows) {
  const columns = new Set()
  rows.slice(0, 10).forEach((row) => {
    Object.keys(row || {}).forEach((key) => columns.add(key))
  })
  return [...columns].slice(0, 8)
}

function formatMetric(value, label) {
  const key = String(label).toLowerCase()
  if (key.includes('amount') || key.includes('revenue') || key.includes('value') || key.includes('charge')) {
    return money(value, 'en-US')
  }

  return Number(value || 0).toLocaleString('en-US')
}

function formatValue(value, column) {
  if (value === null || value === undefined || value === '') return '-'
  if (moneyColumns.includes(column)) return money(value, 'en-US')
  if (dateColumns.includes(column)) return date(value, 'en-US')
  if (typeof value === 'object') return value.full_name || value.product_name || value.order_number || JSON.stringify(value)
  return String(value)
}

function cleanFilters(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value))
}

function buildCsv(tables) {
  const chunks = []

  Object.entries(tables).forEach(([title, rows]) => {
    if (!Array.isArray(rows) || !rows.length) return
    const columns = getColumns(rows)
    chunks.push(title.replaceAll('_', ' '))
    chunks.push(columns.join(','))
    rows.forEach((row) => {
      chunks.push(columns.map((column) => csvCell(formatValue(row[column], column))).join(','))
    })
    chunks.push('')
  })

  return chunks.join('\n')
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}
