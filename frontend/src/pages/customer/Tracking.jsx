import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { orderApi } from '../../api/orderApi'
import PageHeader from '../../components/common/PageHeader'
import { date } from '../../utils/formatters'

export default function Tracking() {
  const { id } = useParams()
  const [tracking, setTracking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    orderApi.tracking(id)
      .then((res) => setTracking(res.data.data))
      .catch(() => toast.error('ট্র্যাকিং তথ্য লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-sm text-slate-600">লোড হচ্ছে...</p>
  if (!tracking) return <p className="text-sm text-slate-600">ট্র্যাকিং তথ্য পাওয়া যায়নি।</p>

  const delivery = tracking.delivery

  return (
    <>
      <PageHeader title="ডেলিভারি ট্র্যাকিং" subtitle={`${tracking.order_number} - ${tracking.order_status}`} />
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        {!delivery ? (
          <p className="text-sm text-slate-600">এই অর্ডারের ডেলিভারি এখনো তৈরি হয়নি।</p>
        ) : (
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div><span className="text-slate-500">ট্র্যাকিং নম্বর</span><p className="font-semibold text-slate-950">{delivery.tracking_no}</p></div>
            <div><span className="text-slate-500">স্ট্যাটাস</span><p className="font-semibold text-slate-950">{delivery.delivery_status}</p></div>
            <div><span className="text-slate-500">রাইডার</span><p className="font-semibold text-slate-950">{delivery.rider?.full_name || '-'}</p></div>
            <div><span className="text-slate-500">ডেলিভারি সময়</span><p className="font-semibold text-slate-950">{date(delivery.delivered_at)}</p></div>
          </div>
        )}
      </div>
    </>
  )
}
