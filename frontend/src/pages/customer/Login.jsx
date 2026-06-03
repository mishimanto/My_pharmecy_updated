import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../../layouts/AuthLayout'
import { useCustomerAuth } from '../../context/CustomerAuthContext'

export default function Login() {
  const [form, setForm] = useState({ login: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useCustomerAuth()
  const navigate = useNavigate()

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await login(form)
      toast.success('লগইন সফল হয়েছে')
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.message || 'লগইন করা যায়নি')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="কাস্টমার লগইন">
      <form className="space-y-3" onSubmit={submit}>
        <input className="w-full rounded border px-3 py-2" placeholder="ইমেইল অথবা ফোন" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} />
        <input className="w-full rounded border px-3 py-2" type="password" placeholder="পাসওয়ার্ড" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button disabled={loading} className="w-full rounded bg-emerald-600 px-3 py-2 text-white disabled:opacity-60">{loading ? 'লগইন হচ্ছে...' : 'লগইন'}</button>
        <Link className="block text-sm text-emerald-700" to="/register">নতুন অ্যাকাউন্ট তৈরি করুন</Link>
      </form>
    </AuthLayout>
  )
}

