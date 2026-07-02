import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../../layouts/AuthLayout'
import { adminAuthApi } from '../../api/adminAuthApi'

export default function AdminForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetUrl, setResetUrl] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setResetUrl('')

    try {
      const response = await adminAuthApi.forgotPassword({ email })
      setResetUrl(response.data.data?.reset_url || '')
      toast.success(response.data.message || 'Password reset instructions were sent.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset request could not be completed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Admin forgot password" variant="admin">
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="text-sm font-medium text-slate-700">Email address</label>
          <input
            className="mt-2 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <button disabled={loading} className="w-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
          {loading ? 'Sending link...' : 'Send reset link'}
        </button>

        {resetUrl ? (
          <div className="border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-medium">Reset link generated for local development.</p>
            <a href={resetUrl} className="mt-2 inline-flex text-emerald-700 underline" target="_self" rel="noreferrer">
              Open reset password page
            </a>
          </div>
        ) : null}

        <div className="border-t border-slate-200 pt-4 text-center text-sm text-slate-500">
          Remembered your password?{' '}
          <Link className="font-semibold text-emerald-700" to="/admin/login">
            Back to admin login
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
