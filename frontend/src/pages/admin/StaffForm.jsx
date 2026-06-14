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
      toast.success(editing ? 'Staff member updated.' : 'Staff member created.')
      navigate('/admin/staff')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save staff member.')
    }
  }

  return (
    <>
      <PageHeader title={editing ? 'Edit Staff Member' : 'New Staff Member'} subtitle="Enter staff details, a primary role, and account status." />
      <form className="grid gap-4 rounded border bg-white p-5 md:grid-cols-2" onSubmit={submit}>
        <input className="rounded border px-3 py-2" placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder="Phone" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder={editing ? 'New password (optional)' : 'Password'} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select className="rounded border px-3 py-2" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
          <option value="">Select a role</option>
          {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
        </select>
        <select className="rounded border px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <input className="rounded border px-3 py-2 md:col-span-2" placeholder="License number" value={form.license_no || ''} onChange={(e) => setForm({ ...form, license_no: e.target.value })} />
        <button className="rounded bg-slate-950 px-4 py-2 text-white md:col-span-2">Save</button>
      </form>
    </>
  )
}
