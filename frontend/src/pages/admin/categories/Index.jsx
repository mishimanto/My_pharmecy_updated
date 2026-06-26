/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiChevronDown, FiChevronRight, FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../../api/adminApi'
import AdminFilterBar from '../../../components/admin/AdminFilterBar'
import AdminLoadingState from '../../../components/admin/AdminLoadingState'
import EmptyState from '../../../components/common/EmptyState'
import {
  clearCategoriesCache,
  readCategoriesCache,
  writeCategoriesCache,
} from '../../../utils/adminCategoryCache'

const statuses = ['', 'active', 'inactive']

function statusClass(status) {
  return status === 'active' ? 'text-emerald-600' : 'text-rose-600'
}

function byParent(categories) {
  return categories.reduce((grouped, category) => {
    const key = category.parent_id || 'root'
    grouped[key] = [...(grouped[key] || []), category]
    return grouped
  }, {})
}

export default function CategoryIndex() {
  const initialParams = { search: '', status: '', parent_id: '', page: 1 }
  const initialCache = readCategoriesCache(initialParams)
  const [params, setParams] = useState(initialParams)
  const [categories, setCategories] = useState(initialCache?.categories || [])
  const [allCategories, setAllCategories] = useState([])
  const [meta, setMeta] = useState(initialCache?.meta || null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(!initialCache)
  const [updating, setUpdating] = useState(false)
  const [expanded, setExpanded] = useState({})

  const childrenByParent = useMemo(() => byParent(allCategories), [allCategories])
  const isHierarchyView = !params.search && (params.parent_id === '' || params.parent_id === 'root')
  const tableRows = isHierarchyView ? categories.filter((category) => !category.parent_id) : categories

  const loadHierarchy = () => {
    adminApi.listFresh('categories', { per_page: 100, page: 1 })
      .then(({ data }) => setAllCategories(data.data?.data || []))
      .catch(() => {})
  }

  useEffect(() => {
    loadHierarchy()
  }, [])

  useEffect(() => {
    let active = true
    const cached = readCategoriesCache(params)

    if (cached) {
      setCategories(cached.categories || [])
      setMeta(cached.meta || null)
      setLoading(false)
      setUpdating(false)
      return () => { active = false }
    }

    const hasRows = categories.length > 0
    setLoading(!hasRows)
    setUpdating(hasRows)

    adminApi.listFresh('categories', params)
      .then(({ data }) => {
        if (!active) return
        const payload = {
          categories: data.data?.data || [],
          meta: data.data,
        }
        setCategories(payload.categories)
        setMeta(payload.meta)
        writeCategoriesCache(params, payload)
      })
      .catch(() => active && toast.error('Unable to load categories.'))
      .finally(() => {
        if (!active) return
        setLoading(false)
        setUpdating(false)
      })

    return () => { active = false }
  }, [params])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setParams((current) => current.search === search ? current : { ...current, search, parent_id: '', page: 1 })
    }, 350)

    return () => clearTimeout(timeout)
  }, [search])

  const updateParams = (nextParams) => {
    setParams(nextParams)
  }
  const statusFilterOptions = statuses.map((status) => ({
    value: status,
    label: status ? status[0].toUpperCase() + status.slice(1) : 'All Statuses',
  }))
  const parentFilterOptions = [
    { value: '', label: 'All categories' },
    { value: 'root', label: 'Root categories' },
    ...allCategories.map((category) => ({ value: String(category.id), label: category.category_name })),
  ]

  const toggleExpanded = (id) => {
    setExpanded((current) => ({ ...current, [id]: !current[id] }))
  }

  const removeCategory = async (category) => {
    if (category.products_count > 0) {
      await Swal.fire({
        title: 'Category is in use',
        text: 'Move or remove the products in this category before deleting it.',
        confirmButtonText: 'OK',
      })
      return
    }

    const result = await Swal.fire({
      title: 'Delete this category?',
      text: 'This action will permanently remove the category.',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    })

    if (!result.isConfirmed) return

    try {
      await adminApi.remove('categories', category.id)
      clearCategoriesCache()
      loadHierarchy()
      toast.success('Category deleted.')
      setParams((current) => ({ ...current }))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete category.')
    }
  }

  return (
    <>
      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by category, status, or description"
        filters={[
          {
            key: 'status',
            value: params.status,
            onChange: (value) => updateParams({ ...params, status: value, page: 1 }),
            options: statusFilterOptions,
          },
          {
            key: 'parent_id',
            value: params.parent_id,
            onChange: (value) => updateParams({ ...params, parent_id: value, page: 1 }),
            options: parentFilterOptions,
          },
        ]}
      >
        <Link to="/admin/categories/create" className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-700">
          <FiPlus className="h-4 w-4" />
          <span>Add Category</span>
        </Link>
      </AdminFilterBar>

      {updating ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading && categories.length === 0 ? <AdminLoadingState className="py-8" /> : null}
      {!loading && tableRows.length === 0 ? (
        <EmptyState title="No categories found" text="Try another search term or adjust the filters." />
      ) : null}

      {tableRows.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Parent</th>
                <th className="px-4 py-3 text-center">Products</th>
                <th className="px-4 py-3 text-center">Subcategories</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableRows.map((category) => {
                const children = (childrenByParent[category.id] || []).filter((child) => !params.status || child.status === params.status)
                const isOpen = expanded[category.id]

                return (
                  <Fragment key={category.id}>
                    <tr className="bg-white">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {isHierarchyView ? (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(category.id)}
                              disabled={children.length === 0}
                              className="flex h-6 w-6 items-center justify-center text-slate-900 transition hover:text-emerald-700 disabled:cursor-default disabled:opacity-30"
                              title={children.length ? 'Toggle subcategories' : 'No subcategories'}
                            >
                              {isOpen ? <FiChevronDown className="h-4 w-4" /> : <FiChevronRight className="h-4 w-4" />}
                            </button>
                          ) : null}
                          <div>
                            <div className="font-semibold text-slate-950">{category.category_name}</div>                            
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{category.parent?.category_name || 'Root category'}</td>
                      <td className="px-4 py-3 text-center text-slate-700">{category.products_count || 0}</td>
                      <td className="px-4 py-3 text-center text-slate-700">{children.length || category.children_count || 0}</td>
                      <td className="px-4 py-3 text-center"><span className={`text-xs font-semibold ${statusClass(category.status)}`}>{category.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-3">
                          <Link to={`/admin/categories/${category.id}/edit`} className="flex h-8 w-8 items-center justify-center text-emerald-700 transition hover:text-emerald-800" title="Edit category">
                            <FiEdit className="h-4 w-4" />
                          </Link>
                          <button disabled={category.products_count > 0} onClick={() => removeCategory(category)} className="flex h-8 w-8 items-center justify-center text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300" title={category.products_count > 0 ? 'Category has products' : 'Delete category'}>
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isHierarchyView && isOpen && children.map((child, index) => (
                      <tr key={`${category.id}-${child.id}`} className="bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="ml-10 flex items-center gap-3">
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-500 ring-1 ring-slate-200">{index + 1}</span>
                            <div className="font-medium text-slate-900">{child.category_name}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{category.category_name}</td>
                        <td className="px-4 py-3 text-center text-slate-700">{child.products_count || 0}</td>
                        <td className="px-4 py-3 text-center text-slate-700">{child.children_count || 0}</td>
                        <td className="px-4 py-3 text-center"><span className={`text-xs font-semibold ${statusClass(child.status)}`}>{child.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-3">
                            <Link to={`/admin/categories/${child.id}/edit`} className="flex h-8 w-8 items-center justify-center text-emerald-700 transition hover:text-emerald-800" title="Edit category">
                              <FiEdit className="h-4 w-4" />
                            </Link>
                            <button disabled={child.products_count > 0} onClick={() => removeCategory(child)} className="flex h-8 w-8 items-center justify-center text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300" title={child.products_count > 0 ? 'Category has products' : 'Delete category'}>
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {meta?.last_page > 1 ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Page {meta.current_page || params.page} / {meta.last_page}</span>
          <div className="flex justify-end gap-2">
            <button disabled={params.page <= 1} onClick={() => updateParams({ ...params, page: params.page - 1 })} className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
            <button disabled={params.page >= meta.last_page} onClick={() => updateParams({ ...params, page: params.page + 1 })} className="rounded-md border border-slate-300 px-3 py-1 font-medium transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
          </div>
        </div>
      ) : null}
    </>
  )
}
