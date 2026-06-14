import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import PageHeader from '../../components/common/PageHeader'
import { date } from '../../utils/formatters'

const statuses = ['', 'active', 'blocked', 'inactive']

export default function Users() {
  const [users, setUsers] = useState([])
  const [params, setParams] = useState({ search: '', status: '' })
  const [loading, setLoading] = useState(true)

  const load = () => {
    adminApi.list('users', params)
      .then((res) => setUsers(res.data.data?.data || []))
      .catch(() => toast.error('Unable to load customers.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [params])

  const updateStatus = async (user, status) => {
    if (user.status === status) return
    const result = await Swal.fire({ title: 'Change customer status?', text: `${user.status} to ${status}`, input: 'text', inputPlaceholder: 'Reason', showCancelButton: true, confirmButtonText: 'Update', cancelButtonText: 'Cancel' })
    if (!result.isConfirmed) return
    try {
      await adminApi.patch('users', user.id, 'status', { status, reason: result.value || undefined })
      toast.success('Customer status updated.')
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update customer status.')
    }
  }

  const updateParams = (next) => {
    setLoading(true)
    setParams(next)
  }

  return (
    <>
      <PageHeader title="Customers" subtitle="Search customers, filter them, and block or unblock accounts." />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <input value={params.search} onChange={(event) => updateParams({ ...params, search: event.target.value })} placeholder="Name, email, or phone" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select value={params.status} onChange={(event) => updateParams({ ...params, status: event.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          {statuses.map((status) => <option key={status || 'all'} value={status}>{status || 'All Statuses'}</option>)}
        </select>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3"></th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">Loading...</td></tr> : null}
            {!loading && !users.length ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">No customers found.</td></tr> : null}
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-medium text-slate-950">{user.full_name}</td>
                <td className="px-4 py-3 text-slate-600">{user.phone}</td>
                <td className="px-4 py-3 text-slate-600">{user.email || '-'}</td>
                <td className="px-4 py-3"><select value={user.status} onChange={(event) => updateStatus(user, event.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-sm">{statuses.filter(Boolean).map((status) => <option key={status} value={status}>{status}</option>)}</select></td>
                <td className="px-4 py-3 text-slate-600">{date(user.created_at, 'en-US')}</td>
                <td className="px-4 py-3 text-right"><Link to={`/admin/users/${user.id}`} className="font-semibold text-emerald-700">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
