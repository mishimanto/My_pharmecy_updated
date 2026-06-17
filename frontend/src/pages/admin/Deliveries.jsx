import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import EmptyState from '../../components/common/EmptyState'
// import PageHeader from '../../components/common/PageHeader'
import { date } from '../../utils/formatters'
import { getDeliveryStatusLabel } from '../../utils/statusLabels'

const statuses = ['', 'pending', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed', 'returned']
const statusClasses = {
  pending: 'text-amber-600',
  assigned: 'text-sky-600',
  picked_up: 'text-blue-600',
  out_for_delivery: 'text-cyan-600',
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

  return (
    <>
      {/* <PageHeader title="Deliveries" subtitle="Assign riders and manage delivery statuses." /> */}
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tracking number, order number, or rider"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
        <select
          value={params.status}
          onChange={(event) => updateParams({ ...params, status: event.target.value, page: 1 })}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        >
          {statuses.map((status) => <option key={status || 'all'} value={status}>{status ? getDeliveryStatusLabel(status) : 'All Statuses'}</option>)}
        </select>
      </div>

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
                <th className="px-4 py-3">Rider</th>
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
                  <td className="px-4 py-3 text-slate-600">{delivery.rider?.full_name || '-'}</td>
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
