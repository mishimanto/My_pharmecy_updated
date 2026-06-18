import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminApi } from '../../../../api/adminApi'
import { productApi } from '../../../../api/productApi'
import AdminLoadingState from '../../../../components/admin/AdminLoadingState'
import { clearProductsCache } from '../../../../utils/adminProductCache'
import { clearInventoryBatchesCache } from '../../../../utils/adminInventoryBatchCache'

const initialForm = {
  product_id: '',
  supplier_id: '',
  batch_number: '',
  expiry_date: '',
  manufactured_date: '',
  purchase_price: '',
  selling_price: '',
  stock_quantity: '',
  status: 'active',
}

function formFromBatch(batch) {
  return {
    ...initialForm,
    ...batch,
    product_id: batch?.product_id || '',
    supplier_id: batch?.supplier_id || '',
    batch_number: batch?.batch_number || '',
    expiry_date: batch?.expiry_date || '',
    manufactured_date: batch?.manufactured_date || '',
    purchase_price: batch?.purchase_price ?? '',
    selling_price: batch?.selling_price ?? '',
    stock_quantity: batch?.stock_quantity ?? '',
    status: batch?.status || 'active',
  }
}

export default function BatchForm({ mode = 'create' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(initialForm)
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    Promise.all([
      adminApi.listFresh('products', { per_page: 500 }),
      adminApi.listFresh('suppliers', { per_page: 500, status: 'active' }),
    ])
      .then(([productResponse, supplierResponse]) => {
        if (!active) return
        setProducts(productResponse.data.data?.data || [])
        setSuppliers(supplierResponse.data.data?.data || [])
      })
      .catch(() => active && toast.error('Unable to load batch options.'))
      .finally(() => active && setOptionsLoading(false))

    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!isEdit) return undefined

    let active = true

    adminApi.show('inventory/batches', id)
      .then(({ data }) => {
        if (!active) return
        setForm(formFromBatch(data.data))
      })
      .catch(() => active && toast.error('Unable to load batch details.'))
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [id, isEdit])

  const selectedProduct = useMemo(
    () => products.find((product) => String(product.id) === String(form.product_id)),
    [form.product_id, products],
  )

  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => String(supplier.id) === String(form.supplier_id)),
    [form.supplier_id, suppliers],
  )

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!form.product_id || !form.supplier_id || !form.batch_number.trim()) {
      toast.error('Product, supplier, and batch number are required.')
      return
    }

    setSaving(true)

    try {
      const payload = {
        product_id: form.product_id,
        supplier_id: form.supplier_id,
        batch_number: form.batch_number.trim(),
        expiry_date: form.expiry_date,
        manufactured_date: form.manufactured_date || null,
        purchase_price: Number(form.purchase_price || 0),
        selling_price: Number(form.selling_price || 0),
        stock_quantity: Number(form.stock_quantity || 0),
        status: form.status || 'active',
      }

      if (isEdit) {
        await adminApi.update('inventory/batches', id, payload)
      } else {
        await adminApi.create('inventory/batches', payload)
      }

      clearInventoryBatchesCache()
      clearProductsCache()
      productApi.clearCache()
      toast.success(isEdit ? 'Batch updated.' : 'Batch created.')
      navigate('/admin/inventory/batches')
    } catch (error) {
      const errors = error.response?.data?.errors
      const firstError = errors ? Object.values(errors).flat()[0] : null
      toast.error(firstError || error.response?.data?.message || 'Unable to save batch.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <AdminLoadingState className="py-8" />
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{isEdit ? 'Edit batch' : 'Add inventory batch'}</h2>
        </div>
        <Link to="/admin/inventory/batches" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700">
          <FiArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">Batch details</div>
          <button disabled={saving || optionsLoading} className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
            <FiSave className="h-4 w-4" />
            <span>{saving ? 'Saving...' : isEdit ? 'Update Batch' : 'Create Batch'}</span>
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Product</span>
            <select value={form.product_id} onChange={(event) => setField('product_id', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" disabled={optionsLoading}>
              <option value="">{optionsLoading ? 'Loading products...' : 'Select product'}</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.product_name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Supplier</span>
            <select value={form.supplier_id} onChange={(event) => setField('supplier_id', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" disabled={optionsLoading}>
              <option value="">{optionsLoading ? 'Loading suppliers...' : 'Select supplier'}</option>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.supplier_name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Batch number</span>
            <input value={form.batch_number} onChange={(event) => setField('batch_number', event.target.value)} placeholder="BATCH-001" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Expiry date</span>
            <input type="date" value={form.expiry_date} onChange={(event) => setField('expiry_date', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Manufactured date</span>
            <input type="date" value={form.manufactured_date || ''} onChange={(event) => setField('manufactured_date', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
            <select value={form.status} onChange={(event) => setField('status', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
              <option value="damaged">Damaged</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Purchase price</span>
            <input type="number" min="0" step="0.01" value={form.purchase_price} onChange={(event) => setField('purchase_price', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Selling price</span>
            <input type="number" min="0" step="0.01" value={form.selling_price} onChange={(event) => setField('selling_price', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Stock quantity</span>
            <input type="number" min="0" value={form.stock_quantity} onChange={(event) => setField('stock_quantity', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
          </label>
        </div>

        {selectedProduct || selectedSupplier ? (
          <div className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <span className="font-medium text-slate-700">Selected product:</span>{' '}
              <span>{selectedProduct?.product_name || '-'}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Selected supplier:</span>{' '}
              <span>{selectedSupplier?.supplier_name || '-'}</span>
            </div>
          </div>
        ) : null}
      </section>
    </form>
  )
}
