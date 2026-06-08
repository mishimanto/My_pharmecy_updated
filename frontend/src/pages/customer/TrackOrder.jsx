import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiMapPin, FiPackage, FiPhoneCall, FiTruck } from 'react-icons/fi'
import PageHeader from '../../components/common/PageHeader'
import { orderApi } from '../../api/orderApi'
import { useCustomerAuth } from '../../context/CustomerAuthContext'

export default function TrackOrder() {
  const { ensureGuestToken, customer } = useCustomerAuth()
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [tracking, setTracking] = useState(null)

  const submit = async (event) => {
    event.preventDefault()
    if (!orderId.trim()) return

    ensureGuestToken()
    setLoading(true)

    try {
      const res = await orderApi.tracking(orderId.trim())
      setTracking(res.data.data)
    } catch (error) {
      setTracking(null)
      toast.error(error.response?.data?.message || 'Tracking information could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  const delivery = tracking?.delivery

  return (
    <>
      <PageHeader title="Track order" subtitle="Use your order ID on the same guest session or while logged in to review delivery progress and order status." />

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <section className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Tracking lookup</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Check pharmacy delivery progress.</h2>
          </div>

          <form onSubmit={submit} className="mt-5">
            <label className="text-sm font-medium text-slate-700">Order ID</label>
            <input
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              className="mt-2 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none"
              placeholder="Enter your numeric order ID"
            />
            <button disabled={loading} className="mt-4 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
              {loading ? 'Checking tracking...' : 'Track this order'}
            </button>
          </form>

          <div className="mt-6 grid gap-3">
            <InfoBlock icon={FiPackage} title="Use your order reference" body="Tracking works for the logged-in customer or the same guest session that placed the order." />
            <InfoBlock icon={FiTruck} title="Delivery status visibility" body="Check whether the order is still pending, packed, assigned, or out for delivery." />
            <InfoBlock icon={FiPhoneCall} title="Need human help?" body="If order tracking looks incorrect, continue into the support center for a complaint or help request." />
          </div>
        </section>

        <section className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Tracking result</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Live order movement.</h2>
          </div>

          {!tracking && !loading ? (
            <div className="mt-5 border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-500">
              Enter an order ID to load tracking data. {customer ? 'You can also open tracking from your order history.' : 'If you ordered as a guest, use the same browser session that placed the order.'}
            </div>
          ) : null}

          {tracking ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <TrackingCard label="Order number" value={tracking.order_number} />
                <TrackingCard label="Order status" value={tracking.order_status} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <TrackingCard label="Tracking number" value={delivery?.tracking_no || 'Not created yet'} />
                <TrackingCard label="Delivery status" value={delivery?.delivery_status || 'Delivery not created'} />
                <TrackingCard label="Rider" value={delivery?.rider?.full_name || 'Not assigned yet'} />
                <TrackingCard label="Coverage note" value="Dhaka pharmacy delivery workflow" />
              </div>

              <div className="border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  <FiMapPin className="h-4 w-4" />
                  Tracking guidance
                </div>
                <p className="mt-3 text-sm leading-8 text-slate-600">
                  If this order needs more attention or delivery clarification, open the support center and reference order ID {orderId}.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link to="/support" className="inline-flex items-center gap-2 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                    Contact support
                    <FiArrowRight className="h-4 w-4" />
                  </Link>
                  {customer ? (
                    <Link to="/orders" className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
                      Open order history
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </>
  )
}

function InfoBlock({ icon: Icon, title, body }) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-4">
      <div className="inline-flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-950">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-500">{body}</p>
    </div>
  )
}

function TrackingCard({ label, value }) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-slate-950">{value}</div>
    </div>
  )
}
