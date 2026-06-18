import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiSave, FiUploadCloud, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminApi } from '../../../api/adminApi'
import { productApi } from '../../../api/productApi'
import AdminLoadingState from '../../../components/admin/AdminLoadingState'
import { clearManufacturersCache } from '../../../utils/adminManufacturerCache'
import { getManufacturerImage, handleImageFallback } from '../../../utils/imageUrl'

const initialForm = {
  manufacturer_name: '',
  country: '',
  status: 'active',
}

function formFromManufacturer(manufacturer) {
  return {
    manufacturer_name: manufacturer?.manufacturer_name || '',
    country: manufacturer?.country || '',
    status: manufacturer?.status || 'active',
  }
}

function initials(name) {
  return name?.slice(0, 2)?.toUpperCase() || 'NA'
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

export default function ManufacturerForm({ mode = 'create' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(initialForm)
  const [logoFile, setLogoFile] = useState(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEdit) return undefined

    let active = true

    adminApi.show('manufacturers', id)
      .then(({ data }) => {
        if (!active) return
        const manufacturer = data.data
        setForm(formFromManufacturer(manufacturer))
        setPreview(manufacturer.logo_url ? getManufacturerImage(manufacturer, '') : '')
      })
      .catch(() => active && toast.error('Unable to load manufacturer details.'))
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [id, isEdit])

  const previewInitials = useMemo(() => initials(form.manufacturer_name), [form.manufacturer_name])

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
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
    setRemoveLogo(true)
    setPreview('')
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!form.manufacturer_name.trim()) {
      toast.error('Manufacturer name is required.')
      return
    }

    const payload = {
      manufacturer_name: form.manufacturer_name.trim(),
      country: form.country.trim() || null,
      status: form.status,
    }

    if (logoFile) {
      payload.logo_data = await resizeLogoToDataUri(logoFile)
    } else if (removeLogo) {
      payload.remove_logo = true
    }

    setSaving(true)
    try {
      if (isEdit) {
        await adminApi.updateManufacturer(id, payload)
        toast.success('Manufacturer updated.')
      } else {
        await adminApi.createManufacturer(payload)
        toast.success('Manufacturer created.')
      }

      clearManufacturersCache()
      productApi.clearCache()
      navigate('/admin/manufacturers')
    } catch (error) {
      const errors = error.response?.data?.errors
      const firstError = errors ? Object.values(errors).flat()[0] : null
      toast.error(firstError || error.response?.data?.message || 'Unable to save manufacturer.')
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
          <h2 className="text-lg font-semibold text-slate-950">{isEdit ? 'Edit manufacturer' : 'Create manufacturer'}</h2>
          
        </div>
        <Link to="/admin/manufacturers" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700">
          <FiArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Company name</span>
              <input
                value={form.manufacturer_name}
                onChange={(event) => setField('manufacturer_name', event.target.value)}
                placeholder="Square Pharmaceuticals"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Country</span>
              <input
                value={form.country}
                onChange={(event) => setField('country', event.target.value)}
                placeholder="Bangladesh"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
              <select
                value={form.status}
                onChange={(event) => setField('status', event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Logo</span>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700">
                <FiUploadCloud className="h-4 w-4" />
                <span>Choose image</span>
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </label>
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">Profile preview</div>
          <div className="mt-4 flex flex-col items-center rounded-md border border-slate-200 bg-slate-50 p-4 text-center">
            {preview && !removeLogo ? (
              <img src={preview} alt="Manufacturer logo preview" loading="lazy" decoding="async" onError={handleImageFallback} className="h-24 w-24 bg-white object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-slate-200 bg-white text-xl font-semibold text-slate-500">
                {previewInitials}
              </div>
            )}
            <div className="mt-3 font-semibold text-slate-950">{form.manufacturer_name || 'Manufacturer name'}</div>
            <div className="mt-1 text-sm text-slate-600">{form.country || 'Country'}</div>
            <div className={`mt-3 text-xs font-semibold ${form.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {form.status === 'active' ? 'Active' : 'Inactive'}
            </div>
          </div>

          {preview && !removeLogo ? (
            <button type="button" onClick={clearLogo} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-rose-200 hover:text-rose-600">
              <FiX className="h-4 w-4" />
              <span>Remove logo</span>
            </button>
          ) : null}

          <button disabled={saving} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
            <FiSave className="h-4 w-4" />
            <span>{saving ? 'Saving...' : isEdit ? 'Update manufacturer' : 'Create manufacturer'}</span>
          </button>
        </div>
      </div>
    </form>
  )
}
