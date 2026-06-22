import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiEdit, FiPlus, FiPower, FiTrash2 } from 'react-icons/fi'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../../api/adminApi'
import AdminLoadingState from '../../../components/admin/AdminLoadingState'
import EmptyState from '../../../components/common/EmptyState'
import OptimizedImage from '../../../components/common/OptimizedImage'
import { money } from '../../../utils/formatters'
import { getProductThumbnail, handleImageFallback } from '../../../utils/imageUrl'
import { clearProductsCache, readProductsCache, writeProductsCache } from '../../../utils/adminProductCache'

const statusOptions = ['', 'active', 'inactive']
const prescriptionOptions = ['', 'required', 'not_required']

export default function ProductIndex() {
  const initialParams = { search: '', category_id: '', manufacturer_id: '', status: '', prescription: '', page: 1 }
  const initialCache = readProductsCache(initialParams)
  const [params, setParams] = useState(initialParams)
  const [products, setProducts] = useState(initialCache?.products || [])
  const [categories, setCategories] = useState([])
  const [manufacturers, setManufacturers] = useState([])
  const [meta, setMeta] = useState(initialCache?.meta || null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(!initialCache)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    adminApi.listFresh('categories', { per_page: 100 }).then(({ data }) => setCategories(data.data?.data || [])).catch(() => {})
    adminApi.listFresh('manufacturers', { per_page: 100 }).then(({ data }) => setManufacturers(data.data?.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    const cached = readProductsCache(params)

    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts(cached.products || [])
      setMeta(cached.meta || null)
      setLoading(false)
      setUpdating(false)
      return () => { active = false }
    }

    const hasRows = products.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('products', params)
      .then(({ data }) => {
        if (!active) return
        const payload = {
          products: data.data?.data || [],
          meta: data.data,
        }
        setProducts(payload.products)
        setMeta(payload.meta)
        writeProductsCache(params, payload)
      })
      .catch(() => active && toast.error('Unable to load products.'))
      .finally(() => {
        if (!active) return
        setLoading(false)
        setUpdating(false)
      })

    return () => { active = false }
  }, [params, products.length])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setParams((current) => current.search === search ? current : { ...current, search, page: 1 })
    }, 350)

    return () => clearTimeout(timeout)
  }, [search])

  const updateParams = (nextParams) => setParams(nextParams)

  const refreshAfterChange = () => {
    clearProductsCache()
    setParams((current) => ({ ...current }))
  }

  const toggleStatus = async (product) => {
    const result = await Swal.fire({ title: 'Change product status?', showCancelButton: true, confirmButtonText: 'Yes', cancelButtonText: 'Cancel' })
    if (!result.isConfirmed) return

    await adminApi.patch('products', product.id, 'status', { is_active: !product.is_active })
    toast.success('Status updated.')
    refreshAfterChange()
  }

  const remove = async (product) => {
    const result = await Swal.fire({ title: 'Delete this product?', text: product.product_name, showCancelButton: true, confirmButtonText: 'Delete', cancelButtonText: 'Cancel', confirmButtonColor: '#dc2626' })
    if (!result.isConfirmed) return

    await adminApi.remove('products', product.id)
    toast.success('Product deleted.')
    refreshAfterChange()
  }

  return (
    <>
      <div className="mb-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by product, generic, or brand" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
          <Link to="/admin/products/create" className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-700">
            <FiPlus className="h-4 w-4" />
            <span>Add Product</span>
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select value={params.category_id} onChange={(event) => updateParams({ ...params, category_id: event.target.value, page: 1 })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
            <option value="">All Categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.category_name}</option>)}
          </select>
          <select value={params.manufacturer_id} onChange={(event) => updateParams({ ...params, manufacturer_id: event.target.value, page: 1 })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
            <option value="">All Manufacturers</option>
            {manufacturers.map((manufacturer) => <option key={manufacturer.id} value={manufacturer.id}>{manufacturer.manufacturer_name}</option>)}
          </select>
          <select value={params.status} onChange={(event) => updateParams({ ...params, status: event.target.value, page: 1 })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
            {statusOptions.map((status) => <option key={status || 'all'} value={status}>{status ? status[0].toUpperCase() + status.slice(1) : 'All Statuses'}</option>)}
          </select>
          <select value={params.prescription} onChange={(event) => updateParams({ ...params, prescription: event.target.value, page: 1 })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
            {prescriptionOptions.map((option) => <option key={option || 'all'} value={option}>{option === 'required' ? 'Prescription' : option === 'not_required' ? 'No Prescription' : 'All Types'}</option>)}
          </select>
        </div>
      </div>

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && products.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && products.length === 0 ? <EmptyState title="No products found" text="Try another search term or adjust the filters." /> : null}

      {products.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Manufacturer</th>
                <th className="px-4 py-3 text-center">Prescription</th>
                <th className="px-4 py-3 text-center">Batch Price</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => {
                const batch = product.batches?.[0]
                return (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <OptimizedImage src={getProductThumbnail(product)} alt={product.product_name} onError={handleImageFallback} className="h-11 w-11 rounded-md border border-slate-200 object-cover" />
                        <div>
                          <div className="font-semibold text-slate-950">{product.product_name}</div>
                          <div className="text-xs text-slate-500">{product.generic_name || product.brand_name || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{product.category?.category_name || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{product.manufacturer?.manufacturer_name || '-'}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{product.requires_prescription ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{batch ? money(batch.selling_price) : '-'}</td>
                    <td className="px-4 py-3 text-center"><span className={`text-xs font-semibold ${product.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>{product.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-3">
                        <Link to={`/admin/products/${product.id}/edit`} className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-100 text-emerald-700 transition hover:bg-emerald-50" title="Edit product"><FiEdit className="h-4 w-4" /></Link>
                        <button onClick={() => toggleStatus(product)} className="flex h-8 w-8 items-center justify-center rounded-md border border-amber-100 text-amber-600 transition hover:bg-amber-50" title={product.is_active ? 'Deactivate product' : 'Activate product'}><FiPower className="h-4 w-4" /></button>
                        <button onClick={() => remove(product)} className="flex h-8 w-8 items-center justify-center rounded-md border border-rose-100 text-rose-600 transition hover:bg-rose-50" title="Delete product"><FiTrash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
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
