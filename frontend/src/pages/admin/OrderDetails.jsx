import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'

const statuses = ['pending', 'prescription_review', 'confirmed', 'processing', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded']

export default function OrderDetails() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    adminApi.show('orders', id)
      .then((res) => {
        setOrder(res.data.data)
        setStatus(res.data.data.order_status)
      })
      .catch(() => toast.error('অর্ডার বিস্তারিত লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }, [id])

  const updateStatus = async () => {
    if (!status || status === order.order_status) return
    const result = await Swal.fire({
      title: 'স্ট্যাটাস আপডেট করবেন?',
      text: `${order.order_status} থেকে ${status} করা হবে।`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'আপডেট করুন',
      cancelButtonText: 'বাতিল',
    })
    if (!result.isConfirmed) return

    try {
      const res = await adminApi.patch('orders', id, 'status', { order_status: status })
      setOrder(res.data.data)
      setStatus(res.data.data.order_status)
      toast.success('অর্ডার স্ট্যাটাস আপডেট হয়েছে।')
    } catch (error) {
      toast.error(error.response?.data?.message || 'স্ট্যাটাস আপডেট করা যায়নি।')
    }
  }

  const createDelivery = async () => {
    const result = await Swal.fire({
      title: 'ডেলিভারি তৈরি করবেন?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'তৈরি করুন',
      cancelButtonText: 'বাতিল',
    })
    if (!result.isConfirmed) return
    try {
      await adminApi.createOrderDelivery(id)
      const res = await adminApi.show('orders', id)
      setOrder(res.data.data)
      toast.success('ডেলিভারি তৈরি হয়েছে।')
    } catch (error) {
      toast.error(error.response?.data?.message || 'ডেলিভারি তৈরি করা যায়নি।')
    }
  }

  if (loading) return <p className="text-sm text-slate-600">লোড হচ্ছে...</p>
  if (!order) return <p className="text-sm text-slate-600">অর্ডার পাওয়া যায়নি।</p>

  return (
    <>
      <PageHeader title={order.order_number} subtitle={`${order.user?.full_name || 'গ্রাহক'} - ${date(order.order_date)}`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-slate-200 bg-white">
          {order.items?.map((item) => (
            <div key={item.id} className="border-b border-slate-100 p-4 last:border-b-0">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-950">{item.product?.product_name}</p>
                  <p className="text-sm text-slate-500">{item.product?.generic_name} {item.product?.strength}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {item.quantity} {item.purchase_unit || 'piece'} x {money(item.unit_price)} ({item.piece_quantity || item.quantity} pieces)
                  </p>
                </div>
                <p className="font-semibold text-slate-950">{money(item.subtotal)}</p>
              </div>
              <div className="mt-3 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
                {item.batches?.map((allocation) => (
                  <div key={allocation.id} className="flex justify-between">
                    <span>{allocation.batch?.batch_number}</span>
                    <span>{allocation.quantity} pieces allocated</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-950">স্ট্যাটাস</h2>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button onClick={updateStatus} disabled={status === order.order_status} className="mt-3 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">
              স্ট্যাটাস আপডেট
            </button>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h2 className="text-lg font-semibold text-slate-950">সারাংশ</h2>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between"><span>সাবটোটাল</span><span>{money(order.subtotal_amount)}</span></div>
              <div className="flex justify-between"><span>ডেলিভারি</span><span>{money(order.delivery_charge)}</span></div>
              <div className="flex justify-between font-semibold text-slate-950"><span>মোট</span><span>{money(order.total_amount)}</span></div>
              <div className="pt-3 text-slate-600">পেমেন্ট: {order.payment_status} ({order.payment_method})</div>
              <div className="text-slate-600">ডেলিভারি: {order.delivery?.delivery_status || '-'}</div>
            </div>
            {!order.delivery && ['confirmed', 'processing', 'packed', 'out_for_delivery'].includes(order.order_status) && (
              <button onClick={createDelivery} className="mt-4 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">ডেলিভারি তৈরি</button>
            )}
          </div>
        </aside>
      </div>
    </>
  )
}
