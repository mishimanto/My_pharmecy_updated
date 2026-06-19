import { useEffect, useMemo, useState } from 'react'
import { FiEdit, FiPhone, FiPlus, FiTruck, FiTrash2, FiUser } from 'react-icons/fi'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import EmptyState from '../../components/common/EmptyState'
import { date } from '../../utils/formatters'

const statuses = ['', 'active', 'inactive', 'suspended']
const RIDERS_CACHE_KEY = 'admin_riders_payload_v1'
const RIDERS_CACHE_TTL = 2 * 60 * 1000

const defaultForm = {
  full_name: '',
  phone: '',
  vehicle_type: '',
  vehicle_number: '',
  status: 'active',
}

function cacheKey(params) {
  return JSON.stringify({
    search: params.search || '',
    status: params.status || '',
    vehicle_type: params.vehicle_type || '',
    page: params.page || 1,
  })
}

function readCache(params) {
  if (typeof window === 'undefined') return null

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(RIDERS_CACHE_KEY) || '{}')
    const cached = cache[cacheKey(params)]
    if (!cached || Date.now() - cached.cachedAt > RIDERS_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

function writeCache(params, payload) {
  if (typeof window === 'undefined') return

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(RIDERS_CACHE_KEY) || '{}')
    cache[cacheKey(params)] = { payload, cachedAt: Date.now() }
    window.sessionStorage.setItem(RIDERS_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

function clearCache() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(RIDERS_CACHE_KEY)
}

function getInitials(name) {
  return String(name || 'R')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'R'
}

function statusBadgeClass(status) {
  if (status === 'active') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'suspended') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-slate-100 text-slate-600'
}

function StatCard({ icon: Icon, label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-white text-slate-700',
    emerald: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50/70 text-amber-700',
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

export default function Riders() {
  const initialParams = { search: '', status: '', vehicle_type: '', page: 1 }
  const initialCache = readCache(initialParams)
  const [params, setParams] = useState(initialParams)
  const [riders, setRiders] = useState(initialCache?.riders || [])
  const [meta, setMeta] = useState(initialCache?.meta || null)
  const [allRiders, setAllRiders] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(!initialCache)
  const [updating, setUpdating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(defaultForm)

  const vehicleOptions = useMemo(() => {
    const vehicles = allRiders.map((rider) => rider.vehicle_type).filter(Boolean)
    return [...new Set(vehicles)].sort((a, b) => a.localeCompare(b))
  }, [allRiders])

  const stats = useMemo(() => ({
    total: allRiders.length,
    active: allRiders.filter((rider) => rider.status === 'active').length,
    suspended: allRiders.filter((rider) => rider.status === 'suspended').length,
    vehicleTypes: vehicleOptions.length,
  }), [allRiders, vehicleOptions.length])

  const hasActiveFilters = Boolean(search || params.status || params.vehicle_type)

  const loadRiderOptions = () => {
    adminApi.listFresh('riders', { page: 1, per_page: 100 })
      .then((res) => setAllRiders(res.data.data?.data || []))
      .catch(() => {})
  }

  useEffect(() => {
    loadRiderOptions()
  }, [])

  useEffect(() => {
    let active = true
    const cached = readCache(params)

    if (cached) {
      setRiders(cached.riders || [])
      setMeta(cached.meta || null)
      setLoading(false)
      setUpdating(false)
      return () => { active = false }
    }

    const hasRows = riders.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('riders', params)
      .then((res) => {
        if (!active) return
        const payload = {
          riders: res.data.data?.data || [],
          meta: res.data.data,
        }
        setRiders(payload.riders)
        setMeta(payload.meta)
        writeCache(params, payload)
      })
      .catch(() => active && toast.error('Unable to load riders.'))
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
    loadRiderOptions()
    setParams((current) => ({ ...current }))
  }

  const startEdit = (rider) => {
    setEditingId(rider.id)
    setForm({
      full_name: rider.full_name || '',
      phone: rider.phone || '',
      vehicle_type: rider.vehicle_type || '',
      vehicle_number: rider.vehicle_number || '',
      status: rider.status || 'active',
    })
  }

  const submit = async (event) => {
    event.preventDefault()

    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      vehicle_type: form.vehicle_type.trim(),
      vehicle_number: form.vehicle_number.trim(),
      status: form.status || 'active',
    }

    if (!payload.full_name || !payload.phone) {
      toast.error('Rider name and phone are required.')
      return
    }

    setSaving(true)

    try {
      if (editingId) {
        await adminApi.update('riders', editingId, payload)
        toast.success('Rider updated.')
      } else {
        await adminApi.create('riders', payload)
        toast.success('Rider created.')
      }
      resetForm()
      refreshList()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save rider.')
    } finally {
      setSaving(false)
    }
  }

  const removeRider = async (rider) => {
    const result = await Swal.fire({
      title: 'Delete this rider?',
      text: rider.full_name,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    })

    if (!result.isConfirmed) return

    try {
      await adminApi.remove('riders', rider.id)
      toast.success('Rider deleted.')
      if (editingId === rider.id) resetForm()
      refreshList()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete rider.')
    }
  }

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FiUser} label="Total Riders" value={stats.total} tone="slate" />
        <StatCard icon={FiTruck} label="Active Riders" value={stats.active} tone="emerald" />
        <StatCard icon={FiPhone} label="Suspended" value={stats.suspended} tone="amber" />
        <StatCard icon={FiPlus} label="Vehicle Types" value={stats.vehicleTypes} tone="sky" />
      </div>

      <form onSubmit={submit} className="mb-4 border border-slate-300 bg-white p-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-md font-semibold text-slate-950">
              {editingId ? 'Edit rider' : 'Add rider'}
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

        <div className="grid gap-3 lg:grid-cols-5">
          <input
            value={form.full_name}
            onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
            placeholder="Full name"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <input
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            placeholder="Phone"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <input
            value={form.vehicle_type}
            onChange={(event) => setForm((current) => ({ ...current, vehicle_type: event.target.value }))}
            placeholder="Vehicle type"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <input
            value={form.vehicle_number}
            onChange={(event) => setForm((current) => ({ ...current, vehicle_number: event.target.value }))}
            placeholder="Vehicle number"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <select
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {editingId ? <FiEdit className="h-4 w-4" /> : <FiPlus className="h-4 w-4" />}
            <span>{saving ? 'Saving...' : editingId ? 'Update Rider' : 'Add Rider'}</span>
          </button>
        </div>
      </form>

      <div className="mb-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_220px_220px_150px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by rider, phone, or status"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <select
            value={params.vehicle_type}
            onChange={(event) => updateParams({ ...params, vehicle_type: event.target.value, page: 1 })}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">All Vehicles</option>
            {vehicleOptions.map((vehicle) => <option key={vehicle} value={vehicle}>{vehicle}</option>)}
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
              updateParams({ search: '', status: '', vehicle_type: '', page: 1 })
            }}
            disabled={!hasActiveFilters}
            className="inline-flex items-center justify-center rounded-md border border-slate-500 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-gray-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && riders.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && riders.length === 0 ? (
        <EmptyState title="No riders found" text="Add a rider or adjust the search filters." />
      ) : null}

      {riders.length > 0 ? (
        <table className="min-w-full border border-slate-300 divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Rider</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Vehicle No.</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Created</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {riders.map((rider) => (
              <tr key={rider.id} className="transition hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-slate-100 to-slate-200 text-xs font-semibold text-slate-700">
                      {getInitials(rider.full_name)}
                    </span>
                    <div>
                      <div className="font-medium text-slate-950">{rider.full_name}</div>
                      <div className="text-xs text-slate-500">Rider #{rider.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{rider.phone}</td>
                <td className="px-4 py-3 text-slate-600">{rider.vehicle_type || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{rider.vehicle_number || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(rider.status)}`}>
                    {rider.status ? rider.status[0].toUpperCase() + rider.status.slice(1) : '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-slate-600">{date(rider.created_at, 'en-US')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      title="Edit rider"
                      onClick={() => startEdit(rider)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-300"
                    >
                      <FiEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Delete rider"
                      onClick={() => removeRider(rider)}
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
