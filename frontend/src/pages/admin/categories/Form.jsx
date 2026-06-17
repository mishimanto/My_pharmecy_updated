import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminApi } from '../../../api/adminApi'
import AdminLoadingState from '../../../components/admin/AdminLoadingState'
import { clearCategoriesCache } from '../../../utils/adminCategoryCache'

const initialForm = {
  parent_id: '',
  category_name: '',
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
            description: category.description || '',
            status: category.status || 'active',
          })
        })
        .catch(() => active && toast.error('Unable to load category.'))
        .finally(() => active && setLoading(false))
    }

    return () => { active = false }
  }, [id, isEdit])

  const selectedParent = useMemo(
    () => parentOptions.find((category) => String(category.id) === String(form.parent_id)),
    [form.parent_id, parentOptions],
  )

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const saveCategory = async (event) => {
    event.preventDefault()

    if (!form.category_name.trim()) {
      toast.error('Category name is required.')
      return
    }

    const payload = {
      ...form,
      parent_id: form.parent_id || null,
      category_name: form.category_name.trim(),
      description: form.description.trim() || null,
    }

    setSaving(true)
    try {
      if (isEdit) {
        await adminApi.update('categories', id, payload)
        toast.success('Category updated.')
      } else {
        await adminApi.create('categories', payload)
        toast.success('Category created.')
      }
      clearCategoriesCache()
      navigate('/admin/categories')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save category.')
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

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
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
