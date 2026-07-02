import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiAlertCircle, FiCheckCircle, FiClock, FiShoppingBag } from 'react-icons/fi'
import AdminFilterBar from '../../components/admin/AdminFilterBar'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import AdminStatCard from '../../components/admin/AdminStatCard'
import EmptyState from '../../components/common/EmptyState'
import { useAdminListQuery } from '../../queries/adminQueries'
// import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'
import { getOrderStatusLabel } from '../../utils/statusLabels'

const statuses = ['', 'pending_confirmation', 'prescription_review', 'confirmed', 'processing', 'delivered', 'cancelled', 'returned', 'refunded']
const statusClasses = {
  pending_confirmation: 'text-amber-600',
  prescription_review: 'text-violet-600',
  confirmed: 'text-sky-600',
  processing: 'text-blue-600',
  delivered: 'text-emerald-600',
  cancelled: 'text-rose-600',
  returned: 'text-orange-600',
  refunded: 'text-slate-600',
}
const initialParams = { search: '', status: '', page: 1 }

export default function Orders() {
  const [params, setParams] = useState(initialParams)
  const [search, setSearch] = useState('')
  const ordersQuery = useAdminListQuery('orders', params, {
    placeholderData: (previous) => previous,
    staleTime: 1000 * 30,
  })
  const meta = ordersQuery.data || null
  const orders = meta?.data || []
  const loading = ordersQuery.isLoading && orders.length === 0
  const updating = ordersQuery.isFetching && orders.length > 0
  const statItems = useMemo(() => {
    const totalOrders = meta?.total ?? orders.length
    const pendingOrders = orders.filter((order) => ['pending_confirmation', 'prescription_review'].includes(order.order_status)).length
    const deliveredOrders = orders.filter((order) => order.order_status === 'delivered').length
    const issueOrders = orders.filter((order) => ['cancelled', 'returned', 'refunded'].includes(order.order_status)).length

    return [
      { label: 'Total Orders', value: totalOrders, variant: 'sky', icon: FiShoppingBag },
      { label: 'Pending Orders', value: pendingOrders, variant: 'amber', icon: FiClock },
      { label: 'Delivered', value: deliveredOrders, variant: 'emerald', icon: FiCheckCircle },
      { label: 'Cancelled / Returned', value: issueOrders, variant: 'rose', icon: FiAlertCircle },
    ]
  }, [meta?.total, orders])

  useEffect(() => {
    if (ordersQuery.isError) {
      toast.error('Unable to load orders.')
    }
  }, [ordersQuery.isError])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setParams((current) => current.search === search ? current : { ...current, search, page: 1 })
    }, 350)

    return () => clearTimeout(timeout)
  }, [search])

  const updateParams = (nextParams) => {
    setParams(nextParams)
  }
  const statusFilterOptions = statuses.map((status) => ({
    value: status,
    label: status ? getOrderStatusLabel(status) : 'All Statuses',
  }))

  return (
    <>
      {/* <PageHeader title="Orders" subtitle="Manage admin confirmation, cancellations, and status updates from here." /> */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statItems.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} variant={item.variant} icon={item.icon} />
        ))}
      </div>
      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Order number, customer name, or phone"
        filters={[{
          key: 'status',
          value: params.status,
          onChange: (value) => updateParams({ ...params, status: value, page: 1 }),
          options: statusFilterOptions,
        }]}
      />
      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && orders.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && orders.length === 0 ? (
        <EmptyState title="No orders found" text="Try another search term or adjust the status filter." />
      ) : null}
      {orders.length > 0 ? <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 font-medium text-slate-950">{order.order_number}</td>
                <td className="px-4 py-3 text-slate-600">{order.customer_name || order.user?.full_name || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{order.delivery_area?.area_name || '-'}</td>
                <td className="px-4 py-3"><span className={`text-xs font-semibold ${statusClasses[order.order_status] || 'text-slate-600'}`}>{getOrderStatusLabel(order.order_status)}</span></td>
                <td className="px-4 py-3 text-slate-700">{money(order.total_amount)}</td>
                <td className="px-4 py-3 text-slate-600">{date(order.order_date, 'en-US')}</td>
                <td className="px-4 py-3 text-center"><Link to={`/admin/orders/${order.id}`} className="font-semibold text-emerald-700">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div> : null}
      {meta?.last_page > 1 && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Page {meta.current_page || params.page} / {meta.last_page}</span>
          <div className="flex justify-end gap-2">
            <button disabled={params.page <= 1} onClick={() => updateParams({ ...params, page: params.page - 1 })} className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
            <button disabled={params.page >= meta.last_page} onClick={() => updateParams({ ...params, page: params.page + 1 })} className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </>
  )
}

