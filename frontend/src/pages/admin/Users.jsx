import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiEye, FiShield, FiShoppingBag, FiTrash2, FiUser, FiUserCheck, FiUserX, FiUsers } from 'react-icons/fi'
import { useQueryClient } from '@tanstack/react-query'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminFilterBar from '../../components/admin/AdminFilterBar'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import AdminStatCard from '../../components/admin/AdminStatCard'
import EmptyState from '../../components/common/EmptyState'
import { adminQueryKeys, useAdminListQuery } from '../../queries/adminQueries'
import { date, money } from '../../utils/formatters'

const userStatuses = ['', 'active', 'blocked', 'inactive']
const customerTypes = ['', 'registered', 'guest']
const customerTypeClasses = {
  registered: 'text-sky-600',
  guest: 'text-violet-600',
}
function statusChipClass(status) {
  if (status === 'active') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'blocked') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (status === 'inactive') return 'border-slate-200 bg-slate-100 text-slate-600'
  return 'border-slate-200 bg-slate-50 text-slate-500'
}

function actionButtonClass(tone = 'slate', disabled = false) {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300',
    sky: 'border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300',
    rose: 'border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:text-rose-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300',
    slate: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
  }

  return `inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${
    disabled ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed' : tones[tone] || tones.slate
  }`
}

function nextAccountStatus(status) {
  return status === 'active' ? 'blocked' : 'active'
}

function getInitials(name) {
  return String(name || 'G')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'G'
}

export default function Users() {
  const queryClient = useQueryClient()
  const [view, setView] = useState('users')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [customerType, setCustomerType] = useState('')
  const [page, setPage] = useState(1)
  const resource = view === 'users' ? 'users' : 'users/customers'
  const requestParams = view === 'users'
    ? { search, status, page }
    : { search, type: customerType, page }
  const usersQuery = useAdminListQuery(resource, requestParams, {
    placeholderData: (previous) => previous,
    staleTime: 1000 * 30,
  })
  const meta = usersQuery.data || null
  const rows = meta?.data || []
  const loading = usersQuery.isLoading && rows.length === 0
  const updating = usersQuery.isFetching && rows.length > 0

  useEffect(() => {
    if (usersQuery.isError) {
      toast.error(`Unable to load ${view}.`)
    }
  }, [usersQuery.isError, view])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch((current) => current === query ? current : query)
      setPage(1)
    }, 350)

    return () => clearTimeout(timeout)
  }, [query])

  const switchView = (nextView) => {
    setView(nextView)
    setQuery('')
    setSearch('')
    setStatus('')
    setCustomerType('')
    setPage(1)
  }

  const clearFilters = () => {
    setQuery('')
    setSearch('')
    setStatus('')
    setCustomerType('')
    setPage(1)
  }

  const hasActiveFilters = Boolean(query || status || customerType)

  const refreshCurrentView = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.resourceList(resource) })
      await usersQuery.refetch()
    } catch {
      toast.error(`Unable to refresh ${view}.`)
    }
  }

  const updateStatus = async (user, nextStatus) => {
    if (user.status === nextStatus) return

    const result = await Swal.fire({
      title: 'Change user status?',
      text: `${user.status} to ${nextStatus}`,
      input: 'text',
      inputPlaceholder: 'Reason',
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
    })

    if (!result.isConfirmed) return

    try {
      await adminApi.patch('users', user.id, 'status', { status: nextStatus, reason: result.value || undefined })
      toast.success('User status updated.')
      refreshCurrentView()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update user status.')
    }
  }

  const deleteUser = async (user) => {
    const result = await Swal.fire({
      title: 'Delete this user?',
      text: user.full_name,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    })

    if (!result.isConfirmed) return

    try {
      await adminApi.remove('users', user.id)
      toast.success('User deleted. Email was queued.')
      refreshCurrentView()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete this user.')
    }
  }

  const currentStats = view === 'users'
    ? {
        total: rows.length,
        active: rows.filter((row) => row.status === 'active').length,
        blocked: rows.filter((row) => row.status === 'blocked').length,
      }
    : {
        total: rows.length,
        registered: rows.filter((row) => row.customer_type === 'registered').length,
        guest: rows.filter((row) => row.customer_type === 'guest').length,
      }
  const statItems = view === 'users'
    ? [
        { label: 'Listed Users', value: currentStats.total, variant: 'slate', icon: FiUsers },
        { label: 'Active Users', value: currentStats.active, variant: 'emerald', icon: FiUser },
        { label: 'Blocked Users', value: currentStats.blocked, variant: 'rose', icon: FiShield },
      ]
    : [
        { label: 'Listed Customers', value: currentStats.total, variant: 'slate', icon: FiUsers },
        { label: 'Registered', value: currentStats.registered, variant: 'sky', icon: FiUser },
        { label: 'Guest Checkouts', value: currentStats.guest, variant: 'violet', icon: FiShield },
      ]
  const filterOptions = view === 'users'
    ? [
        {
          key: 'status',
          value: status,
          onChange: (value) => { setStatus(value); setPage(1) },
          options: userStatuses.map((item) => ({
            value: item,
            label: item ? item[0].toUpperCase() + item.slice(1) : 'All Statuses',
          })),
        },
      ]
    : [
        {
          key: 'type',
          value: customerType,
          onChange: (value) => { setCustomerType(value); setPage(1) },
          options: customerTypes.map((item) => ({
            value: item,
            label: item === 'registered' ? 'Registered Customers' : item === 'guest' ? 'Guest Customers' : 'All Customers',
          })),
        },
      ]

  const renderUsersTable = () => (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[920px] divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3 text-center">Status</th>
            <th className="px-4 py-3 text-center">Joined</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((user) => (
            <tr key={user.id} className="transition hover:bg-slate-50/80">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-slate-100 to-slate-200 text-xs font-semibold text-slate-700">
                    {getInitials(user.full_name)}
                  </span>
                  <div>
                    <div className="font-medium text-slate-950">{user.full_name}</div>
                    <div className="text-xs text-slate-500">User #{user.id}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 font-medium text-slate-700">{user.phone}</td>
              <td className="px-4 py-3 text-slate-600">{user.email || '-'}</td>
              <td className="px-4 py-3 text-center">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusChipClass(user.status)}`}>
                  {user.status ? user.status[0].toUpperCase() + user.status.slice(1) : '-'}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600 text-center">{date(user.created_at, 'en-US')}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-3">
                  <Link
                    to={`/admin/users/${user.id}`}
                    title="View user"
                    className={actionButtonClass('emerald')}
                  >
                    <FiEye className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    title={user.status === 'active' ? 'Block user' : 'Activate user'}
                    onClick={() => updateStatus(user, nextAccountStatus(user.status))}
                    className={actionButtonClass(user.status === 'active' ? 'rose' : 'sky')}
                  >
                    {user.status === 'active' ? <FiUserX className="h-4 w-4" /> : <FiUserCheck className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    title="Delete user"
                    onClick={() => deleteUser(user)}
                    className={actionButtonClass('rose')}
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderCustomersTable = () => (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[1080px] divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3 text-center">Orders</th>
            <th className="px-4 py-3 text-center">Total Spent</th>
            <th className="px-4 py-3 text-center">Last Order</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((customer, index) => (
            <tr key={`${customer.customer_type}-${customer.user_id || customer.guest_token || index}`} className="transition hover:bg-slate-50/80">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-slate-100 to-slate-200 text-xs font-semibold text-slate-700">
                    {getInitials(customer.customer_name || 'Guest customer')}
                  </span>
                  <div>
                    <div className="font-medium text-slate-950">{customer.customer_name || 'Guest customer'}</div>
                    <div className="text-xs text-slate-500">
                      {customer.user_id ? `User #${customer.user_id}` : `Guest session ${String(customer.guest_token || '').slice(0, 10) || '-'}`}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 font-medium text-slate-700">{customer.customer_phone || '-'}</td>
              <td className="px-4 py-3 text-slate-600">{customer.customer_email || '-'}</td>
              <td className="px-4 py-3">
                <div className="space-y-1">
                  <div className={`text-xs font-semibold ${customerTypeClasses[customer.customer_type] || 'text-slate-600'}`}>
                    {customer.customer_type === 'guest' ? 'Guest customer' : 'Registered customer'}
                  </div>
                  {customer.account_status ? (
                    <div className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusChipClass(customer.account_status)}`}>
                      {customer.account_status[0].toUpperCase() + customer.account_status.slice(1)}
                    </div>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-3 text-center font-semibold text-slate-800">{customer.orders_count}</td>
              <td className="px-4 py-3 text-center text-slate-700">{money(customer.total_spent || 0)}</td>
              <td className="px-4 py-3 text-slate-600 text-center">{date(customer.last_order_at, 'en-US')}</td>
              <td className="px-4 py-3 text-center">
                {customer.user_id ? (
                  <div className="flex items-center justify-center gap-3">
                    <Link
                      to={`/admin/users/${customer.user_id}`}
                      title="View customer"
                      className={actionButtonClass('emerald')}
                    >
                      <FiEye className="h-4 w-4" />
                    </Link>
                    {customer.latest_order_id ? (
                      <Link
                        to={`/admin/orders/${customer.latest_order_id}`}
                        title={customer.latest_order_number ? `Open ${customer.latest_order_number}` : 'Open latest order'}
                        className={actionButtonClass('sky')}
                      >
                        <FiShoppingBag className="h-4 w-4" />
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      title={(customer.account_status || 'active') === 'active' ? 'Block customer' : 'Activate customer'}
                      onClick={() => updateStatus({
                        id: customer.user_id,
                        full_name: customer.customer_name,
                        status: customer.account_status || 'active',
                      }, nextAccountStatus(customer.account_status || 'active'))}
                      className={actionButtonClass((customer.account_status || 'active') === 'active' ? 'rose' : 'sky')}
                    >
                      {(customer.account_status || 'active') === 'active' ? <FiUserX className="h-4 w-4" /> : <FiUserCheck className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      disabled
                      title="Customers with order history cannot be deleted."
                      className={actionButtonClass('slate', true)}
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    {customer.latest_order_id ? (
                      <Link
                        to={`/admin/orders/${customer.latest_order_id}`}
                        title={customer.latest_order_number ? `Open ${customer.latest_order_number}` : 'Open latest order'}
                        className={actionButtonClass('violet')}
                      >
                        <FiShoppingBag className="h-4 w-4" />
                      </Link>
                    ) : null}
                    <span className="text-xs font-semibold text-violet-700">Guest checkout</span>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <>
      <div className="mb-4 flex flex-wrap">
        {[
          { key: 'users', label: 'Users' },
          { key: 'customers', label: 'Customers' },
        ].map((tab) => {
          const active = view === tab.key

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => switchView(tab.key)}
              className={`border px-4 py-2 text-sm font-semibold transition ${
                active
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {statItems.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} variant={item.variant} icon={item.icon} />
        ))}
      </div>

      <AdminFilterBar
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder={view === 'users' ? 'Name, email, or phone' : 'Name, email, phone, or order number'}
        filters={filterOptions}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && rows.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && rows.length === 0 ? (
        <EmptyState
          title={view === 'users' ? 'No users found' : 'No customers found'}
          text={view === 'users' ? 'Try another search term or adjust the status filter.' : 'Try another search term or adjust the customer filter.'}
        />
      ) : null}

      {rows.length > 0 ? (view === 'users' ? renderUsersTable() : renderCustomersTable()) : null}

      {view === 'customers' && rows.length > 0 ? (
        <div className="mt-3 border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          <span className="font-semibold">Note:</span> Delete stays unavailable for customers with order history.
        </div>
      ) : null}

      {meta?.last_page > 1 ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Page {meta.current_page || page} / {meta.last_page}</span>
          <div className="flex justify-end gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setPage(page + 1)}
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
