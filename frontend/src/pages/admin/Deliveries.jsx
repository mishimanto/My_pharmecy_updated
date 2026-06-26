/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiAlertCircle, FiCheckCircle, FiClock, FiTruck } from 'react-icons/fi'
import { adminApi } from '../../api/adminApi'
import AdminFilterBar from '../../components/admin/AdminFilterBar'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import AdminStatCard from '../../components/admin/AdminStatCard'
import EmptyState from '../../components/common/EmptyState'
// import PageHeader from '../../components/common/PageHeader'
import { date } from '../../utils/formatters'
import { getDeliveryStatusLabel } from '../../utils/statusLabels'

const statuses = ['', 'pending', 'delivered', 'failed', 'returned']
const statusClasses = {
  pending: 'text-amber-600',
  delivered: 'text-emerald-600',
  failed: 'text-rose-600',
  returned: 'text-orange-600',
}
const DELIVERIES_CACHE_KEY = 'admin_deliveries_payload_v1'
const DELIVERIES_CACHE_TTL = 2 * 60 * 1000

function deliveryCacheKey(params) {
  return JSON.stringify({
    search: params.search || '',
    status: params.status || '',
    page: params.page || 1,
  })
}

function readDeliveriesCache(params) {
  if (typeof window === 'undefined') return null

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(DELIVERIES_CACHE_KEY) || '{}')
    const cached = cache[deliveryCacheKey(params)]
    if (!cached || Date.now() - cached.cachedAt > DELIVERIES_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

function writeDeliveriesCache(params, payload) {
  if (typeof window === 'undefined') return

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(DELIVERIES_CACHE_KEY) || '{}')
    cache[deliveryCacheKey(params)] = { payload, cachedAt: Date.now() }
    window.sessionStorage.setItem(DELIVERIES_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

export default function Deliveries() {
  const initialParams = { search: '', status: '', page: 1 }
  const initialCache = readDeliveriesCache(initialParams)
  const [params, setParams] = useState(initialParams)
  const [deliveries, setDeliveries] = useState(initialCache?.deliveries || [])
  const [meta, setMeta] = useState(initialCache?.meta || null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(!initialCache)
  const [updating, setUpdating] = useState(false)
  const statItems = useMemo(() => {
    const totalDeliveries = meta?.total ?? deliveries.length
    const pendingDeliveries = deliveries.filter((delivery) => delivery.delivery_status === 'pending').length
    const deliveredDeliveries = deliveries.filter((delivery) => delivery.delivery_status === 'delivered').length
    const issueDeliveries = deliveries.filter((delivery) => ['failed', 'returned'].includes(delivery.delivery_status)).length

    return [
      { label: 'Total Deliveries', value: totalDeliveries, variant: 'sky', icon: FiTruck },
      { label: 'Pending Deliveries', value: pendingDeliveries, variant: 'amber', icon: FiClock },
      { label: 'Delivered', value: deliveredDeliveries, variant: 'emerald', icon: FiCheckCircle },
      { label: 'Failed / Returned', value: issueDeliveries, variant: 'rose', icon: FiAlertCircle },
    ]
  }, [deliveries, meta?.total])

  useEffect(() => {
    let active = true
    const cached = readDeliveriesCache(params)

    if (cached) {
      setDeliveries(cached.deliveries || [])
      setMeta(cached.meta || null)
      setLoading(false)
      setUpdating(false)
      return () => { active = false }
    }

    const hasRows = deliveries.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('deliveries', params)
      .then((res) => {
        if (!active) return
        const payload = {
          deliveries: res.data.data?.data || [],
          meta: res.data.data,
        }
        setDeliveries(payload.deliveries)
        setMeta(payload.meta)
        writeDeliveriesCache(params, payload)
      })
      .catch(() => active && toast.error('Unable to load deliveries.'))
      .finally(() => {
        if (!active) return
        setLoading(false)
        setUpdating(false)
      })

    return () => { active = false }
  }, [params])

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
    label: status ? getDeliveryStatusLabel(status) : 'All Statuses',
  }))

  return (
    <>
      {/* <PageHeader title="Deliveries" subtitle="Manage direct-store delivery records and statuses." /> */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statItems.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} variant={item.variant} icon={item.icon} />
        ))}
      </div>
      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tracking number or order number"
        filters={[{
          key: 'status',
          value: params.status,
          onChange: (value) => updateParams({ ...params, status: value, page: 1 }),
          options: statusFilterOptions,
        }]}
      />

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && deliveries.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && deliveries.length === 0 ? (
        <EmptyState title="No deliveries found" text="Try another search term or adjust the status filter." />
      ) : null}

      {deliveries.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Tracking</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Delivered</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td className="px-4 py-3 font-medium text-slate-950">{delivery.tracking_no || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{delivery.order?.order_number || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${statusClasses[delivery.delivery_status] || 'text-slate-600'}`}>
                      {getDeliveryStatusLabel(delivery.delivery_status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{date(delivery.delivered_at, 'en-US')}</td>
                  <td className="px-4 py-3 text-center"><Link className="font-semibold text-emerald-700" to={`/admin/deliveries/${delivery.id}`}>Manage</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {meta?.last_page > 1 ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Page {meta.current_page || params.page} / {meta.last_page}</span>
          <div className="flex justify-end gap-2">
            <button disabled={params.page <= 1} onClick={() => updateParams({ ...params, page: params.page - 1 })} className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
            <button disabled={params.page >= meta.last_page} onClick={() => updateParams({ ...params, page: params.page + 1 })} className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
          </div>
        </div>
      ) : null}
    </>
  )
}
