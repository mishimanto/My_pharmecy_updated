import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiAlertCircle } from 'react-icons/fi'
import AuthLayout from '../../layouts/AuthLayout'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { safeCustomerPath } from '../../utils/safeCustomerPath'
import AuthPasswordField from '../../components/common/AuthPasswordField'

export default function Login() {
  const [form, setForm] = useState({ login: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useCustomerAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = useMemo(() => safeCustomerPath(searchParams.get('returnTo'), '/account'), [searchParams])

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = {}

    if (!String(form.login || '').trim()) {
      nextErrors.login = 'Phone or email is required.'
    }

    if (!String(form.password || '')) {
      nextErrors.password = 'Password is required.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setFormError('')
      return
    }

    setLoading(true)
    setFormError('')
    try {
      await login(form)
      toast.success('Login successful.')
      navigate(returnTo)
    } catch (error) {
      setFormError(error.response?.data?.message || 'Login could not be completed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Login"
      subtitle="Use your phone number or email and continue into orders, addresses, prescriptions, and support."
    >
      <form className="space-y-4" onSubmit={submit}>
        {formError ? (
          <div className="flex items-start gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        ) : null}

        <div>
          <label className="text-sm font-medium text-slate-700">Phone or email</label>
          <input
            className="mt-1 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="01XXXXXXXXX or email@example.com"
            value={form.login}
            onChange={(event) => {
              setForm({ ...form, login: event.target.value })
              setErrors((current) => ({ ...current, login: '' }))
              setFormError('')
            }}
          />
          {errors.login ? <p className="mt-2 text-sm text-rose-600">{errors.login}</p> : null}
        </div>

        <div>
          <AuthPasswordField
            label="Password"
            placeholder="Enter your password"
            value={form.password}
            error={errors.password}
            onChange={(event) => {
              setForm({ ...form, password: event.target.value })
              setErrors((current) => ({ ...current, password: '' }))
              setFormError('')
            }}
          />
          <div className="mt-2 text-right">
            <Link className="text-sm font-medium text-emerald-700 transition hover:text-emerald-800" to="/forgot-password">
              Forgot password?
            </Link>
          </div>
        </div>

        <button disabled={loading} className="w-full my-3 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
          {loading ? 'Signing in...' : 'Login to account'}
        </button>

        <div className="border-t border-slate-200 pt-4 text-sm text-slate-500 text-center">
          New customer?{' '}
          <Link className="font-semibold text-emerald-700" to="/register">
            Create your account
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
