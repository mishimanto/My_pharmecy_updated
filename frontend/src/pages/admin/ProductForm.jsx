import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import { adminApi } from '../../api/adminApi'
import { productApi } from '../../api/productApi'
import { getCachedItem, getCachedList, setCachedItem, setCachedList } from '../../utils/adminResourceCache'

const empty = {
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
  is_active: true,
}

function formFromProduct(product) {
  return {
    ...empty,
    ...product,
    category_id: product?.category_id || '',
    manufacturer_id: product?.manufacturer_id || '',
    strip_price: product?.strip_price ?? '',
    box_price: product?.box_price ?? '',
  }
}

export default function ProductForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const seededProduct = editing ? getCachedItem('products', id) : null
  const seededCategories = getCachedList('categories', { per_page: 100 })
  const seededManufacturers = getCachedList('manufacturers', { per_page: 100 })
  const [form, setForm] = useState(() => formFromProduct(seededProduct))
  const [categories, setCategories] = useState(seededCategories?.data || [])
  const [manufacturers, setManufacturers] = useState(seededManufacturers?.data || [])
  const [images, setImages] = useState(seededProduct?.images || [])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(editing && !seededProduct)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminApi.list('categories', { per_page: 100 }).then(({ data }) => {
      const payload = data.data
      setCategories(payload.data || [])
      setCachedList('categories', { per_page: 100 }, payload)
    })

    adminApi.list('manufacturers', { per_page: 100 }).then(({ data }) => {
      const payload = data.data
      setManufacturers(payload.data || [])
      setCachedList('manufacturers', { per_page: 100 }, payload)
    })
  }, [])

  useEffect(() => {
    if (!editing) return

    let active = true
    adminApi.show('products', id).then(({ data }) => {
      if (!active) return
      const product = data.data
      setCachedItem('products', id, product)
      setForm(formFromProduct(product))
      setImages(product.images || [])
    }).catch(() => active && toast.error('প্রোডাক্ট তথ্য লোড করা যায়নি'))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [editing, id])

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...form,
        pieces_per_strip: Number(form.pieces_per_strip || 1),
        strips_per_box: Number(form.strips_per_box || 1),
        strip_price: form.strip_price === '' ? null : Number(form.strip_price),
        box_price: form.box_price === '' ? null : Number(form.box_price),
        requires_prescription: Boolean(form.requires_prescription),
        is_active: Boolean(form.is_active),
      }

      const response = editing ? await adminApi.update('products', id, payload) : await adminApi.create('products', payload)
      const productId = id || response.data.data.id

      if (files.length > 0) {
        const body = new FormData()
        files.forEach((file) => body.append('images[]', file))
        body.append('primary_index', '0')
        await adminApi.uploadProductImages(productId, body)
      }

      toast.success(editing ? 'প্রোডাক্ট আপডেট হয়েছে' : 'প্রোডাক্ট তৈরি হয়েছে')
      productApi.clearCache()
      navigate('/admin/products')
    } catch (error) {
      toast.error(error.response?.data?.message || 'প্রোডাক্ট সেভ করা যায়নি')
    } finally {
      setSaving(false)
    }
  }

  const removeImage = async (image) => {
    const result = await Swal.fire({ title: 'ছবি ডিলিট করবেন?', showCancelButton: true, confirmButtonText: 'ডিলিট', cancelButtonText: 'বাতিল', confirmButtonColor: '#dc2626' })
    if (!result.isConfirmed) return
    await adminApi.deleteProductImage(image.id)
    toast.success('ছবি ডিলিট হয়েছে')
    setImages((current) => current.filter((item) => item.id !== image.id))
  }

  return (
    <>
      <PageHeader title={editing ? 'প্রোডাক্ট এডিট' : 'নতুন প্রোডাক্ট'} subtitle="Piece price batch থেকে আসবে। Strip আর box conversion এবং bundle price এখানে সেট করুন।" />
      {loading ? (
        <ProductFormSkeleton />
      ) : (
        <form className="grid gap-4 rounded-2xl border bg-white p-5 shadow-sm md:grid-cols-2" onSubmit={submit}>
          <input className="rounded-xl border px-3 py-2 md:col-span-2" placeholder="প্রোডাক্ট নাম" value={form.product_name} onChange={(event) => setField('product_name', event.target.value)} />
          <select className="rounded-xl border px-3 py-2" value={form.category_id} onChange={(event) => setField('category_id', event.target.value)}><option value="">ক্যাটাগরি</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.category_name}</option>)}</select>
          <select className="rounded-xl border px-3 py-2" value={form.manufacturer_id} onChange={(event) => setField('manufacturer_id', event.target.value)}><option value="">ম্যানুফ্যাকচারার</option>{manufacturers.map((item) => <option key={item.id} value={item.id}>{item.manufacturer_name}</option>)}</select>
          <input className="rounded-xl border px-3 py-2" placeholder="জেনেরিক নাম" value={form.generic_name || ''} onChange={(event) => setField('generic_name', event.target.value)} />
          <input className="rounded-xl border px-3 py-2" placeholder="ব্র্যান্ড নাম" value={form.brand_name || ''} onChange={(event) => setField('brand_name', event.target.value)} />
          <input className="rounded-xl border px-3 py-2" placeholder="স্ট্রেন্থ" value={form.strength || ''} onChange={(event) => setField('strength', event.target.value)} />
          <input className="rounded-xl border px-3 py-2" placeholder="ডোজেজ ফর্ম" value={form.dosage_form || ''} onChange={(event) => setField('dosage_form', event.target.value)} />

          <div className="rounded-2xl border p-4">
            <div className="text-sm font-semibold text-slate-900">Strip setup</div>
            <p className="mt-1 text-xs text-slate-500">Inventory stays in pieces. Example: 10 means 1 strip = 10 pieces.</p>
            <input className="mt-3 w-full rounded-xl border px-3 py-2" type="number" min="1" placeholder="Pieces per strip" value={form.pieces_per_strip} onChange={(event) => setField('pieces_per_strip', event.target.value)} />
            <input className="mt-3 w-full rounded-xl border px-3 py-2" type="number" min="0" step="0.01" placeholder="Strip price (optional)" value={form.strip_price} onChange={(event) => setField('strip_price', event.target.value)} />
          </div>

          <div className="rounded-2xl border p-4">
            <div className="text-sm font-semibold text-slate-900">Box setup</div>
            <p className="mt-1 text-xs text-slate-500">Example: 10 means 1 box = 10 strips.</p>
            <input className="mt-3 w-full rounded-xl border px-3 py-2" type="number" min="1" placeholder="Strips per box" value={form.strips_per_box} onChange={(event) => setField('strips_per_box', event.target.value)} />
            <input className="mt-3 w-full rounded-xl border px-3 py-2" type="number" min="0" step="0.01" placeholder="Box price (optional)" value={form.box_price} onChange={(event) => setField('box_price', event.target.value)} />
          </div>

          <label className="flex items-center gap-2 rounded-xl border px-3 py-2"><input type="checkbox" checked={Boolean(form.requires_prescription)} onChange={(event) => setField('requires_prescription', event.target.checked)} /> প্রেসক্রিপশন প্রয়োজন</label>
          <label className="flex items-center gap-2 rounded-xl border px-3 py-2"><input type="checkbox" checked={Boolean(form.is_active)} onChange={(event) => setField('is_active', event.target.checked)} /> সক্রিয়</label>
          <textarea className="rounded-xl border px-3 py-2 md:col-span-2" placeholder="বর্ণনা" value={form.description || ''} onChange={(event) => setField('description', event.target.value)} />
          <input className="rounded-xl border px-3 py-2 md:col-span-2" type="file" multiple accept="image/*" onChange={(event) => setFiles(Array.from(event.target.files || []))} />
          {images.length > 0 && <div className="grid gap-2 md:col-span-2 sm:grid-cols-3">{images.map((image) => <div key={image.id} className="rounded-2xl border p-2 text-sm"><img className="mb-2 h-24 w-full rounded-xl object-cover" src={image.image_url} alt="" /><button type="button" className="text-rose-700" onClick={() => removeImage(image)}>ডিলিট</button></div>)}</div>}
          <button disabled={saving} className="rounded-xl bg-slate-950 px-4 py-2 text-white md:col-span-2 disabled:opacity-60">{saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}</button>
        </form>
      )}
    </>
  )
}

function ProductFormSkeleton() {
  return (
    <div className="grid animate-pulse gap-4 rounded-2xl border bg-white p-5 md:grid-cols-2">
      <div className="h-11 rounded-xl bg-slate-100 md:col-span-2" />
      <div className="h-11 rounded-xl bg-slate-100" />
      <div className="h-11 rounded-xl bg-slate-100" />
      <div className="h-11 rounded-xl bg-slate-100" />
      <div className="h-11 rounded-xl bg-slate-100" />
      <div className="h-11 rounded-xl bg-slate-100" />
      <div className="h-11 rounded-xl bg-slate-100" />
      <div className="h-40 rounded-2xl bg-slate-100" />
      <div className="h-40 rounded-2xl bg-slate-100" />
      <div className="h-11 rounded-xl bg-slate-100" />
      <div className="h-11 rounded-xl bg-slate-100" />
      <div className="h-24 rounded-xl bg-slate-100 md:col-span-2" />
    </div>
  )
}
