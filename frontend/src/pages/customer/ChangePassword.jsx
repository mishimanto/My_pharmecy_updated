import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiCheckCircle, FiEye, FiEyeOff, FiKey, FiLock, FiSave, FiShield } from 'react-icons/fi'
import { customerAuthApi } from '../../api/customerAuthApi'
import { useLanguage } from '../../context/LanguageContext'

const initialForm = {
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
}

export default function ChangePassword() {
  const navigate = useNavigate()
  const { isBangla } = useLanguage()
  const t = (bn, en) => (isBangla ? bn : en)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState({
    current_password: false,
    new_password: false,
    new_password_confirmation: false,
  })

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const toggleVisible = (field) => {
    setVisible((current) => ({ ...current, [field]: !current[field] }))
  }

  const submit = async (event) => {
    event.preventDefault()

    if (form.new_password !== form.new_password_confirmation) {
      toast.error(t('নতুন পাসওয়ার্ডের কনফার্মেশন মিলছে না।', 'New password confirmation does not match.'))
      return
    }

    setSaving(true)

    try {
      await customerAuthApi.changePassword(form)
      toast.success(t('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।', 'Password changed successfully.'))
      navigate('/account')
    } catch (error) {
      toast.error(error.response?.data?.message || t('পাসওয়ার্ড পরিবর্তন করা যায়নি।', 'Unable to change password.'))
    } finally {
      setSaving(false)
    }
  }

  const tips = [
    t('কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড ব্যবহার করুন।', 'Use at least 8 characters.'),
    t('পুরোনো পাসওয়ার্ড থেকে আলাদা রাখুন।', 'Keep it different from your current password.'),
    t('সংখ্যা, বড় হাতের অক্ষর বা সিম্বল ব্যবহার করলে পাসওয়ার্ড আরও শক্তিশালী হয়।', 'Using numbers, uppercase letters, or symbols makes it stronger.'),
  ]

  return (
    <div className="space-y-4 sm:space-y-7">
      <section className="relative isolate overflow-hidden border border-sky-200 bg-[linear-gradient(180deg,#fdfefe_0%,#eef8ff_100%)] shadow-[0_24px_60px_-42px_rgba(14,116,144,0.28)]">
        <BubbleBackdrop />
        <div className="relative flex items-center justify-between gap-3 p-4 sm:p-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {t('পাসওয়ার্ড পরিবর্তন', 'Change password')}
            </h1>
          </div>

          <Link
            to="/account"
            className="inline-flex shrink-0 items-center justify-center gap-2 border border-slate-300 bg-white/90 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 sm:px-4 sm:py-3 sm:text-sm"
          >
            <FiArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t('অ্যাকাউন্টে ফিরে যান', 'Back to account')}</span>
            <span className="sm:hidden">{t('ফিরুন', 'Back')}</span>
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden border border-slate-200 bg-white shadow-[0_24px_60px_-42px_rgba(15,23,42,0.24)]">
          <form onSubmit={submit} className="grid gap-4 p-4 sm:gap-5 sm:p-6">
            <PasswordField
              id="customer-current-password"
              icon={FiLock}
              label={t('বর্তমান পাসওয়ার্ড', 'Current password')}
              placeholder={t('বর্তমান পাসওয়ার্ড লিখুন', 'Enter current password')}
              visible={visible.current_password}
              value={form.current_password}
              onToggle={() => toggleVisible('current_password')}
              onChange={(value) => setField('current_password', value)}
            />
            <PasswordField
              id="customer-new-password"
              icon={FiKey}
              label={t('নতুন পাসওয়ার্ড', 'New password')}
              placeholder={t('নতুন পাসওয়ার্ড লিখুন', 'Enter new password')}
              visible={visible.new_password}
              value={form.new_password}
              onToggle={() => toggleVisible('new_password')}
              onChange={(value) => setField('new_password', value)}
            />
            <PasswordField
              id="customer-confirm-password"
              icon={FiKey}
              label={t('নতুন পাসওয়ার্ড নিশ্চিত করুন', 'Confirm new password')}
              placeholder={t('আবার নতুন পাসওয়ার্ড লিখুন', 'Re-enter new password')}
              visible={visible.new_password_confirmation}
              value={form.new_password_confirmation}
              onToggle={() => toggleVisible('new_password_confirmation')}
              onChange={(value) => setField('new_password_confirmation', value)}
            />

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              >
                <FiSave className="h-4 w-4" />
                {saving ? t('সেভ হচ্ছে...', 'Saving...') : t('পাসওয়ার্ড আপডেট করুন', 'Update password')}
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-3 sm:space-y-4">
          <div className="overflow-hidden border border-emerald-200 bg-[linear-gradient(180deg,#fcfffd_0%,#effcf6_100%)] shadow-[0_20px_50px_-42px_rgba(5,150,105,0.32)]">
            <div className="border-b border-emerald-100 px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-6 w-6 items-center justify-center text-emerald-700">
                  <FiShield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-950">{t('ভালো পাসওয়ার্ডের নিয়ম', 'Password tips')}</h2>
                </div>
              </div>
            </div>

            <ul className="space-y-2.5 p-4 text-sm leading-6 text-slate-700 sm:space-y-3 sm:p-5">
              {tips.map((tip) => (
                <li key={tip} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center text-emerald-700">
                    <FiCheckCircle className="h-4 w-4" />
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

function PasswordField({ id, icon: Icon, label, placeholder, value, visible, onChange, onToggle }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
        <Icon className="h-4 w-4 text-slate-400" />
        {label}
      </label>
      <div className="flex overflow-hidden border border-slate-300 bg-white transition focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400 sm:px-4 sm:py-3"
        />
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex w-12 items-center justify-center border-l border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <span className="sr-only">{visible ? 'Hide password' : 'Show password'}</span>
          {visible ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

function BubbleBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -right-12 top-0 h-36 w-36 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-emerald-200/20 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
    </div>
  )
}
