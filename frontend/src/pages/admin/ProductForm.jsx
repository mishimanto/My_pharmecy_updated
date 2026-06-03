import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import { adminApi } from '../../api/adminApi'

const empty = { category_id: '', manufacturer_id: '', product_name: '', generic_name: '', brand_name: '', strength: '', dosage_form: '', requires_prescription: false, description: '', is_active: true }

export default function ProductForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [categories, setCategories] = useState([])
  const [manufacturers, setManufacturers] = useState([])
  const [images, setImages] = useState([])
  const [files, setFiles] = useState([])

  useEffect(() => {
    adminApi.list('categories', { per_page: 100 }).then(({ data }) => setCategories(data.data.data || []))
    adminApi.list('manufacturers', { per_page: 100 }).then(({ data }) => setManufacturers(data.data.data || []))
    if (editing) {
      adminApi.show('products', id).then(({ data }) => {
        const product = data.data
        setForm({ ...empty, ...product, category_id: product.category_id || '', manufacturer_id: product.manufacturer_id || '' })
        setImages(product.images || [])
      })
    }
  }, [editing, id])

  const submit = async (event) => {
    event.preventDefault()
    try {
      const payload = { ...form, requires_prescription: Boolean(form.requires_prescription), is_active: Boolean(form.is_active) }
      const response = editing ? await adminApi.update('products', id, payload) : await adminApi.create('products', payload)
      const productId = id || response.data.data.id
      if (files.length > 0) {
        const body = new FormData()
        files.forEach((file) => body.append('images[]', file))
        body.append('primary_index', '0')
        await adminApi.uploadProductImages(productId, body)
      }
      toast.success(editing ? 'প্রোডাক্ট আপডেট হয়েছে' : 'প্রোডাক্ট তৈরি হয়েছে')
      navigate('/admin/products')
    } catch (error) {
      toast.error(error.response?.data?.message || 'প্রোডাক্ট সেভ করা যায়নি')
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
      <PageHeader title={editing ? 'প্রোডাক্ট এডিট' : 'নতুন প্রোডাক্ট'} subtitle="স্টক বা final price এখানে নয়; price/stock inventory batch থেকে আসবে।" />
      <form className="grid gap-4 rounded border bg-white p-5 md:grid-cols-2" onSubmit={submit}>
        <input className="rounded border px-3 py-2 md:col-span-2" placeholder="প্রোডাক্ট নাম" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} />
        <select className="rounded border px-3 py-2" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}><option value="">ক্যাটাগরি</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.category_name}</option>)}</select>
        <select className="rounded border px-3 py-2" value={form.manufacturer_id} onChange={(e) => setForm({ ...form, manufacturer_id: e.target.value })}><option value="">ম্যানুফ্যাকচারার</option>{manufacturers.map((item) => <option key={item.id} value={item.id}>{item.manufacturer_name}</option>)}</select>
        <input className="rounded border px-3 py-2" placeholder="জেনেরিক নাম" value={form.generic_name || ''} onChange={(e) => setForm({ ...form, generic_name: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder="ব্র্যান্ড নাম" value={form.brand_name || ''} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder="স্ট্রেন্থ" value={form.strength || ''} onChange={(e) => setForm({ ...form, strength: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder="ডোজেজ ফর্ম" value={form.dosage_form || ''} onChange={(e) => setForm({ ...form, dosage_form: e.target.value })} />
        <label className="flex items-center gap-2 rounded border px-3 py-2"><input type="checkbox" checked={Boolean(form.requires_prescription)} onChange={(e) => setForm({ ...form, requires_prescription: e.target.checked })} /> প্রেসক্রিপশন প্রয়োজন</label>
        <label className="flex items-center gap-2 rounded border px-3 py-2"><input type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> সক্রিয়</label>
        <textarea className="rounded border px-3 py-2 md:col-span-2" placeholder="বর্ণনা" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="rounded border px-3 py-2 md:col-span-2" type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
        {images.length > 0 && <div className="md:col-span-2 grid gap-2 sm:grid-cols-3">{images.map((image) => <div key={image.id} className="rounded border p-2 text-sm"><img className="mb-2 h-24 w-full rounded object-cover" src={image.image_url} alt="" /><button type="button" className="text-rose-700" onClick={() => removeImage(image)}>ডিলিট</button></div>)}</div>}
        <button className="rounded bg-slate-950 px-4 py-2 text-white md:col-span-2">সেভ করুন</button>
      </form>
    </>
  )
}

