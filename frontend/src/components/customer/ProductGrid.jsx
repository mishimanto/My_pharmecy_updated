import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { cartApi } from '../../api/cartApi'
import { productApi } from '../../api/productApi'
import { money } from '../../utils/formatters'
import EmptyState from '../common/EmptyState'

const availableStock = (batch) => Number(batch?.stock_quantity || 0) - Number(batch?.reserved_quantity || 0)

export default function ProductGrid() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [categories, setCategories] = useState([])
  const [manufacturers, setManufacturers] = useState([])
  const [filters, setFilters] = useState({ category_id: '', manufacturer_id: '', requires_prescription: '' })

  useEffect(() => {
    productApi.categories().then(({ data }) => setCategories(data.data || [])).catch(() => {})
    productApi.manufacturers().then(({ data }) => setManufacturers(data.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)
      productApi
        .list({ search, page, ...filters })
        .then(({ data }) => {
          const payload = data.data
          setProducts((payload.data || []).filter((product) => product.is_active !== false && availableStock(product.batches?.[0]) > 0))
          setMeta(payload)
        })
        .catch(() => toast.error('ওষুধ লোড করা যায়নি'))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [search, page, filters])

  const hasNext = useMemo(() => meta?.current_page < meta?.last_page, [meta])

  const add = async (product) => {
    try {
      await cartApi.add({ product_id: product.id, quantity: 1 })
      toast.success('কার্টে যোগ করা হয়েছে')
    } catch {
      toast.error('কার্টে যোগ করা যায়নি')
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input className="w-full rounded border border-slate-300 bg-white px-3 py-2" placeholder="ওষুধের নাম, জেনেরিক বা ব্র্যান্ড দিয়ে খুঁজুন" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
        <select className="rounded border border-slate-300 bg-white px-3 py-2" value={filters.category_id} onChange={(event) => { setFilters({ ...filters, category_id: event.target.value }); setPage(1) }}><option value="">সব ক্যাটাগরি</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.category_name}</option>)}</select>
        <select className="rounded border border-slate-300 bg-white px-3 py-2" value={filters.manufacturer_id} onChange={(event) => { setFilters({ ...filters, manufacturer_id: event.target.value }); setPage(1) }}><option value="">সব ম্যানুফ্যাকচারার</option>{manufacturers.map((item) => <option key={item.id} value={item.id}>{item.manufacturer_name}</option>)}</select>
        <select className="rounded border border-slate-300 bg-white px-3 py-2" value={filters.requires_prescription} onChange={(event) => { setFilters({ ...filters, requires_prescription: event.target.value }); setPage(1) }}><option value="">সব</option><option value="1">প্রেসক্রিপশন প্রয়োজন</option><option value="0">প্রেসক্রিপশন ছাড়া</option></select>
        <button className="rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700" onClick={() => { setSearch(''); setFilters({ category_id: '', manufacturer_id: '', requires_prescription: '' }); setPage(1) }}>রিসেট</button>
      </div>
      {loading && <p className="text-sm text-slate-500">ওষুধ লোড হচ্ছে...</p>}
      {!loading && products.length === 0 && <EmptyState title="কোনো ওষুধ পাওয়া যায়নি" text="অন্য নামে খুঁজে দেখুন অথবা পরে আবার চেষ্টা করুন।" />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const batch = product.batches?.[0]
          return (
            <article key={product.id} className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <Link to={`/products/${product.id}`} className="block">
                <div className="mb-3 flex h-28 items-center justify-center rounded bg-emerald-50 text-3xl font-semibold text-emerald-700">Rx</div>
                <h2 className="text-base font-semibold text-slate-950">{product.product_name}</h2>
                <p className="text-sm text-slate-600">{product.generic_name || product.brand_name || 'জেনেরিক তথ্য নেই'}</p>
              </Link>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <span className="block font-semibold text-emerald-700">{money(product.display_price || batch?.selling_price)}</span>
                  <span className="text-xs text-slate-500">স্টক: {product.available_stock ?? availableStock(batch)}</span>
                </div>
                <button className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700" onClick={() => add(product)}>কার্টে যোগ</button>
              </div>
              {product.requires_prescription && <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">প্রেসক্রিপশন প্রয়োজন</p>}
            </article>
          )
        })}
      </div>
      {meta && (
        <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
          <span>পৃষ্ঠা {meta.current_page || page} / {meta.last_page || 1}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} className="rounded border px-3 py-1 disabled:opacity-40" onClick={() => setPage((value) => Math.max(1, value - 1))}>আগে</button>
            <button disabled={!hasNext} className="rounded border px-3 py-1 disabled:opacity-40" onClick={() => setPage((value) => value + 1)}>পরে</button>
          </div>
        </div>
      )}
    </div>
  )
}
