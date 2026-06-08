import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiClock, FiPackage, FiTruck, FiUser } from 'react-icons/fi'
import { orderApi } from '../../api/orderApi'
import PageHeader from '../../components/common/PageHeader'

export default function Tracking() {
  const { id } = useParams()
  const [tracking, setTracking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    orderApi.tracking(id)
      .then((res) => setTracking(res.data.data))
      .catch(() => toast.error('Tracking information could not be loaded.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-sm text-slate-500">Loading tracking...</p>
  if (!tracking) return <p className="text-sm text-slate-500">Tracking information not found.</p>

  const delivery = tracking.delivery

  return (
    <>
      <PageHeader title="Delivery tracking" subtitle={`${tracking.order_number} • ${tracking.order_status}`} action={<Link to="/support" className="border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Need help?</Link>} />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Tracking state</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Current delivery visibility.</h2>
          </div>

          {!delivery ? (
            <div className="mt-5 border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-500">
              Delivery has not been created for this order yet. The order can still be under review, confirmation, or packing.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <TrackingBlock label="Tracking number" value={delivery.tracking_no} icon={FiPackage} />
              <TrackingBlock label="Delivery status" value={delivery.delivery_status} icon={FiTruck} />
              <TrackingBlock label="Assigned rider" value={delivery.rider?.full_name || 'Not assigned'} icon={FiUser} />
              <TrackingBlock label="Order status" value={tracking.order_status} icon={FiClock} />
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">What to do next</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Keep delivery and support close.</h2>
            <p className="mt-3 text-sm leading-8 text-slate-500">
              If delivery is delayed or the tracking state does not match what you expected, open support and include this order reference.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Link to="/support" className="flex items-center justify-between bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                Open support center
                <FiArrowRight className="h-4 w-4" />
              </Link>
              <Link to={`/orders/${id}`} className="flex items-center justify-between border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
                Back to order details
                <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}

function TrackingBlock({ label, value, icon: Icon }) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-5">
      <div className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-white text-slate-950">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-slate-950">{value}</div>
    </div>
  )
}
