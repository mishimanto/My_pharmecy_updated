import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiEdit, FiSave, FiTrash2, FiUploadCloud, FiX } from 'react-icons/fi'
import { adminApi } from '../../../api/adminApi'
import AdminLoadingState from '../../../components/admin/AdminLoadingState'
import { toolCopy } from './marketingConfig'
import { Field, StatCard, ToolHeader } from './shared'

const emptyBannerForm = {
  label: '',
  label_bn: '',
  title: '',
  title_bn: '',
  body: '',
  body_bn: '',
  button_label: 'Shop now',
  button_label_bn: 'এখনই দেখুন',
  link_url: '/products',
  placement: 'homepage',
  image_url: '',
  sort_order: 0,
  status: 'active',
}

export default function BannerImagesTool() {
  const tool = toolCopy.bannerImages
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyBannerForm)
  const [editingId, setEditingId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const stats = useMemo(() => ([
    ['Banners', items.length],
    ['Active', items.filter((item) => item.status === 'active').length],
    ['Placement', 'Homepage'],
  ]), [items])

  const load = () => {
    setLoading(true)
    adminApi.listFresh('banner-images')
      .then((response) => setItems(response.data.data || []))
      .catch(() => toast.error('Unable to load banner images.'))
      .finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, [])

  useEffect(() => {
    if (!imageFile) return undefined
    const objectUrl = URL.createObjectURL(imageFile)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [imageFile])

  const resetForm = () => {
    setForm(emptyBannerForm)
    setEditingId(null)
    setImageFile(null)
    setPreview('')
  }

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const edit = (item) => {
    setEditingId(item.id)
    setForm({
      label: item.label || '',
      label_bn: item.label_bn || '',
      title: item.title || '',
      title_bn: item.title_bn || '',
      body: item.body || '',
      body_bn: item.body_bn || '',
      button_label: item.button_label || '',
      button_label_bn: item.button_label_bn || '',
      link_url: item.link_url || '',
      placement: item.placement || 'homepage',
      image_url: item.image_path ? '' : item.image_url || '',
      sort_order: item.sort_order || 0,
      status: item.status || 'active',
    })
    setImageFile(null)
    setPreview(item.image_src || item.image_url || '')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) {
      toast.error('Banner title is required.')
      return
    }
    if (!editingId && !imageFile && !form.image_url.trim()) {
      toast.error('Add a banner image upload or CDN URL.')
      return
    }

    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => payload.append(key, value ?? ''))
    if (imageFile) payload.append('image', imageFile)

    setSaving(true)
    try {
      if (editingId) {
        await adminApi.updateBannerImage(editingId, payload)
      } else {
        await adminApi.createBannerImage(payload)
      }
      toast.success(editingId ? 'Banner image updated.' : 'Banner image created.')
      resetForm()
      load()
    } catch (error) {
      const errors = error.response?.data?.errors
      const firstError = errors ? Object.values(errors).flat()[0] : null
      toast.error(firstError || error.response?.data?.message || 'Unable to save banner image.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return

    try {
      await adminApi.remove('banner-images', item.id)
      toast.success('Banner image deleted.')
      load()
      if (editingId === item.id) resetForm()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete banner image.')
    }
  }

  if (loading && items.length === 0) return <AdminLoadingState className="py-8" />

  return (
    <div className="space-y-5">
      <ToolHeader tool={tool} icon={tool.icon} actionLabel={editingId ? 'Editing Banner' : 'Add New'} />
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(([label, value]) => <StatCard key={label} label={label} value={value} />)}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">Homepage banner images</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[180px_minmax(0,1fr)_auto] lg:items-center">
                <img src={item.image_src || item.image_url} alt="" className="h-24 w-full rounded-md bg-slate-100 object-cover" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">{item.placement || 'homepage'}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${item.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                      {item.status}
                    </span>
                  </div>
                  <h3 className="mt-2 truncate text-sm font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-1 truncate text-xs text-slate-500">{item.label || 'No label'} / {item.title_bn || 'No Bangla title'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => edit(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50">
                    <FiEdit className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => remove(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rose-100 text-rose-600 transition hover:bg-rose-50">
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 ? <div className="px-5 py-10 text-center text-sm text-slate-500">No banner images yet.</div> : null}
          </div>
        </section>

        <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-950">{editingId ? 'Edit banner' : 'Add banner'}</h2>
            {editingId ? (
              <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
                <FiX className="h-4 w-4" />
                Cancel
              </button>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Label" value={form.label} onChange={(value) => setField('label', value)} />
            <Field label="Label BN" value={form.label_bn} onChange={(value) => setField('label_bn', value)} />
          </div>
          <Field label="Title" value={form.title} onChange={(value) => setField('title', value)} required />
          <Field label="Title (Bangla)" value={form.title_bn} onChange={(value) => setField('title_bn', value)} />
          <Field label="Body" value={form.body} onChange={(value) => setField('body', value)} />
          <Field label="Body (Bangla)" value={form.body_bn} onChange={(value) => setField('body_bn', value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Button label" value={form.button_label} onChange={(value) => setField('button_label', value)} />
            <Field label="Button label BN" value={form.button_label_bn} onChange={(value) => setField('button_label_bn', value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Link URL" value={form.link_url} onChange={(value) => setField('link_url', value)} placeholder="/products" />
            <Field label="Placement" value={form.placement} onChange={(value) => setField('placement', value)} placeholder="homepage" />
          </div>
          <Field label="Image CDN URL" value={form.image_url} onChange={(value) => { setField('image_url', value); if (value.trim()) { setImageFile(null); setPreview(value.trim()) } }} placeholder="https://cdn.example.com/banner.jpg" />

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700">
            <FiUploadCloud className="h-4 w-4" />
            <span>Upload banner image</span>
            <input type="file" accept="image/*" onChange={(event) => { setImageFile(event.target.files?.[0] || null); setField('image_url', '') }} className="hidden" />
          </label>

          {preview ? <img src={preview} alt="" className="h-36 w-full rounded-md border border-slate-200 object-cover" /> : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Sort order" type="number" value={form.sort_order} onChange={(value) => setField('sort_order', value)} />
            <label className="text-sm font-medium text-slate-700">
              Status
              <select value={form.status} onChange={(event) => setField('status', event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>

          <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
            <FiSave className="h-4 w-4" />
            {saving ? 'Saving...' : editingId ? 'Update Banner' : 'Create Banner'}
          </button>
        </form>
      </div>
    </div>
  )
}
