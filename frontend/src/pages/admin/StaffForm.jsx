import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PiNewspaperClipping } from "react-icons/pi";
import { FiArrowLeft, FiLock, FiMail, FiPhone, FiSave, FiShield, FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'

const initialForm = {
  full_name: '',
  email: '',
  phone: '',
  password: '',
  role_id: '',
  license_no: '',
  status: 'active',
}

const statusTone = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  inactive: 'border-slate-200 bg-slate-100 text-slate-600',
  suspended: 'border-amber-200 bg-amber-50 text-amber-700',
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'ST'
}

function labelForStatus(status) {
  const labels = {
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
  }

  return labels[status] || status || 'Unknown'
}

export default function StaffForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const [roles, setRoles] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    adminApi.list('roles', { per_page: 100 })
      .then(({ data }) => {
        if (!active) return
        setRoles(data.data.data || [])
      })
      .catch(() => active && toast.error('Unable to load role options.'))

    if (!editing) {
      return () => { active = false }
    }

    adminApi.show('staff', id)
      .then(({ data }) => {
        if (!active) return
        const staff = data.data
        setForm({
          full_name: staff.full_name || '',
          email: staff.email || '',
          phone: staff.phone || '',
          password: '',
          role_id: staff.role_id || staff.roles?.[0]?.id || '',
          license_no: staff.license_no || '',
          status: staff.status || 'active',
        })
      })
      .catch(() => active && toast.error('Unable to load staff details.'))
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [editing, id])

  const selectedRole = useMemo(
    () => roles.find((role) => String(role.id) === String(form.role_id)) || null,
    [roles, form.role_id],
  )

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const payload = { ...form }

    if (editing && !payload.password) {
      delete payload.password
    }

    setSaving(true)

    try {
      if (editing) {
        await adminApi.update('staff', id, payload)
      } else {
        await adminApi.create('staff', payload)
      }

      toast.success(editing ? 'Staff member updated.' : 'Staff member created.')
      navigate('/admin/staff')
    } catch (error) {
      const errors = error.response?.data?.errors
      const firstError = errors ? Object.values(errors).flat()[0] : null
      toast.error(firstError || error.response?.data?.message || 'Unable to save staff member.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <AdminLoadingState className="py-8" />
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-col gap-3 border border-slate-300 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{editing ? 'Edit staff member' : 'Create staff member'}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Assign one primary role, keep contact details current, and control account status from one form.
          </p>
        </div>
        <Link
          to="/admin/staff"
          className="inline-flex items-center justify-center gap-2 border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
        >
          <FiArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_320px]">
        <section className="border border-slate-300 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              icon={FiUser}
              label="Full name"
              value={form.full_name}
              onChange={(value) => setField('full_name', value)}
              placeholder="Enter full name"
            />
            <Field
              icon={FiMail}
              label="Email address"
              type="email"
              value={form.email}
              onChange={(value) => setField('email', value)}
              placeholder="Enter email address"
            />
            <Field
              icon={FiPhone}
              label="Phone number"
              value={form.phone}
              onChange={(value) => setField('phone', value)}
              placeholder="Enter phone number"
            />
            <Field
              icon={FiLock }
              label={editing ? 'New password' : 'Password'}
              type="password"
              value={form.password}
              onChange={(value) => setField('password', value)}
              placeholder={editing ? 'Leave blank to keep current password' : 'Create a password'}
            />
            <SelectField
              icon={FiShield}
              label="Primary role"
              value={form.role_id}
              onChange={(value) => setField('role_id', value)}
              options={roles.map((role) => ({ value: role.id, label: role.name }))}
              placeholder="Select a role"
            />
            <SelectField
              icon={FiShield}
              label="Account status"
              value={form.status}
              onChange={(value) => setField('status', value)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'suspended', label: 'Suspended' },
              ]}
              placeholder="Select status"
            />
            <Field
              icon={PiNewspaperClipping}
              label="License number"
              value={form.license_no}
              onChange={(value) => setField('license_no', value)}
              placeholder="Enter license number"
              className="md:col-span-2"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiSave className="h-4 w-4" />
              <span>{saving ? 'Saving...' : editing ? 'Update Staff' : 'Create Staff'}</span>
            </button>
            <p className="text-sm text-slate-500">
              Staff role and status affect which admin areas they can access after login.
            </p>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="border border-slate-300 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Account preview</div>
            <div className="mt-4 border border-slate-200 bg-slate-50 p-4 text-center">
              <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-linear-to-br from-slate-100 to-slate-200 text-lg font-semibold text-slate-700">
                {initials(form.full_name)}
              </div>
              <div className="mt-3 text-lg font-semibold text-slate-950">{form.full_name || 'Staff member name'}</div>
              <div className="mt-1 text-sm text-slate-600">{form.email || 'Email address'}</div>
              <div className="mt-1 text-sm text-slate-500">{form.phone || 'Phone number'}</div>
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone[form.status] || statusTone.inactive}`}>
                  {labelForStatus(form.status)}
                </span>
                {selectedRole ? (
                  <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                    {selectedRole.name}
                  </span>
                ) : null}
              </div>
            </div>
          </section>

          <section className="border border-slate-300 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Role note</div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>Each staff account should have one primary role from the roles and permissions section.</p>
              <p>Leave password empty during edit if you do not want to change the current login password.</p>
              <p>Suspended staff remain on record but should not be used for day-to-day access.</p>
            </div>
          </section>
        </aside>
      </div>
    </form>
  )
}

function Field({ icon: Icon, label, value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
        <Icon className="h-4 w-4 text-slate-400" />
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  )
}

function SelectField({ icon: Icon, label, value, onChange, options, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
        <Icon className="h-4 w-4 text-slate-400" />
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
