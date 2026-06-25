import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { FiCheckCircle, FiClock, FiCreditCard, FiRotateCcw } from 'react-icons/fi'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import EmptyState from '../../components/common/EmptyState'
// import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'
import { getPaymentStatusLabel } from '../../utils/statusLabels'

const statuses = ['', 'pending', 'awaiting_proof', 'under_review', 'paid', 'refunded']
const PAYMENTS_CACHE_KEY = 'admin_payments_payload_v1'
const PAYMENTS_CACHE_TTL = 2 * 60 * 1000
const paymentStatusTextStyles = {
  awaiting_proof: 'text-amber-700',
  pending: 'text-amber-700',
  under_review: 'text-sky-700',
  paid: 'text-emerald-700',
  failed: 'text-rose-700',
  cancelled: 'text-slate-500',
  refunded: 'text-violet-700',
}
const statStyles = {
  emerald: {
    panel: 'border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#d1fae5_100%)] shadow-[0_18px_45px_-34px_rgba(16,185,129,0.9)]',
    bubble: 'from-white/80 via-emerald-100 to-emerald-300/80 shadow-[-14px_18px_34px_-24px_rgba(5,150,105,0.9),inset_12px_-12px_24px_rgba(5,150,105,0.22),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
    value: 'text-emerald-700',
  },
  sky: {
    panel: 'border-sky-200 bg-[linear-gradient(135deg,#f0f9ff_0%,#dbeafe_100%)] shadow-[0_18px_45px_-34px_rgba(14,165,233,0.9)]',
    bubble: 'from-white/80 via-sky-100 to-sky-300/80 shadow-[-14px_18px_34px_-24px_rgba(2,132,199,0.9),inset_12px_-12px_24px_rgba(2,132,199,0.22),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
    value: 'text-sky-700',
  },
  amber: {
    panel: 'border-amber-200 bg-[linear-gradient(135deg,#fffbeb_0%,#fef3c7_100%)] shadow-[0_18px_45px_-34px_rgba(245,158,11,0.9)]',
    bubble: 'from-white/80 via-amber-100 to-amber-300/80 shadow-[-14px_18px_34px_-24px_rgba(217,119,6,0.9),inset_12px_-12px_24px_rgba(217,119,6,0.22),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
    value: 'text-amber-700',
  },
  violet: {
    panel: 'border-violet-200 bg-[linear-gradient(135deg,#f5f3ff_0%,#ede9fe_100%)] shadow-[0_18px_45px_-34px_rgba(139,92,246,0.9)]',
    bubble: 'from-white/80 via-violet-100 to-violet-300/80 shadow-[-14px_18px_34px_-24px_rgba(124,58,237,0.9),inset_12px_-12px_24px_rgba(124,58,237,0.22),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
    value: 'text-violet-700',
  },
}

function getPaymentMethodLabel(method) {
  const labels = {
    COD: 'Cash on delivery',
    BKASH: 'bKash',
    NAGAD: 'Nagad',
    NOGOD: 'Nagad',
  }

  return labels[String(method || '').toUpperCase()] || method || '-'
}

function paymentCacheKey(params) {
  return JSON.stringify({
    search: params.search || '',
    status: params.status || '',
    page: params.page || 1,
  })
}

function readPaymentsCache(params) {
  if (typeof window === 'undefined') return null

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(PAYMENTS_CACHE_KEY) || '{}')
    const cached = cache[paymentCacheKey(params)]
    if (!cached || Date.now() - cached.cachedAt > PAYMENTS_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

function writePaymentsCache(params, payload) {
  if (typeof window === 'undefined') return

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(PAYMENTS_CACHE_KEY) || '{}')
    cache[paymentCacheKey(params)] = { payload, cachedAt: Date.now() }
    window.sessionStorage.setItem(PAYMENTS_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

function clearPaymentsCache() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(PAYMENTS_CACHE_KEY)
  }
}

export default function Payments() {
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  const initialStatus = searchParams.get('status') || ''
  const initialParams = { search: initialSearch, status: initialStatus, page: 1 }
  const initialCache = readPaymentsCache(initialParams)
  const [params, setParams] = useState(initialParams)
  const [payments, setPayments] = useState(initialCache?.payments || [])
  const [meta, setMeta] = useState(initialCache?.meta || null)
  const [search, setSearch] = useState(initialSearch)
  const [loading, setLoading] = useState(!initialCache)
  const [updating, setUpdating] = useState(false)
  const statItems = useMemo(() => {
    const totalPayments = meta?.total ?? payments.length
    const underReview = payments.filter((payment) => payment.payment_status === 'under_review').length
    const paidPayments = payments.filter((payment) => payment.payment_status === 'paid').length
    const refundedPayments = payments.filter((payment) => payment.payment_status === 'refunded').length

    return [
      { label: 'Total Payments', value: totalPayments, variant: 'sky', icon: FiCreditCard },
      { label: 'Under Review', value: underReview, variant: 'amber', icon: FiClock },
      { label: 'Paid', value: paidPayments, variant: 'emerald', icon: FiCheckCircle },
      { label: 'Refunded', value: refundedPayments, variant: 'violet', icon: FiRotateCcw },
    ]
  }, [meta?.total, payments])

  useEffect(() => {
    let active = true
    const cached = readPaymentsCache(params)

    if (cached) {
      setPayments(cached.payments || [])
      setMeta(cached.meta || null)
      setLoading(false)
      setUpdating(false)
      return () => { active = false }
    }

    const hasRows = payments.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('payments', params)
      .then((res) => {
        if (!active) return
        const payload = {
          payments: res.data.data?.data || [],
          meta: res.data.data,
        }
        setPayments(payload.payments)
        setMeta(payload.meta)
        writePaymentsCache(params, payload)
      })
      .catch(() => active && toast.error('Unable to load payments.'))
      .finally(() => {
        if (!active) return
        setLoading(false)
        setUpdating(false)
      })

    return () => { active = false }
  }, [params])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setParams((current) => current.search === search ? current : { ...current, search, page: 1 })
    }, 350)

    return () => clearTimeout(timeout)
  }, [search])

  const updateParams = (nextParams) => {
    setParams(nextParams)
  }

  const updateStatus = async (payment, status) => {
    if (payment.payment_status === status) return

    const result = await Swal.fire({
      title: 'Update payment status?',
      input: 'textarea',
      inputLabel: 'Review note (optional)',
      inputPlaceholder: 'Add an admin note',
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
    })

    if (!result.isConfirmed) return

    try {
      await adminApi.patch('payments', payment.id, 'status', {
        payment_status: status,
        reviewed_note: result.value || '',
      })
      clearPaymentsCache()
      toast.success('Payment status updated.')
      setParams((current) => ({ ...current }))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update payment status.')
    }
  }

  return (
    <>
      {/* <PageHeader title="Payments" subtitle="Review manual payment proofs, transaction IDs, and the verification workflow." /> */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statItems.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} variant={item.variant} icon={item.icon} />
        ))}
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Order number, transaction ID, or method"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
        <select
          value={params.status}
          onChange={(event) => updateParams({ ...params, status: event.target.value, page: 1 })}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        >
          {statuses.map((status) => <option key={status || 'all'} value={status}>{status ? getPaymentStatusLabel(status) : 'All Statuses'}</option>)}
        </select>
      </div>

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && payments.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && payments.length === 0 ? (
        <EmptyState title="No payments found" text="Try another search term or adjust the status filter." />
      ) : null}

      {payments.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Proof</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3 font-medium text-slate-950">{payment.order?.order_number || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{getPaymentMethodLabel(payment.payment_method)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{payment.transaction_id || '-'}</div>
                    {payment.reviewed_note ? <div className="mt-1 text-xs text-slate-500">{payment.reviewed_note}</div> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {payment.payment_proof_url ? <a href={payment.payment_proof_url} target="_blank" rel="noreferrer" className="text-emerald-700 underline">View</a> : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{money(payment.amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold ${getPaymentStatusTextClass(payment.payment_status)}`}>
                      {getPaymentStatusLabel(payment.payment_status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{date(payment.paid_at, 'en-US')}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex flex-wrap justify-end gap-2">
                        {payment.order?.id ? (
                          <Link
                            to={`/admin/orders/${payment.order.id}`}
                            className="text-xs font-semibold text-slate-700 underline underline-offset-2"
                          >
                            Open order
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">Order unavailable</span>
                        )}
                        {payment.payment_proof_url ? (
                          <a
                            href={payment.payment_proof_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-emerald-700 underline underline-offset-2"
                          >
                            View proof
                          </a>
                        ) : null}
                      </div>

                      {getAvailablePaymentActions(payment).length > 0 ? (
                        <select
                          key={`${payment.id}-${payment.payment_status}`}
                          defaultValue=""
                          onChange={(event) => {
                            if (!event.target.value) return
                            updateStatus(payment, event.target.value)
                            event.target.value = ''
                          }}
                          className="min-w-40 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                        >
                          <option value="">Choose action</option>
                          {getAvailablePaymentActions(payment).map((action) => (
                            <option key={action.value} value={action.value}>{action.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-right text-xs text-slate-500">
                          {getPaymentActionHint(payment)}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {meta?.last_page > 1 ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Page {meta.current_page || params.page} / {meta.last_page}</span>
          <div className="flex justify-end gap-2">
            <button disabled={params.page <= 1} onClick={() => updateParams({ ...params, page: params.page - 1 })} className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
            <button disabled={params.page >= meta.last_page} onClick={() => updateParams({ ...params, page: params.page + 1 })} className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-slate-600">
        <span className="font-bold">Note:</span> Keep <span className="font-semibold">Cash On Delivery</span> payments pending until delivery is completed. For full-payment (bKash or Nagad) orders, move the status to <span className="font-semibold text-green-700">Paid</span> after the proof is verified.
      </div>
    </>
  )
}

function StatCard({ label, value, variant = 'emerald', icon: Icon = FiCreditCard }) {
  const style = statStyles[variant] || statStyles.emerald

  return (
    <div className={`relative overflow-hidden rounded-lg border p-4 ${style.panel}`}>
      <span className={`pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-linear-to-br ${style.bubble}`}>
        <span className="absolute left-5 top-5 h-5 w-5 rounded-full bg-white/70 blur-[1px]" />
      </span>
      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className={`mt-2 text-2xl font-semibold ${style.value}`}>{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-slate-500">
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </div>
  )
}

function getAvailablePaymentActions(payment) {
  const method = String(payment?.payment_method || '').toUpperCase()
  const orderStatus = payment?.order?.order_status
  const paymentStatus = payment?.payment_status

  if (method === 'COD') {
    if (paymentStatus === 'refunded') return []
    if (paymentStatus === 'paid') return [{ value: 'refunded', label: 'Mark as refunded' }]
    if (orderStatus === 'delivered') return [{ value: 'paid', label: 'Mark as paid' }]
    return []
  }

  if (paymentStatus === 'under_review') {
    return [
      { value: 'paid', label: 'Mark as paid' },
      { value: 'awaiting_proof', label: 'Request resubmission' },
    ]
  }

  if (paymentStatus === 'paid') {
    return [{ value: 'refunded', label: 'Mark as refunded' }]
  }

  return []
}

function getPaymentActionHint(payment) {
  const method = String(payment?.payment_method || '').toUpperCase()
  const orderStatus = payment?.order?.order_status
  const paymentStatus = payment?.payment_status

  if (method === 'COD') {
    if (paymentStatus === 'refunded') return 'Refund completed'
    if (paymentStatus === 'paid') return 'Payment completed'
    if (orderStatus !== 'delivered') return 'Wait until the order is delivered'
    return 'Ready to mark as paid'
  }

  if (paymentStatus === 'awaiting_proof' || paymentStatus === 'pending') {
    return 'Waiting for customer payment proof'
  }

  if (paymentStatus === 'paid') {
    return 'Payment completed'
  }

  if (paymentStatus === 'refunded') {
    return 'Refund completed'
  }

  return 'No further action'
}

function getPaymentStatusTextClass(status) {
  return paymentStatusTextStyles[status] || 'text-slate-700'
}
