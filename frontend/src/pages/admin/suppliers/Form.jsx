import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminApi } from '../../../api/adminApi'
import AdminLoadingState from '../../../components/admin/AdminLoadingState'
import { clearSuppliersCache } from '../../../utils/adminSupplierCache'

const initialForm = {
  supplier_name: '',
  phone: '',
  email: '',
  address: '',
  status: 'active',
}

function formFromSupplier(supplier) {
  return {
    supplier_name: supplier?.supplier_name || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
    status: supplier?.status || 'active',
  }
}

export default function SupplierForm({ mode = 'create' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEdit) return undefined

    let active = true

    adminApi.show('suppliers', id)
      .then(({ data }) => {
        if (!active) return
        setForm(formFromSupplier(data.data))
      })
      .catch(() => active && toast.error('Unable to load supplier details.'))
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [id, isEdit])

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!form.supplier_name.trim()) {
      toast.error('Supplier name is required.')
      return
    }

    const payload = {
      supplier_name: form.supplier_name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      status: form.status,
    }

    setSaving(true)
    try {
      if (isEdit) {
        await adminApi.update('suppliers', id, payload)
        toast.success('Supplier updated.')
      } else {
        await adminApi.create('suppliers', payload)
        toast.success('Supplier created.')
      }

      clearSuppliersCache()
      navigate('/admin/suppliers')
    } catch (error) {
      const errors = error.response?.data?.errors
      const firstError = errors ? Object.values(errors).flat()[0] : null
      toast.error(firstError || error.response?.data?.message || 'Unable to save supplier.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <AdminLoadingState className="py-8" />
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{isEdit ? 'Edit supplier' : 'Create supplier'}</h2>
        </div>
        <Link to="/admin/suppliers" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700">
          <FiArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-slate-700">Supplier name</span>
              <input value={form.supplier_name} onChange={(event) => setField('supplier_name', event.target.value)} placeholder="ABC Pharma Supply" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Phone</span>
              <input value={form.phone} onChange={(event) => setField('phone', event.target.value)} placeholder="+8801..." className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
              <input type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} placeholder="supplier@example.com" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Address</span>
            <textarea value={form.address} onChange={(event) => setField('address', event.target.value)} placeholder="Supplier warehouse or office address" rows="5" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
          </label>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
            <select value={form.status} onChange={(event) => setField('status', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</div>
            <div className="mt-2 font-semibold text-slate-950">{form.supplier_name || 'Supplier name'}</div>
            <div className="mt-1 text-sm text-slate-600">{form.phone || 'Phone number'}</div>
            <div className="mt-1 text-sm text-slate-600">{form.email || 'Email address'}</div>
            <div className={`mt-3 text-xs font-semibold ${form.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {form.status === 'active' ? 'Active' : 'Inactive'}
            </div>
          </div>

          <button disabled={saving} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
            <FiSave className="h-4 w-4" />
            <span>{saving ? 'Saving...' : isEdit ? 'Update supplier' : 'Create supplier'}</span>
          </button>
        </div>
      </div>
    </form>
  )
}
