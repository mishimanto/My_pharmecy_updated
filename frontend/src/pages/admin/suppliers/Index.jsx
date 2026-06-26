/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArchive, FiCheckCircle, FiEdit, FiPlus, FiTrash2, FiTruck, FiXCircle } from 'react-icons/fi'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../../api/adminApi'
import AdminFilterBar from '../../../components/admin/AdminFilterBar'
import AdminLoadingState from '../../../components/admin/AdminLoadingState'
import AdminStatCard from '../../../components/admin/AdminStatCard'
import EmptyState from '../../../components/common/EmptyState'
import { clearSuppliersCache, readSuppliersCache, writeSuppliersCache } from '../../../utils/adminSupplierCache'

const statuses = ['', 'active', 'inactive']

function statusClass(status) {
  return status === 'active' ? 'text-emerald-600' : 'text-rose-600'
}

function initials(name) {
  return name?.slice(0, 2)?.toUpperCase() || 'SU'
}

export default function SupplierIndex() {
  const initialParams = { search: '', status: '', page: 1 }
  const initialCache = readSuppliersCache(initialParams)
  const [params, setParams] = useState(initialParams)
  const [suppliers, setSuppliers] = useState(initialCache?.suppliers || [])
  const [meta, setMeta] = useState(initialCache?.meta || null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(!initialCache)
  const [updating, setUpdating] = useState(false)
  const statItems = useMemo(() => {
    const totalSuppliers = meta?.total ?? suppliers.length
    const activeSuppliers = suppliers.filter((supplier) => supplier.status === 'active').length
    const inactiveSuppliers = suppliers.filter((supplier) => supplier.status === 'inactive').length
    const linkedBatches = suppliers.reduce((total, supplier) => total + Number(supplier.batches_count || 0), 0)

    return [
      { label: 'Total Suppliers', value: totalSuppliers, variant: 'sky', icon: FiTruck },
      { label: 'Active Suppliers', value: activeSuppliers, variant: 'emerald', icon: FiCheckCircle },
      { label: 'Inactive Suppliers', value: inactiveSuppliers, variant: 'rose', icon: FiXCircle },
      { label: 'Linked Batches', value: linkedBatches, variant: 'amber', icon: FiArchive },
    ]
  }, [meta?.total, suppliers])

  useEffect(() => {
    let active = true
    const cached = readSuppliersCache(params)

    if (cached) {
      setSuppliers(cached.suppliers || [])
      setMeta(cached.meta || null)
      setLoading(false)
      setUpdating(false)
      return () => { active = false }
    }

    const hasRows = suppliers.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('suppliers', params)
      .then(({ data }) => {
        if (!active) return
        const payload = {
          suppliers: data.data?.data || [],
          meta: data.data,
        }
        setSuppliers(payload.suppliers)
        setMeta(payload.meta)
        writeSuppliersCache(params, payload)
      })
      .catch(() => active && toast.error('Unable to load suppliers.'))
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
    label: status ? status[0].toUpperCase() + status.slice(1) : 'All Statuses',
  }))

  const removeSupplier = async (supplier) => {
    if (supplier.batches_count > 0) {
      await Swal.fire({
        title: 'Supplier is in use',
        text: 'This supplier has inventory batches. Remove or move those batches before deleting it.',
        confirmButtonText: 'OK',
      })
      return
    }

    const result = await Swal.fire({
      title: 'Delete this supplier?',
      text: supplier.supplier_name,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    })

    if (!result.isConfirmed) return

    try {
      await adminApi.remove('suppliers', supplier.id)
      clearSuppliersCache()
      toast.success('Supplier deleted.')
      setParams((current) => ({ ...current }))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete supplier.')
    }
  }

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statItems.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} variant={item.variant} icon={item.icon} />
        ))}
      </div>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by supplier, phone, email, or status"
        filters={[{
          key: 'status',
          value: params.status,
          onChange: (value) => updateParams({ ...params, status: value, page: 1 }),
          options: statusFilterOptions,
        }]}
      >
        <Link to="/admin/suppliers/create" className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-700">
          <FiPlus className="h-4 w-4" />
          <span>Add Supplier</span>
        </Link>
      </AdminFilterBar>

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && suppliers.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && suppliers.length === 0 ? (
        <EmptyState title="No suppliers found" text="Try another search term or adjust the status filter." />
      ) : null}

      {suppliers.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3 text-center">Batches</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                        {initials(supplier.supplier_name)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-950">{supplier.supplier_name}</div>
                        {/* <div className="text-xs text-slate-500">Supplier ID #{supplier.id}</div> */}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{supplier.phone || '-'}</div>
                    <div className="text-xs text-slate-500">{supplier.email || '-'}</div>
                  </td>
                  <td className="max-w-sm px-4 py-3 text-slate-600">{supplier.address || '-'}</td>
                  <td className="px-4 py-3 text-center text-slate-700">{supplier.batches_count || 0}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-xs font-semibold ${statusClass(supplier.status)}`}>{supplier.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-3">
                      <Link to={`/admin/suppliers/${supplier.id}/edit`} className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-100 text-emerald-700 transition hover:bg-emerald-50" title="Edit supplier">
                        <FiEdit className="h-4 w-4" />
                      </Link>
                      <button disabled={supplier.batches_count > 0} onClick={() => removeSupplier(supplier)} className="flex h-8 w-8 items-center justify-center rounded-md border border-rose-100 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300" title={supplier.batches_count > 0 ? 'Supplier has batches' : 'Delete supplier'}>
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
