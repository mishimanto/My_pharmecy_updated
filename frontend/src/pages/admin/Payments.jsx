import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import EmptyState from '../../components/common/EmptyState'
// import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'
import { getPaymentStatusLabel } from '../../utils/statusLabels'

const statuses = ['', 'pending', 'awaiting_proof', 'under_review', 'paid', 'refunded']
const paymentStatuses = statuses.filter(Boolean)
const PAYMENTS_CACHE_KEY = 'admin_payments_payload_v1'
const PAYMENTS_CACHE_TTL = 2 * 60 * 1000

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
                    <select
                      value={payment.payment_status}
                      onChange={(event) => updateStatus(payment, event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                    >
                      {getAvailablePaymentStatuses(payment).map((status) => <option key={status} value={status}>{getPaymentStatusLabel(status)}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{date(payment.paid_at, 'en-US')}</td>
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

function getAvailablePaymentStatuses(payment) {
  const method = String(payment?.payment_method || '').toUpperCase()
  const orderStatus = payment?.order?.order_status

  let allowed = method === 'COD'
    ? paymentStatuses.filter((status) => ['pending', 'paid', 'refunded'].includes(status))
    : paymentStatuses.filter((status) => ['awaiting_proof', 'under_review', 'paid', 'refunded'].includes(status))

  if (method === 'COD' && orderStatus !== 'delivered') {
    allowed = allowed.filter((status) => status !== 'paid')
  }

  if (payment?.payment_status && !allowed.includes(payment.payment_status)) {
    return [payment.payment_status, ...allowed]
  }

  return allowed
}
