import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../../api/adminApi'
import AdminLoadingState from '../../../components/admin/AdminLoadingState'
import EmptyState from '../../../components/common/EmptyState'
import {
  clearManufacturersCache,
  readManufacturersCache,
  writeManufacturersCache,
} from '../../../utils/adminManufacturerCache'

const statuses = ['', 'active', 'inactive']

function statusClass(status) {
  return status === 'active' ? 'text-emerald-600' : 'text-rose-600'
}

function initials(name) {
  return name?.slice(0, 2)?.toUpperCase() || 'NA'
}

export default function ManufacturerIndex() {
  const initialParams = { search: '', status: '', page: 1 }
  const initialCache = readManufacturersCache(initialParams)
  const [params, setParams] = useState(initialParams)
  const [manufacturers, setManufacturers] = useState(initialCache?.manufacturers || [])
  const [meta, setMeta] = useState(initialCache?.meta || null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(!initialCache)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    let active = true
    const cached = readManufacturersCache(params)

    if (cached) {
      setManufacturers(cached.manufacturers || [])
      setMeta(cached.meta || null)
      setLoading(false)
      setUpdating(false)
      return () => { active = false }
    }

    const hasRows = manufacturers.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('manufacturers', params)
      .then(({ data }) => {
        if (!active) return
        const payload = {
          manufacturers: data.data?.data || [],
          meta: data.data,
        }
        setManufacturers(payload.manufacturers)
        setMeta(payload.meta)
        writeManufacturersCache(params, payload)
      })
      .catch(() => active && toast.error('Unable to load manufacturers.'))
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

  const removeManufacturer = async (manufacturer) => {
    if (manufacturer.products_count > 0) {
      await Swal.fire({
        title: 'Manufacturer is in use',
        text: 'Move or remove the products for this manufacturer before deleting it.',
        confirmButtonText: 'OK',
      })
      return
    }

    const result = await Swal.fire({
      title: 'Delete this manufacturer?',
      text: manufacturer.manufacturer_name,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    })

    if (!result.isConfirmed) return

    try {
      await adminApi.remove('manufacturers', manufacturer.id)
      clearManufacturersCache()
      toast.success('Manufacturer deleted.')
      setParams((current) => ({ ...current }))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete manufacturer.')
    }
  }

  return (
    <>
      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px_170px]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by manufacturer, country, or status"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
        <select
          value={params.status}
          onChange={(event) => updateParams({ ...params, status: event.target.value, page: 1 })}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        >
          {statuses.map((status) => <option key={status || 'all'} value={status}>{status ? status[0].toUpperCase() + status.slice(1) : 'All Statuses'}</option>)}
        </select>
        <Link to="/admin/manufacturers/create" className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-700">
          <FiPlus className="h-4 w-4" />
          <span>Add Manufacturer</span>
        </Link>
      </div>

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && manufacturers.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && manufacturers.length === 0 ? (
        <EmptyState title="No manufacturers found" text="Try another search term or adjust the status filter." />
      ) : null}

      {manufacturers.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Manufacturer</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3 text-center">Products</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {manufacturers.map((manufacturer) => (
                <tr key={manufacturer.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {manufacturer.logo_url ? (
                        <img src={manufacturer.logo_url} alt={manufacturer.manufacturer_name} loading="lazy" decoding="async" className="h-11 w-11 rounded-md border border-slate-200 object-cover" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                          {initials(manufacturer.manufacturer_name)}
                        </div>
                      )}
                      <div className="font-semibold text-slate-950">{manufacturer.manufacturer_name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{manufacturer.country || '-'}</td>
                  <td className="px-4 py-3 text-center text-slate-700">{manufacturer.products_count || 0}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-xs font-semibold ${statusClass(manufacturer.status)}`}>{manufacturer.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-3">
                      <Link to={`/admin/manufacturers/${manufacturer.id}/edit`} className="flex h-8 w-8 items-center justify-center text-emerald-700 transition hover:text-emerald-800" title="Edit manufacturer">
                        <FiEdit className="h-4 w-4" />
                      </Link>
                      <button disabled={manufacturer.products_count > 0} onClick={() => removeManufacturer(manufacturer)} className="flex h-8 w-8 items-center justify-center text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300" title={manufacturer.products_count > 0 ? 'Manufacturer has products' : 'Delete manufacturer'}>
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
            <button disabled={params.page <= 1} onClick={() => updateParams({ ...params, page: params.page - 1 })} className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
            <button disabled={params.page >= meta.last_page} onClick={() => updateParams({ ...params, page: params.page + 1 })} className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
          </div>
        </div>
      ) : null}
    </>
  )
}
