import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { orderApi } from '../../api/orderApi'
import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'

const cancellable = ['pending', 'prescription_review', 'confirmed']

export default function OrderDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    orderApi.show(id)
      .then((res) => setOrder(res.data.data))
      .catch(() => toast.error('অর্ডার বিস্তারিত লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }, [id])

  const cancelOrder = async () => {
    const result = await Swal.fire({
      title: 'অর্ডার বাতিল করবেন?',
      text: 'রিজার্ভ করা স্টক রিলিজ করা হবে।',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'হ্যাঁ, বাতিল করুন',
      cancelButtonText: 'না',
    })
    if (!result.isConfirmed) return
    try {
      const res = await orderApi.cancel(id)
      setOrder(res.data.data)
      toast.success('অর্ডার বাতিল করা হয়েছে।')
    } catch (error) {
      toast.error(error.response?.data?.message || 'অর্ডার বাতিল করা যায়নি।')
    }
  }

  const confirmCod = async () => {
    try {
      await orderApi.codPayment(id)
      toast.success('COD পেমেন্ট পেন্ডিং হিসেবে নিশ্চিত আছে।')
    } catch (error) {
      toast.error(error.response?.data?.message || 'COD পেমেন্ট নিশ্চিত করা যায়নি।')
    }
  }

  if (loading) return <p className="text-sm text-slate-600">লোড হচ্ছে...</p>
  if (!order) return <p className="text-sm text-slate-600">অর্ডার পাওয়া যায়নি।</p>

  return (
    <>
      <PageHeader
        title={order.order_number}
        subtitle={`${date(order.order_date)} - ${order.order_status}`}
        action={<div className="flex flex-wrap gap-2">
          <button onClick={() => navigate(`/orders/${order.id}/tracking`)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">ট্র্যাকিং</button>
          {order.payment_method === 'COD' && <button onClick={confirmCod} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">COD পেমেন্ট</button>}
          {cancellable.includes(order.order_status) && <button onClick={cancelOrder} className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white">অর্ডার বাতিল</button>}
        </div>}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-slate-200 bg-white">
          {order.items?.map((item) => (
            <div key={item.id} className="border-b border-slate-100 p-4 last:border-b-0">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-950">{item.product?.product_name}</p>
                  <p className="text-sm text-slate-500">{item.product?.generic_name} {item.product?.strength}</p>
                </div>
                <p className="font-semibold text-slate-950">{money(item.subtotal)}</p>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                ব্যাচ: {item.batches?.map((batch) => `${batch.batch?.batch_number} x ${batch.quantity}`).join(', ')}
              </div>
            </div>
          ))}
        </section>
        <aside className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <h2 className="text-lg font-semibold text-slate-950">সারাংশ</h2>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between"><span>সাবটোটাল</span><span>{money(order.subtotal_amount)}</span></div>
            <div className="flex justify-between"><span>ডেলিভারি</span><span>{money(order.delivery_charge)}</span></div>
            <div className="flex justify-between font-semibold text-slate-950"><span>মোট</span><span>{money(order.total_amount)}</span></div>
            <div className="pt-3 text-slate-600">পেমেন্ট: {order.payment_status} ({order.payment_method})</div>
            <div className="text-slate-600">ডেলিভারি: {order.delivery?.delivery_status || '-'}</div>
          </div>
        </aside>
      </div>
    </>
  )
}
