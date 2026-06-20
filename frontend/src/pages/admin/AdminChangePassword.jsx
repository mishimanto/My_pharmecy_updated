import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle, FiEye, FiEyeOff, FiKey, FiLock, FiSave, FiShield } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminAuthApi } from '../../api/adminAuthApi'

const initialForm = {
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
}

export default function AdminChangePassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState({
    current_password: false,
    new_password: false,
    new_password_confirmation: false,
  })

  const passwordChecks = useMemo(() => {
    const password = form.new_password

    return [
      { label: 'At least 8 characters', passed: password.length >= 8 },
      { label: 'Has a number or symbol', passed: /[\d\W_]/.test(password) },
      { label: 'Confirmation matches', passed: Boolean(password) && password === form.new_password_confirmation },
    ]
  }, [form.new_password, form.new_password_confirmation])

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

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const toggleVisible = (field) => {
    setVisible((current) => ({ ...current, [field]: !current[field] }))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-6 w-6 items-center justify-center text-emerald-700">
            <FiShield className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-950">Change Password</h1>
          </div>
        </div>
        <Link
          to="/admin/profile"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">

          <form onSubmit={submit} className="grid gap-4 p-5">
            <PasswordField
              id="admin-current-password"
              icon={FiLock}
              label="Current password"
              visible={visible.current_password}
              value={form.current_password}
              onToggle={() => toggleVisible('current_password')}
              onChange={(value) => setField('current_password', value)}
            />
            <PasswordField
              id="admin-new-password"
              icon={FiKey}
              label="New password"
              visible={visible.new_password}
              value={form.new_password}
              onToggle={() => toggleVisible('new_password')}
              onChange={(value) => setField('new_password', value)}
            />
            <PasswordField
              id="admin-confirm-password"
              icon={FiKey}
              label="Confirm new password"
              visible={visible.new_password_confirmation}
              value={form.new_password_confirmation}
              onToggle={() => toggleVisible('new_password_confirmation')}
              onChange={(value) => setField('new_password_confirmation', value)}
            />

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <FiSave className="h-4 w-4" />
                {saving ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <FiShield className="h-4 w-4 text-emerald-700" />
              <h2 className="text-base font-semibold text-slate-950">Password checks</h2>
            </div>
            <div className="mt-4 space-y-3">
              {passwordChecks.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <FiCheckCircle className={`h-4 w-4 ${item.passed ? 'text-emerald-700' : 'text-slate-300'}`} />
                  <span className={item.passed ? 'font-medium text-emerald-800' : 'text-slate-600'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function PasswordField({ id, icon: Icon, label, value, visible, onChange, onToggle }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
        <Icon className="h-4 w-4 text-slate-400" />
        {label}
      </label>
      <div className="flex overflow-hidden rounded-md border border-slate-300 bg-white shadow-xs transition focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex w-11 items-center justify-center border-l border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <span className="sr-only">{visible ? 'Hide password' : 'Show password'}</span>
          {visible ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
