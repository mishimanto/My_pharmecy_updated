import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiImage, FiSave, FiTrash2, FiUploadCloud, FiX } from 'react-icons/fi'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../../api/adminApi'
import { productApi } from '../../../api/productApi'
import AdminLoadingState from '../../../components/admin/AdminLoadingState'
import { clearProductsCache } from '../../../utils/adminProductCache'
import { handleImageFallback, resolveImageUrl } from '../../../utils/imageUrl'

const initialForm = {
  category_id: '',
  manufacturer_id: '',
  product_name: '',
  generic_name: '',
  brand_name: '',
  strength: '',
  dosage_form: '',
  pieces_per_strip: 10,
  strips_per_box: 10,
  strip_price: '',
  box_price: '',
  requires_prescription: false,
  description: '',
  description_bn: '',
  is_active: true,
}

const initialBatchForm = {
  enabled: false,
  supplier_id: '',
  batch_number: '',
  expiry_date: '',
  manufactured_date: '',
  purchase_price: '',
  selling_price: '',
  stock_quantity: '',
}

function formFromProduct(product) {
  return {
    ...initialForm,
    ...product,
    category_id: product?.category_id || '',
    manufacturer_id: product?.manufacturer_id || '',
    strip_price: product?.strip_price ?? '',
    box_price: product?.box_price ?? '',
    requires_prescription: Boolean(product?.requires_prescription),
    is_active: product?.is_active ?? true,
  }
}

function filePreview(files, images) {
  if (files.length > 0) {
    return URL.createObjectURL(files[0])
  }

  if (images.length > 0) {
    return resolveImageUrl(images[0].image_url || images[0].image_path || images[0].path)
  }

  return ''
}

function readFileAsDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function resizeProductImageToDataUri(file) {
  const source = await readFileAsDataUri(file)

  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const maxSize = 420
      const width = image.naturalWidth || image.width
      const height = image.naturalHeight || image.height
      const scale = Math.min(1, maxSize / Math.max(width, height))
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      canvas.width = Math.max(1, Math.round(width * scale))
      canvas.height = Math.max(1, Math.round(height * scale))
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.68))
    }
    image.onerror = reject
    image.src = source
  })
}

async function uploadProductImageInChunks(productId, dataUri, isPrimary) {
  const chunkSize = 1200
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const total = Math.ceil(dataUri.length / chunkSize)

  for (let index = 0; index < total; index += 1) {
    await adminApi.uploadProductImageChunk(productId, {
      upload_id: uploadId,
      index,
      total,
      chunk: dataUri.slice(index * chunkSize, (index + 1) * chunkSize),
      primary: isPrimary ? 1 : 0,
    })
  }
}

export default function ProductForm({ mode = 'create' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(initialForm)
  const [categories, setCategories] = useState([])
  const [manufacturers, setManufacturers] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [batchForm, setBatchForm] = useState(initialBatchForm)
  const [images, setImages] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    Promise.all([
      adminApi.listFresh('categories', { per_page: 100 }),
      adminApi.listFresh('manufacturers', { per_page: 100 }),
      adminApi.listFresh('suppliers', { per_page: 100, status: 'active' }),
    ]).then(([categoryResponse, manufacturerResponse, supplierResponse]) => {
      if (!active) return
      setCategories(categoryResponse.data.data?.data || [])
      setManufacturers(manufacturerResponse.data.data?.data || [])
      setSuppliers(supplierResponse.data.data?.data || [])
    }).catch(() => active && toast.error('Unable to load product options.'))

    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!isEdit) return undefined

    let active = true

    adminApi.show('products', id)
      .then(({ data }) => {
        if (!active) return
        const product = data.data
        setForm(formFromProduct(product))
        setImages(product.images || [])
      })
      .catch(() => active && toast.error('Unable to load product details.'))
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [id, isEdit])

  const preview = useMemo(() => filePreview(files, images), [files, images])
  const selectedCategory = categories.find((category) => String(category.id) === String(form.category_id))
  const selectedManufacturer = manufacturers.find((manufacturer) => String(manufacturer.id) === String(form.manufacturer_id))

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const setBatchField = (field, value) => {
    setBatchForm((current) => ({ ...current, [field]: value }))
  }

  const handleFiles = (event) => {
    setFiles(Array.from(event.target.files || []))
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!form.product_name.trim()) {
      toast.error('Product name is required.')
      return
    }

    setSaving(true)

    try {
      const payload = {
        ...form,
        product_name: form.product_name.trim(),
        generic_name: form.generic_name?.trim() || null,
        brand_name: form.brand_name?.trim() || null,
        strength: form.strength?.trim() || null,
        dosage_form: form.dosage_form?.trim() || null,
        description: form.description?.trim() || null,
        description_bn: form.description_bn?.trim() || null,
        pieces_per_strip: Number(form.pieces_per_strip || 1),
        strips_per_box: Number(form.strips_per_box || 1),
        strip_price: form.strip_price === '' ? null : Number(form.strip_price),
        box_price: form.box_price === '' ? null : Number(form.box_price),
        requires_prescription: Boolean(form.requires_prescription),
        is_active: Boolean(form.is_active),
      }

      if (batchForm.enabled) {
        payload.initial_batch = {
          enabled: true,
          supplier_id: batchForm.supplier_id,
          batch_number: batchForm.batch_number.trim(),
          expiry_date: batchForm.expiry_date,
          manufactured_date: batchForm.manufactured_date || null,
          purchase_price: Number(batchForm.purchase_price || 0),
          selling_price: Number(batchForm.selling_price || 0),
          stock_quantity: Number(batchForm.stock_quantity || 0),
        }
      }

      const response = isEdit ? await adminApi.update('products', id, payload) : await adminApi.create('products', payload)
      const productId = id || response.data.data.id

      if (files.length > 0) {
        for (const [index, file] of files.entries()) {
          const imageData = await resizeProductImageToDataUri(file)
          await uploadProductImageInChunks(productId, imageData, index === 0)
        }
      }

      clearProductsCache()
      productApi.clearCache()
      toast.success(isEdit ? 'Product updated.' : 'Product created.')
      navigate('/admin/products')
    } catch (error) {
      const errors = error.response?.data?.errors
      const firstError = errors ? Object.values(errors).flat()[0] : null
      toast.error(firstError || error.response?.data?.message || 'Unable to save product.')
    } finally {
      setSaving(false)
    }
  }

  const removeImage = async (image) => {
    const result = await Swal.fire({
      title: 'Delete this image?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    })

    if (!result.isConfirmed) return

    await adminApi.deleteProductImage(image.id)
    clearProductsCache()
    productApi.clearCache()
    toast.success('Image deleted.')
    setImages((current) => current.filter((item) => item.id !== image.id))
  }

  if (loading) {
    return <AdminLoadingState className="py-8" />
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{isEdit ? 'Edit product' : 'Create product'}</h2>
        </div>
        <Link to="/admin/products" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700">
          <FiArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 text-sm font-semibold text-slate-900">Basic information</div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Product name</span>
                <input value={form.product_name} onChange={(event) => setField('product_name', event.target.value)} placeholder="Napa 500 mg Tablet" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Category</span>
                <select value={form.category_id} onChange={(event) => setField('category_id', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
                  <option value="">Select category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.category_name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Manufacturer</span>
                <select value={form.manufacturer_id} onChange={(event) => setField('manufacturer_id', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
                  <option value="">Select manufacturer</option>
                  {manufacturers.map((manufacturer) => <option key={manufacturer.id} value={manufacturer.id}>{manufacturer.manufacturer_name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Generic name</span>
                <input value={form.generic_name || ''} onChange={(event) => setField('generic_name', event.target.value)} placeholder="Paracetamol" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Brand name</span>
                <input value={form.brand_name || ''} onChange={(event) => setField('brand_name', event.target.value)} placeholder="Napa" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Strength</span>
                <input value={form.strength || ''} onChange={(event) => setField('strength', event.target.value)} placeholder="500 mg" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Dosage form</span>
                <input value={form.dosage_form || ''} onChange={(event) => setField('dosage_form', event.target.value)} placeholder="Tablet" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold text-slate-900">Initial inventory batch</div>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={batchForm.enabled} onChange={(event) => setBatchField('enabled', event.target.checked)} className="h-4 w-4 accent-emerald-600" />
                <span>Add stock now</span>
              </label>
            </div>

            {batchForm.enabled ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Supplier</span>
                  <select value={batchForm.supplier_id} onChange={(event) => setBatchField('supplier_id', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
                    <option value="">Select supplier</option>
                    {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.supplier_name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Batch number</span>
                  <input value={batchForm.batch_number} onChange={(event) => setBatchField('batch_number', event.target.value)} placeholder="BATCH-001" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Expiry date</span>
                  <input type="date" value={batchForm.expiry_date} onChange={(event) => setBatchField('expiry_date', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Manufactured date</span>
                  <input type="date" value={batchForm.manufactured_date} onChange={(event) => setBatchField('manufactured_date', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Purchase price</span>
                  <input type="number" min="0" step="0.01" value={batchForm.purchase_price} onChange={(event) => setBatchField('purchase_price', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Selling price</span>
                  <input type="number" min="0" step="0.01" value={batchForm.selling_price} onChange={(event) => setBatchField('selling_price', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Stock quantity</span>
                  <input type="number" min="1" value={batchForm.stock_quantity} onChange={(event) => setBatchField('stock_quantity', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
                </label>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                Products without an active batch will stay hidden from the storefront until stock is added.
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 text-sm font-semibold text-slate-900">Packaging and pricing</div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Pieces per strip</span>
                <input type="number" min="1" value={form.pieces_per_strip} onChange={(event) => setField('pieces_per_strip', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Strips per box</span>
                <input type="number" min="1" value={form.strips_per_box} onChange={(event) => setField('strips_per_box', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Strip price</span>
                <input type="number" min="0" step="0.01" value={form.strip_price} onChange={(event) => setField('strip_price', event.target.value)} placeholder="Optional" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Box price</span>
                <input type="number" min="0" step="0.01" value={form.box_price} onChange={(event) => setField('box_price', event.target.value)} placeholder="Optional" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 text-sm font-semibold text-slate-900">Description</div>
            <div className="grid gap-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
                <textarea rows="4" value={form.description || ''} onChange={(event) => setField('description', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Description BN</span>
                <textarea rows="4" value={form.description_bn || ''} onChange={(event) => setField('description_bn', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
              </label>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Product preview</div>
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
              {preview ? (
                <img src={preview} alt="Product preview" loading="lazy" decoding="async" onError={handleImageFallback} className="h-44 w-full rounded-md border border-slate-200 bg-white object-cover" />
              ) : (
                <div className="flex h-44 w-full items-center justify-center rounded-md border border-dashed border-slate-300 bg-white text-slate-400">
                  <FiImage className="h-9 w-9" />
                </div>
              )}
              <div className="mt-3 font-semibold text-slate-950">{form.product_name || 'Product name'}</div>
              <div className="mt-1 text-sm text-slate-600">{selectedCategory?.category_name || 'Category'} / {selectedManufacturer?.manufacturer_name || 'Manufacturer'}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className={form.is_active ? 'text-emerald-600' : 'text-rose-600'}>{form.is_active ? 'Active' : 'Inactive'}</span>
                <span className={form.requires_prescription ? 'text-amber-600' : 'text-slate-500'}>{form.requires_prescription ? 'Prescription required' : 'No prescription'}</span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Controls</div>
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                <span>Active product</span>
                <input type="checkbox" checked={Boolean(form.is_active)} onChange={(event) => setField('is_active', event.target.checked)} className="h-4 w-4 accent-emerald-600" />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                <span>Prescription required</span>
                <input type="checkbox" checked={Boolean(form.requires_prescription)} onChange={(event) => setField('requires_prescription', event.target.checked)} className="h-4 w-4 accent-emerald-600" />
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700">
                <FiUploadCloud className="h-4 w-4" />
                <span>Choose images</span>
                <input type="file" multiple accept="image/*" onChange={handleFiles} className="hidden" />
              </label>
              {files.length > 0 ? (
                <button type="button" onClick={() => setFiles([])} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-rose-200 hover:text-rose-600">
                  <FiX className="h-4 w-4" />
                  <span>Clear selected images</span>
                </button>
              ) : null}
            </div>
          </section>

          {images.length > 0 ? (
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Saved images</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {images.map((image) => (
                  <div key={image.id} className="flex items-center gap-3 rounded-md border border-slate-200 p-2">
                    <img src={resolveImageUrl(image.image_url || image.image_path || image.path)} alt="" loading="lazy" decoding="async" onError={handleImageFallback} className="h-14 w-14 rounded-md object-cover" />
                    <div className="min-w-0 flex-1 text-sm text-slate-600">{image.is_primary ? 'Primary image' : 'Product image'}</div>
                    <button type="button" onClick={() => removeImage(image)} className="flex h-8 w-8 items-center justify-center rounded-md border border-rose-100 text-rose-600 transition hover:bg-rose-50" title="Delete image">
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
            <FiSave className="h-4 w-4" />
            <span>{saving ? 'Saving...' : isEdit ? 'Update product' : 'Create product'}</span>
          </button>
        </aside>
      </div>
    </form>
  )
}
