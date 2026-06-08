import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { FiArrowRight, FiMapPin, FiPackage, FiShield, FiTruck } from 'react-icons/fi'
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
      .catch(() => toast.error('Order details could not be loaded.'))
      .finally(() => setLoading(false))
  }, [id])

  const cancelOrder = async () => {
    const result = await Swal.fire({
      title: 'Cancel this order?',
      text: 'Reserved stock will be released for other customers.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Cancel order',
      cancelButtonText: 'Keep order',
    })

    if (!result.isConfirmed) return

    try {
      const res = await orderApi.cancel(id)
      setOrder(res.data.data)
      toast.success('Order cancelled successfully.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Order could not be cancelled.')
    }
  }

  const confirmCod = async () => {
    try {
      await orderApi.codPayment(id)
      toast.success('COD payment preference confirmed.')
      const refreshed = await orderApi.show(id)
      setOrder(refreshed.data.data)
    } catch (error) {
      toast.error(error.response?.data?.message || 'COD confirmation could not be completed.')
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading order details...</p>
  if (!order) return <p className="text-sm text-slate-500">Order not found.</p>

  return (
    <>
      <PageHeader
        title={order.order_number}
        subtitle={`${date(order.order_date)} • ${order.order_status}`}
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate(`/orders/${order.id}/tracking`)} className="border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Delivery tracking
            </button>
            {order.payment_method === 'COD' ? (
              <button onClick={confirmCod} className="bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                Confirm COD
              </button>
            ) : null}
            {cancellable.includes(order.order_status) ? (
              <button onClick={cancelOrder} className="border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
                Cancel order
              </button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatusCard label="Order status" value={order.order_status} icon={FiPackage} />
            <StatusCard label="Payment status" value={order.payment_status} icon={FiShield} />
            <StatusCard label="Delivery status" value={order.delivery?.delivery_status || 'Not created'} icon={FiTruck} />
            <StatusCard label="Total amount" value={money(order.total_amount)} icon={FiArrowRight} />
          </div>

          <div className="border border-slate-200 bg-white shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <div className="border-b border-slate-200 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Ordered items</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Medicine and unit breakdown.</h2>
            </div>

            <div className="divide-y divide-slate-200">
              {order.items?.map((item) => (
                <div key={item.id} className="grid gap-4 p-6 lg:grid-cols-[1fr_140px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">{item.product?.product_name}</h3>
                      {item.product?.requires_prescription ? (
                        <span className="border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                          Prescription
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {item.product?.generic_name || '-'} {item.product?.strength || ''} {item.product?.dosage_form || ''}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">{item.quantity} {item.purchase_unit || 'piece'}</span>
                      <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">{item.piece_quantity || item.quantity} pieces total</span>
                      <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">{money(item.unit_price)} each</span>
                    </div>
                    <p className="mt-3 text-xs leading-6 text-slate-500">
                      Batch allocation: {item.batches?.map((batch) => `${batch.batch?.batch_number} x ${batch.quantity}`).join(', ') || 'Not listed'}
                    </p>
                  </div>
                  <div className="text-left lg:text-right">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Subtotal</div>
                    <div className="mt-2 text-2xl font-semibold text-slate-950">{money(item.subtotal)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <div className="border-b border-slate-200 pb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Order summary</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Payment and delivery totals.</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotal_amount)}</span></div>
              <div className="flex justify-between"><span>Delivery charge</span><span>{money(order.delivery_charge)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-950"><span>Total</span><span>{money(order.total_amount)}</span></div>
              <div className="border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Payment method</div>
                <div className="mt-2 text-sm font-semibold text-slate-950">{order.payment_method}</div>
                <div className="mt-1 text-sm text-slate-500">Status: {order.payment_status}</div>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-slate-50 text-slate-950">
                <FiMapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Shipping address</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{order.customer_name || 'Customer delivery info'}</h2>
                <p className="mt-3 text-sm leading-8 text-slate-600">{order.shipping_address || 'Address not available'}</p>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Next step</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Stay close to delivery updates.</h2>
            <p className="mt-3 text-sm leading-8 text-slate-500">
              Use tracking for delivery movement, or open support if any medicine, payment, or delivery issue needs review.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Link to={`/orders/${order.id}/tracking`} className="flex items-center justify-between bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                Open tracking
                <FiArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/support" className="flex items-center justify-between border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
                Contact support
                <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}

function StatusCard({ label, value, icon: Icon }) {
  return (
    <div className="border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
      <div className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-slate-50 text-slate-950">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-950">{value}</div>
    </div>
  )
}
