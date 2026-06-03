import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { adminApi } from '../../api/adminApi'

export default function Roles() {
  const [roles, setRoles] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  const load = () => adminApi.list('roles', { search, page }).then(({ data }) => {
    setRoles(data.data.data || [])
    setMeta(data.data)
  }).catch(() => toast.error('রোল লোড করা যায়নি'))

  useEffect(load, [search, page])

  const remove = async (role) => {
    const result = await Swal.fire({ title: 'রোল ডিলিট করবেন?', text: role.name, showCancelButton: true, confirmButtonText: 'ডিলিট', cancelButtonText: 'বাতিল', confirmButtonColor: '#dc2626' })
    if (!result.isConfirmed) return
    await adminApi.remove('roles', role.id)
    toast.success('রোল ডিলিট হয়েছে')
    load()
  }

  return (
    <>
      <PageHeader title="রোল" subtitle="Spatie role এবং assigned permissions ম্যানেজ করুন।" action={<Link className="rounded bg-slate-950 px-4 py-2 text-sm text-white" to="/admin/roles/create">নতুন রোল</Link>} />
      <input className="mb-4 w-full rounded border px-3 py-2" placeholder="রোল খুঁজুন" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      {roles.length === 0 && <EmptyState />}
      {roles.length > 0 && (
        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100"><tr><th className="px-3 py-2">রোল</th><th className="px-3 py-2">পারমিশন</th><th className="px-3 py-2" /></tr></thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{role.name}</td>
                  <td className="px-3 py-2">{role.permissions?.map((permission) => permission.name).join(', ') || '-'}</td>
                  <td className="px-3 py-2 text-right"><Link className="rounded bg-slate-100 px-2 py-1" to={`/admin/roles/${role.id}/edit`}>এডিট</Link> <button className="rounded bg-rose-50 px-2 py-1 text-rose-700" onClick={() => remove(role)}>ডিলিট</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta && <div className="mt-4 flex justify-between text-sm"><span>পৃষ্ঠা {meta.current_page} / {meta.last_page}</span><div className="flex gap-2"><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>আগে</button><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(page + 1)}>পরে</button></div></div>}
    </>
  )
}

