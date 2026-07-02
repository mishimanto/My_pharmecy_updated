import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { FiCheckCircle, FiClock, FiLock, FiRefreshCw, FiSearch, FiShield, FiSlash, FiUsers } from 'react-icons/fi'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import AdminStatCard from '../../components/admin/AdminStatCard'
import EmptyState from '../../components/common/EmptyState'
import AuthPasswordField from '../../components/common/AuthPasswordField'
import { date } from '../../utils/formatters'

const initialParams = { guard: 'staff', status: '', search: '', page: 1, per_page: 15 }

export default function Security() {
  const [summary, setSummary] = useState(null)
  const [params, setParams] = useState(initialParams)
  const [search, setSearch] = useState('')
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [password, setPassword] = useState('')

  const rows = history?.data || []
  const stats = useMemo(() => [
    { label: '2FA Status', value: summary?.two_factor_enabled ? 'Enabled' : 'Disabled', variant: summary?.two_factor_enabled ? 'emerald' : 'rose', icon: FiShield },
    { label: 'Active Staff Sessions', value: summary?.active_staff_sessions || 0, variant: 'slate', icon: FiUsers },
    { label: 'Visible History', value: history?.total || rows.length, variant: 'amber', icon: FiClock },
    { label: 'Password Confirmed', value: summary?.password_confirmation_expires_at ? 'Recent' : 'Required', variant: summary?.password_confirmation_expires_at ? 'emerald' : 'rose', icon: FiLock },
  ], [history?.total, rows.length, summary])

  const loadSummary = () => {
    return adminApi.securitySummary()
      .then((response) => setSummary(response.data.data))
      .catch(() => toast.error('Unable to load security summary.'))
  }

  const loadHistory = (nextParams = params) => {
    setUpdating(true)
    return adminApi.loginHistory(cleanParams(nextParams))
      .then((response) => setHistory(response.data.data))
      .catch(() => toast.error('Unable to load login history.'))
      .finally(() => {
        setLoading(false)
        setUpdating(false)
      })
  }

  useEffect(() => {
    loadSummary()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setParams((current) => current.search === search ? current : { ...current, search, page: 1 })
    }, 350)

    return () => clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    loadHistory(params)
  }, [params])

  const refresh = () => {
    loadSummary()
    loadHistory(params)
  }

  const toggleTwoFactor = async () => {
    if (!password) {
      toast.error('Current password is required.')
      return
    }

    try {
      const nextEnabled = !summary?.two_factor_enabled
      const response = await adminApi.updateTwoFactor({ enabled: nextEnabled, current_password: password })
      setSummary((current) => ({ ...current, two_factor_enabled: response.data.data?.two_factor_enabled }))
      setPassword('')
      toast.success(nextEnabled ? 'Two-factor login enabled.' : 'Two-factor login disabled.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update two-factor setting.')
    }
  }

  const revoke = async (session) => {
    const result = await Swal.fire({
      title: 'Revoke this staff session?',
      text: `${session.actor_name || 'Staff'} will be signed out from that session.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Revoke',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    })

    if (!result.isConfirmed) return

    try {
      await adminApi.revokeStaffSession(session.id)
      toast.success('Staff session revoked.')
      refresh()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to revoke session.')
    }
  }

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} variant={item.variant} icon={item.icon} />
        ))}
      </div>

      <section className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Login History</h2>
            </div>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
            >
              <FiRefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[160px_160px_minmax(0,1fr)]">
            <select
              value={params.guard}
              onChange={(event) => setParams({ ...params, guard: event.target.value, page: 1 })}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="staff">Staff</option>
              <option value="customer">Customers</option>
            </select>
            <select
              value={params.status}
              onChange={(event) => setParams({ ...params, status: event.target.value, page: 1 })}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All Sessions</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
            </select>
            <label className="relative block min-w-0">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, device, or IP"
                className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>
        </div>

        <div className="border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Admin 2FA</h2>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-semibold ${summary?.two_factor_enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {summary?.two_factor_enabled ? <FiCheckCircle className="h-3.5 w-3.5" /> : <FiSlash className="h-3.5 w-3.5" />}
              {summary?.two_factor_enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="mt-4">
            <AuthPasswordField
              value={password}
              placeholder="Confirm your password"
              className="mt-0"
              inputClassName="h-10 rounded-md bg-white px-3 py-0 transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={toggleTwoFactor}
            className={`mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition ${summary?.two_factor_enabled ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {summary?.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'}
          </button>
        </div>
      </section>

      {updating && !loading ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading ? <AdminLoadingState className="py-8" /> : null}
      {!loading && rows.length === 0 ? (
        <EmptyState title="No login history found" text="Try another guard, status, or search term." />
      ) : null}

      {rows.length > 0 ? (
        <div className="overflow-x-auto border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Guard</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3 text-center">Login</th>
                <th className="px-4 py-3 text-center">Logout</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((session) => (
                <tr key={`${session.guard_name}-${session.id}`} className="hover:bg-slate-50/80">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-950">{session.actor_name || '-'}</p>
                    <p className="mt-1 text-xs text-slate-500">{session.actor_email || '-'}</p>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{label(session.guard_name)}</td>
                  <td className="px-4 py-4 text-slate-600">{session.device_type || '-'}</td>
                  <td className="px-4 py-4 text-slate-600">{session.ip_address || '-'}</td>
                  <td className="px-4 py-4 text-center text-slate-600">{date(session.login_at, 'en-US')}</td>
                  <td className="px-4 py-4 text-center">
                    {session.logout_at ? (
                      <span className="text-slate-600">{date(session.logout_at, 'en-US')}</span>
                    ) : (
                      <span className="font-semibold text-emerald-700">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {session.guard_name === 'staff' && !session.logout_at ? (
                      <button
                        type="button"
                        onClick={() => revoke(session)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300"
                      >
                        Revoke
                      </button>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  )
}

function label(value) {
  return String(value || '-').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function cleanParams(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined))
}
