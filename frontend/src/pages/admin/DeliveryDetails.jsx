import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiCheckCircle, FiClock, FiPackage, FiRefreshCw, FiRotateCcw, FiShoppingBag, FiTruck, FiXCircle } from 'react-icons/fi'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'
import { getDeliveryStatusLabel, getOrderStatusLabel } from '../../utils/statusLabels'

const statusTransitions = {
  pending: ['delivered', 'failed', 'returned'],
  delivered: ['returned'],
  failed: ['pending', 'returned'],
  returned: [],
}

const statusMeta = {
  pending: {
    icon: FiClock,
    tone: 'border-amber-200 bg-amber-50 text-amber-700',
    panel: 'border-amber-200 bg-amber-50/70',
  },
  delivered: {
    icon: FiCheckCircle,
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    panel: 'border-emerald-200 bg-emerald-50/70',
  },
  failed: {
    icon: FiXCircle,
    tone: 'border-rose-200 bg-rose-50 text-rose-700',
    panel: 'border-rose-200 bg-rose-50/70',
  },
  returned: {
    icon: FiRotateCcw,
    tone: 'border-orange-200 bg-orange-50 text-orange-700',
    panel: 'border-orange-200 bg-orange-50/70',
  },
}

function Info({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-950">{value || '-'}</p>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, className = 'border-slate-200 bg-white text-slate-700' }) {
  return (
    <div className={`rounded-lg border px-4 py-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">{label}</p>
          <p className="mt-1 truncate text-lg font-semibold text-slate-950">{value || '-'}</p>
        </div>
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}

export default function DeliveryDetails() {
  const { id } = useParams()
  const [delivery, setDelivery] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = () => {
    adminApi.show('deliveries', id)
      .then((deliveryRes) => {
        setDelivery(deliveryRes.data.data)
        setStatus(deliveryRes.data.data.delivery_status)
      })
      .catch(() => toast.error('Unable to load delivery details.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const availableStatuses = delivery
    ? [delivery.delivery_status, ...(statusTransitions[delivery.delivery_status] || [])]
    : []
  const currentMeta = statusMeta[delivery?.delivery_status] || statusMeta.pending
  const CurrentIcon = currentMeta.icon

  const updateStatus = async () => {
    if (!status || status === delivery.delivery_status) return

    const result = await Swal.fire({
      title: 'Update delivery status?',
      text: `${getDeliveryStatusLabel(delivery.delivery_status)} to ${getDeliveryStatusLabel(status)}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
    })

    if (!result.isConfirmed) return

    setSaving(true)
    try {
      const res = await adminApi.patch('deliveries', id, 'status', { delivery_status: status })
      setDelivery(res.data.data)
      setStatus(res.data.data.delivery_status)
      toast.success('Delivery status updated.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update delivery status.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLoadingState className="py-8" />
  if (!delivery) return <p className="text-sm text-slate-600">Delivery not found.</p>

  return (
    <>
      <PageHeader
        title={delivery.tracking_no || 'Delivery details'}
        subtitle={`${delivery.order?.order_number || '-'} - ${getDeliveryStatusLabel(delivery.delivery_status)}`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={CurrentIcon} label="Delivery status" value={getDeliveryStatusLabel(delivery.delivery_status)} className={currentMeta.panel} />
        <SummaryCard icon={FiShoppingBag} label="Order status" value={getOrderStatusLabel(delivery.order?.order_status)} className="border-sky-200 bg-sky-50/70 text-sky-700" />
        <SummaryCard icon={FiPackage} label="Order total" value={money(delivery.order?.total_amount)} className="border-violet-200 bg-violet-50/70 text-violet-700" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-6">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Order information</h2>
              </div>
              <Link to={`/admin/orders/${delivery.order?.id}`} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700">
                <FiShoppingBag className="h-4 w-4" />
                Open order
              </Link>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <Info label="Customer" value={delivery.order?.customer_name || delivery.order?.user?.full_name} />
              <Info label="Order number" value={delivery.order?.order_number} />
              <Info label="Order status" value={getOrderStatusLabel(delivery.order?.order_status)} />
              <Info label="Total" value={money(delivery.order?.total_amount)} />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-950">Delivery timeline</h2>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <Info label="Tracking number" value={delivery.tracking_no} />
              <Info label="Delivery charge" value={money(delivery.delivery_charge)} />
              <Info label="Created" value={date(delivery.created_at, 'en-US')} />
              <Info label="Delivered at" value={date(delivery.delivered_at, 'en-US')} />
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className={`rounded-lg border p-5 shadow-sm ${currentMeta.panel}`}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-300 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Delivery status</h2>
                
              </div>
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${currentMeta.tone}`}>
                <CurrentIcon className="h-4 w-4" />
              </span>
            </div>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Next status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            >
              {availableStatuses.map((item) => <option key={item} value={item}>{getDeliveryStatusLabel(item)}</option>)}
            </select>
            <button
              disabled={saving || status === delivery.delivery_status}
              onClick={updateStatus}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <FiRefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Updating...' : 'Update Status'}
            </button>
          </div>

          {/* <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
              <FiTruck className="h-4 w-4 text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-950">Delivery method</h2>
            </div>
            <p className="mt-4 leading-6 text-slate-600">
              This workflow is set up for direct store delivery without rider assignment.
            </p>
          </div> */}
        </aside>
      </div>
    </>
  )
}
