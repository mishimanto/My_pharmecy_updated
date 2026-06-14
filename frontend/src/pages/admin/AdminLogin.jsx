import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../../layouts/AuthLayout'
import { useStaffAuth } from '../../context/StaffAuthContext'

export default function AdminLogin() {
  const [form, setForm] = useState({ email: 'admin@pharmacy.com', password: 'password' })
  const [loading, setLoading] = useState(false)
  const { login } = useStaffAuth()
  const navigate = useNavigate()

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await login(form)
      toast.success('Staff login successful.')
      navigate('/admin/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to log in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Staff / Admin Login">
      <form className="space-y-3" onSubmit={submit}>
        <input className="w-full rounded border px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="w-full rounded border px-3 py-2" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button disabled={loading} className="w-full rounded bg-slate-950 px-3 py-2 text-white disabled:opacity-60">{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </AuthLayout>
  )
}
