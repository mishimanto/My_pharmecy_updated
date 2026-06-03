import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { adminApi } from '../../api/adminApi'

const statusLabels = { active: 'সক্রিয়', inactive: 'নিষ্ক্রিয়', suspended: 'সাসপেন্ড' }
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
    }).catch(() => toast.error('স্টাফ লোড করা যায়নি')).finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true
    adminApi.list('staff', { search, page }).then(({ data }) => {
      if (!active) return
      setStaff(data.data.data || [])
      setMeta(data.data)
    }).catch(() => active && toast.error('স্টাফ লোড করা যায়নি')).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [search, page])

  const changeStatus = async (member, status) => {
    const result = await Swal.fire({ title: 'স্ট্যাটাস আপডেট করবেন?', showCancelButton: true, confirmButtonText: 'আপডেট', cancelButtonText: 'বাতিল' })
    if (!result.isConfirmed) return
    await adminApi.patch('staff', member.id, 'status', { status })
    toast.success('স্ট্যাটাস আপডেট হয়েছে')
    load()
  }

  const remove = async (member) => {
    const result = await Swal.fire({ title: 'স্টাফ ডিলিট করবেন?', text: member.full_name, showCancelButton: true, confirmButtonText: 'ডিলিট', cancelButtonText: 'বাতিল', confirmButtonColor: '#dc2626' })
    if (!result.isConfirmed) return
    await adminApi.remove('staff', member.id)
    toast.success('স্টাফ ডিলিট হয়েছে')
    load()
  }

  return (
    <>
      <PageHeader title="স্টাফ" subtitle="স্টাফ, প্রাইমারি রোল এবং স্ট্যাটাস ম্যানেজ করুন।" action={<Link className="rounded bg-slate-950 px-4 py-2 text-sm text-white" to="/admin/staff/create">নতুন স্টাফ</Link>} />
      <div className="mb-4 flex gap-2">
        <input className="w-full rounded border px-3 py-2" placeholder="নাম, ইমেইল, ফোন বা স্ট্যাটাস দিয়ে খুঁজুন" value={search} onChange={(e) => { setLoading(true); setSearch(e.target.value); setPage(1) }} />
      </div>
      {loading && <p className="text-sm text-slate-500">লোড হচ্ছে...</p>}
      {!loading && staff.length === 0 && <EmptyState />}
      {staff.length > 0 && (
        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100"><tr><th className="px-3 py-2">নাম</th><th className="px-3 py-2">ইমেইল</th><th className="px-3 py-2">রোল</th><th className="px-3 py-2">স্ট্যাটাস</th><th className="px-3 py-2" /></tr></thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{member.full_name}</td>
                  <td className="px-3 py-2">{member.email}</td>
                  <td className="px-3 py-2">{member.roles?.map((role) => role.name).join(', ') || '-'}</td>
                  <td className="px-3 py-2"><span className={`rounded px-2 py-1 text-xs ${statusClass[member.status] || statusClass.inactive}`}>{statusLabels[member.status] || member.status}</span></td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link className="rounded bg-slate-100 px-2 py-1" to={`/admin/staff/${member.id}/edit`}>এডিট</Link>
                      <button className="rounded bg-amber-50 px-2 py-1 text-amber-700" onClick={() => changeStatus(member, member.status === 'active' ? 'inactive' : 'active')}>{member.status === 'active' ? 'নিষ্ক্রিয়' : 'সক্রিয়'}</button>
                      <button className="rounded bg-rose-50 px-2 py-1 text-rose-700" onClick={() => remove(member)}>ডিলিট</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta && <div className="mt-4 flex justify-between text-sm"><span>পৃষ্ঠা {meta.current_page} / {meta.last_page}</span><div className="flex gap-2"><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => { setLoading(true); setPage(page - 1) }}>আগে</button><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={meta.current_page >= meta.last_page} onClick={() => { setLoading(true); setPage(page + 1) }}>পরে</button></div></div>}
    </>
  )
}
