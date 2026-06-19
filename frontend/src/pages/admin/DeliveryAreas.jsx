import { useEffect, useMemo, useState } from 'react'
import { FiDollarSign, FiEdit, FiMapPin, FiPlus, FiRefreshCw, FiTrash2, FiTruck } from 'react-icons/fi'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import EmptyState from '../../components/common/EmptyState'
import { date, money } from '../../utils/formatters'

const statuses = ['', 'active', 'inactive']
const DELIVERY_AREAS_CACHE_KEY = 'admin_delivery_areas_payload_v1'
const DELIVERY_AREAS_CACHE_TTL = 2 * 60 * 1000

const defaultForm = {
  area_name: '',
  city: '',
  delivery_charge: '',
  status: 'active',
}

function cacheKey(params) {
  return JSON.stringify({
    search: params.search || '',
    status: params.status || '',
    city: params.city || '',
    page: params.page || 1,
  })
}

function readCache(params) {
  if (typeof window === 'undefined') return null

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(DELIVERY_AREAS_CACHE_KEY) || '{}')
    const cached = cache[cacheKey(params)]
    if (!cached || Date.now() - cached.cachedAt > DELIVERY_AREAS_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

function writeCache(params, payload) {
  if (typeof window === 'undefined') return

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(DELIVERY_AREAS_CACHE_KEY) || '{}')
    cache[cacheKey(params)] = { payload, cachedAt: Date.now() }
    window.sessionStorage.setItem(DELIVERY_AREAS_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

function clearCache() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(DELIVERY_AREAS_CACHE_KEY)
}

function statusBadgeClass(status) {
  return status === 'active'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-rose-200 bg-rose-50 text-rose-700'
}

function getInitials(name) {
  return String(name || 'A')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'A'
}

function StatCard({ icon: Icon, label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-white text-slate-700',
    emerald: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    rose: 'border-rose-200 bg-rose-50/70 text-rose-700',
    sky: 'border-sky-200 bg-sky-50/70 text-sky-700',
  }

  return (
    <div className={`rounded-lg border px-4 py-4 ${tones[tone] || tones.slate}`}>
      <div className="flex items-start justify-between gap-3">
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

export default function DeliveryAreas() {
  const initialParams = { search: '', status: '', city: '', page: 1 }
  const initialCache = readCache(initialParams)
  const [params, setParams] = useState(initialParams)
  const [areas, setAreas] = useState(initialCache?.areas || [])
  const [meta, setMeta] = useState(initialCache?.meta || null)
  const [allAreas, setAllAreas] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(!initialCache)
  const [updating, setUpdating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(defaultForm)

  const cityOptions = useMemo(() => {
    const cities = allAreas.map((area) => area.city).filter(Boolean)
    return [...new Set(cities)].sort((a, b) => a.localeCompare(b))
  }, [allAreas])

  const stats = useMemo(() => ({
    total: allAreas.length,
    active: allAreas.filter((area) => area.status === 'active').length,
    inactive: allAreas.filter((area) => area.status === 'inactive').length,
    averageCharge: allAreas.length
      ? allAreas.reduce((sum, area) => sum + Number(area.delivery_charge || 0), 0) / allAreas.length
      : 0,
  }), [allAreas])

  const hasActiveFilters = Boolean(search || params.status || params.city)

  const loadAreaOptions = () => {
    adminApi.listFresh('delivery-areas', { page: 1, per_page: 100 })
      .then((res) => setAllAreas(res.data.data?.data || []))
      .catch(() => {})
  }

  useEffect(() => {
    loadAreaOptions()
  }, [])

  useEffect(() => {
    let active = true
    const cached = readCache(params)

    if (cached) {
      setAreas(cached.areas || [])
      setMeta(cached.meta || null)
      setLoading(false)
      setUpdating(false)
      return () => { active = false }
    }

    const hasRows = areas.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('delivery-areas', params)
      .then((res) => {
        if (!active) return
        const payload = {
          areas: res.data.data?.data || [],
          meta: res.data.data,
        }
        setAreas(payload.areas)
        setMeta(payload.meta)
        writeCache(params, payload)
      })
      .catch(() => active && toast.error('Unable to load delivery areas.'))
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

  const resetForm = () => {
    setEditingId(null)
    setForm(defaultForm)
  }

  const refreshList = () => {
    clearCache()
    loadAreaOptions()
    setParams((current) => ({ ...current }))
  }

  const startEdit = (area) => {
    setEditingId(area.id)
    setForm({
      area_name: area.area_name || '',
      city: area.city || '',
      delivery_charge: String(area.delivery_charge ?? ''),
      status: area.status || 'active',
    })
  }

  const submit = async (event) => {
    event.preventDefault()

    const payload = {
      area_name: form.area_name.trim(),
      city: form.city.trim(),
      delivery_charge: Number(form.delivery_charge || 0),
      status: form.status || 'active',
    }

    if (!payload.area_name || !payload.city) {
      toast.error('Area name and city are required.')
      return
    }

    if (Number.isNaN(payload.delivery_charge) || payload.delivery_charge < 0) {
      toast.error('Enter a valid delivery charge.')
      return
    }

    setSaving(true)

    try {
      if (editingId) {
        await adminApi.update('delivery-areas', editingId, payload)
        toast.success('Delivery area updated.')
      } else {
        await adminApi.create('delivery-areas', payload)
        toast.success('Delivery area created.')
      }
      resetForm()
      refreshList()
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to save delivery area.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const removeArea = async (area) => {
    const result = await Swal.fire({
      title: 'Delete this delivery area?',
      text: `${area.area_name}, ${area.city}`,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    })

    if (!result.isConfirmed) return

    try {
      await adminApi.remove('delivery-areas', area.id)
      toast.success('Delivery area deleted.')
      if (editingId === area.id) resetForm()
      refreshList()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete delivery area.')
    }
  }

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={FiMapPin} label="Total Areas" value={stats.total} tone="slate" />
        <StatCard icon={FiTruck} label="Active Areas" value={stats.active} tone="emerald" />
        <StatCard icon={FiRefreshCw} label="Inactive Areas" value={stats.inactive} tone="rose" />
        {/* <StatCard icon={FiDollarSign} label="Average Charge" value={money(stats.averageCharge || 0)} tone="sky" /> */}
      </div>

      <form onSubmit={submit} className="mb-4 border border-slate-300 bg-white p-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-md font-semibold text-slate-950">
              {editingId ? 'Edit delivery area' : 'Add delivery area'}
            </h3>
          </div>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 lg:grid-cols-4">
          <input
            value={form.area_name}
            onChange={(event) => setForm((current) => ({ ...current, area_name: event.target.value }))}
            placeholder="Area name"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <input
            value={form.city}
            onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
            placeholder="City"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.delivery_charge}
            onChange={(event) => setForm((current) => ({ ...current, delivery_charge: event.target.value }))}
            placeholder="Delivery charge"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <select
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {editingId ? <FiEdit className="h-4 w-4" /> : <FiPlus className="h-4 w-4" />}
            <span>{saving ? 'Saving...' : editingId ? 'Update Delivery Area' : 'Add Delivery Area'}</span>
          </button>
        </div>
      </form>

      <div className="mb-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_220px_220px_150px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by area, city, or status"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <select
            value={params.city}
            onChange={(event) => updateParams({ ...params, city: event.target.value, page: 1 })}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">All Cities</option>
            {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
          <select
            value={params.status}
            onChange={(event) => updateParams({ ...params, status: event.target.value, page: 1 })}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          >
            {statuses.map((status) => (
              <option key={status || 'all'} value={status}>
                {status ? status[0].toUpperCase() + status.slice(1) : 'All Statuses'}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              updateParams({ search: '', status: '', city: '', page: 1 })
            }}
            disabled={!hasActiveFilters}
            className="inline-flex items-center justify-center rounded-md border border-slate-500 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-gray-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && areas.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && areas.length === 0 ? (
        <EmptyState title="No delivery areas found" text="Add a delivery area or adjust the search filters." />
      ) : null}

      {areas.length > 0 ? (
        <table className="min-w-full border border-slate-300 divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3 text-center">Delivery Charge</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Created</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {areas.map((area) => (
              <tr key={area.id} className="transition hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-slate-100 to-slate-200 text-xs font-semibold text-slate-700">
                      {getInitials(area.area_name)}
                    </span>
                    <div>
                      <div className="font-medium text-slate-950">{area.area_name}</div>
                      <div className="text-xs text-slate-500">Area #{area.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{area.city}</td>
                <td className="px-4 py-3 text-center font-semibold text-slate-800">{money(area.delivery_charge || 0)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(area.status)}`}>
                    {area.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-slate-600">{date(area.created_at, 'en-US')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      title="Edit area"
                      onClick={() => startEdit(area)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-300"
                    >
                      <FiEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Delete area"
                      onClick={() => removeArea(area)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {meta?.last_page > 1 ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Page {meta.current_page || params.page} / {meta.last_page}</span>
          <div className="flex justify-end gap-2">
            <button
              disabled={params.page <= 1}
              onClick={() => updateParams({ ...params, page: params.page - 1 })}
              className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={params.page >= meta.last_page}
              onClick={() => updateParams({ ...params, page: params.page + 1 })}
              className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
