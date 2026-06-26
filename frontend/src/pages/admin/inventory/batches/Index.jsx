/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiAlertCircle, FiArchive, FiCheckCircle, FiEdit, FiPackage, FiPlus, FiPower, FiTrash2 } from 'react-icons/fi'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import EmptyState from '../../../../components/common/EmptyState'
import AdminFilterBar from '../../../../components/admin/AdminFilterBar'
import AdminLoadingState from '../../../../components/admin/AdminLoadingState'
import AdminStatCard from '../../../../components/admin/AdminStatCard'
import { adminApi } from '../../../../api/adminApi'
import { productApi } from '../../../../api/productApi'
import { date, money } from '../../../../utils/formatters'
import { clearProductsCache } from '../../../../utils/adminProductCache'
import {
  clearInventoryBatchesCache,
  readInventoryBatchesCache,
  writeInventoryBatchesCache,
} from '../../../../utils/adminInventoryBatchCache'

const statuses = ['', 'active', 'inactive', 'expired', 'damaged']
const stockStates = ['', 'in_stock', 'reserved', 'out_of_stock']

function statusClass(status) {
  if (status === 'active') return 'text-emerald-600'
  if (status === 'inactive') return 'text-slate-500'
  if (status === 'expired') return 'text-amber-600'
  return 'text-rose-600'
}

function stockLabel(batch) {
  const available = Number(batch.available_stock || 0)
  const reserved = Number(batch.reserved_quantity || 0)
  if (available <= 0) return 'Out of stock'
  if (reserved > 0) return 'Partially reserved'
  return 'Available'
}

export default function InventoryBatchesIndex() {
  const initialParams = { search: '', product_id: '', supplier_id: '', status: '', stock_state: '', page: 1 }
  const initialCache = readInventoryBatchesCache(initialParams)
  const [params, setParams] = useState(initialParams)
  const [batches, setBatches] = useState(initialCache?.batches || [])
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [search, setSearch] = useState('')
  const [meta, setMeta] = useState(initialCache?.meta || null)
  const [loading, setLoading] = useState(!initialCache)
  const [updating, setUpdating] = useState(false)
  const statItems = useMemo(() => {
    const totalBatches = meta?.total ?? batches.length
    const activeBatches = batches.filter((batch) => batch.status === 'active').length
    const availableBatches = batches.filter((batch) => Number(batch.available_stock || 0) > 0).length
    const outOfStockBatches = batches.filter((batch) => Number(batch.available_stock || 0) <= 0).length

    return [
      { label: 'Total Batches', value: totalBatches, variant: 'sky', icon: FiArchive },
      { label: 'Active Batches', value: activeBatches, variant: 'emerald', icon: FiCheckCircle },
      { label: 'Available Stock', value: availableBatches, variant: 'amber', icon: FiPackage },
      { label: 'Out of Stock', value: outOfStockBatches, variant: 'rose', icon: FiAlertCircle },
    ]
  }, [batches, meta?.total])

  useEffect(() => {
    adminApi.listFresh('products', { per_page: 500 }).then(({ data }) => setProducts(data.data?.data || [])).catch(() => {})
    adminApi.listFresh('suppliers', { per_page: 500, status: 'active' }).then(({ data }) => setSuppliers(data.data?.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    const cached = readInventoryBatchesCache(params)

    if (cached) {
      setBatches(cached.batches || [])
      setMeta(cached.meta || null)
      setLoading(false)
      setUpdating(false)
      return () => { active = false }
    }

    const hasRows = batches.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('inventory/batches', params)
      .then(({ data }) => {
        if (!active) return
        const payload = {
          batches: data.data?.data || [],
          meta: data.data,
        }
        setBatches(payload.batches)
        setMeta(payload.meta)
        writeInventoryBatchesCache(params, payload)
      })
      .catch(() => active && toast.error('Unable to load inventory batches.'))
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

  const hasActiveFilters = Boolean(search || params.status || params.product_id || params.supplier_id || params.stock_state)
  const filterOptions = [
    {
      key: 'status',
      value: params.status,
      onChange: (value) => updateParams({ ...params, status: value, page: 1 }),
      options: statuses.map((status) => ({
        value: status,
        label: status ? status[0].toUpperCase() + status.slice(1) : 'All Statuses',
      })),
    },
    {
      key: 'product_id',
      value: params.product_id,
      onChange: (value) => updateParams({ ...params, product_id: value, page: 1 }),
      options: [
        { value: '', label: 'All Products' },
        ...products.map((item) => ({ value: String(item.id), label: item.product_name })),
      ],
    },
    {
      key: 'supplier_id',
      value: params.supplier_id,
      onChange: (value) => updateParams({ ...params, supplier_id: value, page: 1 }),
      options: [
        { value: '', label: 'All Suppliers' },
        ...suppliers.map((item) => ({ value: String(item.id), label: item.supplier_name })),
      ],
    },
    {
      key: 'stock_state',
      value: params.stock_state,
      onChange: (value) => updateParams({ ...params, stock_state: value, page: 1 }),
      options: stockStates.map((state) => ({
        value: state,
        label: state === 'in_stock' ? 'In Stock' : state === 'reserved' ? 'Reserved Stock' : state === 'out_of_stock' ? 'Out of Stock' : 'All Stock',
      })),
    },
  ]

  const clearFilters = () => {
    setSearch('')
    setParams(initialParams)
  }

  const refreshAfterChange = () => {
    clearInventoryBatchesCache()
    clearProductsCache()
    productApi.clearCache()
    setParams((current) => ({ ...current }))
  }

  const toggleStatus = async (batch) => {
    const nextStatus = batch.status === 'active' ? 'inactive' : 'active'
    const result = await Swal.fire({ title: 'Change batch status?', text: `${batch.batch_number} will become ${nextStatus}.`, showCancelButton: true, confirmButtonText: 'Update', cancelButtonText: 'Cancel' })
    if (!result.isConfirmed) return

    await adminApi.patch('inventory/batches', batch.id, 'status', { status: nextStatus })
    toast.success('Status updated.')
    refreshAfterChange()
  }

  const remove = async (batch) => {
    const result = await Swal.fire({ title: 'Delete this batch?', text: batch.batch_number, showCancelButton: true, confirmButtonText: 'Delete', cancelButtonText: 'Cancel', confirmButtonColor: '#dc2626' })
    if (!result.isConfirmed) return

    try {
      await adminApi.remove('inventory/batches', batch.id)
      toast.success('Batch deleted.')
      refreshAfterChange()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete batch.')
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
        searchPlaceholder="Search by batch, product, supplier, or status"
        filters={filterOptions}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      >
        <Link to="/admin/inventory/batches/create" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700">
          <FiPlus className="h-4 w-4" />
          <span>Add Batch</span>
        </Link>
      </AdminFilterBar>

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && batches.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && batches.length === 0 ? <EmptyState title="No batches found" text="Try another search term or adjust the filters." /> : null}

      {batches.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-[1180px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3 text-center">Total Stock</th>
                <th className="px-4 py-3 text-center">Reserved</th>
                <th className="px-4 py-3 text-center">Available Stock</th>
                <th className="px-4 py-3 text-center">Price</th>
                <th className="px-4 py-3 text-center">Expiry</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((batch) => (
                <tr key={batch.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-950">{batch.batch_number}</div>
                    <div className="text-xs text-slate-500">{stockLabel(batch)}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{batch.product?.product_name || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{batch.supplier?.supplier_name || '-'}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">{batch.stock_quantity}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{batch.reserved_quantity || 0}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">{batch.available_stock}</td>
                  <td className="px-4 py-3 text-center text-slate-700">{money(batch.selling_price)}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{date(batch.expiry_date, 'en-US')}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-xs font-semibold ${statusClass(batch.status)}`}>{batch.status ? batch.status[0].toUpperCase() + batch.status.slice(1) : '-'}</span></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-3">
                      <Link to={`/admin/inventory/batches/${batch.id}/edit`} className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-100 text-emerald-700 transition hover:bg-emerald-50" title="Edit batch">
                        <FiEdit className="h-4 w-4" />
                      </Link>
                      <button onClick={() => toggleStatus(batch)} className="flex h-8 w-8 items-center justify-center rounded-md border border-amber-100 text-amber-600 transition hover:bg-amber-50" title={batch.status === 'active' ? 'Deactivate batch' : 'Activate batch'}>
                        <FiPower className="h-4 w-4" />
                      </button>
                      <button disabled={Number(batch.reserved_quantity || 0) > 0} onClick={() => remove(batch)} className="flex h-8 w-8 items-center justify-center rounded-md border border-rose-100 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300" title={Number(batch.reserved_quantity || 0) > 0 ? 'Batch has reserved stock' : 'Delete batch'}>
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
