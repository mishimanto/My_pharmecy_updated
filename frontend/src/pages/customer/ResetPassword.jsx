import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../../layouts/AuthLayout'
import { customerAuthApi } from '../../api/customerAuthApi'
import AuthPasswordField from '../../components/common/AuthPasswordField'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const initialEmail = searchParams.get('email') || ''
  const [form, setForm] = useState({
    email: initialEmail,
    password: '',
    password_confirmation: '',
  })
  const [loading, setLoading] = useState(false)

  const isReady = useMemo(() => Boolean(token && form.email), [token, form.email])

  const submit = async (event) => {
    event.preventDefault()

    if (!token) {
      toast.error('Reset token is missing from the link.')
      return
    }

    setLoading(true)

    try {
      const response = await customerAuthApi.resetPassword({
        token,
        ...form,
      })
      toast.success(response.data.message || 'Password has been reset successfully.')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset could not be completed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Choose a new password for your customer account and continue back to login."
    >
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="text-sm font-medium text-slate-700">Email address</label>
          <input
            className="mt-2 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </div>

        <AuthPasswordField
          label="New password"
          placeholder="Enter a new password"
          className="mt-2"
          autoComplete="new-password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />

        <AuthPasswordField
          label="Confirm password"
          placeholder="Re-enter your new password"
          className="mt-2"
          autoComplete="new-password"
          value={form.password_confirmation}
          onChange={(event) => setForm({ ...form, password_confirmation: event.target.value })}
        />

        {!isReady ? (
          <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            The reset link is incomplete. Please use the full password reset link from your email.
          </div>
        ) : null}

        <button disabled={loading || !isReady} className="w-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
          {loading ? 'Resetting password...' : 'Reset password'}
        </button>

        <div className="border-t border-slate-200 pt-4 text-sm text-slate-500 text-center">
          <Link className="font-semibold text-emerald-700" to="/login">
            Back to login
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
