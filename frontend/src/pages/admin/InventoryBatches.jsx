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
    }).catch(() => toast.error('Unable to load inventory batches.'))
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
      toast.success('Batch created.')
      setForm(empty)
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save the batch.')
    }
  }

  const status = async (batch, value) => {
    const result = await Swal.fire({ title: 'Change batch status?', showCancelButton: true, confirmButtonText: 'Update', cancelButtonText: 'Cancel' })
    if (!result.isConfirmed) return
    await adminApi.patch('inventory/batches', batch.id, 'status', { status: value })
    toast.success('Status updated.')
    load()
  }

  const remove = async (batch) => {
    const result = await Swal.fire({ title: 'Delete this batch?', text: batch.batch_number, showCancelButton: true, confirmButtonText: 'Delete', cancelButtonText: 'Cancel', confirmButtonColor: '#dc2626' })
    if (!result.isConfirmed) return
    await adminApi.remove('inventory/batches', batch.id)
    toast.success('Batch deleted.')
    load()
  }

  return (
    <>
      <PageHeader title="Inventory Batches" subtitle="The primary source of product stock and selling prices." />
      <form className="mb-6 grid gap-3 rounded border bg-white p-4 md:grid-cols-4" onSubmit={submit}>
        <select className="rounded border px-3 py-2" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}><option value="">Product</option>{products.map((item) => <option key={item.id} value={item.id}>{item.product_name}</option>)}</select>
        <select className="rounded border px-3 py-2" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}><option value="">Supplier</option>{suppliers.map((item) => <option key={item.id} value={item.id}>{item.supplier_name}</option>)}</select>
        <input className="rounded border px-3 py-2" placeholder="Batch number" value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} />
        <input className="rounded border px-3 py-2" type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
        <input className="rounded border px-3 py-2" type="date" value={form.manufactured_date || ''} onChange={(e) => setForm({ ...form, manufactured_date: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder="Purchase price" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder="Selling price" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder="Stock quantity" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
        <button className="rounded bg-slate-950 px-4 py-2 text-white md:col-span-4">Add Batch</button>
      </form>
      <input className="mb-4 w-full rounded border px-3 py-2" placeholder="Search by batch, product, or supplier" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      {batches.length === 0 && <EmptyState />}
      {batches.length > 0 && <div className="overflow-x-auto rounded border bg-white"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="px-3 py-2">Batch</th><th className="px-3 py-2">Product</th><th className="px-3 py-2">Supplier</th><th className="px-3 py-2">Stock</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Expiry</th><th className="px-3 py-2">Status</th><th className="px-3 py-2" /></tr></thead><tbody>{batches.map((batch) => <tr key={batch.id} className="border-t"><td className="px-3 py-2">{batch.batch_number}</td><td className="px-3 py-2">{batch.product?.product_name}</td><td className="px-3 py-2">{batch.supplier?.supplier_name}</td><td className="px-3 py-2">{batch.available_stock}</td><td className="px-3 py-2">{money(batch.selling_price)}</td><td className="px-3 py-2">{date(batch.expiry_date, 'en-US')}</td><td className="px-3 py-2">{batch.status}</td><td className="px-3 py-2 text-right"><button className="rounded bg-amber-50 px-2 py-1 text-amber-700" onClick={() => status(batch, batch.status === 'active' ? 'inactive' : 'active')}>Toggle Status</button> <button className="rounded bg-rose-50 px-2 py-1 text-rose-700" onClick={() => remove(batch)}>Delete</button></td></tr>)}</tbody></table></div>}
      {meta && <div className="mt-4 flex justify-between text-sm"><span>Page {meta.current_page} / {meta.last_page}</span><div className="flex gap-2"><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(page + 1)}>Next</button></div></div>}
    </>
  )
}
