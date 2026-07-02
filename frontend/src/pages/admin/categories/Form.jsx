import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiImage, FiSave, FiUploadCloud, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminApi } from '../../../api/adminApi'
import AdminLoadingState from '../../../components/admin/AdminLoadingState'
import { clearCategoriesCache } from '../../../utils/adminCategoryCache'
import { resolveImageUrl } from '../../../utils/imageUrl'

const initialForm = {
  parent_id: '',
  category_name: '',
  category_name_bn: '',
  image_url: '',
  description: '',
  status: 'active',
}

export default function CategoryForm({ mode = 'create' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = mode === 'edit'
  const [parentOptions, setParentOptions] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState('')

  useEffect(() => {
    let active = true

    adminApi.listFresh('categories', { per_page: 100, page: 1 })
      .then(({ data }) => active && setParentOptions(data.data?.data || []))
      .catch(() => active && toast.error('Unable to load parent categories.'))

    if (isEdit) {
      adminApi.show('categories', id)
        .then(({ data }) => {
          if (!active) return
          const category = data.data
          setForm({
            parent_id: category.parent_id || '',
            category_name: category.category_name || '',
            category_name_bn: category.category_name_bn || '',
            image_url: category.image_path ? '' : category.image_url || '',
            description: category.description || '',
            status: category.status || 'active',
          })
          setPreview(category.image_url || '')
        })
        .catch(() => active && toast.error('Unable to load category.'))
        .finally(() => active && setLoading(false))
    }

    return () => { active = false }
  }, [id, isEdit])

  useEffect(() => {
    if (!imageFile) return undefined

    const objectUrl = URL.createObjectURL(imageFile)
    setPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [imageFile])

  const selectedParent = useMemo(
    () => parentOptions.find((category) => String(category.id) === String(form.parent_id)),
    [form.parent_id, parentOptions],
  )

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const clearImage = () => {
    setImageFile(null)
    setPreview('')
    setForm((current) => ({ ...current, image_url: '' }))
  }

  const saveCategory = async (event) => {
    event.preventDefault()

    if (!form.category_name.trim()) {
      toast.error('Category name is required.')
      return
    }

    const payload = new FormData()
    payload.append('parent_id', form.parent_id || '')
    payload.append('category_name', form.category_name.trim())
    payload.append('category_name_bn', form.category_name_bn.trim())
    payload.append('image_url', form.image_url.trim())
    payload.append('description', form.description.trim())
    payload.append('status', form.status)

    if (imageFile) {
      payload.append('image', imageFile)
    }

    if (isEdit && !imageFile && !form.image_url.trim() && !preview) {
      payload.append('remove_image', '1')
    }

    setSaving(true)
    try {
      if (isEdit) {
        await adminApi.updateCategory(id, payload)
        toast.success('Category updated.')
      } else {
        await adminApi.createCategory(payload)
        toast.success('Category created.')
      }
      clearCategoriesCache()
      navigate('/admin/categories')
    } catch (error) {
      const errors = error.response?.data?.errors
      const firstError = errors ? Object.values(errors).flat()[0] : null
      toast.error(firstError || error.response?.data?.message || 'Unable to save category.')
    } finally {
      setSaving(false)
    }
  }

  const selectableParents = parentOptions.filter((category) => String(category.id) !== String(id))

  if (loading) {
    return <AdminLoadingState className="py-8" />
  }

  return (
    <form onSubmit={saveCategory} className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{isEdit ? 'Edit category' : 'Create category'}</h2>
        </div>
        <Link to="/admin/categories" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700">
          <FiArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Category name</span>
              <input
                value={form.category_name}
                onChange={(event) => setField('category_name', event.target.value)}
                placeholder="Pain Relief"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Category name (Bangla)</span>
              <input
                value={form.category_name_bn}
                onChange={(event) => setField('category_name_bn', event.target.value)}
                placeholder="ব্যথা উপশম"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Parent category</span>
              <select
                value={form.parent_id}
                onChange={(event) => setField('parent_id', event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">No parent</option>
                {selectableParents.map((category) => (
                  <option key={category.id} value={category.id}>{category.category_name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Image CDN URL</span>
              <input
                value={form.image_url}
                onChange={(event) => {
                  const value = event.target.value
                  setField('image_url', value)
                  if (value.trim()) {
                    setImageFile(null)
                    setPreview(value.trim())
                  } else if (!imageFile) {
                    setPreview('')
                  }
                }}
                placeholder="https://cdn.example.com/category.webp"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>

          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              {/* <div>
                <div className="text-md font-medium text-slate-700">Category image</div>
              </div> */}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700">
                <FiUploadCloud className="h-4 w-4" />
                <span>Upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null
                    setImageFile(file)
                    if (file) {
                      setField('image_url', '')
                    }
                  }}
                />
              </label>
            </div>

            <div className="mt-4">
              {preview ? (
                <div className="relative h-40 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <img src={resolveImageUrl(preview, '')} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-sm transition hover:text-rose-600"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-slate-400">
                  <FiImage className="h-6 w-6" />
                </div>
              )}
            </div>
          </div>

          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => setField('description', event.target.value)}
              placeholder="Short catalog description"
              rows="5"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
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

          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</div>
            <div className="mt-2 font-semibold text-slate-950">{form.category_name || 'Category name'}</div>
            <div className="mt-1 text-sm text-slate-600">{form.category_name_bn || 'Bangla name (optional)'}</div>
            <div className="mt-1 text-sm text-slate-600">{selectedParent?.category_name || 'Root category'}</div>
            <div className={`mt-3 text-xs font-semibold ${form.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {form.status === 'active' ? 'Active' : 'Inactive'}
            </div>
          </div>

          <button disabled={saving} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
            <FiSave className="h-4 w-4" />
            <span>{saving ? 'Saving...' : isEdit ? 'Update category' : 'Create category'}</span>
          </button>
        </div>
      </div>
    </form>
  )
}
