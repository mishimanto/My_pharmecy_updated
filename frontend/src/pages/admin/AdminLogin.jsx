import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiAlertCircle } from 'react-icons/fi'
import AuthLayout from '../../layouts/AuthLayout'
import { useStaffAuth } from '../../context/StaffAuthContext'

export default function AdminLogin() {
  const [form, setForm] = useState({ email: 'admin@pharmacy.com', password: 'password' })
  const [twoFactor, setTwoFactor] = useState(null)
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, verifyTwoFactor } = useStaffAuth()
  const navigate = useNavigate()

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = {}

    if (!String(form.email || '').trim()) {
      nextErrors.email = 'Email is required.'
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
      const result = await login(form)

      if (result?.requires_2fa) {
        setTwoFactor(result)
        toast.success('Two-factor code generated.')
        return
      }

      toast.success('Staff login successful.')
      navigate('/admin/dashboard')
    } catch (error) {
      setFormError(error.response?.data?.message || 'Unable to log in.')
    } finally {
      setLoading(false)
    }
  }

  const submitTwoFactor = async (event) => {
    event.preventDefault()

    if (!String(code || '').trim()) {
      setErrors({ code: 'Verification code is required.' })
      return
    }

    setLoading(true)
    setFormError('')
    try {
      await verifyTwoFactor({
        challenge_token: twoFactor.challenge_token,
        code,
      })
      toast.success('Staff login successful.')
      navigate('/admin/dashboard')
    } catch (error) {
      setFormError(error.response?.data?.message || 'Unable to verify the code.')
    } finally {
      setLoading(false)
    }
  }

  if (twoFactor) {
    return (
      <AuthLayout title="Two-Factor Verification" variant="admin">
        <form className="space-y-4" onSubmit={submitTwoFactor}>
          {formError ? (
            <div className="flex items-start gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          ) : null}

          <div>
            <label className="text-sm font-medium text-slate-700">Verification code</label>
            <input
              className="mt-1 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                setErrors((current) => ({ ...current, code: '' }))
                setFormError('')
              }}
            />
            {errors.code ? <p className="mt-2 text-sm text-rose-600">{errors.code}</p> : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setTwoFactor(null)
                setCode('')
                setFormError('')
              }}
              className="border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500 disabled:opacity-60"
            >
              Back
            </button>
            <button
              disabled={loading}
              className="bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify and login'}
            </button>
          </div>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Staff / Admin Login" variant="admin">
      <form className="space-y-4" onSubmit={submit}>
        {formError ? (
          <div className="flex items-start gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        ) : null}

        <div>
          <label className="text-sm font-medium text-slate-700">Email address</label>
          <input
            className="mt-1 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            type="email"
            placeholder="admin@example.com"
            value={form.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value })
              setErrors((current) => ({ ...current, email: '' }))
              setFormError('')
            }}
          />
          {errors.email ? <p className="mt-2 text-sm text-rose-600">{errors.email}</p> : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Password</label>
          <input
            className="mt-1 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => {
              setForm({ ...form, password: e.target.value })
              setErrors((current) => ({ ...current, password: '' }))
              setFormError('')
            }}
          />
          {errors.password ? <p className="mt-2 text-sm text-rose-600">{errors.password}</p> : null}
        </div>

        <button
          disabled={loading}
          className="w-full my-3 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Login to admin panel'}
        </button>
      </form>
    </AuthLayout>
  )
}
