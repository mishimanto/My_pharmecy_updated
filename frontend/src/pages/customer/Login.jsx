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
      toast.success('Login successful.')
      navigate('/account')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login could not be completed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Customer login"
      subtitle="Use your phone number or email and continue into orders, addresses, prescriptions, and support."
    >
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="text-sm font-medium text-slate-700">Phone or email</label>
          <input
            className="mt-2 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="01XXXXXXXXX or email@example.com"
            value={form.login}
            onChange={(event) => setForm({ ...form, login: event.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Password</label>
          <input
            className="mt-2 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </div>

        <button disabled={loading} className="w-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
          {loading ? 'Signing in...' : 'Login to account'}
        </button>

        <div className="border-t border-slate-200 pt-4 text-sm text-slate-500">
          New customer?{' '}
          <Link className="font-semibold text-emerald-700" to="/register">
            Create your account
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
