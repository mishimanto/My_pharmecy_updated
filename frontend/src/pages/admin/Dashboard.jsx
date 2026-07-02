import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FiAlertCircle,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiMessageSquare,
  FiPackage,
  FiRotateCcw,
  FiShoppingBag,
  FiTruck,
  FiUsers,
} from 'react-icons/fi'
import AdminChart from '../../components/admin/AdminChart'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import AdminStatCard from '../../components/admin/AdminStatCard'
// import PageHeader from '../../components/common/PageHeader'
import {
  useAdminDashboardLowStockQuery,
  useAdminDashboardNearExpiryQuery,
  useAdminDashboardPendingPrescriptionsQuery,
  useAdminDashboardRecentOrdersQuery,
  useAdminDashboardSummaryQuery,
  useAdminReportQuery,
} from '../../queries/adminQueries'
import { date, money } from '../../utils/formatters'
import { getOrderStatusLabel } from '../../utils/statusLabels'
import { delayedAnimation } from '../../utils/adminChartOptions'

const labels = {
  total_users: 'Total Customers',
  total_orders: 'Total Orders',
  today_orders: 'Today\'s Orders',
  total_revenue: 'Total Revenue',
  pending_prescription_reviews: 'Pending Prescriptions',
  pending_deliveries: 'Pending Deliveries',
  low_stock_batches: 'Low-Stock Batches',
  near_expiry_batches: 'Near-Expiry Batches',
  open_support_tickets: 'Support Tickets',
  pending_return_requests: 'Pending Returns',
}
const DASHBOARD_REPORT_DAYS = 30
const statVariants = {
  total_users: 'emerald',
  total_orders: 'sky',
  today_orders: 'violet',
  total_revenue: 'emerald',
  pending_prescription_reviews: 'amber',
  pending_deliveries: 'sky',
  low_stock_batches: 'rose',
  near_expiry_batches: 'amber',
  open_support_tickets: 'violet',
  pending_return_requests: 'rose',
}
const statIcons = {
  total_users: FiUsers,
  total_orders: FiShoppingBag,
  today_orders: FiClock,
  total_revenue: FiDollarSign,
  pending_prescription_reviews: FiFileText,
  pending_deliveries: FiTruck,
  low_stock_batches: FiAlertCircle,
  near_expiry_batches: FiPackage,
  open_support_tickets: FiMessageSquare,
  pending_return_requests: FiRotateCcw,
}

function localDateString(value) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function dashboardReportParams() {
  const dateTo = new Date()
  const dateFrom = new Date()
  dateFrom.setDate(dateTo.getDate() - DASHBOARD_REPORT_DAYS + 1)

  return {
    date_from: localDateString(dateFrom),
    date_to: localDateString(dateTo),
  }
}

function listFrom(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (payload && typeof payload === 'object') return Object.values(payload)
  return []
}

function rowsFrom(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (payload && typeof payload === 'object') return Object.values(payload)
  return []
}

export default function Dashboard() {
  const reportParams = useMemo(() => dashboardReportParams(), [])
  const summaryQuery = useAdminDashboardSummaryQuery({ staleTime: 1000 * 30 })
  const ordersQuery = useAdminDashboardRecentOrdersQuery({ staleTime: 1000 * 30 })
  const prescriptionsQuery = useAdminDashboardPendingPrescriptionsQuery({ staleTime: 1000 * 30 })
  const lowStockQuery = useAdminDashboardLowStockQuery({ staleTime: 1000 * 30 })
  const nearExpiryQuery = useAdminDashboardNearExpiryQuery({ staleTime: 1000 * 30 })
  const salesReportQuery = useAdminReportQuery('sales', reportParams, { staleTime: 1000 * 60 })
  const inventoryReportQuery = useAdminReportQuery('inventory', reportParams, { staleTime: 1000 * 60 })

  const summary = summaryQuery.data || {}
  const orders = listFrom(ordersQuery.data)
  const prescriptions = listFrom(prescriptionsQuery.data)
  const lowStock = listFrom(lowStockQuery.data)
  const nearExpiry = listFrom(nearExpiryQuery.data)
  const salesReport = salesReportQuery.data || { tables: {} }
  const inventoryReport = inventoryReportQuery.data || { tables: {} }
  const loading = (
    summaryQuery.isLoading
    || ordersQuery.isLoading
    || prescriptionsQuery.isLoading
    || lowStockQuery.isLoading
    || nearExpiryQuery.isLoading
  ) && !summaryQuery.data
  const reportsLoading = salesReportQuery.isLoading || inventoryReportQuery.isLoading
  const dailySalesTrend = useMemo(() => buildDailySalesTrend(salesReport?.tables?.daily_sales || []), [salesReport])
  const inventoryShare = useMemo(() => buildInventoryShare(inventoryReport?.tables?.stock_value || []), [inventoryReport])
  const topSellingProducts = useMemo(() => buildTopSellingProducts(salesReport?.tables?.top_selling_medicines || []), [salesReport])
  const lineOptions = useMemo(() => ({
    animation: delayedAnimation('line'),
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.18)' }, ticks: { color: '#64748b', font: { size: 11 } } },
    },
  }), [])
  const pieOptions = useMemo(() => ({
    animation: delayedAnimation('pie'),
    cutout: 0,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, boxHeight: 10, color: '#475569', font: { size: 11, weight: 600 } },
      },
    },
  }), [])
  const barOptions = useMemo(() => ({
    indexAxis: 'y',
    animation: delayedAnimation('bar'),
    scales: {
      x: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.18)' }, ticks: { color: '#64748b', font: { size: 11 } } },
      y: { grid: { display: false }, ticks: { color: '#475569', font: { size: 11, weight: 600 } } },
    },
  }), [])

  useEffect(() => {
    if (
      summaryQuery.isError
      || ordersQuery.isError
      || prescriptionsQuery.isError
      || lowStockQuery.isError
      || nearExpiryQuery.isError
    ) {
      toast.error('Unable to load dashboard data.')
    }
  }, [
    lowStockQuery.isError,
    nearExpiryQuery.isError,
    ordersQuery.isError,
    prescriptionsQuery.isError,
    summaryQuery.isError,
  ])

  useEffect(() => {
    if (salesReportQuery.isError || inventoryReportQuery.isError) {
      toast.error('Unable to load dashboard chart data.')
    }
  }, [inventoryReportQuery.isError, salesReportQuery.isError])

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <AdminLoadingState inline size={180} />
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Object.entries(labels).map(([key, label]) => (
          <AdminStatCard key={key} label={label} value={key === 'total_revenue' ? money(summary[key]) : summary[key] ?? 0} variant={statVariants[key]} icon={statIcons[key]} />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <ChartPanel title="Daily product sales" subtitle={reportsLoading ? 'Loading latest chart data...' : `Last ${DASHBOARD_REPORT_DAYS} days`}>
          <AdminChart type="line" data={dailySalesTrend} options={lineOptions} />
        </ChartPanel>
        <ChartPanel title="Inventory value share" subtitle={reportsLoading ? 'Loading latest chart data...' : 'Current stock value'}>
          <AdminChart type="pie" data={inventoryShare} options={pieOptions} />
        </ChartPanel>
      </div>
      <div className="mt-6">
        <ChartPanel title="Top-selling products" subtitle={reportsLoading ? 'Loading latest chart data...' : `Last ${DASHBOARD_REPORT_DAYS} days`}>
          <AdminChart type="bar" data={topSellingProducts} options={barOptions} className="h-96" />
        </ChartPanel>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Recent Orders" count={orders.length} to="/admin/orders">
          {orders.map((order) => <Row key={order.id} title={order.order_number} meta={`${order.customer_name || order.user?.full_name || '-'} - ${getOrderStatusLabel(order.order_status)}`} value={money(order.total_amount)} />)}
        </Panel>
        <Panel title="Pending Prescriptions" count={prescriptions.length} to="/admin/prescriptions">
          {prescriptions.map((item) => <Row key={item.id} title={item.prescription_code || `Prescription #${item.id}`} meta={item.user?.full_name || 'Guest customer'} value={date(item.uploaded_at, 'en-US')} />)}
        </Panel>
        <Panel title="Low Stock" count={lowStock.length} to="/admin/inventory/low-stock">
          {lowStock.map((item) => <Row key={item.id} title={item.product_name} meta={item.batch_number} value={item.available_stock} />)}
        </Panel>
        <Panel title="Near Expiry" count={nearExpiry.length} to="/admin/inventory/near-expiry">
          {nearExpiry.map((item) => <Row key={item.id} title={item.product_name} meta={item.batch_number} value={date(item.expiry_date, 'en-US')} />)}
        </Panel>
      </div>
    </>
  )
}

function ChartPanel({ title, subtitle, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function Panel({ title, count, to, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        {to ? <Link to={to} className="shrink-0 text-sm font-semibold text-emerald-700 hover:text-emerald-800">View all</Link> : null}
      </div>
      <div className="space-y-2">{count > 0 ? children : <p className="text-sm text-slate-500">No data found.</p>}</div>
    </section>
  )
}

function Row({ title, meta, value }) {
  return <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"><div><p className="font-medium text-slate-950">{title}</p><p className="text-xs text-slate-500">{meta}</p></div><span className="font-semibold text-slate-700">{value}</span></div>
}

function buildDailySalesTrend(rows) {
  const entries = rowsFrom(rows).reverse().slice(-14)

  return {
    labels: entries.length ? entries.map((item) => date(item.date, 'en-US')) : ['No sales'],
    datasets: [
      {
        label: 'Sales revenue',
        data: entries.length ? entries.map((item) => Math.round(Number(item.revenue || 0))) : [0],
        borderColor: '#0e6574',
        backgroundColor: 'rgba(19,184,176,0.14)',
        pointBackgroundColor: '#13b8b0',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        fill: true,
        tension: 0.35,
      },
    ],
  }
}

function buildInventoryShare(rows) {
  const products = rowsFrom(rows).slice(0, 6)
  const hasData = products.some((item) => Number(item.stock_value || 0) > 0)

  return {
    labels: products.length ? products.map((item) => item.product_name) : ['No inventory'],
    datasets: [
      {
        data: hasData ? products.map((item) => Number(item.stock_value || 0)) : [1],
        backgroundColor: ['#13b8b0', '#38bdf8', '#6366f1', '#f59e0b', '#f43f5e', '#10b981'],
        borderColor: '#ffffff',
        borderWidth: 3,
      },
    ],
  }
}

function buildTopSellingProducts(rows) {
  const products = rowsFrom(rows).slice(0, 10)

  return {
    labels: products.length ? products.map((item) => item.product_name) : ['No product sales'],
    datasets: [
      {
        label: 'Quantity sold',
        data: products.length ? products.map((item) => Number(item.quantity_sold || 0)) : [0],
        backgroundColor: products.length
          ? products.map((_, index) => ['#0e6574', '#13b8b0', '#38bdf8', '#6366f1', '#f59e0b'][index % 5])
          : ['#cbd5e1'],
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }
}
