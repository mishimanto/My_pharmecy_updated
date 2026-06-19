import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiEye, FiShield, FiShoppingBag, FiTrash2, FiUser, FiUsers } from 'react-icons/fi'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import EmptyState from '../../components/common/EmptyState'
import { date, money } from '../../utils/formatters'

const userStatuses = ['', 'active', 'blocked', 'inactive']
const customerTypes = ['', 'registered', 'guest']
const customerTypeClasses = {
  registered: 'text-sky-600',
  guest: 'text-violet-600',
}
const USERS_CACHE_KEY = 'admin_users_payload_v2'
const USERS_CACHE_TTL = 2 * 60 * 1000

function cacheKey(params) {
  return JSON.stringify({
    view: params.view || 'users',
    search: params.search || '',
    status: params.status || '',
    type: params.type || '',
    page: params.page || 1,
  })
}

function readUsersCache(params) {
  if (typeof window === 'undefined') return null

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(USERS_CACHE_KEY) || '{}')
    const cached = cache[cacheKey(params)]
    if (!cached || Date.now() - cached.cachedAt > USERS_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

function writeUsersCache(params, payload) {
  if (typeof window === 'undefined') return

  try {
    const cache = JSON.parse(window.sessionStorage.getItem(USERS_CACHE_KEY) || '{}')
    cache[cacheKey(params)] = { payload, cachedAt: Date.now() }
    window.sessionStorage.setItem(USERS_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

function clearUsersCache() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(USERS_CACHE_KEY)
}

function statusChipClass(status) {
  if (status === 'active') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'blocked') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (status === 'inactive') return 'border-slate-200 bg-slate-100 text-slate-600'
  return 'border-slate-200 bg-slate-50 text-slate-500'
}

function getInitials(name) {
  return String(name || 'G')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'G'
}

function StatCard({ icon: Icon, label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-white text-slate-700',
    emerald: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    rose: 'border-rose-200 bg-rose-50/70 text-rose-700',
    sky: 'border-sky-200 bg-sky-50/70 text-sky-700',
    violet: 'border-violet-200 bg-violet-50/70 text-violet-700',
  }

  return (
    <div className={`rounded-lg border px-4 py-4 ${tones[tone] || tones.slate}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}

export default function Users() {
  const initialParams = { view: 'users', search: '', status: '', type: '', page: 1 }
  const initialCache = readUsersCache(initialParams)
  const [view, setView] = useState('users')
  const [rows, setRows] = useState(initialCache?.rows || [])
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [customerType, setCustomerType] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(initialCache?.meta || null)
  const [loading, setLoading] = useState(!initialCache)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    let active = true
    const params = {
      view,
      search,
      status: view === 'users' ? status : '',
      type: view === 'customers' ? customerType : '',
      page,
    }
    const cached = readUsersCache(params)

    if (cached) {
      setRows(cached.rows || [])
      setMeta(cached.meta || null)
      setLoading(false)
      setUpdating(false)
      return () => { active = false }
    }

    const hasRows = rows.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    const resource = view === 'users' ? 'users' : 'users/customers'
    const requestParams = view === 'users'
      ? { search, status, page }
      : { search, type: customerType, page }

    adminApi.listFresh(resource, requestParams)
      .then((res) => {
        if (!active) return
        const payload = {
          rows: res.data.data?.data || [],
          meta: res.data.data,
        }
        setRows(payload.rows)
        setMeta(payload.meta)
        writeUsersCache(params, payload)
      })
      .catch(() => active && toast.error(`Unable to load ${view}.`))
      .finally(() => {
        if (!active) return
        setLoading(false)
        setUpdating(false)
      })

    return () => { active = false }
  }, [view, search, status, customerType, page])

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

  const refreshCurrentView = () => {
    clearUsersCache()
    const params = {
      view,
      search,
      status: view === 'users' ? status : '',
      type: view === 'customers' ? customerType : '',
      page,
    }

    setLoading(rows.length === 0)
    setUpdating(rows.length > 0)

    adminApi.listFresh(view === 'users' ? 'users' : 'users/customers', view === 'users'
      ? { search, status, page }
      : { search, type: customerType, page })
      .then((res) => {
        const payload = {
          rows: res.data.data?.data || [],
          meta: res.data.data,
        }
        setRows(payload.rows)
        setMeta(payload.meta)
        writeUsersCache(params, payload)
      })
      .catch(() => toast.error(`Unable to refresh ${view}.`))
      .finally(() => {
        setLoading(false)
        setUpdating(false)
      })
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

  const renderUsersTable = () => (

      <table className="min-w-full border border-slate-300 divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Phone</th>
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
              <td className="px-4 py-3 text-slate-600">{user.phone}</td>
              <td className="px-4 py-3 text-slate-600">{user.email || '-'}</td>
              <td className="px-4 py-3 text-center">
                <div className="flex flex-wrap items-center gap-3 justify-center">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusChipClass(user.status)}`}>
                    {user.status ? user.status[0].toUpperCase() + user.status.slice(1) : '-'}
                  </span>
                  <select
                    value={user.status}
                    onChange={(event) => updateStatus(user, event.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  >
                    {userStatuses.filter(Boolean).map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
                  </select>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600 text-center">{date(user.created_at, 'en-US')}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-3">
                  <Link
                    to={`/admin/users/${user.id}`}
                    title="View user"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-300"
                  >
                    <FiEye className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    title="Delete user"
                    onClick={() => deleteUser(user)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
  )

  const renderCustomersTable = () => (
      <table className="min-w-full border border-slate-300 divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3 text-center">Type</th>
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
              <td className="px-4 py-3 text-slate-600">{customer.customer_phone || '-'}</td>
              <td className="px-4 py-3 text-slate-600">{customer.customer_email || '-'}</td>
              <td className="px-4 py-3 text-center">
                <div className="flex flex-wrap items-center justify-center gap-2">
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
                    <select
                      value={customer.account_status || 'active'}
                      onChange={(event) => updateStatus({ id: customer.user_id, full_name: customer.customer_name, status: customer.account_status || 'active' }, event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                    >
                      {userStatuses.filter(Boolean).map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
                    </select>
                    <Link
                      to={`/admin/users/${customer.user_id}`}
                      title="View customer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-300"
                    >
                      <FiEye className="h-4 w-4" />
                    </Link>
                    {customer.latest_order_id ? (
                      <Link
                        to={`/admin/orders/${customer.latest_order_id}`}
                        title={customer.latest_order_number ? `Open ${customer.latest_order_number}` : 'Open latest order'}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700 transition hover:border-sky-300"
                      >
                        <FiShoppingBag className="h-4 w-4" />
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      disabled
                      title="Customers with order history cannot be deleted."
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-slate-400 disabled:cursor-not-allowed"
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
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-violet-200 bg-violet-50 text-violet-700 transition hover:border-violet-300"
                      >
                        <FiShoppingBag className="h-4 w-4" />
                      </Link>
                    ) : null}
                    <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      Guest checkout
                    </span>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
      {view === 'users' ? (
          <>
            <StatCard icon={FiUsers} label="Listed Users" value={currentStats.total} tone="slate" />
            <StatCard icon={FiUser} label="Active Users" value={currentStats.active} tone="emerald" />
            <StatCard icon={FiShield} label="Blocked Users" value={currentStats.blocked} tone="rose" />
          </>
        ) : (
          <>
            <StatCard icon={FiUsers} label="Listed Customers" value={currentStats.total} tone="slate" />
            <StatCard icon={FiUser} label="Registered" value={currentStats.registered} tone="sky" />
            <StatCard icon={FiShield} label="Guest Checkouts" value={currentStats.guest} tone="violet" />
          </>
        )}
      </div>

      <div className="mb-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_220px_150px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={view === 'users' ? 'Name, email, or phone' : 'Name, email, phone, or order number'}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          {view === 'users' ? (
            <select
              value={status}
              onChange={(event) => { setStatus(event.target.value); setPage(1) }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            >
              {userStatuses.map((item) => <option key={item || 'all'} value={item}>{item ? item[0].toUpperCase() + item.slice(1) : 'All Statuses'}</option>)}
            </select>
          ) : (
            <select
              value={customerType}
              onChange={(event) => { setCustomerType(event.target.value); setPage(1) }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            >
              {customerTypes.map((item) => (
                <option key={item || 'all'} value={item}>
                  {item === 'registered' ? 'Registered Customers' : item === 'guest' ? 'Guest Customers' : 'All Customers'}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex items-center justify-center rounded-md border border-slate-500 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-gray-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

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
