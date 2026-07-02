import { useEffect, useMemo, useState } from 'react'
import { FiDollarSign, FiEdit, FiMapPin, FiPlus, FiRefreshCw, FiTrash2, FiTruck } from 'react-icons/fi'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminFilterBar from '../../components/admin/AdminFilterBar'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import AdminStatCard from '../../components/admin/AdminStatCard'
import EmptyState from '../../components/common/EmptyState'
import { useAdminFreshListQuery } from '../../queries/adminQueries'
import { date, money } from '../../utils/formatters'

const statuses = ['', 'active', 'inactive']

const defaultForm = {
  area_name: '',
  city: '',
  delivery_charge: '',
  status: 'active',
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

function actionButtonClass(tone = 'slate') {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300',
    rose: 'border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:text-rose-700',
    slate: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
  }

  return `inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${tones[tone] || tones.slate}`
}

export default function DeliveryAreas() {
  const initialParams = { search: '', status: '', city: '', page: 1 }
  const [params, setParams] = useState(initialParams)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const areasQuery = useAdminFreshListQuery('delivery-areas', params, {
    placeholderData: (previous) => previous,
    staleTime: 1000 * 30,
  })
  const statsQuery = useAdminFreshListQuery('delivery-areas', { page: 1, per_page: 100 }, {
    staleTime: 1000 * 30,
  })
  const areas = areasQuery.data?.data || []
  const meta = areasQuery.data || null
  const allAreas = statsQuery.data?.data || []
  const loading = areasQuery.isLoading && !areasQuery.data
  const updating = areasQuery.isFetching && Boolean(areasQuery.data)

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

  const updateParams = (nextParams) => {
    setParams(nextParams)
  }

  const hasActiveFilters = Boolean(search || params.status || params.city)
  const statItems = [
    { label: 'Total Areas', value: stats.total, variant: 'slate', icon: FiMapPin },
    { label: 'Active Areas', value: stats.active, variant: 'emerald', icon: FiTruck },
    { label: 'Inactive Areas', value: stats.inactive, variant: 'rose', icon: FiRefreshCw },
    { label: 'Average Charge', value: money(stats.averageCharge || 0), variant: 'sky', icon: FiDollarSign },
  ]
  const filterOptions = [
    {
      key: 'city',
      value: params.city,
      onChange: (value) => updateParams({ ...params, city: value, page: 1 }),
      options: [
        { value: '', label: 'All Cities' },
        ...cityOptions.map((city) => ({ value: city, label: city })),
      ],
    },
    {
      key: 'status',
      value: params.status,
      onChange: (value) => updateParams({ ...params, status: value, page: 1 }),
      options: statuses.map((status) => ({
        value: status,
        label: status ? status[0].toUpperCase() + status.slice(1) : 'All Statuses',
      })),
    },
  ]

  useEffect(() => {
    if (areasQuery.isError) {
      toast.error('Unable to load delivery areas.')
    }
  }, [areasQuery.isError])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setParams((current) => current.search === search ? current : { ...current, search, page: 1 })
    }, 350)

    return () => clearTimeout(timeout)
  }, [search])

  const resetForm = () => {
    setEditingId(null)
    setForm(defaultForm)
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
      await Promise.all([areasQuery.refetch(), statsQuery.refetch()])
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
      await Promise.all([areasQuery.refetch(), statsQuery.refetch()])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete delivery area.')
    }
  }

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statItems.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} variant={item.variant} icon={item.icon} />
        ))}
      </div>

      <form onSubmit={submit} className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">
              {editingId ? 'Edit delivery area' : 'Add delivery area'}
            </h3>
          </div>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
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
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {editingId ? <FiEdit className="h-4 w-4" /> : <FiPlus className="h-4 w-4" />}
            <span>{saving ? 'Saving...' : editingId ? 'Update Delivery Area' : 'Add Delivery Area'}</span>
          </button>
        </div>
      </form>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by area, city, or status"
        filters={filterOptions}
        onClear={() => {
          setSearch('')
          updateParams({ search: '', status: '', city: '', page: 1 })
        }}
        hasActiveFilters={hasActiveFilters}
      />

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && areas.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && areas.length === 0 ? (
        <EmptyState title="No delivery areas found" text="Add a delivery area or adjust the search filters." />
      ) : null}

      {areas.length > 0 ? (
        <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
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
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-xs font-semibold text-emerald-700">
                        {getInitials(area.area_name)}
                      </span>
                      <div>
                        <div className="font-medium text-slate-950">{area.area_name}</div>
                        <div className="text-xs text-slate-500">Area #{area.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{area.city}</td>
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
                        className={actionButtonClass('emerald')}
                      >
                        <FiEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete area"
                        onClick={() => removeArea(area)}
                        className={actionButtonClass('rose')}
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
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
