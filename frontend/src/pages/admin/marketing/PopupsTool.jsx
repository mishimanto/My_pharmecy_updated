import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { adminApi } from '../../../api/adminApi'
import AdminLoadingState from '../../../components/admin/AdminLoadingState'
import { toDateTimeLocal } from './dateUtils'
import { toolCopy } from './marketingConfig'
import { Field, FormHeader, MarketingList, SaveButton, StatCard, StatusField, ToolHeader, UploadField } from './shared'

const emptyPopup = {
  source_offer_id: '',
  label: '',
  label_bn: '',
  title: '',
  title_bn: '',
  body: '',
  body_bn: '',
  button_label: 'View now',
  button_label_bn: 'এখন দেখুন',
  link_url: '/products',
  image_url: '',
  starts_at: '',
  ends_at: '',
  is_active: false,
}

export default function PopupsTool() {
  const tool = toolCopy.popups
  const [items, setItems] = useState([])
  const [offers, setOffers] = useState([])
  const [form, setForm] = useState(emptyPopup)
  const [editingId, setEditingId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const stats = useMemo(() => [['Popups', items.length], ['Active', items.filter((item) => item.is_active).length], ['Delay', '2 seconds']], [items])

  const load = () => {
    setLoading(true)
    Promise.all([adminApi.listFresh('marketing-popups'), adminApi.listFresh('offers')])
      .then(([popupRes, offerRes]) => {
        setItems(popupRes.data.data || [])
        setOffers(offerRes.data.data || [])
      })
      .catch(() => toast.error('Unable to load popups.'))
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

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const reset = () => { setForm(emptyPopup); setEditingId(null); setImageFile(null); setPreview('') }
  const edit = (item) => {
    setEditingId(item.id)
    setForm({
      ...emptyPopup,
      ...item,
      source_offer_id: item.source_offer_id || '',
      image_url: item.image_path ? '' : item.image_url || '',
      starts_at: toDateTimeLocal(item.starts_at),
      ends_at: toDateTimeLocal(item.ends_at),
      is_active: Boolean(item.is_active),
    })
    setPreview(item.image_src || item.image_url || '')
    setImageFile(null)
  }

  const selectOffer = (offerId) => {
    const offer = offers.find((item) => String(item.id) === String(offerId))
    setForm((current) => ({
      ...current,
      source_offer_id: offerId,
      label: offer?.label || current.label,
      label_bn: offer?.label_bn || current.label_bn,
      title: offer?.title || current.title,
      title_bn: offer?.title_bn || current.title_bn,
      body: offer?.body || current.body,
      body_bn: offer?.body_bn || current.body_bn,
      button_label: offer?.button_label || current.button_label,
      button_label_bn: offer?.button_label_bn || current.button_label_bn,
      link_url: offer?.link_url || current.link_url,
      image_url: offer?.image_path ? '' : offer?.image_url || current.image_url,
      starts_at: toDateTimeLocal(offer?.starts_at) || current.starts_at,
      ends_at: toDateTimeLocal(offer?.ends_at) || current.ends_at,
    }))
    if (offer?.image_src || offer?.image_url) setPreview(offer.image_src || offer.image_url)
    setImageFile(null)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) return toast.error('Popup title is required.')
    const payload = new FormData()
    Object.entries({ ...form, starts_at: form.starts_at || '', ends_at: form.ends_at || '' }).forEach(([key, value]) => {
      payload.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value ?? '')
    })
    if (imageFile) payload.append('image', imageFile)
    setSaving(true)
    try {
      editingId ? await adminApi.updateMarketingPopup(editingId, payload) : await adminApi.createMarketingPopup(payload)
      toast.success(editingId ? 'Popup updated.' : 'Popup created.')
      reset(); load()
    } catch (error) {
      const errors = error.response?.data?.errors
      toast.error((errors ? Object.values(errors).flat()[0] : null) || error.response?.data?.message || 'Unable to save popup.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return
    await adminApi.remove('marketing-popups', item.id).then(() => { toast.success('Popup deleted.'); load() }).catch(() => toast.error('Unable to delete popup.'))
  }

  if (loading && items.length === 0) return <AdminLoadingState className="py-8" />

  return (
    <div className="space-y-5">
      <ToolHeader tool={tool} icon={tool.icon} actionLabel={editingId ? 'Editing Popup' : 'Add New'} />
      <div className="grid gap-4 md:grid-cols-3">{stats.map(([label, value]) => <StatCard key={label} label={label} value={value} />)}</div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <MarketingList title="Entry popups" items={items} emptyText="No popups yet." onEdit={edit} onRemove={remove} renderMeta={(item) => [item.is_active ? 'Active' : 'Inactive', item.source_offer?.title ? `From offer: ${item.source_offer.title}` : null].filter(Boolean).join(' / ')} renderTitle={(item) => item.title} image />
        <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <FormHeader title={editingId ? 'Edit popup' : 'Add popup'} editing={Boolean(editingId)} onCancel={reset} />
          <label className="block text-sm font-medium text-slate-700">
            Use offer content
            <select value={form.source_offer_id} onChange={(event) => selectOffer(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none">
              <option value="">Custom popup</option>
              {offers.map((offer) => <option key={offer.id} value={offer.id}>{offer.title}</option>)}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Label" value={form.label} onChange={(value) => setField('label', value)} /><Field label="Label BN" value={form.label_bn} onChange={(value) => setField('label_bn', value)} /></div>
          <Field label="Title" value={form.title} onChange={(value) => setField('title', value)} required />
          <Field label="Title (Bangla)" value={form.title_bn} onChange={(value) => setField('title_bn', value)} />
          <Field label="Body" value={form.body} onChange={(value) => setField('body', value)} />
          <Field label="Body (Bangla)" value={form.body_bn} onChange={(value) => setField('body_bn', value)} />
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Button label" value={form.button_label} onChange={(value) => setField('button_label', value)} /><Field label="Button label BN" value={form.button_label_bn} onChange={(value) => setField('button_label_bn', value)} /></div>
          <Field label="Link URL" value={form.link_url} onChange={(value) => setField('link_url', value)} placeholder="/products" />
          <Field label="Image CDN URL" value={form.image_url} onChange={(value) => { setField('image_url', value); if (value.trim()) { setImageFile(null); setPreview(value.trim()) } }} />
          <UploadField label="Upload popup image" onChange={(file) => { setImageFile(file); setField('image_url', '') }} />
          {preview ? <img src={preview} alt="" className="h-36 w-full rounded-md border border-slate-200 object-cover" /> : null}
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Starts at" type="datetime-local" value={form.starts_at} onChange={(value) => setField('starts_at', value)} /><Field label="Ends at" type="datetime-local" value={form.ends_at} onChange={(value) => setField('ends_at', value)} /></div>
          <div className="grid gap-3">
            <StatusField value={form.is_active ? 'active' : 'inactive'} onChange={(value) => setField('is_active', value === 'active')} />
            <ToggleField label="Active popup" checked={form.is_active} onChange={(value) => setField('is_active', value)} />            
          </div>
          <SaveButton saving={saving} label={editingId ? 'Update Popup' : 'Create Popup'} />
        </form>
      </div>
    </div>
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
