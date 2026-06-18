import { useEffect, useState } from 'react'
import { FiPlus, FiPower, FiTrash2 } from 'react-icons/fi'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import EmptyState from '../../components/common/EmptyState'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import { adminApi } from '../../api/adminApi'
import { productApi } from '../../api/productApi'
import { date, money } from '../../utils/formatters'
import { clearProductsCache } from '../../utils/adminProductCache'
import {
  clearInventoryBatchesCache,
  readInventoryBatchesCache,
  writeInventoryBatchesCache,
} from '../../utils/adminInventoryBatchCache'

const empty = {
  product_id: '',
  supplier_id: '',
  batch_number: '',
  expiry_date: '',
  manufactured_date: '',
  purchase_price: '',
  selling_price: '',
  stock_quantity: '',
  reserved_quantity: 0,
  status: 'active',
}

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

export default function InventoryBatches() {
  const initialParams = { search: '', product_id: '', supplier_id: '', status: '', stock_state: '', page: 1 }
  const initialCache = readInventoryBatchesCache(initialParams)
  const [params, setParams] = useState(initialParams)
  const [batches, setBatches] = useState(initialCache?.batches || [])
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [form, setForm] = useState(empty)
  const [search, setSearch] = useState('')
  const [meta, setMeta] = useState(initialCache?.meta || null)
  const [loading, setLoading] = useState(!initialCache)
  const [updating, setUpdating] = useState(false)
  const [saving, setSaving] = useState(false)

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

  const refreshAfterChange = () => {
    clearInventoryBatchesCache()
    clearProductsCache()
    productApi.clearCache()
    setParams((current) => ({ ...current }))
  }

  const submit = async (event) => {
    event.preventDefault()

    setSaving(true)
    try {
      await adminApi.create('inventory/batches', {
        ...form,
        purchase_price: Number(form.purchase_price || 0),
        selling_price: Number(form.selling_price || 0),
        stock_quantity: Number(form.stock_quantity || 0),
        reserved_quantity: Number(form.reserved_quantity || 0),
      })
      toast.success('Batch created.')
      setForm(empty)
      refreshAfterChange()
    } catch (error) {
      const errors = error.response?.data?.errors
      const firstError = errors ? Object.values(errors).flat()[0] : null
      toast.error(firstError || error.response?.data?.message || 'Unable to save the batch.')
    } finally {
      setSaving(false)
    }
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
      <form className="mb-4 rounded-lg border border-slate-200 bg-white p-4" onSubmit={submit}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold text-slate-900">Add inventory batch</div>
          <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
            <FiPlus className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Add Batch'}</span>
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" value={form.product_id} onChange={(event) => setForm({ ...form, product_id: event.target.value })}>
            <option value="">Product</option>
            {products.map((item) => <option key={item.id} value={item.id}>{item.product_name}</option>)}
          </select>
          <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" value={form.supplier_id} onChange={(event) => setForm({ ...form, supplier_id: event.target.value })}>
            <option value="">Supplier</option>
            {suppliers.map((item) => <option key={item.id} value={item.id}>{item.supplier_name}</option>)}
          </select>
          <input className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" placeholder="Batch number" value={form.batch_number} onChange={(event) => setForm({ ...form, batch_number: event.target.value })} />
          <input className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" type="date" value={form.expiry_date} onChange={(event) => setForm({ ...form, expiry_date: event.target.value })} />
          <input className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" type="date" value={form.manufactured_date || ''} onChange={(event) => setForm({ ...form, manufactured_date: event.target.value })} />
          <input className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" type="number" min="0" step="0.01" placeholder="Purchase price" value={form.purchase_price} onChange={(event) => setForm({ ...form, purchase_price: event.target.value })} />
          <input className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" type="number" min="0" step="0.01" placeholder="Selling price" value={form.selling_price} onChange={(event) => setForm({ ...form, selling_price: event.target.value })} />
          <input className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" type="number" min="0" placeholder="Stock quantity" value={form.stock_quantity} onChange={(event) => setForm({ ...form, stock_quantity: event.target.value })} />
        </div>
      </form>

      <div className="mb-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
          <input className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" placeholder="Search by batch, product, supplier, or status" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select value={params.status} onChange={(event) => updateParams({ ...params, status: event.target.value, page: 1 })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
            {statuses.map((status) => <option key={status || 'all'} value={status}>{status ? status[0].toUpperCase() + status.slice(1) : 'All Statuses'}</option>)}
          </select>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select value={params.product_id} onChange={(event) => updateParams({ ...params, product_id: event.target.value, page: 1 })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
            <option value="">All Products</option>
            {products.map((item) => <option key={item.id} value={item.id}>{item.product_name}</option>)}
          </select>
          <select value={params.supplier_id} onChange={(event) => updateParams({ ...params, supplier_id: event.target.value, page: 1 })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
            <option value="">All Suppliers</option>
            {suppliers.map((item) => <option key={item.id} value={item.id}>{item.supplier_name}</option>)}
          </select>
          <select value={params.stock_state} onChange={(event) => updateParams({ ...params, stock_state: event.target.value, page: 1 })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
            {stockStates.map((state) => (
              <option key={state || 'all'} value={state}>
                {state === 'in_stock' ? 'In Stock' : state === 'reserved' ? 'Reserved Stock' : state === 'out_of_stock' ? 'Out of Stock' : 'All Stock'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && batches.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && batches.length === 0 ? <EmptyState title="No batches found" text="Try another search term or adjust the filters." /> : null}

      {batches.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Reserved</th>
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
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">{batch.available_stock}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{batch.reserved_quantity || 0}</td>
                  <td className="px-4 py-3 text-center text-slate-700">{money(batch.selling_price)}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{date(batch.expiry_date, 'en-US')}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-xs font-semibold ${statusClass(batch.status)}`}>{batch.status ? batch.status[0].toUpperCase() + batch.status.slice(1) : '-'}</span></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-3">
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
