import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiEdit, FiSave, FiTrash2, FiUploadCloud, FiX } from 'react-icons/fi'
import { adminApi } from '../../../api/adminApi'
import AdminLoadingState from '../../../components/admin/AdminLoadingState'
import { toolCopy } from './marketingConfig'
import { Field, StatCard, ToolHeader } from './shared'

const emptyHeroForm = {
  eyebrow: '',
  eyebrow_bn: '',
  title: '',
  title_bn: '',
  primary_label: 'Shop medicines',
  primary_label_bn: 'ওষুধ দেখুন',
  primary_url: '/products',
  secondary_label: 'Upload prescription',
  secondary_label_bn: 'প্রেসক্রিপশন আপলোড',
  secondary_url: '/upload-prescription',
  image_url: '',
  sort_order: 0,
  status: 'active',
}

export default function HeroImagesTool() {
  const tool = toolCopy.heroImages
  const [slides, setSlides] = useState([])
  const [form, setForm] = useState(emptyHeroForm)
  const [editingId, setEditingId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const stats = useMemo(() => ([
    ['Hero Slides', slides.length],
    ['Published', slides.filter((item) => item.status === 'active').length],
    ['Recommended', '1600x900'],
  ]), [slides])

  const load = () => {
    setLoading(true)
    adminApi.listFresh('hero-slides')
      .then((response) => setSlides(response.data.data || []))
      .catch(() => toast.error('Unable to load hero slides.'))
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
    setForm(emptyHeroForm)
    setEditingId(null)
    setImageFile(null)
    setPreview('')
  }

  const edit = (slide) => {
    setEditingId(slide.id)
    setForm({
      eyebrow: slide.eyebrow || '',
      eyebrow_bn: slide.eyebrow_bn || '',
      title: slide.title || '',
      title_bn: slide.title_bn || '',
      primary_label: slide.primary_label || '',
      primary_label_bn: slide.primary_label_bn || '',
      primary_url: slide.primary_url || '',
      secondary_label: slide.secondary_label || '',
      secondary_label_bn: slide.secondary_label_bn || '',
      secondary_url: slide.secondary_url || '',
      image_url: slide.image_path ? '' : slide.image_url || '',
      sort_order: slide.sort_order || 0,
      status: slide.status || 'active',
    })
    setImageFile(null)
    setPreview(slide.image_src || slide.image_url || '')
  }

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) {
      toast.error('Hero title is required.')
      return
    }
    if (!editingId && !imageFile && !form.image_url.trim()) {
      toast.error('Add a hero image upload or CDN URL.')
      return
    }

    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => payload.append(key, value ?? ''))
    if (imageFile) payload.append('image', imageFile)

    setSaving(true)
    try {
      if (editingId) {
        await adminApi.updateHeroSlide(editingId, payload)
      } else {
        await adminApi.createHeroSlide(payload)
      }
      toast.success(editingId ? 'Hero slide updated.' : 'Hero slide created.')
      resetForm()
      load()
    } catch (error) {
      const errors = error.response?.data?.errors
      const firstError = errors ? Object.values(errors).flat()[0] : null
      toast.error(firstError || error.response?.data?.message || 'Unable to save hero slide.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (slide) => {
    if (!window.confirm(`Delete "${slide.title}"?`)) return

    try {
      await adminApi.remove('hero-slides', slide.id)
      toast.success('Hero slide deleted.')
      load()
      if (editingId === slide.id) resetForm()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete hero slide.')
    }
  }

  if (loading && slides.length === 0) return <AdminLoadingState className="py-8" />

  return (
    <div className="space-y-5">
      <ToolHeader tool={tool} icon={tool.icon} actionLabel={editingId ? 'Editing Slide' : 'Add New'} />
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(([label, value]) => <StatCard key={label} label={label} value={value} />)}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">Homepage hero slides</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {slides.map((slide) => (
              <div key={slide.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[180px_minmax(0,1fr)_auto] lg:items-center">
                <img src={slide.image_src || slide.image_url} alt="" className="h-24 w-full rounded-md bg-slate-100 object-cover" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">#{slide.sort_order || 0}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${slide.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                      {slide.status}
                    </span>
                  </div>
                  <h3 className="mt-2 truncate text-sm font-semibold text-slate-950">{slide.title}</h3>
                  <p className="mt-1 truncate text-xs text-slate-500">{slide.eyebrow || 'No eyebrow'} / {slide.title_bn || 'No Bangla title'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => edit(slide)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50">
                    <FiEdit className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => remove(slide)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rose-100 text-rose-600 transition hover:bg-rose-50">
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {slides.length === 0 ? <div className="px-5 py-10 text-center text-sm text-slate-500">No hero slides yet.</div> : null}
          </div>
        </section>

        <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-950">{editingId ? 'Edit slide' : 'Add slide'}</h2>
            {editingId ? (
              <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
                <FiX className="h-4 w-4" />
                Cancel
              </button>
            ) : null}
          </div>

          <Field label="Eyebrow" value={form.eyebrow} onChange={(value) => setField('eyebrow', value)} />
          <Field label="Eyebrow (Bangla)" value={form.eyebrow_bn} onChange={(value) => setField('eyebrow_bn', value)} />
          <Field label="Title" value={form.title} onChange={(value) => setField('title', value)} required />
          <Field label="Title (Bangla)" value={form.title_bn} onChange={(value) => setField('title_bn', value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Primary label" value={form.primary_label} onChange={(value) => setField('primary_label', value)} />
            <Field label="Primary label BN" value={form.primary_label_bn} onChange={(value) => setField('primary_label_bn', value)} />
          </div>
          <Field label="Primary URL" value={form.primary_url} onChange={(value) => setField('primary_url', value)} placeholder="/products" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Secondary label" value={form.secondary_label} onChange={(value) => setField('secondary_label', value)} />
            <Field label="Secondary label BN" value={form.secondary_label_bn} onChange={(value) => setField('secondary_label_bn', value)} />
          </div>
          <Field label="Secondary URL" value={form.secondary_url} onChange={(value) => setField('secondary_url', value)} placeholder="/upload-prescription" />
          <Field label="Image CDN URL" value={form.image_url} onChange={(value) => { setField('image_url', value); if (value.trim()) { setImageFile(null); setPreview(value.trim()) } }} placeholder="https://cdn.example.com/hero.jpg" />

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700">
            <FiUploadCloud className="h-4 w-4" />
            <span>Upload hero image</span>
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
            {saving ? 'Saving...' : editingId ? 'Update Slide' : 'Create Slide'}
          </button>
        </form>
      </div>
    </div>
  )
}
