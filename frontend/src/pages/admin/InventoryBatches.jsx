import { useCallback, useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { adminApi } from '../../api/adminApi'
import { date, money } from '../../utils/formatters'

const empty = { product_id: '', supplier_id: '', batch_number: '', expiry_date: '', manufactured_date: '', purchase_price: '', selling_price: '', stock_quantity: '', reserved_quantity: 0, status: 'active' }

export default function InventoryBatches() {
  const [batches, setBatches] = useState([])
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [form, setForm] = useState(empty)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  const load = useCallback(() => {
    adminApi.list('inventory/batches', { search, page }).then(({ data }) => {
      setBatches(data.data.data || [])
      setMeta(data.data)
    }).catch(() => toast.error('ব্যাচ লোড করা যায়নি'))
  }, [search, page])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    adminApi.list('products', { per_page: 100 }).then(({ data }) => setProducts(data.data.data || []))
    adminApi.list('suppliers', { per_page: 100 }).then(({ data }) => setSuppliers(data.data.data || []))
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    try {
      await adminApi.create('inventory/batches', form)
      toast.success('ব্যাচ তৈরি হয়েছে')
      setForm(empty)
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'ব্যাচ সেভ করা যায়নি')
    }
  }

  const status = async (batch, value) => {
    const result = await Swal.fire({ title: 'ব্যাচ স্ট্যাটাস বদলাবেন?', showCancelButton: true, confirmButtonText: 'আপডেট', cancelButtonText: 'বাতিল' })
    if (!result.isConfirmed) return
    await adminApi.patch('inventory/batches', batch.id, 'status', { status: value })
    toast.success('স্ট্যাটাস আপডেট হয়েছে')
    load()
  }

  const remove = async (batch) => {
    const result = await Swal.fire({ title: 'ব্যাচ ডিলিট করবেন?', text: batch.batch_number, showCancelButton: true, confirmButtonText: 'ডিলিট', cancelButtonText: 'বাতিল', confirmButtonColor: '#dc2626' })
    if (!result.isConfirmed) return
    await adminApi.remove('inventory/batches', batch.id)
    toast.success('ব্যাচ ডিলিট হয়েছে')
    load()
  }

  return (
    <>
      <PageHeader title="ইনভেন্টরি ব্যাচ" subtitle="প্রোডাক্ট স্টক ও বিক্রয়মূল্যের মূল উৎস।" />
      <form className="mb-6 grid gap-3 rounded border bg-white p-4 md:grid-cols-4" onSubmit={submit}>
        <select className="rounded border px-3 py-2" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}><option value="">প্রোডাক্ট</option>{products.map((item) => <option key={item.id} value={item.id}>{item.product_name}</option>)}</select>
        <select className="rounded border px-3 py-2" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}><option value="">সাপ্লায়ার</option>{suppliers.map((item) => <option key={item.id} value={item.id}>{item.supplier_name}</option>)}</select>
        <input className="rounded border px-3 py-2" placeholder="ব্যাচ নম্বর" value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} />
        <input className="rounded border px-3 py-2" type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
        <input className="rounded border px-3 py-2" type="date" value={form.manufactured_date || ''} onChange={(e) => setForm({ ...form, manufactured_date: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder="ক্রয়মূল্য" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder="বিক্রয়মূল্য" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder="স্টক" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
        <button className="rounded bg-slate-950 px-4 py-2 text-white md:col-span-4">ব্যাচ যোগ করুন</button>
      </form>
      <input className="mb-4 w-full rounded border px-3 py-2" placeholder="ব্যাচ, প্রোডাক্ট বা সাপ্লায়ার খুঁজুন" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      {batches.length === 0 && <EmptyState />}
      {batches.length > 0 && <div className="overflow-x-auto rounded border bg-white"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="px-3 py-2">ব্যাচ</th><th className="px-3 py-2">প্রোডাক্ট</th><th className="px-3 py-2">সাপ্লায়ার</th><th className="px-3 py-2">স্টক</th><th className="px-3 py-2">মূল্য</th><th className="px-3 py-2">মেয়াদ</th><th className="px-3 py-2">স্ট্যাটাস</th><th className="px-3 py-2" /></tr></thead><tbody>{batches.map((batch) => <tr key={batch.id} className="border-t"><td className="px-3 py-2">{batch.batch_number}</td><td className="px-3 py-2">{batch.product?.product_name}</td><td className="px-3 py-2">{batch.supplier?.supplier_name}</td><td className="px-3 py-2">{batch.available_stock}</td><td className="px-3 py-2">{money(batch.selling_price)}</td><td className="px-3 py-2">{date(batch.expiry_date)}</td><td className="px-3 py-2">{batch.status}</td><td className="px-3 py-2 text-right"><button className="rounded bg-amber-50 px-2 py-1 text-amber-700" onClick={() => status(batch, batch.status === 'active' ? 'inactive' : 'active')}>স্ট্যাটাস</button> <button className="rounded bg-rose-50 px-2 py-1 text-rose-700" onClick={() => remove(batch)}>ডিলিট</button></td></tr>)}</tbody></table></div>}
      {meta && <div className="mt-4 flex justify-between text-sm"><span>পৃষ্ঠা {meta.current_page} / {meta.last_page}</span><div className="flex gap-2"><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>আগে</button><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(page + 1)}>পরে</button></div></div>}
    </>
  )
}
