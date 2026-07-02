import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowUpRight, FiCheckCircle, FiClock, FiRotateCcw, FiXCircle } from 'react-icons/fi'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminFilterBar from '../../components/admin/AdminFilterBar'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import AdminStatCard from '../../components/admin/AdminStatCard'
import EmptyState from '../../components/common/EmptyState'
import { useAdminFreshListQuery } from '../../queries/adminQueries'
import { date, money } from '../../utils/formatters'

const statuses = ['requested', 'approved', 'rejected', 'picked_up', 'refunded', 'closed']

function statusLabel(status) {
  return String(status || '-')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function statusBadgeClass(status) {
  if (status === 'requested') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (status === 'approved' || status === 'picked_up') return 'border-sky-200 bg-sky-50 text-sky-700'
  if (status === 'refunded' || status === 'closed') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'rejected') return 'border-rose-200 bg-rose-50 text-rose-700'
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function refundBadgeClass(status) {
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'processing') return 'border-sky-200 bg-sky-50 text-sky-700'
  if (status === 'pending') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (status === 'rejected') return 'border-rose-200 bg-rose-50 text-rose-700'
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function actionButtonClass(tone = 'slate') {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300',
    sky: 'border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300',
    slate: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
  }

  return `inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${tones[tone] || tones.slate}`
}

export default function Returns() {
  const initialParams = { search: '', status: '', page: 1 }
  const [params, setParams] = useState(initialParams)
  const [search, setSearch] = useState('')
  const returnsQuery = useAdminFreshListQuery('returns', params, {
    placeholderData: (previous) => previous,
    staleTime: 1000 * 30,
  })
  const statsQuery = useAdminFreshListQuery('returns', { page: 1, per_page: 100 }, {
    staleTime: 1000 * 30,
  })
  const returns = returnsQuery.data?.data || []
  const allReturns = statsQuery.data?.data || []
  const meta = returnsQuery.data || null
  const loading = returnsQuery.isLoading && !returnsQuery.data
  const updating = returnsQuery.isFetching && Boolean(returnsQuery.data)

  const stats = useMemo(() => ({
    total: allReturns.length,
    requested: allReturns.filter((item) => item.status === 'requested').length,
    approved: allReturns.filter((item) => ['approved', 'picked_up'].includes(item.status)).length,
    refunded: allReturns.filter((item) => item.status === 'refunded').length,
  }), [allReturns])

  const updateParams = (nextParams) => {
    setParams(nextParams)
  }

  const hasActiveFilters = Boolean(search || params.status)
  const statItems = [
    { label: 'Total Returns', value: stats.total, variant: 'slate', icon: FiRotateCcw },
    { label: 'Requested', value: stats.requested, variant: 'amber', icon: FiClock },
    { label: 'Approved Flow', value: stats.approved, variant: 'sky', icon: FiCheckCircle },
    { label: 'Refunded', value: stats.refunded, variant: 'emerald', icon: FiXCircle },
  ]
  const filterOptions = [
    {
      key: 'status',
      value: params.status,
      onChange: (value) => updateParams({ ...params, status: value, page: 1 }),
      options: [
        { value: '', label: 'All Statuses' },
        ...statuses.map((status) => ({ value: status, label: statusLabel(status) })),
      ],
    },
  ]

  useEffect(() => {
    if (returnsQuery.isError) {
      toast.error('Unable to load returns.')
    }
  }, [returnsQuery.isError])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setParams((current) => current.search === search ? current : { ...current, search, page: 1 })
    }, 350)

    return () => clearTimeout(timeout)
  }, [search])
  const updateStatus = async (item, status) => {
    if (item.status === status) return

    const result = await Swal.fire({
      title: 'Update return status?',
      text: `${statusLabel(item.status)} to ${statusLabel(status)}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
    })
    if (!result.isConfirmed) return

    try {
      await adminApi.patch('returns', item.id, 'status', { status })
      toast.success('Return status updated.')
      await Promise.all([returnsQuery.refetch(), statsQuery.refetch()])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update return status.')
    }
  }

  const processRefund = async (item) => {
    const result = await Swal.fire({
      title: 'Create refund',
      html: `
        <input id="refund_amount" class="swal2-input" placeholder="Refund amount">
        <input id="refund_method" class="swal2-input" placeholder="Refund method" value="Manual Refund">
        <input id="transaction_id" class="swal2-input" placeholder="Transaction ID (optional)">
        <select id="refund_status" class="swal2-input">
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Create Refund',
      cancelButtonText: 'Cancel',
      focusConfirm: false,
      preConfirm: () => {
        const refundAmount = document.getElementById('refund_amount')?.value?.trim()
        const refundMethod = document.getElementById('refund_method')?.value?.trim()
        const transactionId = document.getElementById('transaction_id')?.value?.trim()
        const refundStatus = document.getElementById('refund_status')?.value

        if (!refundAmount || Number(refundAmount) < 0) {
          Swal.showValidationMessage('Enter a valid refund amount.')
          return false
        }

        if (!refundMethod) {
          Swal.showValidationMessage('Refund method is required.')
          return false
        }

        return {
          refund_amount: Number(refundAmount),
          refund_method: refundMethod,
          transaction_id: transactionId || undefined,
          status: refundStatus,
        }
      },
    })
    if (!result.isConfirmed) return

    try {
      await adminApi.create(`returns/${item.id}/refund`, result.value)
      toast.success('Refund created.')
      await Promise.all([returnsQuery.refetch(), statsQuery.refetch()])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create refund.')
    }
  }

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statItems.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} variant={item.variant} icon={item.icon} />
        ))}
      </div>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by order, customer, phone, or reason"
        filters={filterOptions}
        onClear={() => {
          setSearch('')
          updateParams({ search: '', status: '', page: 1 })
        }}
        hasActiveFilters={hasActiveFilters}
      />

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && returns.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && returns.length === 0 ? (
        <EmptyState title="No returns found" text="Try another search term or adjust the status filter." />
      ) : null}

      {returns.length > 0 ? (
        <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[1180px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Return</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Refund</th>
                <th className="px-4 py-3 text-center">Created</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returns.map((item) => {
                const canRefund = ['approved', 'picked_up', 'refunded'].includes(item.status)
                const refundCreated = Boolean(item.refund)

                return (
                  <tr key={item.id} className="transition hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-700">
                          <FiRotateCcw className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="font-medium text-slate-950">{item.order?.order_number || `Return #${item.id}`}</div>
                          <div className="text-xs text-slate-500">Return #{item.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-slate-800">{item.user?.full_name || '-'}</div>
                        <div className="text-xs text-slate-500">{item.user?.phone || '-'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.order_item?.product?.product_name || item.order_item?.product?.name || '-'}</td>
                    <td className="max-w-[260px] px-4 py-3 text-slate-600">
                      <p className="line-clamp-2">{item.reason}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="space-y-2">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(item.status)}`}>
                          {statusLabel(item.status)}
                        </span>
                        <select
                          value={item.status}
                          onChange={(event) => updateStatus(item, event.target.value)}
                          className="block w-full rounded-md border border-slate-300 px-2 py-1 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                        >
                          {statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.refund ? (
                        <div className="space-y-1">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${refundBadgeClass(item.refund.status)}`}>
                            {statusLabel(item.refund.status)}
                          </span>
                          <div className="text-sm font-semibold text-slate-800">{money(item.refund.refund_amount)}</div>
                          <div className="text-xs text-slate-500">{item.refund.refund_method || '-'}</div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={!canRefund || refundCreated}
                          onClick={() => processRefund(item)}
                          className="rounded-md bg-slate-950 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          Create Refund
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">{date(item.created_at, 'en-US')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3">
                        {item.user?.id ? (
                          <Link to={`/admin/users/${item.user.id}`} className={actionButtonClass('emerald')} title="Open user">
                            <FiArrowUpRight className="h-4 w-4" />
                          </Link>
                        ) : null}
                        {item.order?.id ? (
                          <Link to={`/admin/orders/${item.order.id}`} className={actionButtonClass('sky')} title="Open order">
                            <FiRotateCcw className="h-4 w-4" />
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {meta?.last_page > 1 ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Page {meta.current_page || params.page} / {meta.last_page}</span>
          <div className="flex justify-end gap-2">
            <button
              disabled={params.page <= 1}
              onClick={() => updateParams({ ...params, page: params.page - 1 })}
              className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={params.page >= meta.last_page}
              onClick={() => updateParams({ ...params, page: params.page + 1 })}
              className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
