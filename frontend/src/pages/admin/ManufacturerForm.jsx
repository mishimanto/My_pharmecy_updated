import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import { adminApi } from '../../api/adminApi'
import { productApi } from '../../api/productApi'
import { getCachedItem, setCachedItem } from '../../utils/adminResourceCache'

function formFromManufacturer(manufacturer) {
  return {
    manufacturer_name: manufacturer?.manufacturer_name || '',
    country: manufacturer?.country || '',
    status: manufacturer?.status || 'active',
  }
}

export default function ManufacturerForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const seededManufacturer = editing ? getCachedItem('manufacturers', id) : null
  const [form, setForm] = useState(() => formFromManufacturer(seededManufacturer))
  const [logoFile, setLogoFile] = useState(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const [preview, setPreview] = useState(seededManufacturer?.logo_url || '')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(editing && !seededManufacturer)

  useEffect(() => {
    if (!editing) return

    let active = true

    adminApi.show('manufacturers', id).then(({ data }) => {
      if (!active) return
      const manufacturer = data.data
      setCachedItem('manufacturers', id, manufacturer)
      setForm(formFromManufacturer(manufacturer))
      setPreview(manufacturer.logo_url || '')
    }).catch(() => active && toast.error('Unable to load manufacturer details.'))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [editing, id])

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0] || null
    setLogoFile(file)

    if (file) {
      setPreview(URL.createObjectURL(file))
      setRemoveLogo(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)

    const payload = new FormData()
    payload.append('manufacturer_name', form.manufacturer_name)
    payload.append('country', form.country)
    payload.append('status', form.status)

    if (logoFile) {
      payload.append('logo', logoFile)
    }

    if (removeLogo) {
      payload.append('remove_logo', '1')
    }

    try {
      if (editing) {
        payload.append('_method', 'PUT')
        const response = await adminApi.updateManufacturer(id, payload)
        setCachedItem('manufacturers', id, response.data.data)
      } else {
        const response = await adminApi.createManufacturer(payload)
        setCachedItem('manufacturers', response.data.data.id, response.data.data)
      }

      productApi.clearCache()

      toast.success(editing ? 'Manufacturer updated.' : 'Manufacturer created.')
      navigate('/admin/manufacturers')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save manufacturer.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title={editing ? 'Edit Manufacturer' : 'New Manufacturer'}
        subtitle="Set the company name, logo, country, and active status."
      />

      {loading ? (
        <FormSkeleton />
      ) : (
        <form className="grid gap-5 rounded-2xl border bg-white p-5 shadow-sm md:grid-cols-2" onSubmit={submit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Company name</label>
            <input
              className="w-full rounded-xl border px-3 py-2.5"
              placeholder="Manufacturer name"
              value={form.manufacturer_name}
              onChange={(event) => setForm({ ...form, manufacturer_name: event.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Country</label>
            <input
              className="w-full rounded-xl border px-3 py-2.5"
              placeholder="Country"
              value={form.country}
              onChange={(event) => setForm({ ...form, country: event.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <select className="w-full rounded-xl border px-3 py-2.5" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 p-4">
            <label className="block text-sm font-medium text-slate-700">Company logo</label>
            <input type="file" accept="image/*" onChange={handleLogoChange} />
            {preview && !removeLogo ? <img src={preview} alt="Manufacturer logo preview" className="h-24 w-24 rounded-2xl border object-cover" /> : null}
            {editing && preview ? (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={removeLogo} onChange={(event) => setRemoveLogo(event.target.checked)} />
                Remove current logo
              </label>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <button disabled={saving} className="rounded-xl bg-slate-950 px-4 py-2.5 text-white disabled:opacity-60">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </>
  )
}

function FormSkeleton() {
  return (
    <div className="grid animate-pulse gap-5 rounded-2xl border bg-white p-5 md:grid-cols-2">
      <div className="space-y-2">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="h-11 rounded-xl bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-11 rounded-xl bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-20 rounded bg-slate-200" />
        <div className="h-11 rounded-xl bg-slate-100" />
      </div>
      <div className="rounded-2xl border border-dashed border-slate-200 p-4">
        <div className="h-24 w-24 rounded-2xl bg-slate-100" />
      </div>
    </div>
  )
}
