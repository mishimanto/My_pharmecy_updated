import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiCheckCircle, FiShield, FiShoppingCart, FiTruck } from 'react-icons/fi'
import PageHeader from '../../components/common/PageHeader'
import { productApi } from '../../api/productApi'
import { cartApi } from '../../api/cartApi'
import { money } from '../../utils/formatters'

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '')

export default function ProductDetails() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    productApi
      .show(id)
      .then(({ data }) => setProduct(data.data))
      .catch(() => toast.error('প্রোডাক্ট পাওয়া যায়নি'))
      .finally(() => setLoading(false))
  }, [id])

  const add = async () => {
    await cartApi.add({ product_id: product.id, quantity: 1 })
    toast.success('কার্টে যোগ করা হয়েছে')
  }

  if (loading) return <p className="p-4 text-slate-500">লোড হচ্ছে...</p>
  if (!product) return <PageHeader title="প্রোডাক্ট পাওয়া যায়নি" />

  const batch = product.batches?.[0]
  const image = product.primary_image?.image_url || product.images?.[0]?.image_url
  const imageUrl = image?.startsWith('http') ? image : image ? `${API_ORIGIN}${image}` : null
  const description = product.description || 'এই পণ্যের বিস্তারিত নির্দেশাবলী এবং ব্যবহারের তথ্য এখানে দেখুন।'

  return (
    <div className="space-y-10">
      <PageHeader title={product.product_name} subtitle={product.description || 'ওষুধের বিস্তারিত তথ্য'} />

      <div className="mx-auto max-w-screen-2xl px-6">
        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <div className="space-y-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="overflow-hidden rounded-4xl bg-slate-50">
              {imageUrl ? (
                <img src={imageUrl} alt={product.product_name} className="h-105 w-full object-cover" />
              ) : (
                <div className="flex h-105 items-center justify-center bg-emerald-50 text-6xl font-bold text-emerald-700">Rx</div>
              )}
            </div>
            <div className="grid gap-4 rounded-[1.75rem] bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">{product.dosage_form || 'ফর্ম নেই'}</span>
                <span className={`rounded-full px-4 py-2 text-sm font-semibold ${product.available_stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {product.available_stock > 0 ? 'স্টক আছে' : 'স্টক আউট'}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-500">ব্র্যান্ড</p>
                <p className="text-lg font-semibold text-slate-900">{product.brand_name || 'অনধিকृत'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">জেনেরিক</p>
                <p className="text-lg font-semibold text-slate-900">{product.generic_name || 'নির্দিষ্ট নয়'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">ব্র্যাচ নম্বর</p>
                <p className="text-lg font-semibold text-slate-900">{batch?.batch_number || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">পণ্য পরিচিতি</p>
                  <h1 className="mt-3 text-4xl font-semibold text-slate-900">{product.product_name}</h1>
                  <p className="mt-3 text-sm text-slate-500">{description.length > 120 ? `${description.slice(0, 120)}...` : description}</p>
                </div>
                <span className="inline-flex rounded-3xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  {product.requires_prescription ? 'প্রেসক্রিপশন আবশ্যক' : 'প্রেসক্রিপশন ছাড়া'}
                </span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">মূল্য</p>
                  <p className="mt-2 text-3xl font-semibold text-emerald-600">{money(product.display_price || batch?.selling_price)}</p>
                </div>
                <div className="rounded-[1.75rem] bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">স্টক</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{product.available_stock ?? '—'}</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button className="inline-flex items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-emerald-700" onClick={add}>
                  <FiShoppingCart className="h-5 w-5" />
                  কার্টে যোগ করুন
                </button>
                {product.requires_prescription && (
                  <Link to="/upload-prescription" className="inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-slate-100 px-6 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-200">
                    <FiShield className="h-5 w-5 text-emerald-700" />
                    প্রেসক্রিপশন আপলোড
                  </Link>
                )}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-slate-50 p-5 text-center">
                  <p className="text-sm text-slate-500">রিটার্ন</p>
                  <p className="mt-2 font-semibold text-slate-900">৭ দিন</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5 text-center">
                  <p className="text-sm text-slate-500">ডেলিভারি</p>
                  <p className="mt-2 font-semibold text-slate-900">এক্সপ্রেস</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5 text-center">
                  <p className="text-sm text-slate-500">সাপোর্ট</p>
                  <p className="mt-2 font-semibold text-slate-900">২৪/৭</p>
                </div>
              </div>
            </div>

            <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">পণ্যের বিবরণ</h2>
                  <p className="mt-2 text-sm text-slate-500">উৎপাদন, ব্যবহারের নির্দেশিকা ও সঠিক ডোজ সম্পর্কে দেখুন।</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-3xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <FiCheckCircle className="h-4 w-4" />
                  নিশ্চিত মান
                </div>
              </div>

              <div className="mt-6 space-y-4 text-slate-600 leading-7">
                <p>{description}</p>
                <p>
                  <strong>ডোজ:</strong> {product.strength || 'N/A'} / {product.dosage_form || 'N/A'}
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] bg-slate-50 p-5">
                  <h3 className="font-semibold text-slate-900">ব্যাচ বিস্তারিত</h3>
                  <p className="mt-3 text-sm text-slate-600">{batch?.batch_number ? `ব্যাচ: ${batch.batch_number}` : 'ব্যাচ তথ্য নেই'}</p>
                </div>
                <div className="rounded-[1.75rem] bg-slate-50 p-5">
                  <h3 className="font-semibold text-slate-900">ডেলিভারি</h3>
                  <p className="mt-3 text-sm text-slate-600">প্রায় ১-২ কার্যদিবসের মধ্যে বিতরণযোগ্য।</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
