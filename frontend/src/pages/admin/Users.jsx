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
      .catch(() => toast.error('কাস্টমার তালিকা লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [params])

  const updateStatus = async (user, status) => {
    if (user.status === status) return
    const result = await Swal.fire({ title: 'কাস্টমার স্ট্যাটাস বদলাবেন?', text: `${user.status} থেকে ${status}`, input: 'text', inputPlaceholder: 'কারণ', showCancelButton: true, confirmButtonText: 'আপডেট', cancelButtonText: 'বাতিল' })
    if (!result.isConfirmed) return
    try {
      await adminApi.patch('users', user.id, 'status', { status, reason: result.value || undefined })
      toast.success('কাস্টমার স্ট্যাটাস আপডেট হয়েছে।')
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'স্ট্যাটাস আপডেট করা যায়নি।')
    }
  }

  const updateParams = (next) => {
    setLoading(true)
    setParams(next)
  }

  return (
    <>
      <PageHeader title="কাস্টমার" subtitle="কাস্টমার খুঁজুন, ফিল্টার করুন এবং ব্লক/আনব্লক করুন।" />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <input value={params.search} onChange={(event) => updateParams({ ...params, search: event.target.value })} placeholder="নাম, ইমেইল বা ফোন" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select value={params.status} onChange={(event) => updateParams({ ...params, status: event.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          {statuses.map((status) => <option key={status || 'all'} value={status}>{status || 'সব স্ট্যাটাস'}</option>)}
        </select>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600"><tr><th className="px-4 py-3">নাম</th><th className="px-4 py-3">ফোন</th><th className="px-4 py-3">ইমেইল</th><th className="px-4 py-3">স্ট্যাটাস</th><th className="px-4 py-3">যোগদান</th><th className="px-4 py-3"></th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">লোড হচ্ছে...</td></tr> : null}
            {!loading && !users.length ? <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">কোনো কাস্টমার নেই।</td></tr> : null}
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-medium text-slate-950">{user.full_name}</td>
                <td className="px-4 py-3 text-slate-600">{user.phone}</td>
                <td className="px-4 py-3 text-slate-600">{user.email || '-'}</td>
                <td className="px-4 py-3"><select value={user.status} onChange={(event) => updateStatus(user, event.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-sm">{statuses.filter(Boolean).map((status) => <option key={status} value={status}>{status}</option>)}</select></td>
                <td className="px-4 py-3 text-slate-600">{date(user.created_at)}</td>
                <td className="px-4 py-3 text-right"><Link to={`/admin/users/${user.id}`} className="font-semibold text-emerald-700">দেখুন</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
