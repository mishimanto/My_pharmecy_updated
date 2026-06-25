import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { adminApi } from '../../../api/adminApi'
import AdminLoadingState from '../../../components/admin/AdminLoadingState'
import { queryClient } from '../../../lib/queryClient'
import { customerQueryKeys } from '../../../queries/customerQueries'
import { toDateTimeLocal } from './dateUtils'
import { toolCopy } from './marketingConfig'
import { Field, FormHeader, MarketingList, SaveButton, StatCard, StatusField, ToolHeader, UploadField } from './shared'

const emptyOffer = {
  label: '',
  label_bn: '',
  title: '',
  title_bn: '',
  body: '',
  body_bn: '',
  button_label: 'Browse products',
  button_label_bn: 'পণ্য দেখুন',
  link_url: '/products',
  image_url: '',
  sort_order: 0,
  show_in_nav: false,
  starts_at: '',
  ends_at: '',
  status: 'active',
  discount_type: 'percent',
  discount_value: 0,
  max_discount: '',
  applies_to: 'all',
  category_id: '',
  manufacturer_id: '',
  product_ids: '',
}

export default function OffersTool() {
  const tool = toolCopy.offers
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyOffer)
  const [editingId, setEditingId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState([])
  const [manufacturers, setManufacturers] = useState([])
  const [products, setProducts] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const stats = useMemo(() => [['Offers', items.length], ['Active', items.filter((item) => item.status === 'active').length], ['Rules', items.filter((item) => Number(item.discount_value || 0) > 0).length]], [items])
  const selectedProductIds = useMemo(() => parseIds(form.product_ids), [form.product_ids])
  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase()
    if (!search) return products

    return products.filter((product) => [
      product.product_name,
      product.generic_name,
      product.brand_name,
      product.category?.category_name,
      product.manufacturer?.manufacturer_name,
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(search)))
  }, [productSearch, products])

  const load = () => {
    setLoading(true)
    adminApi.listFresh('offers').then((res) => setItems(res.data.data || [])).catch(() => toast.error('Unable to load offers.')).finally(() => setLoading(false))
  }

  const loadRuleOptions = () => {
    Promise.all([
      adminApi.listFresh('categories', { per_page: 100, status: 'active' }),
      adminApi.listFresh('manufacturers', { per_page: 100, status: 'active' }),
      adminApi.listFresh('products', { per_page: 100, status: 'active' }),
    ]).then(([categoryRes, manufacturerRes, productRes]) => {
      setCategories(readList(categoryRes))
      setManufacturers(readList(manufacturerRes))
      setProducts(readList(productRes))
    }).catch(() => toast.error('Unable to load offer rule options.'))
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, [])
  useEffect(loadRuleOptions, [])

  useEffect(() => {
    if (!imageFile) return undefined
    const objectUrl = URL.createObjectURL(imageFile)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [imageFile])

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const setAppliesTo = (value) => setForm((current) => ({
    ...current,
    applies_to: value,
    category_id: value === 'category' ? current.category_id : '',
    manufacturer_id: value === 'manufacturer' ? current.manufacturer_id : '',
    product_ids: value === 'products' ? current.product_ids : '',
  }))
  const toggleProduct = (id) => {
    const ids = selectedProductIds.includes(id)
      ? selectedProductIds.filter((value) => value !== id)
      : [...selectedProductIds, id]

    setField('product_ids', ids.join(','))
  }
  const reset = () => { setForm(emptyOffer); setEditingId(null); setImageFile(null); setPreview('') }
  const refreshStorefrontPricing = () => {
    queryClient.invalidateQueries({ queryKey: customerQueryKeys.offers })
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['product'] })
  }
  const edit = (item) => {
    setEditingId(item.id)
    setForm({
      ...emptyOffer,
      ...item,
      show_in_nav: Boolean(item.show_in_nav),
      image_url: item.image_path ? '' : item.image_url || '',
      starts_at: toDateTimeLocal(item.starts_at),
      ends_at: toDateTimeLocal(item.ends_at),
      max_discount: item.max_discount ?? '',
      category_id: item.category_id ?? '',
      manufacturer_id: item.manufacturer_id ?? '',
      product_ids: Array.isArray(item.product_ids) ? item.product_ids.join(',') : item.product_ids || '',
    })
    setPreview(item.image_src || item.image_url || '')
    setImageFile(null)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) return toast.error('Offer title is required.')
    if (Number(form.discount_value || 0) <= 0) return toast.error('Discount value must be greater than 0.')
    if (form.applies_to === 'category' && !form.category_id) return toast.error('Select a category for this offer.')
    if (form.applies_to === 'manufacturer' && !form.manufacturer_id) return toast.error('Select a manufacturer for this offer.')
    if (form.applies_to === 'products' && selectedProductIds.length === 0) return toast.error('Select at least one product for this offer.')

    const payload = new FormData()
    Object.entries({
      ...form,
      starts_at: form.starts_at || '',
      ends_at: form.ends_at || '',
      max_discount: form.max_discount || '',
      category_id: form.category_id || '',
      manufacturer_id: form.manufacturer_id || '',
    }).forEach(([key, value]) => {
      payload.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value ?? '')
    })
    if (imageFile) payload.append('image', imageFile)

    setSaving(true)
    try {
      editingId ? await adminApi.updateOffer(editingId, payload) : await adminApi.createOffer(payload)
      toast.success(editingId ? 'Offer updated.' : 'Offer created.')
      refreshStorefrontPricing()
      reset(); load()
    } catch (error) {
      const errors = error.response?.data?.errors
      toast.error((errors ? Object.values(errors).flat()[0] : null) || error.response?.data?.message || 'Unable to save offer.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return
    await adminApi.remove('offers', item.id).then(() => { toast.success('Offer deleted.'); refreshStorefrontPricing(); load() }).catch(() => toast.error('Unable to delete offer.'))
  }

  if (loading && items.length === 0) return <AdminLoadingState className="py-8" />

  return (
    <div className="space-y-5">
      <ToolHeader tool={tool} icon={tool.icon} actionLabel={editingId ? 'Editing Offer' : 'Add New'} />
      <div className="grid gap-4 md:grid-cols-3">{stats.map(([label, value]) => <StatCard key={label} label={label} value={value} />)}</div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <MarketingList title="Storefront offers" items={items} emptyText="No offers yet." onEdit={edit} onRemove={remove} renderMeta={offerMeta} renderTitle={(item) => item.title} image />
        <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <FormHeader title={editingId ? 'Edit offer' : 'Add offer'} editing={Boolean(editingId)} onCancel={reset} />
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Label" value={form.label} onChange={(value) => setField('label', value)} /><Field label="Label BN" value={form.label_bn} onChange={(value) => setField('label_bn', value)} /></div>
          <Field label="Title" value={form.title} onChange={(value) => setField('title', value)} required />
          <Field label="Title (Bangla)" value={form.title_bn} onChange={(value) => setField('title_bn', value)} />
          <Field label="Body" value={form.body} onChange={(value) => setField('body', value)} />
          <Field label="Body (Bangla)" value={form.body_bn} onChange={(value) => setField('body_bn', value)} />
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Button label" value={form.button_label} onChange={(value) => setField('button_label', value)} /><Field label="Button label BN" value={form.button_label_bn} onChange={(value) => setField('button_label_bn', value)} /></div>
          <Field label="Link URL" value={form.link_url} onChange={(value) => setField('link_url', value)} placeholder="/products" />

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-950">Discount rule</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <SelectField label="Discount type" value={form.discount_type} onChange={(value) => setField('discount_type', value)} options={[['percent', 'Percent'], ['fixed', 'Fixed taka']]} />
              <Field label="Discount value" type="number" value={form.discount_value} onChange={(value) => setField('discount_value', value)} />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Max discount" type="number" value={form.max_discount} onChange={(value) => setField('max_discount', value)} placeholder="Optional" />
              <SelectField label="Applies to" value={form.applies_to} onChange={setAppliesTo} options={[['all', 'All products'], ['category', 'Category'], ['manufacturer', 'Manufacturer'], ['products', 'Selected products']]} />
            </div>
            {form.applies_to === 'category' ? (
              <div className="mt-3">
                <SelectField
                  label="Category"
                  value={form.category_id}
                  onChange={(value) => setField('category_id', value)}
                  options={[['', 'Select category'], ...categories.map((category) => [String(category.id), category.category_name])]}
                />
              </div>
            ) : null}
            {form.applies_to === 'manufacturer' ? (
              <div className="mt-3">
                <SelectField
                  label="Manufacturer"
                  value={form.manufacturer_id}
                  onChange={(value) => setField('manufacturer_id', value)}
                  options={[['', 'Select manufacturer'], ...manufacturers.map((manufacturer) => [String(manufacturer.id), manufacturer.manufacturer_name])]}
                />
              </div>
            ) : null}
            {form.applies_to === 'products' ? (
              <ProductPicker
                products={filteredProducts}
                selectedIds={selectedProductIds}
                search={productSearch}
                onSearch={setProductSearch}
                onToggle={toggleProduct}
              />
            ) : null}
          </div>

          <Field label="Image CDN URL" value={form.image_url} onChange={(value) => { setField('image_url', value); if (value.trim()) { setImageFile(null); setPreview(value.trim()) } }} />
          <UploadField label="Upload offer image" onChange={(file) => { setImageFile(file); setField('image_url', '') }} />
          {preview ? <img src={preview} alt="" className="h-36 w-full rounded-md border border-slate-200 object-cover" /> : null}
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Starts at" type="datetime-local" value={form.starts_at} onChange={(value) => setField('starts_at', value)} /><Field label="Ends at" type="datetime-local" value={form.ends_at} onChange={(value) => setField('ends_at', value)} /></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Sort order" type="number" value={form.sort_order} onChange={(value) => setField('sort_order', value)} /><StatusField value={form.status} onChange={(value) => setField('status', value)} /></div>
          <ToggleField label="Show in top offer bar" checked={form.show_in_nav} onChange={(value) => setField('show_in_nav', value)} />
          <SaveButton saving={saving} label={editingId ? 'Update Offer' : 'Create Offer'} />
        </form>
      </div>
    </div>
  )
}

function offerMeta(item) {
  const discount = item.discount_type === 'fixed'
    ? `Tk ${Number(item.discount_value || 0)}`
    : `${Number(item.discount_value || 0)}%`
  const scope = {
    category: item.category?.category_name || 'Category',
    manufacturer: item.manufacturer?.manufacturer_name || 'Manufacturer',
    products: Array.isArray(item.product_ids) && item.product_ids.length ? `${item.product_ids.length} products` : 'Selected products',
    all: 'All products',
  }[item.applies_to || 'all']

  return [item.label || 'No label', discount, scope, item.show_in_nav ? 'Top nav' : null].filter(Boolean).join(' / ')
}

function readList(response) {
  const data = response.data?.data
  return Array.isArray(data) ? data : data?.data || []
}

function parseIds(value) {
  if (Array.isArray(value)) {
    return value.map((id) => Number(id)).filter(Boolean)
  }

  return String(value || '')
    .split(',')
    .map((id) => Number(id.trim()))
    .filter(Boolean)
}

function productLabel(product) {
  return [
    product.product_name,
    product.strength,
    product.manufacturer?.manufacturer_name ? `- ${product.manufacturer.manufacturer_name}` : null,
  ].filter(Boolean).join(' ')
}

function ProductPicker({ products, selectedIds, search, onSearch, onToggle }) {
  return (
    <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-slate-800" htmlFor="offer-product-search">Products</label>
        <span className="text-xs font-medium text-slate-500">{selectedIds.length} selected</span>
      </div>
      <input
        id="offer-product-search"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder="Search product by name, generic, brand..."
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0e6574] focus:ring-2 focus:ring-[#0e6574]/10"
      />
      <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
        {products.length > 0 ? products.map((product) => (
          <label key={product.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm transition hover:border-[#0e6574]/30 hover:bg-[#e8fbf9]">
            <input
              type="checkbox"
              checked={selectedIds.includes(Number(product.id))}
              onChange={() => onToggle(Number(product.id))}
              className="mt-0.5 h-4 w-4 accent-[#0e6574]"
            />
            <span className="min-w-0">
              <span className="block font-semibold text-slate-900">{productLabel(product)}</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {[product.category?.category_name, product.generic_name].filter(Boolean).join(' / ') || 'No extra details'}
              </span>
            </span>
          </label>
        )) : (
          <div className="rounded-md border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
            No products found.
          </div>
        )}
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none">
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  )
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[#0e6574]"
      />
    </label>
  )
}
