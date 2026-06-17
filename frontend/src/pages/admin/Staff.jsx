import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import { adminApi } from '../../api/adminApi'

const statusLabels = { active: 'Active', inactive: 'Inactive', suspended: 'Suspended' }
const statusClass = { active: 'bg-emerald-50 text-emerald-700', inactive: 'bg-slate-100 text-slate-700', suspended: 'bg-amber-50 text-amber-700' }

export default function Staff() {
  const [staff, setStaff] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    adminApi.list('staff', { search, page }).then(({ data }) => {
      setStaff(data.data.data || [])
      setMeta(data.data)
    }).catch(() => toast.error('Unable to load staff.')).finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true
    adminApi.list('staff', { search, page }).then(({ data }) => {
      if (!active) return
      setStaff(data.data.data || [])
      setMeta(data.data)
    }).catch(() => active && toast.error('Unable to load staff.')).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [search, page])

  const changeStatus = async (member, status) => {
    const result = await Swal.fire({ title: 'Update staff status?', showCancelButton: true, confirmButtonText: 'Update', cancelButtonText: 'Cancel' })
    if (!result.isConfirmed) return
    await adminApi.patch('staff', member.id, 'status', { status })
    toast.success('Status updated.')
    load()
  }

  const remove = async (member) => {
    const result = await Swal.fire({ title: 'Delete this staff member?', text: member.full_name, showCancelButton: true, confirmButtonText: 'Delete', cancelButtonText: 'Cancel', confirmButtonColor: '#dc2626' })
    if (!result.isConfirmed) return
    await adminApi.remove('staff', member.id)
    toast.success('Staff member deleted.')
    load()
  }

  return (
    <>
      <PageHeader title="Staff" subtitle="Manage staff members, primary roles, and account status." action={<Link className="rounded bg-slate-950 px-4 py-2 text-sm text-white" to="/admin/staff/create">New Staff Member</Link>} />
      <div className="mb-4 flex gap-2">
        <input className="w-full rounded border px-3 py-2" placeholder="Search by name, email, phone, or status" value={search} onChange={(e) => { setLoading(true); setSearch(e.target.value); setPage(1) }} />
      </div>
      {loading && <AdminLoadingState className="py-6" />}
      {!loading && staff.length === 0 && <EmptyState />}
      {staff.length > 0 && (
        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Status</th><th className="px-3 py-2" /></tr></thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{member.full_name}</td>
                  <td className="px-3 py-2">{member.email}</td>
                  <td className="px-3 py-2">{member.roles?.map((role) => role.name).join(', ') || '-'}</td>
                  <td className="px-3 py-2"><span className={`rounded px-2 py-1 text-xs ${statusClass[member.status] || statusClass.inactive}`}>{statusLabels[member.status] || member.status}</span></td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link className="rounded bg-slate-100 px-2 py-1" to={`/admin/staff/${member.id}/edit`}>Edit</Link>
                      <button className="rounded bg-amber-50 px-2 py-1 text-amber-700" onClick={() => changeStatus(member, member.status === 'active' ? 'inactive' : 'active')}>{member.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                      <button className="rounded bg-rose-50 px-2 py-1 text-rose-700" onClick={() => remove(member)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta && <div className="mt-4 flex justify-between text-sm"><span>Page {meta.current_page} / {meta.last_page}</span><div className="flex gap-2"><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => { setLoading(true); setPage(page - 1) }}>Previous</button><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={meta.current_page >= meta.last_page} onClick={() => { setLoading(true); setPage(page + 1) }}>Next</button></div></div>}
    </>
  )
}
