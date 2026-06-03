import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import { adminApi } from '../../api/adminApi'

export default function RoleForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const [name, setName] = useState('')
  const [permissions, setPermissions] = useState([])
  const [selected, setSelected] = useState([])

  useEffect(() => {
    adminApi.permissions().then(({ data }) => setPermissions(data.data || []))
    if (editing) {
      adminApi.show('roles', id).then(({ data }) => {
        setName(data.data.name)
        setSelected((data.data.permissions || []).map((permission) => permission.name))
      })
    }
  }, [editing, id])

  const toggle = (permission) => {
    setSelected((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission])
  }

  const submit = async (event) => {
    event.preventDefault()
    const result = await Swal.fire({ title: 'পারমিশন সেভ করবেন?', showCancelButton: true, confirmButtonText: 'সেভ', cancelButtonText: 'বাতিল' })
    if (!result.isConfirmed) return
    try {
      if (editing) await adminApi.update('roles', id, { name, permissions: selected })
      else await adminApi.create('roles', { name, permissions: selected })
      toast.success(editing ? 'রোল আপডেট হয়েছে' : 'রোল তৈরি হয়েছে')
      navigate('/admin/roles')
    } catch (error) {
      toast.error(error.response?.data?.message || 'রোল সেভ করা যায়নি')
    }
  }

  return (
    <>
      <PageHeader title={editing ? 'রোল এডিট' : 'নতুন রোল'} subtitle="রোলের নাম দিন এবং প্রয়োজনীয় পারমিশন নির্বাচন করুন।" />
      <form className="space-y-5 rounded border bg-white p-5" onSubmit={submit}>
        <input className="w-full rounded border px-3 py-2" placeholder="রোলের নাম" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {permissions.map((permission) => (
            <label key={permission.id} className="flex items-center gap-2 rounded border border-slate-200 p-2 text-sm">
              <input type="checkbox" checked={selected.includes(permission.name)} onChange={() => toggle(permission.name)} />
              {permission.name}
            </label>
          ))}
        </div>
        <button className="rounded bg-slate-950 px-4 py-2 text-white">সেভ করুন</button>
      </form>
    </>
  )
}

