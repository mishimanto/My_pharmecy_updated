import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../../layouts/AuthLayout'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import AuthPasswordField from '../../components/common/AuthPasswordField'

export default function Register() {
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { register } = useCustomerAuth()
  const navigate = useNavigate()

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created successfully.')
      navigate('/account')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration could not be completed.')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    ['full_name', 'Full name', 'text'],
    ['phone', 'Phone number', 'text'],
    ['email', 'Email address', 'email'],
    ['password', 'Password', 'password'],
  ]

  return (
    <AuthLayout
      title="Create new account"
      subtitle="Register once and keep your pharmacy orders, delivery addresses, prescriptions, and support threads together."
    >
      <form className="space-y-4" onSubmit={submit}>
        {fields.map(([field, label, type]) => (
          type === 'password' ? (
            <AuthPasswordField
              key={field}
              label={label}
              placeholder={label}
              value={form[field]}
              autoComplete="new-password"
              onChange={(event) => setForm({ ...form, [field]: event.target.value })}
            />
          ) : (
            <div key={field}>
              <label className="text-sm font-medium text-slate-700">{label}</label>
              <input
                className="mt-1 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                type={type}
                placeholder={label}
                value={form[field]}
                onChange={(event) => setForm({ ...form, [field]: event.target.value })}
              />
            </div>
          )
        ))}

        <button disabled={loading} className="w-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
          {loading ? 'Creating account...' : 'Register account'}
        </button>

        <div className="border-t border-slate-200 pt-4 text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link className="font-semibold text-emerald-700" to="/login">
            Login here
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
