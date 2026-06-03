import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { cartApi } from '../../api/cartApi'
import { money } from '../../utils/formatters'

export default function Cart() {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  const load = () => cartApi.get()
    .then(({ data }) => setCart(data.data))
    .catch(() => toast.error('কার্ট লোড করা যায়নি'))
    .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const items = useMemo(() => cart?.items || [], [cart])
  const hasPrescription = Boolean(cart?.requires_prescription)
  const warnings = cart?.warnings || []

  const updateQuantity = async (item, quantity) => {
    if (quantity < 1) return
    setUpdatingId(item.cart_item_id)
    try {
      const { data } = await cartApi.update(item.cart_item_id, { quantity })
      setCart(data.data.cart)
      toast.success('পরিমাণ আপডেট হয়েছে')
    } catch (error) {
      toast.error(error.response?.data?.message || 'পরিমাণ আপডেট করা যায়নি')
    } finally {
      setUpdatingId(null)
    }
  }

  const remove = async (item) => {
    const result = await Swal.fire({
      title: 'কার্ট থেকে বাদ দেবেন?',
      text: item.product_name,
      showCancelButton: true,
      confirmButtonText: 'বাদ দিন',
      cancelButtonText: 'বাতিল',
    })
    if (!result.isConfirmed) return
    const { data } = await cartApi.remove(item.cart_item_id)
    setCart(data.data)
    toast.success('আইটেম বাদ দেওয়া হয়েছে')
  }

  const clear = async () => {
    const result = await Swal.fire({
      title: 'পুরো কার্ট খালি করবেন?',
      showCancelButton: true,
      confirmButtonText: 'খালি করুন',
      cancelButtonText: 'বাতিল',
      confirmButtonColor: '#dc2626',
    })
    if (!result.isConfirmed) return
    const { data } = await cartApi.clear()
    setCart(data.data)
    toast.success('কার্ট খালি হয়েছে')
  }

  return (
    <>
      <PageHeader title="আমার কার্ট" subtitle="চেকআউটের আগে ওষুধ, পরিমাণ, স্টক এবং প্রেসক্রিপশন সতর্কতা দেখুন।" />
      {loading && <p className="text-slate-500">কার্ট লোড হচ্ছে...</p>}
      {!loading && items.length === 0 && <EmptyState title="কার্ট খালি" text="ওষুধ যোগ করলে এখানে দেখাবে।" />}
      {hasPrescription && <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">কার্টে প্রেসক্রিপশন প্রয়োজন এমন ওষুধ আছে। চেকআউটের আগে প্রেসক্রিপশন আপলোড বা অনুমোদিত প্রেসক্রিপশন প্রয়োজন।</div>}
      {warnings.length > 0 && <div className="mb-4 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>}
      {items.length > 0 && (
        <div className="rounded border border-slate-200 bg-white">
          {items.map((item) => (
            <div key={item.cart_item_id} className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-[80px_1fr_auto_auto] md:items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded bg-emerald-50 text-emerald-700">
                {item.image_url ? <img className="h-full w-full rounded object-cover" src={item.image_url} alt="" /> : 'Rx'}
              </div>
              <div>
                <h2 className="font-semibold text-slate-950">{item.product_name}</h2>
                <p className="text-sm text-slate-600">{item.generic_name || '-'} {item.strength || ''} {item.dosage_form || ''}</p>
                <p className="text-xs text-slate-500">স্টক: {item.available_stock}</p>
                {item.requires_prescription && <span className="text-xs font-medium text-amber-700">প্রেসক্রিপশন প্রয়োজন</span>}
              </div>
              <div className="flex items-center gap-2">
                <button className="h-8 w-8 rounded border" disabled={updatingId === item.cart_item_id} onClick={() => updateQuantity(item, item.quantity - 1)}>-</button>
                <input className="h-8 w-16 rounded border text-center" value={item.quantity} onChange={(event) => updateQuantity(item, Number(event.target.value))} />
                <button className="h-8 w-8 rounded border" disabled={updatingId === item.cart_item_id || item.quantity >= item.available_stock} onClick={() => updateQuantity(item, item.quantity + 1)}>+</button>
              </div>
              <div className="text-right">
                <p className="font-semibold">{money(item.subtotal)}</p>
                <p className="text-xs text-slate-500">{money(item.unit_price)} / পিস</p>
                <button className="mt-2 rounded bg-rose-50 px-3 py-1 text-sm text-rose-700" onClick={() => remove(item)}>বাদ দিন</button>
              </div>
            </div>
          ))}
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <button className="rounded border border-rose-200 px-4 py-2 text-sm text-rose-700" onClick={clear}>কার্ট খালি করুন</button>
            <div className="flex items-center gap-4">
              <strong>সাবটোটাল: {money(cart?.subtotal)}</strong>
              <Link to="/checkout" className="rounded bg-emerald-600 px-4 py-2 text-white">চেকআউট</Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

