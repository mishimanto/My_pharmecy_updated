import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { productApi } from '../../api/productApi'
import { useStorefront } from '../../context/StorefrontContext'
import EmptyState from '../common/EmptyState'
import ProductCard, { ProductCardSkeleton } from './ProductCard'
import { getDefaultPurchaseOption } from '../../utils/purchaseUnits'

export default function ProductGrid() {
  const { addToCart } = useStorefront()
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  const initialCategoryId = searchParams.get('category_id') || ''
  const initialRequiresPrescription = searchParams.get('requires_prescription') || ''
  const initialParams = {
    search: initialSearch,
    page: 1,
    category_id: initialCategoryId,
    manufacturer_id: '',
    requires_prescription: initialRequiresPrescription,
  }
  const initialCachedList = productApi.getCachedList(initialParams)

  const [products, setProducts] = useState(initialCachedList?.data || [])
  const [search, setSearch] = useState(initialSearch)
  const [loading, setLoading] = useState(!initialCachedList)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(initialCachedList)
  const [categories, setCategories] = useState(() => productApi.getCachedCategories())
  const [manufacturers, setManufacturers] = useState(() => productApi.getCachedManufacturers())
  const [filters, setFilters] = useState({
    category_id: initialCategoryId,
    manufacturer_id: '',
    requires_prescription: initialRequiresPrescription,
  })
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    productApi.categories().then(({ data }) => setCategories(data.data || [])).catch(() => {})
    productApi.manufacturers().then(({ data }) => setManufacturers(data.data || [])).catch(() => {})
  }, [])

  const requestParams = useMemo(
    () => ({ search: deferredSearch, page, ...filters }),
    [deferredSearch, page, filters],
  )

  const cachedPayload = useMemo(
    () => productApi.getCachedList(requestParams),
    [requestParams],
  )

  useEffect(() => {
    const hasSeedData = Boolean(cachedPayload?.data?.length)
    let syncTimer = null

    if (cachedPayload) {
      syncTimer = window.setTimeout(() => {
        setProducts(cachedPayload.data || [])
        setMeta(cachedPayload)
      }, 0)
    }

    const timer = setTimeout(() => {
      if (!hasSeedData) {
        setLoading(true)
      }

      productApi
        .list(requestParams)
        .then(({ data }) => {
          const payload = data.data
          setProducts(payload.data || [])
          setMeta(payload)
        })
        .catch(() => toast.error('Could not load products.'))
        .finally(() => setLoading(false))
    }, hasSeedData ? 0 : 120)

    return () => {
      clearTimeout(timer)
      if (syncTimer) window.clearTimeout(syncTimer)
    }
  }, [cachedPayload, requestParams])

  const hasNext = useMemo(() => meta?.current_page < meta?.last_page, [meta])

  const add = async (product) => {
    const option = getDefaultPurchaseOption(product)

    try {
      await addToCart({
        product_id: product.id,
        purchase_unit: option?.code || 'piece',
        quantity: 1,
      })
      toast.success(`Added 1 ${option?.label || 'Piece'} to cart.`)
    } catch {
      toast.error('Could not add this item to the cart.')
    }
  }

  return (
    <div>
      <div className="mb-6 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_auto]">
        <input
          className="border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          placeholder="Search by product, generic, or brand"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />
        <select className="border border-slate-300 bg-white px-3 py-3 text-sm" value={filters.category_id} onChange={(event) => { setFilters({ ...filters, category_id: event.target.value }); setPage(1) }}>
          <option value="">All categories</option>
          {categories.map((item) => <option key={item.id} value={item.id}>{item.category_name}</option>)}
        </select>
        <select className="border border-slate-300 bg-white px-3 py-3 text-sm" value={filters.manufacturer_id} onChange={(event) => { setFilters({ ...filters, manufacturer_id: event.target.value }); setPage(1) }}>
          <option value="">All manufacturers</option>
          {manufacturers.map((item) => <option key={item.id} value={item.id}>{item.manufacturer_name}</option>)}
        </select>
        <select className="border border-slate-300 bg-white px-3 py-3 text-sm" value={filters.requires_prescription} onChange={(event) => { setFilters({ ...filters, requires_prescription: event.target.value }); setPage(1) }}>
          <option value="">All products</option>
          <option value="1">Prescription required</option>
          <option value="0">No prescription</option>
        </select>
        <button className="border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700" onClick={() => { setSearch(''); setFilters({ category_id: '', manufacturer_id: '', requires_prescription: '' }); setPage(1) }}>
          Reset
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading && products.length === 0
          ? Array.from({ length: 9 }, (_, index) => <ProductCardSkeleton key={`product-skeleton-${index}`} />)
          : products.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={add} />
          ))}
      </div>

      {!loading && products.length === 0 && <div className="mt-6"><EmptyState title="No products found" text="Try another search or adjust the filters." /></div>}

      {meta && (
        <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
          <span>Page {meta.current_page || page} / {meta.last_page || 1}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} className="border border-slate-300 bg-white px-3 py-2 disabled:opacity-40" onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
            <button disabled={!hasNext} className="border border-slate-300 bg-white px-3 py-2 disabled:opacity-40" onClick={() => setPage((value) => value + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
