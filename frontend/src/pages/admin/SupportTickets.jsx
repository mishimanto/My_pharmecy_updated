import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCheckCircle, FiClock, FiEye, FiHeadphones, FiMessageSquare } from 'react-icons/fi'
import toast from 'react-hot-toast'
import AdminFilterBar from '../../components/admin/AdminFilterBar'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import AdminStatCard from '../../components/admin/AdminStatCard'
import EmptyState from '../../components/common/EmptyState'
import { useAdminFreshListQuery } from '../../queries/adminQueries'
import { date } from '../../utils/formatters'

const statuses = ['', 'open', 'in_progress', 'resolved', 'closed']

function statusBadgeClass(status) {
  if (status === 'open') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (status === 'in_progress') return 'border-sky-200 bg-sky-50 text-sky-700'
  if (status === 'resolved') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'closed') return 'border-slate-200 bg-slate-100 text-slate-600'
  return 'border-slate-200 bg-slate-50 text-slate-500'
}

function statusLabel(status) {
  if (!status) return 'Unknown'
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function actionButtonClass(tone = 'slate') {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300',
    slate: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
  }

  return `inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${tones[tone] || tones.slate}`
}

export default function SupportTickets() {
  const initialParams = { search: '', status: '', page: 1 }
  const [params, setParams] = useState(initialParams)
  const [search, setSearch] = useState('')
  const ticketsQuery = useAdminFreshListQuery('support-tickets', params, {
    placeholderData: (previous) => previous,
    staleTime: 1000 * 30,
  })
  const statsQuery = useAdminFreshListQuery('support-tickets', { page: 1, per_page: 100 }, {
    staleTime: 1000 * 30,
  })
  const tickets = ticketsQuery.data?.data || []
  const allTickets = statsQuery.data?.data || []
  const meta = ticketsQuery.data || null
  const loading = ticketsQuery.isLoading && !ticketsQuery.data
  const updating = ticketsQuery.isFetching && Boolean(ticketsQuery.data)

  const stats = useMemo(() => ({
    total: allTickets.length,
    open: allTickets.filter((ticket) => ticket.status === 'open').length,
    inProgress: allTickets.filter((ticket) => ticket.status === 'in_progress').length,
    resolved: allTickets.filter((ticket) => ticket.status === 'resolved').length,
  }), [allTickets])

  const updateParams = (nextParams) => {
    setParams(nextParams)
  }

  const hasActiveFilters = Boolean(search || params.status)
  const statItems = [
    { label: 'Total Tickets', value: stats.total, variant: 'slate', icon: FiHeadphones },
    { label: 'Open Tickets', value: stats.open, variant: 'amber', icon: FiClock },
    { label: 'In Progress', value: stats.inProgress, variant: 'sky', icon: FiMessageSquare },
    { label: 'Resolved', value: stats.resolved, variant: 'emerald', icon: FiCheckCircle },
  ]
  const filterOptions = [
    {
      key: 'status',
      value: params.status,
      onChange: (value) => updateParams({ ...params, status: value, page: 1 }),
      options: statuses.map((status) => ({
        value: status,
        label: status ? statusLabel(status) : 'All Statuses',
      })),
    },
  ]

  useEffect(() => {
    if (ticketsQuery.isError) {
      toast.error('Unable to load support tickets.')
    }
  }, [ticketsQuery.isError])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setParams((current) => current.search === search ? current : { ...current, search, page: 1 })
    }, 350)

    return () => clearTimeout(timeout)
  }, [search])

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
        searchPlaceholder="Search by subject, customer, phone, or order number"
        filters={filterOptions}
        onClear={() => {
          setSearch('')
          updateParams({ search: '', status: '', page: 1 })
        }}
        hasActiveFilters={hasActiveFilters}
      />

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && tickets.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && tickets.length === 0 ? (
        <EmptyState title="No support tickets found" text="Try another search term or adjust the ticket status filter." />
      ) : null}

      {tickets.length > 0 ? (
        <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[1080px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Linked Order</th>
                <th className="px-4 py-3 text-center">Replies</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Created</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="transition hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-sky-700">
                        <FiHeadphones className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-950">{ticket.subject}</div>
                        <div className="text-xs text-slate-500">Ticket #{ticket.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-slate-800">{ticket.user?.full_name || '-'}</div>
                      <div className="text-xs text-slate-500">{ticket.user?.phone || '-'}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{ticket.order?.order_number || '-'}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-700">{ticket.replies_count || 0}</td>
                  <td className="px-4 py-3 text-slate-600">{ticket.assigned_staff?.full_name || 'Unassigned'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(ticket.status)}`}>
                      {statusLabel(ticket.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">{date(ticket.created_at, 'en-US')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-3">
                      <Link
                        to={`/admin/support/${ticket.id}`}
                        title="Open ticket"
                        className={actionButtonClass('emerald')}
                      >
                        <FiEye className="h-4 w-4" />
                      </Link>
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
