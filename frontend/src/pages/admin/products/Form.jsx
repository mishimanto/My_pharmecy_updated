import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiImage, FiPlusCircle, FiSave, FiTrash2, FiUploadCloud, FiX } from 'react-icons/fi'
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
  product_type: 'medicine',
  product_name: '',
  generic_name: '',
  brand_name: '',
  strength: '',
  dosage_form: '',
  package_unit: 'piece',
  package_size: '',
  pieces_per_strip: 10,
  strips_per_box: 10,
  strip_price: '',
  box_price: '',
  strip_discount: '',
  box_discount: '',
  requires_prescription: false,
  description: '',
  description_bn: '',
  indications: '',
  indications_bn: '',
  pharmacology: '',
  pharmacology_bn: '',
  dosage_administration: '',
  dosage_administration_bn: '',
  interaction_details: '',
  interaction_details_bn: '',
  contraindications: '',
  contraindications_bn: '',
  side_effects: '',
  side_effects_bn: '',
  pregnancy_lactation: '',
  pregnancy_lactation_bn: '',
  precautions_warnings: '',
  precautions_warnings_bn: '',
  therapeutic_class: '',
  therapeutic_class_bn: '',
  storage_conditions: '',
  storage_conditions_bn: '',
  leaflet_url: '',
  specifications: '',
  description_draft: '',
  description_bn_draft: '',
  description_draft_status: '',
  alternative_product_ids: [],
  drug_interactions: [],
  is_active: true,
}

const productTypeOptions = [
  ['medicine', 'Medicine'],
  ['healthcare', 'Healthcare product'],
  ['device', 'Medical device'],
  ['personal_care', 'Personal care'],
  ['beauty', 'Beauty & skin care'],
  ['baby_care', 'Mother & baby care'],
]

const packageUnitOptions = [
  ['piece', 'Piece'],
  ['pack', 'Pack'],
  ['packet', 'Packet'],
  ['bottle', 'Bottle'],
  ['kit', 'Kit'],
  ['device', 'Device'],
  ['tube', 'Tube'],
  ['jar', 'Jar'],
  ['box', 'Box'],
  ['unit', 'Unit'],
]

const medicineContentFields = [
  {
    key: 'indications',
    bnKey: 'indications_bn',
    label: 'Indications',
    placeholder: 'Common uses, symptoms, or situations where this medicine is prescribed.',
  },
  {
    key: 'pharmacology',
    bnKey: 'pharmacology_bn',
    label: 'Pharmacology',
    placeholder: 'Explain how the medicine works in a concise, pharmacy-friendly way.',
  },
  {
    key: 'dosage_administration',
    bnKey: 'dosage_administration_bn',
    label: 'Dosage & administration',
    placeholder: 'Dose guidance, age groups, route, timing, or important administration instructions.',
  },
  {
    key: 'interaction_details',
    bnKey: 'interaction_details_bn',
    label: 'Interaction details',
    placeholder: 'General interaction notes beyond the structured warning pairs below.',
  },
  {
    key: 'contraindications',
    bnKey: 'contraindications_bn',
    label: 'Contraindications',
    placeholder: 'Who should avoid this medicine or when it should not be used.',
  },
  {
    key: 'side_effects',
    bnKey: 'side_effects_bn',
    label: 'Side effects',
    placeholder: 'Common or serious side effects to be aware of.',
  },
  {
    key: 'pregnancy_lactation',
    bnKey: 'pregnancy_lactation_bn',
    label: 'Pregnancy & lactation',
    placeholder: 'Pregnancy, breastfeeding, and special-care guidance.',
  },
  {
    key: 'precautions_warnings',
    bnKey: 'precautions_warnings_bn',
    label: 'Precautions & warnings',
    placeholder: 'Special warnings, monitoring points, or when to consult a clinician.',
  },
  {
    key: 'storage_conditions',
    bnKey: 'storage_conditions_bn',
    label: 'Storage conditions',
    placeholder: 'Storage temperature, light/moisture guidance, or child safety note.',
  },
]

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
    product_type: product?.product_type || 'medicine',
    package_unit: product?.package_unit || 'piece',
    package_size: product?.package_size || '',
    specifications: product?.specifications || '',
    indications: product?.indications || '',
    indications_bn: product?.indications_bn || '',
    pharmacology: product?.pharmacology || '',
    pharmacology_bn: product?.pharmacology_bn || '',
    dosage_administration: product?.dosage_administration || '',
    dosage_administration_bn: product?.dosage_administration_bn || '',
    interaction_details: product?.interaction_details || '',
    interaction_details_bn: product?.interaction_details_bn || '',
    contraindications: product?.contraindications || '',
    contraindications_bn: product?.contraindications_bn || '',
    side_effects: product?.side_effects || '',
    side_effects_bn: product?.side_effects_bn || '',
    pregnancy_lactation: product?.pregnancy_lactation || '',
    pregnancy_lactation_bn: product?.pregnancy_lactation_bn || '',
    precautions_warnings: product?.precautions_warnings || '',
    precautions_warnings_bn: product?.precautions_warnings_bn || '',
    therapeutic_class: product?.therapeutic_class || '',
    therapeutic_class_bn: product?.therapeutic_class_bn || '',
    storage_conditions: product?.storage_conditions || '',
    storage_conditions_bn: product?.storage_conditions_bn || '',
    leaflet_url: product?.leaflet_url || '',
    strip_price: product?.strip_price ?? '',
    box_price: product?.box_price ?? '',
    strip_discount: product?.strip_discount ?? '',
    box_discount: product?.box_discount ?? '',
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
  const [productOptions, setProductOptions] = useState([])
  const [batchForm, setBatchForm] = useState(initialBatchForm)
  const [images, setImages] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [draftSaving, setDraftSaving] = useState(false)

  useEffect(() => {
    let active = true

    Promise.all([
      adminApi.listFresh('categories', { per_page: 100 }),
      adminApi.listFresh('manufacturers', { per_page: 100 }),
      adminApi.listFresh('suppliers', { per_page: 100, status: 'active' }),
      adminApi.listFresh('products', { per_page: 500 }),
    ]).then(([categoryResponse, manufacturerResponse, supplierResponse, productResponse]) => {
      if (!active) return
      setCategories(categoryResponse.data.data?.data || [])
      setManufacturers(manufacturerResponse.data.data?.data || [])
      setSuppliers(supplierResponse.data.data?.data || [])
      setProductOptions(productResponse.data.data?.data || [])
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
  const isMedicine = (form.product_type || 'medicine') === 'medicine'
  const selectableAlternativeProducts = useMemo(
    () => productOptions.filter((product) => (product.product_type || 'medicine') === 'medicine' && String(product.id) !== String(id || form.id || '')),
    [form.id, id, productOptions],
  )

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const setProductType = (value) => {
    setForm((current) => ({
      ...current,
      product_type: value,
      requires_prescription: value === 'medicine' ? current.requires_prescription : false,
      package_unit: value === 'medicine' ? 'piece' : (current.package_unit === 'piece' ? 'pack' : current.package_unit || 'pack'),
      pieces_per_strip: value === 'medicine' ? current.pieces_per_strip || 10 : 1,
      strips_per_box: value === 'medicine' ? current.strips_per_box || 10 : 1,
      strip_discount: value === 'medicine' ? current.strip_discount : '',
      box_discount: value === 'medicine' ? current.box_discount : '',
    }))
  }

  const setBatchField = (field, value) => {
    setBatchForm((current) => ({ ...current, [field]: value }))
  }

  const setProductFromResponse = (product) => {
    setForm(formFromProduct(product))
    setImages(product.images || [])
    clearProductsCache()
    productApi.clearCache()
  }

  const setAlternativeIds = (options) => {
    setField('alternative_product_ids', Array.from(options).map((option) => Number(option.value)))
  }

  const addInteraction = () => {
    setField('drug_interactions', [
      ...(form.drug_interactions || []),
      { interacts_with_generic_name: '', severity: 'moderate', warning: '', is_active: true },
    ])
  }

  const updateInteraction = (index, field, value) => {
    setField('drug_interactions', (form.drug_interactions || []).map((item, currentIndex) => (
      currentIndex === index ? { ...item, [field]: value } : item
    )))
  }

  const removeInteraction = (index) => {
    setField('drug_interactions', (form.drug_interactions || []).filter((_, currentIndex) => currentIndex !== index))
  }

  const generateDescriptionDraft = async () => {
    if (!isEdit) return

    setDraftSaving(true)
    try {
      const response = await adminApi.generateProductDescriptionDraft(id)
      setProductFromResponse(response.data.data)
      toast.success('Description draft generated for review.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to generate description draft.')
    } finally {
      setDraftSaving(false)
    }
  }

  const publishDescriptionDraft = async () => {
    if (!isEdit || !form.description_draft?.trim()) return

    setDraftSaving(true)
    try {
      const response = await adminApi.publishProductDescriptionDraft(id, {
        description_draft: form.description_draft,
        description_bn_draft: form.description_bn_draft || null,
      })
      setProductFromResponse(response.data.data)
      toast.success('Description draft published.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to publish description draft.')
    } finally {
      setDraftSaving(false)
    }
  }

  const discardDescriptionDraft = async () => {
    if (!isEdit) return

    setDraftSaving(true)
    try {
      const response = await adminApi.discardProductDescriptionDraft(id)
      setProductFromResponse(response.data.data)
      toast.success('Description draft discarded.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to discard description draft.')
    } finally {
      setDraftSaving(false)
    }
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
        product_type: form.product_type || 'medicine',
        package_unit: form.product_type === 'medicine' ? 'piece' : (form.package_unit || 'pack'),
        package_size: form.product_type === 'medicine' ? null : (form.package_size?.trim() || null),
        product_name: form.product_name.trim(),
        generic_name: form.product_type === 'medicine' ? form.generic_name?.trim() || null : null,
        brand_name: form.brand_name?.trim() || null,
        strength: form.product_type === 'medicine' ? form.strength?.trim() || null : null,
        dosage_form: form.product_type === 'medicine' ? form.dosage_form?.trim() || null : null,
        description: form.description?.trim() || null,
        description_bn: form.description_bn?.trim() || null,
        indications: form.product_type === 'medicine' ? form.indications?.trim() || null : null,
        indications_bn: form.product_type === 'medicine' ? form.indications_bn?.trim() || null : null,
        pharmacology: form.product_type === 'medicine' ? form.pharmacology?.trim() || null : null,
        pharmacology_bn: form.product_type === 'medicine' ? form.pharmacology_bn?.trim() || null : null,
        dosage_administration: form.product_type === 'medicine' ? form.dosage_administration?.trim() || null : null,
        dosage_administration_bn: form.product_type === 'medicine' ? form.dosage_administration_bn?.trim() || null : null,
        interaction_details: form.product_type === 'medicine' ? form.interaction_details?.trim() || null : null,
        interaction_details_bn: form.product_type === 'medicine' ? form.interaction_details_bn?.trim() || null : null,
        contraindications: form.product_type === 'medicine' ? form.contraindications?.trim() || null : null,
        contraindications_bn: form.product_type === 'medicine' ? form.contraindications_bn?.trim() || null : null,
        side_effects: form.product_type === 'medicine' ? form.side_effects?.trim() || null : null,
        side_effects_bn: form.product_type === 'medicine' ? form.side_effects_bn?.trim() || null : null,
        pregnancy_lactation: form.product_type === 'medicine' ? form.pregnancy_lactation?.trim() || null : null,
        pregnancy_lactation_bn: form.product_type === 'medicine' ? form.pregnancy_lactation_bn?.trim() || null : null,
        precautions_warnings: form.product_type === 'medicine' ? form.precautions_warnings?.trim() || null : null,
        precautions_warnings_bn: form.product_type === 'medicine' ? form.precautions_warnings_bn?.trim() || null : null,
        therapeutic_class: form.product_type === 'medicine' ? form.therapeutic_class?.trim() || null : null,
        therapeutic_class_bn: form.product_type === 'medicine' ? form.therapeutic_class_bn?.trim() || null : null,
        storage_conditions: form.product_type === 'medicine' ? form.storage_conditions?.trim() || null : null,
        storage_conditions_bn: form.product_type === 'medicine' ? form.storage_conditions_bn?.trim() || null : null,
        leaflet_url: form.product_type === 'medicine' ? form.leaflet_url?.trim() || null : null,
        specifications: form.product_type === 'medicine' ? null : (form.specifications?.trim() || null),
        alternative_product_ids: form.product_type === 'medicine' ? (form.alternative_product_ids || []).map((item) => Number(item)) : [],
        drug_interactions: form.product_type === 'medicine' ? (form.drug_interactions || [])
          .filter((item) => item.interacts_with_generic_name?.trim())
          .map((item) => ({
            interacts_with_generic_name: item.interacts_with_generic_name.trim(),
            severity: item.severity || 'moderate',
            warning: item.warning?.trim() || null,
            is_active: Boolean(item.is_active),
          })) : [],
        pieces_per_strip: form.product_type === 'medicine' ? Number(form.pieces_per_strip || 1) : 1,
        strips_per_box: form.product_type === 'medicine' ? Number(form.strips_per_box || 1) : 1,
        strip_price: null,
        box_price: null,
        strip_discount: form.product_type === 'medicine' && form.strip_discount !== '' ? Number(form.strip_discount) : null,
        box_discount: form.product_type === 'medicine' && form.box_discount !== '' ? Number(form.box_discount) : null,
        requires_prescription: form.product_type === 'medicine' ? Boolean(form.requires_prescription) : false,
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
            <div className="mb-4 text-md font-semibold text-slate-900">Basic information</div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Product type</span>
                <select value={form.product_type || 'medicine'} onChange={(event) => setProductType(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
                  {productTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <span className="mt-1 block text-xs text-slate-500">
                  Medicine keeps prescription, generic, dosage and strip/box rules. Other product types use simple package-based inventory.
                </span>
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Product name</span>
                <input value={form.product_name} onChange={(event) => setField('product_name', event.target.value)} placeholder={isMedicine ? 'Napa 500 mg Tablet' : 'Digital thermometer'} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
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
                <span className="mb-1 block text-sm font-medium text-slate-700">Brand name</span>
                <input value={form.brand_name || ''} onChange={(event) => setField('brand_name', event.target.value)} placeholder="Napa" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
              </label>
              {isMedicine ? (
                <>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Generic name</span>
                    <input value={form.generic_name || ''} onChange={(event) => setField('generic_name', event.target.value)} placeholder="Paracetamol" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Strength</span>
                    <input value={form.strength || ''} onChange={(event) => setField('strength', event.target.value)} placeholder="500 mg" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Dosage form</span>
                    <input value={form.dosage_form || ''} onChange={(event) => setField('dosage_form', event.target.value)} placeholder="Tablet" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
                  </label>
                </>
              ) : (
                <>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Package unit</span>
                    <select value={form.package_unit || 'pack'} onChange={(event) => setField('package_unit', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
                      {packageUnitOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Package size</span>
                    <input value={form.package_size || ''} onChange={(event) => setField('package_size', event.target.value)} placeholder="10 pcs, 100 ml, 1 device" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Specifications</span>
                    <textarea rows="3" value={form.specifications || ''} onChange={(event) => setField('specifications', event.target.value)} placeholder="Material, size, model, flavour, usage details, or other product-specific notes." className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
                  </label>
                </>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-md font-semibold text-slate-900">Initial inventory batch</div>
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
            <div className="mb-4 flex flex-col gap-1 border-b border-slate-200 pb-4">
              <div className="text-md font-semibold text-slate-900">Packaging and unit rules</div>
            </div>
            {isMedicine ? (
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
                  <span className="mb-1 block text-sm font-medium text-slate-700">Strip discount</span>
                  <input type="number" min="0" step="0.01" value={form.strip_discount} onChange={(event) => setField('strip_discount', event.target.value)} placeholder="Optional" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
                  <span className="mt-1 block text-xs text-slate-500">Final strip price = piece selling price x pieces per strip - discount.</span>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Box discount</span>
                  <input type="number" min="0" step="0.01" value={form.box_discount} onChange={(event) => setField('box_discount', event.target.value)} placeholder="Optional" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
                  <span className="mt-1 block text-xs text-slate-500">Final box price = piece selling price x pieces per box - discount.</span>
                </label>
              </div>
            ) : (
              <div className="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800">
                This product will be sold as one selected package unit. Inventory batch stock quantity, purchase price and selling price should be entered per {packageUnitOptions.find(([value]) => value === form.package_unit)?.[1]?.toLowerCase() || 'unit'}.
              </div>
            )}
          </section>

          {isMedicine ? (
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 flex flex-col gap-1 border-b border-slate-200 pb-4">
              <div className="text-md font-semibold text-slate-900">Medicine details for product page</div>
              <div className="text-sm text-slate-500">
                Structured medicine information appears on the customer product details page in dedicated sections.
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)]">
                <label className="block rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Therapeutic class</span>
                  <input
                    value={form.therapeutic_class || ''}
                    onChange={(event) => setField('therapeutic_class', event.target.value)}
                    placeholder="Non opioid analgesic"
                    className="w-full border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <label className="block rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Therapeutic class BN</span>
                  <input
                    value={form.therapeutic_class_bn || ''}
                    onChange={(event) => setField('therapeutic_class_bn', event.target.value)}
                    placeholder="নন-অপিওয়েড অ্যানালজেসিক"
                    className="w-full border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <label className="block rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Leaflet URL</span>
                  <input
                    value={form.leaflet_url || ''}
                    onChange={(event) => setField('leaflet_url', event.target.value)}
                    placeholder="https://example.com/leaflet.pdf"
                    className="w-full border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>

              {medicineContentFields.map((field) => (
                <div key={field.key} className="border border-slate-200 bg-slate-50">
                  <div className="flex flex-col gap-1 border-b border-slate-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-semibold text-slate-900">{field.label}</div>
                    <div className="text-xs text-slate-500">English + Bangla customer-facing copy</div>
                  </div>
                  <div className="grid gap-3 p-3 lg:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">English</span>
                      <textarea
                        rows="3"
                        value={form[field.key] || ''}
                        onChange={(event) => setField(field.key, event.target.value)}
                        placeholder={field.placeholder}
                        className="w-full border border-slate-300 bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Bangla</span>
                      <textarea
                        rows="3"
                        value={form[field.bnKey] || ''}
                        onChange={(event) => setField(field.bnKey, event.target.value)}
                        placeholder="বাংলা কনটেন্ট লিখুন"
                        className="w-full border border-slate-300 bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>
          ) : null}

          {isMedicine ? (
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 flex flex-col gap-1">
              <div className="text-md font-semibold text-slate-900">Product quality</div>
            </div>

            <div className="grid gap-5">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Medicine alternatives</span>
                <select
                  multiple
                  size={Math.min(6, Math.max(3, selectableAlternativeProducts.length || 3))}
                  value={(form.alternative_product_ids || []).map(String)}
                  onChange={(event) => setAlternativeIds(event.target.selectedOptions)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                >
                  {selectableAlternativeProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.product_name} {product.generic_name ? `- ${product.generic_name}` : ''}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-slate-500">Hold Ctrl to select multiple alternatives. Alternatives are saved both ways.</span>
              </label>

              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-700">Drug interaction warnings</div>
                  </div>
                  <button
                    type="button"
                    onClick={addInteraction}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300"
                  >
                    <FiPlusCircle className="h-4 w-4" />
                    Add warning
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {(form.drug_interactions || []).length === 0 ? (
                    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                      No interaction warning has been added for this generic yet.
                    </div>
                  ) : null}

                  {(form.drug_interactions || []).map((interaction, index) => (
                    <div key={`${interaction.id || 'new'}-${index}`} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1fr_160px_1.4fr_auto] lg:items-start">
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Interacts with generic</span>
                        <input
                          value={interaction.interacts_with_generic_name || ''}
                          onChange={(event) => updateInteraction(index, 'interacts_with_generic_name', event.target.value)}
                          placeholder="Warfarin"
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Severity</span>
                        <select
                          value={interaction.severity || 'moderate'}
                          onChange={(event) => updateInteraction(index, 'severity', event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                        >
                          <option value="low">Low</option>
                          <option value="moderate">Moderate</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Warning</span>
                        <input
                          value={interaction.warning || ''}
                          onChange={(event) => updateInteraction(index, 'warning', event.target.value)}
                          placeholder="Ask a pharmacist before using together."
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                        />
                      </label>
                      <div className="flex items-center gap-3 lg:pt-6">
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={interaction.is_active !== false}
                            onChange={(event) => updateInteraction(index, 'is_active', event.target.checked)}
                            className="h-4 w-4 accent-emerald-600"
                          />
                          Active
                        </label>
                        <button
                          type="button"
                          onClick={() => removeInteraction(index)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rose-100 bg-white text-rose-600 transition hover:bg-rose-50"
                          title="Remove warning"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 text-md font-semibold text-slate-900">Description</div>
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

            {isEdit ? (
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-amber-900">Local description draft</div>
                    {form.description_draft_status ? (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Status: {String(form.description_draft_status).replace(/_/g, ' ')}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={draftSaving}
                    onClick={generateDescriptionDraft}
                    className="inline-flex items-center justify-center rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {draftSaving ? 'Working...' : 'Generate draft'}
                  </button>
                </div>

                {form.description_draft ? (
                  <div className="mt-4 grid gap-4">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-amber-900">Draft description</span>
                      <textarea
                        rows="5"
                        value={form.description_draft || ''}
                        onChange={(event) => setField('description_draft', event.target.value)}
                        className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-amber-900">Draft description BN</span>
                      <textarea
                        rows="4"
                        value={form.description_bn_draft || ''}
                        onChange={(event) => setField('description_bn_draft', event.target.value)}
                        className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      />
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        disabled={draftSaving || !form.description_draft?.trim()}
                        onClick={publishDescriptionDraft}
                        className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        Publish reviewed draft
                      </button>
                      <button
                        type="button"
                        disabled={draftSaving}
                        onClick={discardDescriptionDraft}
                        className="inline-flex items-center justify-center rounded-md border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Discard draft
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-md font-semibold text-slate-900">Product preview</div>
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
              {!isMedicine ? (
                <div className="mt-2 text-xs text-slate-500">
                  Sold as {packageUnitOptions.find(([value]) => value === form.package_unit)?.[1] || 'Unit'}
                  {form.package_size ? ` (${form.package_size})` : ''}
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="text-slate-600">{productTypeOptions.find(([value]) => value === form.product_type)?.[1] || 'Medicine'}</span>
                <span className={form.is_active ? 'text-emerald-600' : 'text-rose-600'}>{form.is_active ? 'Active' : 'Inactive'}</span>
                {isMedicine ? (
                  <span className={form.requires_prescription ? 'text-amber-600' : 'text-slate-500'}>{form.requires_prescription ? 'Prescription required' : 'No prescription'}</span>
                ) : null}
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
              {isMedicine ? (
                <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                  <span>Prescription required</span>
                  <input type="checkbox" checked={Boolean(form.requires_prescription)} onChange={(event) => setField('requires_prescription', event.target.checked)} className="h-4 w-4 accent-emerald-600" />
                </label>
              ) : null}
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
