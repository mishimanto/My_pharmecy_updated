import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiCheckCircle, FiClock, FiCreditCard, FiEdit, FiImage, FiSave, FiTrash2, FiX } from 'react-icons/fi'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import AdminStatCard from '../../components/admin/AdminStatCard'
import { handleImageFallback, resolveImageUrl } from '../../utils/imageUrl'

const emptyForm = {
  code: '',
  label: '',
  label_bn: '',
  description: '',
  description_bn: '',
  number: '',
  account_name: '',
  dial_code: '',
  logo_url: '',
  brand_color: '#0e6574',
  requires_proof: false,
  is_active: true,
  sort_order: 0,
}

function readFileAsDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function resizeLogoToDataUri(file) {
  const source = await readFileAsDataUri(file)

  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const size = 192
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      const sourceSize = Math.min(image.naturalWidth || image.width, image.naturalHeight || image.height)
      const sx = ((image.naturalWidth || image.width) - sourceSize) / 2
      const sy = ((image.naturalHeight || image.height) - sourceSize) / 2

      canvas.width = size
      canvas.height = size
      context.drawImage(image, sx, sy, sourceSize, sourceSize, 0, 0, size, size)
      resolve(canvas.toDataURL('image/webp', 0.72))
    }
    image.onerror = reject
    image.src = source
  })
}

export default function PaymentMethods() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [removeLogo, setRemoveLogo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const stats = useMemo(() => [
    { label: 'Methods', value: items.length, variant: 'sky', icon: FiCreditCard },
    { label: 'Active', value: items.filter((item) => item.is_active).length, variant: 'emerald', icon: FiCheckCircle },
    { label: 'Proof Required', value: items.filter((item) => item.requires_proof).length, variant: 'amber', icon: FiClock },
  ], [items])

  const load = () => {
    setLoading(true)
    adminApi.listFresh('payment-methods')
      .then((response) => setItems(response.data.data || []))
      .catch(() => toast.error('Unable to load payment methods.'))
      .finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, [])

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))

    if (field === 'logo_url') {
      setRemoveLogo(false)
      if (!logoFile) {
        setPreview(value || '')
      }
    }
  }
  const reset = () => {
    setForm(emptyForm)
    setEditingId(null)
    setLogoFile(null)
    setPreview('')
    setRemoveLogo(false)
  }
  const edit = (item) => {
    setEditingId(item.id)
    setForm({ ...emptyForm, ...item, requires_proof: Boolean(item.requires_proof), is_active: Boolean(item.is_active) })
    setLogoFile(null)
    setPreview(item.logo_url || '')
    setRemoveLogo(false)
  }

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0] || null
    setLogoFile(file)

    if (file) {
      setPreview(URL.createObjectURL(file))
      setRemoveLogo(false)
    }
  }

  const clearLogo = () => {
    setLogoFile(null)
    setPreview('')
    setRemoveLogo(true)
    setForm((current) => ({ ...current, logo_url: '' }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.code.trim() || !form.label.trim()) return toast.error('Code and label are required.')
    setSaving(true)
    const payload = { ...form, code: form.code.trim().toUpperCase() }
    if (logoFile) {
      payload.logo_data = await resizeLogoToDataUri(logoFile)
    } else if (removeLogo) {
      payload.remove_logo = true
    }
    try {
      editingId ? await adminApi.update('payment-methods', editingId, payload) : await adminApi.create('payment-methods', payload)
      toast.success(editingId ? 'Payment method updated.' : 'Payment method created.')
      reset(); load()
    } catch (error) {
      const errors = error.response?.data?.errors
      toast.error((errors ? Object.values(errors).flat()[0] : null) || error.response?.data?.message || 'Unable to save payment method.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`Delete ${item.label}?`)) return
    await adminApi.remove('payment-methods', item.id).then(() => { toast.success('Payment method deleted.'); load() }).catch((error) => toast.error(error.response?.data?.message || 'Unable to delete payment method.'))
  }

  if (loading && items.length === 0) return <AdminLoadingState className="py-8" />

  return (
    <div className="space-y-5">
      {/* <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <FiCreditCard className="h-5 w-5 text-emerald-700" />
          <h1 className="text-xl font-semibold text-slate-950">Payment Methods</h1>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
          <FiPlus className="h-4 w-4" />
          {editingId ? 'Editing Method' : 'Add New'}
        </span>
      </div> */}

      <div className="grid gap-3 md:grid-cols-3">
        {stats.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} variant={item.variant} icon={item.icon} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">Checkout payment methods</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[72px_minmax(0,1fr)_auto] lg:items-center">
                <MethodLogoPreview item={item} />
                <div className="min-w-0">
                  <h3 className="truncate text-md font-bold text-blue-700">{item.label}</h3>
                  {/* <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{item.code}</p> */}
                  <div className="mt-1 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                    <p className="truncate">
                      <span className="font-medium text-slate-800">Number:</span> {item.number || 'Not set'}
                    </p>
                    <p className="truncate">
                      <span className="font-medium text-slate-800">Account:</span> {item.account_name || 'Not set'}
                    </p>
                    <p className={item.is_active ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                      <span className="font-medium text-slate-800">Status:</span> {item.is_active ? 'Active' : 'Inactive'}
                    </p>
                    <p className={item.requires_proof ? 'text-amber-700' : 'text-slate-500'}>
                      <span className="font-medium text-slate-800">Proof:</span> {item.requires_proof ? 'Required' : 'Not required'}
                    </p>
                  </div>
                  {/* {item.description ? <p className="mt-2 line-clamp-2 text-xs text-slate-500">{item.description}</p> : null} */}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => edit(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50"><FiEdit className="h-4 w-4" /></button>
                  <button type="button" onClick={() => remove(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rose-100 text-rose-600 transition hover:bg-rose-50"><FiTrash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-950">{editingId ? 'Edit method' : 'Add method'}</h2>
            {editingId ? <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"><FiX className="h-4 w-4" />Cancel</button> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Code" value={form.code} onChange={(value) => setField('code', value.toUpperCase())} required /><Field label="Sort order" type="number" value={form.sort_order} onChange={(value) => setField('sort_order', value)} /></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Label" value={form.label} onChange={(value) => setField('label', value)} required /><Field label="Label BN" value={form.label_bn} onChange={(value) => setField('label_bn', value)} /></div>
          <Field label="Description" value={form.description} onChange={(value) => setField('description', value)} />
          <Field label="Description BN" value={form.description_bn} onChange={(value) => setField('description_bn', value)} />
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Payment number" value={form.number} onChange={(value) => setField('number', value)} /><Field label="Account name" value={form.account_name} onChange={(value) => setField('account_name', value)} /></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Dial code" value={form.dial_code} onChange={(value) => setField('dial_code', value)} /><Field label="Brand color" value={form.brand_color} onChange={(value) => setField('brand_color', value)} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Logo CDN URL" value={form.logo_url} onChange={(value) => setField('logo_url', value)} />
            <label className="block text-sm font-medium text-slate-700">
              Upload logo image
              <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700">
                <FiImage className="h-4 w-4" />
                <span>{logoFile ? 'Change image' : 'Choose image'}</span>
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </label>
            </label>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Logo preview</p>
            <div className="mt-3 flex items-center gap-3">
              <MethodLogoPreview item={{ label: form.label, logo_url: preview || form.logo_url, brand_color: form.brand_color }} />
              {(preview || form.logo_url) ? (
                <button
                  type="button"
                  onClick={clearLogo}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-600"
                >
                  <FiX className="h-4 w-4" />
                  Remove logo
                </button>
              ) : null}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField label="Requires proof" checked={form.requires_proof} onChange={(value) => setField('requires_proof', value)} />
            <ToggleField label="Active" checked={form.is_active} onChange={(value) => setField('is_active', value)} />
          </div>
          <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
            <FiSave className="h-4 w-4" />
            {saving ? 'Saving...' : editingId ? 'Update Method' : 'Create Method'}
          </button>
        </form>
      </div>
    </div>
  )
}

function MethodLogoPreview({ item }) {
  const src = item?.logo_url ? resolveImageUrl(item.logo_url, '') : ''
  const initials = String(item?.label || 'PM').trim().slice(0, 2).toUpperCase()

  if (src) {
    return (
      <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden border border-slate-200 bg-white p-2 shadow-sm">
        <img
          src={src}
          alt={item?.label || 'Payment method logo'}
          onError={(event) => handleImageFallback(event, '')}
          className="h-full w-full object-contain"
        />
      </div>
    )
  }

  return (
    <div
      className="flex h-[72px] w-[72px] items-center justify-center border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm"
      style={{ backgroundColor: `${item?.brand_color || '#0e6574'}14` }}
    >
      {item?.label ? initials : <FiImage className="h-5 w-5 text-slate-400" />}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input type={type} required={required} value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-400" />
    </label>
  )
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#0e6574]" />
    </label>
  )
}
