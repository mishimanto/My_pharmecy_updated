import { useEffect, useState } from 'react'
import { FiMail, FiMapPin, FiPhone, FiSave, FiUploadCloud, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import { useSiteSettings } from '../../context/SiteSettingsContext'

function formFromSettings(settings) {
  return {
    site_name: settings?.site_name || '',
    site_tagline: settings?.site_tagline || '',
    support_phone: settings?.support_phone || '',
    support_email: settings?.support_email || '',
    address: settings?.address || '',
    city: settings?.city || '',
    support_hours: settings?.support_hours || '',
    whatsapp_number: settings?.whatsapp_number || '',
    facebook_url: settings?.facebook_url || '',
    instagram_url: settings?.instagram_url || '',
    youtube_url: settings?.youtube_url || '',
    map_embed_url: settings?.map_embed_url || '',
    footer_note: settings?.footer_note || '',
  }
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
      const maxSize = 512
      const sourceWidth = image.naturalWidth || image.width
      const sourceHeight = image.naturalHeight || image.height
      const ratio = Math.min(maxSize / sourceWidth, maxSize / sourceHeight, 1)
      const width = Math.max(1, Math.round(sourceWidth * ratio))
      const height = Math.max(1, Math.round(sourceHeight * ratio))
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      canvas.width = width
      canvas.height = height
      context.clearRect(0, 0, width, height)
      context.drawImage(image, 0, 0, sourceWidth, sourceHeight, 0, 0, width, height)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = reject
    image.src = source
  })
}

export default function SiteSettings() {
  const { settings: globalSettings, updateSettingsState } = useSiteSettings()
  const [form, setForm] = useState(() => formFromSettings(globalSettings))
  const [preview, setPreview] = useState(globalSettings?.logo_url || '')
  const [logoFile, setLogoFile] = useState(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    adminApi.siteSettings()
      .then((res) => {
        if (!active) return
        const payload = res.data?.data || {}
        setForm(formFromSettings(payload))
        setPreview(payload.logo_url || '')
        updateSettingsState(payload)
      })
      .catch(() => active && toast.error('Unable to load site settings.'))
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [updateSettingsState])

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
  }

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!form.site_name.trim()) {
      toast.error('Site name is required.')
      return
    }

    const payload = {
      ...form,
      site_name: form.site_name.trim(),
      site_tagline: form.site_tagline.trim() || null,
      support_phone: form.support_phone.trim() || null,
      support_email: form.support_email.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      support_hours: form.support_hours.trim() || null,
      whatsapp_number: form.whatsapp_number.trim() || null,
      facebook_url: form.facebook_url.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
      youtube_url: form.youtube_url.trim() || null,
      map_embed_url: form.map_embed_url.trim() || null,
      footer_note: form.footer_note.trim() || null,
    }

    if (logoFile) {
      payload.logo_data = await resizeLogoToDataUri(logoFile)
    } else if (removeLogo) {
      payload.remove_logo = true
    }

    setSaving(true)

    try {
      const res = await adminApi.updateSiteSettings(payload)
      updateSettingsState(res.data?.data)
      setForm(formFromSettings(res.data?.data))
      setPreview(res.data?.data?.logo_url || '')
      setLogoFile(null)
      setRemoveLogo(false)
      toast.success('Site settings updated.')
    } catch (error) {
      const errors = error.response?.data?.errors
      const firstError = errors ? Object.values(errors).flat()[0] : null
      toast.error(firstError || error.response?.data?.message || 'Unable to update site settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <AdminLoadingState className="py-8" />
  }

  return (
    <>
      <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_340px]">
        <section className="border border-slate-300 bg-white p-4">
          <div className="mb-4">
            <h2 className="text-lg p-2 border-b border-slate-300 font-semibold text-slate-950">Site settings</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Site name" value={form.site_name} onChange={(value) => setField('site_name', value)} placeholder="My Pharmecy" />
            <Field label="Tagline" value={form.site_tagline} onChange={(value) => setField('site_tagline', value)} placeholder="Trusted online pharmacy support" />
            <Field label="Phone" value={form.support_phone} onChange={(value) => setField('support_phone', value)} placeholder="09610-001122" />
            <Field label="Email" type="email" value={form.support_email} onChange={(value) => setField('support_email', value)} placeholder="support@example.com" />
            <Field label="City" value={form.city} onChange={(value) => setField('city', value)} placeholder="Dhaka" />
            <Field label="Support hours" value={form.support_hours} onChange={(value) => setField('support_hours', value)} placeholder="8AM to 11PM support" />
            <Field label="WhatsApp" value={form.whatsapp_number} onChange={(value) => setField('whatsapp_number', value)} placeholder="09610-001122" />
            <Field label="Facebook URL" value={form.facebook_url} onChange={(value) => setField('facebook_url', value)} placeholder="https://facebook.com/your-page" />
            <Field label="Instagram URL" value={form.instagram_url} onChange={(value) => setField('instagram_url', value)} placeholder="https://instagram.com/your-page" />
            <Field label="YouTube URL" value={form.youtube_url} onChange={(value) => setField('youtube_url', value)} placeholder="https://youtube.com/your-channel" />
            <Field label="Address" value={form.address} onChange={(value) => setField('address', value)} placeholder="Dhaka service point" className="md:col-span-2" />
            <Field label="Map embed URL" value={form.map_embed_url} onChange={(value) => setField('map_embed_url', value)} placeholder="https://www.google.com/maps?q=Dhaka%2C%20Bangladesh&z=12&output=embed" className="md:col-span-2" />
            <Field
              label="Footer note"
              value={form.footer_note}
              onChange={(value) => setField('footer_note', value)}
              placeholder="Prescription-aware online pharmacy experience"
              className="md:col-span-2"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiSave className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="border border-slate-300 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Logo</div>
            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700">
              <FiUploadCloud className="h-4 w-4" />
              <span>Choose logo</span>
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>

            <div className="mt-4 flex min-h-[200px] items-center justify-center border border-slate-200 bg-slate-50 p-4">
              {preview && !removeLogo ? (
                <img src={preview} alt="Site logo preview" className="max-h-32 w-auto object-contain" />
              ) : (
                <div className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center border border-slate-200 bg-white text-xl font-semibold text-slate-500">
                    {form.site_name?.slice(0, 2)?.toUpperCase() || 'MP'}
                  </div>
                  <p className="mt-3 text-sm text-slate-500">No custom logo uploaded.</p>
                </div>
              )}
            </div>

            {preview && !removeLogo ? (
              <button
                type="button"
                onClick={clearLogo}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
              >
                <FiX className="h-4 w-4" />
                <span>Remove logo</span>
              </button>
            ) : null}
          </section>

          <section className="border border-slate-300 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Live preview</div>
            <div className="mt-4 space-y-3 border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                {preview && !removeLogo ? (
                  <img src={preview} alt={form.site_name || 'Site logo'} className="h-12 w-12 object-contain" />
                ) : (
                  <span className="inline-flex h-12 w-12 items-center justify-center border border-slate-200 bg-white font-semibold text-slate-700">
                    {form.site_name?.slice(0, 2)?.toUpperCase() || 'MP'}
                  </span>
                )}
                <div>
                  <div className="font-semibold text-slate-950">{form.site_name || 'My Pharmecy'}</div>
                  <div>{form.site_tagline || 'Trusted online pharmacy support'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FiPhone className="mt-0.5 h-4 w-4 text-slate-400" />
                <span>{form.support_phone || '-'}</span>
              </div>
              <div className="flex items-start gap-2">
                <FiMail className="mt-0.5 h-4 w-4 text-slate-400" />
                <span>{form.support_email || '-'}</span>
              </div>
              <div className="flex items-start gap-2">
                <FiMapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                <span>{form.address || '-'}{form.city ? `, ${form.city}` : ''}</span>
              </div>
            </div>
          </section>
        </aside>
      </form>
    </>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', className = '' }) {
  const isTextarea = label === 'Address' || label === 'Footer note'

  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {isTextarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows="4"
          className="w-full border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
      )}
    </label>
  )
}
