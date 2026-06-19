import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiKey, FiLock, FiSave } from 'react-icons/fi'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import { adminAuthApi } from '../../api/adminAuthApi'

export default function AdminChangePassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  })
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()

    if (form.new_password !== form.new_password_confirmation) {
      toast.error('New password confirmation does not match.')
      return
    }

    setSaving(true)
    try {
      await adminAuthApi.changePassword(form)
      toast.success('Password changed successfully.')
      navigate('/admin/profile')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to change password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Change Password"
        subtitle="Use a dedicated page to change your admin password safely."
        action={(
          <Link
            to="/admin/profile"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to Profile
          </Link>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 px-5 py-6 text-white">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <FiKey className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-emerald-200/75">Security</p>
                <h2 className="mt-2 text-2xl font-semibold">Update account password</h2>
                <p className="mt-2 text-sm text-slate-300">Choose a strong new password with at least 8 characters.</p>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="mt-6 grid gap-4">
            <PasswordField
              icon={FiLock}
              label="Current password"
              value={form.current_password}
              onChange={(value) => setForm((current) => ({ ...current, current_password: value }))}
            />
            <PasswordField
              icon={FiKey}
              label="New password"
              value={form.new_password}
              onChange={(value) => setForm((current) => ({ ...current, new_password: value }))}
            />
            <PasswordField
              icon={FiKey}
              label="Confirm new password"
              value={form.new_password_confirmation}
              onChange={(value) => setForm((current) => ({ ...current, new_password_confirmation: value }))}
            />

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <FiSave className="h-4 w-4" />
                {saving ? 'Saving...' : 'Update Password'}
              </button>
              <p className="text-sm text-slate-500">This changes only your current admin account password.</p>
            </div>
          </form>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">Password guidance</h3>
          <div className="mt-4 space-y-3">
            <TipCard title="Keep it unique" text="Avoid reusing a password from another admin, personal, or customer account." />
            <TipCard title="Use length first" text="A longer password is usually stronger than a short password with symbols only." />
            <TipCard title="Confirm carefully" text="Make sure the confirmation matches exactly before you submit the change." />
          </div>
        </aside>
      </div>
    </>
  )
}

function PasswordField({ icon: Icon, label, value, onChange }) {
  return (
    <label className="rounded-3xl border border-slate-200 bg-white p-4">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
      />
    </label>
  )
}

function TipCard({ title, text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  )
}
