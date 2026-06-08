import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { adminApi } from '../../api/adminApi'
import { money } from '../../utils/formatters'
import { getCachedList, setCachedList } from '../../utils/adminResourceCache'

export default function Products() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const initialCache = getCachedList('products', { search: '', page: 1 })
  const [products, setProducts] = useState(initialCache?.data || [])
  const [meta, setMeta] = useState(initialCache || null)
  const [loading, setLoading] = useState(!initialCache)

  const currentParams = useMemo(() => ({ search, page }), [page, search])

  const load = (params = currentParams, { silent = false } = {}) => {
    if (!silent) {
      setLoading(!products.length)
    }

    return adminApi.list('products', params).then(({ data }) => {
      const payload = data.data
      setProducts(payload.data || [])
      setMeta(payload)
      setCachedList('products', params, payload)
      return payload
    }).catch(() => {
      toast.error('প্রোডাক্ট লোড করা যায়নি')
      throw new Error('Product load failed')
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    const cached = getCachedList('products', currentParams)
    let syncTimer = null

    if (cached) {
      syncTimer = window.setTimeout(() => {
        setProducts(cached.data || [])
        setMeta(cached)
        setLoading(false)
      }, 0)
    }

    let active = true
    adminApi.list('products', currentParams).then(({ data }) => {
      if (!active) return
      const payload = data.data
      setProducts(payload.data || [])
      setMeta(payload)
      setCachedList('products', currentParams, payload)
    }).catch(() => active && toast.error('প্রোডাক্ট লোড করা যায়নি'))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
      if (syncTimer) window.clearTimeout(syncTimer)
    }
  }, [currentParams])

  const toggleStatus = async (product) => {
    const result = await Swal.fire({ title: 'প্রোডাক্ট স্ট্যাটাস বদলাবেন?', showCancelButton: true, confirmButtonText: 'হ্যাঁ', cancelButtonText: 'বাতিল' })
    if (!result.isConfirmed) return
    await adminApi.patch('products', product.id, 'status', { is_active: !product.is_active })
    toast.success('স্ট্যাটাস আপডেট হয়েছে')
    load(currentParams, { silent: true })
  }

  const remove = async (product) => {
    const result = await Swal.fire({ title: 'প্রোডাক্ট ডিলিট করবেন?', text: product.product_name, showCancelButton: true, confirmButtonText: 'ডিলিট', cancelButtonText: 'বাতিল', confirmButtonColor: '#dc2626' })
    if (!result.isConfirmed) return
    await adminApi.remove('products', product.id)
    toast.success('প্রোডাক্ট ডিলিট হয়েছে')
    load(currentParams, { silent: true })
  }

  return (
    <>
      <PageHeader title="প্রোডাক্ট" subtitle="প্রোডাক্ট, প্রেসক্রিপশন ফ্ল্যাগ, batch price/stock এবং status দেখুন।" action={<Link className="rounded bg-slate-950 px-4 py-2 text-sm text-white" to="/admin/products/create">নতুন প্রোডাক্ট</Link>} />
      <input className="mb-4 w-full rounded border px-3 py-2" placeholder="প্রোডাক্ট, জেনেরিক বা ব্র্যান্ড দিয়ে খুঁজুন" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
      {loading && products.length === 0 && <ProductListSkeleton />}
      {!loading && products.length === 0 && <EmptyState />}
      {products.length > 0 && (
        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100"><tr><th className="px-3 py-2">নাম</th><th className="px-3 py-2">ক্যাটাগরি</th><th className="px-3 py-2">ম্যানুফ্যাকচারার</th><th className="px-3 py-2">প্রেসক্রিপশন</th><th className="px-3 py-2">ব্যাচ মূল্য</th><th className="px-3 py-2">স্ট্যাটাস</th><th className="px-3 py-2" /></tr></thead>
            <tbody>
              {products.map((product) => {
                const batch = product.batches?.[0]
                return (
                  <tr key={product.id} className="border-t">
                    <td className="px-3 py-2 font-medium">{product.product_name}</td>
                    <td className="px-3 py-2">{product.category?.category_name || '-'}</td>
                    <td className="px-3 py-2">{product.manufacturer?.manufacturer_name || '-'}</td>
                    <td className="px-3 py-2">{product.requires_prescription ? 'হ্যাঁ' : 'না'}</td>
                    <td className="px-3 py-2">{batch ? money(batch.selling_price) : '-'}</td>
                    <td className="px-3 py-2"><span className={`rounded px-2 py-1 text-xs ${product.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{product.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</span></td>
                    <td className="px-3 py-2 text-right"><Link className="rounded bg-slate-100 px-2 py-1" to={`/admin/products/${product.id}/edit`}>এডিট</Link> <button className="rounded bg-amber-50 px-2 py-1 text-amber-700" onClick={() => toggleStatus(product)}>{product.is_active ? 'নিষ্ক্রিয়' : 'সক্রিয়'}</button> <button className="rounded bg-rose-50 px-2 py-1 text-rose-700" onClick={() => remove(product)}>ডিলিট</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {meta && <div className="mt-4 flex justify-between text-sm"><span>পৃষ্ঠা {meta.current_page} / {meta.last_page}</span><div className="flex gap-2"><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>আগে</button><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(page + 1)}>পরে</button></div></div>}
    </>
  )
}

function ProductListSkeleton() {
  return (
    <div className="rounded border bg-white p-4">
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="grid animate-pulse gap-3 border-b border-slate-100 pb-3 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr]">
            <div className="h-5 rounded bg-slate-200" />
            <div className="h-5 rounded bg-slate-100" />
            <div className="h-5 rounded bg-slate-100" />
            <div className="h-5 rounded bg-slate-100" />
            <div className="h-5 rounded bg-slate-100" />
            <div className="h-5 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  )
}
