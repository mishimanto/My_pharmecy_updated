import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import { adminApi } from '../../api/adminApi'

export default function StaffForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const [roles, setRoles] = useState([])
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', role_id: '', license_no: '', status: 'active' })

  useEffect(() => {
    adminApi.list('roles', { per_page: 100 }).then(({ data }) => setRoles(data.data.data || []))
    if (editing) {
      adminApi.show('staff', id).then(({ data }) => {
        const staff = data.data
        setForm({
          full_name: staff.full_name || '',
          email: staff.email || '',
          phone: staff.phone || '',
          password: '',
          role_id: staff.role_id || staff.roles?.[0]?.id || '',
          license_no: staff.license_no || '',
          status: staff.status || 'active',
        })
      })
    }
  }, [editing, id])

  const submit = async (event) => {
    event.preventDefault()
    const payload = { ...form }
    if (editing && !payload.password) delete payload.password
    try {
      if (editing) await adminApi.update('staff', id, payload)
      else await adminApi.create('staff', payload)
      toast.success(editing ? 'স্টাফ আপডেট হয়েছে' : 'স্টাফ তৈরি হয়েছে')
      navigate('/admin/staff')
    } catch (error) {
      toast.error(error.response?.data?.message || 'সেভ করা যায়নি')
    }
  }

  return (
    <>
      <PageHeader title={editing ? 'স্টাফ এডিট' : 'নতুন স্টাফ'} subtitle="স্টাফ তথ্য, প্রাইমারি রোল এবং স্ট্যাটাস দিন।" />
      <form className="grid gap-4 rounded border bg-white p-5 md:grid-cols-2" onSubmit={submit}>
        <input className="rounded border px-3 py-2" placeholder="পূর্ণ নাম" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder="ইমেইল" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder="ফোন" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder={editing ? 'নতুন পাসওয়ার্ড (ঐচ্ছিক)' : 'পাসওয়ার্ড'} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select className="rounded border px-3 py-2" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
          <option value="">রোল নির্বাচন করুন</option>
          {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
        </select>
        <select className="rounded border px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="active">সক্রিয়</option>
          <option value="inactive">নিষ্ক্রিয়</option>
          <option value="suspended">সাসপেন্ড</option>
        </select>
        <input className="rounded border px-3 py-2 md:col-span-2" placeholder="লাইসেন্স নম্বর" value={form.license_no || ''} onChange={(e) => setForm({ ...form, license_no: e.target.value })} />
        <button className="rounded bg-slate-950 px-4 py-2 text-white md:col-span-2">সেভ করুন</button>
      </form>
    </>
  )
}

