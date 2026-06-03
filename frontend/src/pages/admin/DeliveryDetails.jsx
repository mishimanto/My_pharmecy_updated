import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'

const statuses = ['pending', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed', 'returned']

export default function DeliveryDetails() {
  const { id } = useParams()
  const [delivery, setDelivery] = useState(null)
  const [riders, setRiders] = useState([])
  const [selectedRider, setSelectedRider] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([adminApi.show('deliveries', id), adminApi.list('riders')])
      .then(([deliveryRes, riderRes]) => {
        setDelivery(deliveryRes.data.data)
        setRiders(riderRes.data.data?.data || [])
        setSelectedRider(deliveryRes.data.data.rider_id || '')
        setStatus(deliveryRes.data.data.delivery_status)
      })
      .catch(() => toast.error('ডেলিভারি বিস্তারিত লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const assignRider = async () => {
    if (!selectedRider) return
    const result = await Swal.fire({ title: 'রাইডার অ্যাসাইন করবেন?', icon: 'question', showCancelButton: true, confirmButtonText: 'অ্যাসাইন', cancelButtonText: 'বাতিল' })
    if (!result.isConfirmed) return
    try {
      const res = await adminApi.patch('deliveries', id, 'assign-rider', { rider_id: selectedRider })
      setDelivery(res.data.data)
      toast.success('রাইডার অ্যাসাইন হয়েছে।')
    } catch (error) {
      toast.error(error.response?.data?.message || 'রাইডার অ্যাসাইন করা যায়নি।')
    }
  }

  const updateStatus = async () => {
    if (!status || status === delivery.delivery_status) return
    const result = await Swal.fire({ title: 'ডেলিভারি স্ট্যাটাস আপডেট করবেন?', text: `${delivery.delivery_status} থেকে ${status}`, icon: 'question', showCancelButton: true, confirmButtonText: 'আপডেট', cancelButtonText: 'বাতিল' })
    if (!result.isConfirmed) return
    try {
      const res = await adminApi.patch('deliveries', id, 'status', { delivery_status: status })
      setDelivery(res.data.data)
      setStatus(res.data.data.delivery_status)
      toast.success('ডেলিভারি স্ট্যাটাস আপডেট হয়েছে।')
    } catch (error) {
      toast.error(error.response?.data?.message || 'স্ট্যাটাস আপডেট করা যায়নি।')
    }
  }

  if (loading) return <p className="text-sm text-slate-600">লোড হচ্ছে...</p>
  if (!delivery) return <p className="text-sm text-slate-600">ডেলিভারি পাওয়া যায়নি।</p>

  return (
    <>
      <PageHeader title={delivery.tracking_no || 'ডেলিভারি'} subtitle={`${delivery.order?.order_number || '-'} - ${delivery.delivery_status}`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-950">অর্ডার তথ্য</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><span className="text-slate-500">গ্রাহক</span><p className="font-medium text-slate-950">{delivery.order?.user?.full_name || '-'}</p></div>
            <div><span className="text-slate-500">মোট</span><p className="font-medium text-slate-950">{money(delivery.order?.total_amount)}</p></div>
            <div><span className="text-slate-500">অর্ডার স্ট্যাটাস</span><p className="font-medium text-slate-950">{delivery.order?.order_status}</p></div>
            <div><span className="text-slate-500">ডেলিভারি তারিখ</span><p className="font-medium text-slate-950">{date(delivery.delivered_at)}</p></div>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-950">রাইডার</h2>
            <select value={selectedRider} onChange={(event) => setSelectedRider(event.target.value)} className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">রাইডার নির্বাচন</option>
              {riders.map((rider) => <option key={rider.id} value={rider.id}>{rider.full_name} - {rider.phone}</option>)}
            </select>
            <button onClick={assignRider} className="mt-3 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">অ্যাসাইন করুন</button>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-950">স্ট্যাটাস</h2>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button disabled={status === delivery.delivery_status} onClick={updateStatus} className="mt-3 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">স্ট্যাটাস আপডেট</button>
          </div>
        </aside>
      </div>
    </>
  )
}
