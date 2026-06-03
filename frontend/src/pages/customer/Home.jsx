import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { productApi } from '../../api/productApi'
import { money } from '../../utils/formatters'
import heroImage from '../../assets/hero.png'
import { 
  FiArrowRight, 
  FiShield, 
  FiClock, 
  FiTruck, 
  FiHeadphones, 
  FiCheckCircle,
  FiStar,
  FiShoppingCart,
  FiPackage,
  FiTrendingUp
} from 'react-icons/fi'

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '')

const services = [
  { 
    icon: FiShield, 
    title: 'লাইসেন্সড ফার্মেসি', 
    text: 'ভেরিফায়েড ওষুধ ও ব্যাচভিত্তিক স্টক',
    gradient: 'from-blue-500 to-blue-600'
  },
  { 
    icon: FiCheckCircle, 
    title: 'প্রেসক্রিপশন রিভিউ', 
    text: 'ফার্মাসিস্ট অনুমোদনের পর অর্ডার প্রসেস',
    gradient: 'from-green-500 to-green-600'
  },
  { 
    icon: FiTruck, 
    title: 'দ্রুত ডেলিভারি', 
    text: 'ট্র্যাকিং, রাইডার অ্যাসাইন ও COD পেমেন্ট',
    gradient: 'from-purple-500 to-purple-600'
  },
  { 
    icon: FiHeadphones, 
    title: 'সহজ সাপোর্ট', 
    text: 'টিকিট, রিটার্ন, রিফান্ড ও নোটিফিকেশন',
    gradient: 'from-orange-500 to-orange-600'
  },
]

export default function Home() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      productApi.list({ per_page: 6 }),
      productApi.categories(),
    ]).then(([productRes, categoryRes]) => {
      setProducts(productRes.data.data?.data || [])
      setCategories((categoryRes.data.data || []).slice(0, 6))
    }).catch(() => toast.error('হোম পেজের তথ্য লোড করা যায়নি।')).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-emerald-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        
        <div className="relative grid min-h-[600px] lg:grid-cols-2 lg:items-center">
          {/* Left Content */}
          <div className="px-6 py-16 lg:px-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm font-medium text-white mb-8">
              <FiStar className="h-4 w-4 text-yellow-400" />
              <span>বিশ্বস্ত অনলাইন ফার্মেসি</span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              স্বাস্থ্যসেবা
              <span className="block text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-green-300">
                আপনার দোরগোড়ায়
              </span>
            </h1>
            
            <p className="mt-6 text-lg leading-8 text-gray-300 max-w-xl">
              লাইসেন্সড ফার্মেসি থেকে ভেরিফায়েড ওষুধ, প্রেসক্রিপশন রিভিউ, এবং দ্রুত ডেলিভারি - সবই এখন আপনার হাতের মুঠোয়।
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link 
                to="/products" 
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-green-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-105"
              >
                পণ্য দেখুন
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/upload-prescription" 
                className="inline-flex items-center justify-center rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/20 hover:border-white/50"
              >
                প্রেসক্রিপশন আপলোড
              </Link>
            </div>
            
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">২৪/৭</div>
                <div className="text-sm text-gray-400">সার্ভিস</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">১০০%</div>
                <div className="text-sm text-gray-400">অথেন্টিক</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">দ্রুত</div>
                <div className="text-sm text-gray-400">ডেলিভারি</div>
              </div>
            </div>
          </div>
          
          {/* Right Visual */}
          <div className="relative flex items-center justify-center px-6 py-16 lg:py-0">
            <div className="absolute inset-0 bg-linear-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl" />
            <div className="relative">
              <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 shadow-2xl">
                <img 
                  src={heroImage} 
                  alt="ফার্মেসি অ্যাপ" 
                  className="mx-auto h-64 w-64 object-contain drop-shadow-2xl"
                />
                <div className="mt-6 rounded-xl bg-linear-to-br from-slate-800 to-slate-900 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-emerald-400">লাইভ স্ট্যাটাস</span>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{products.length || 0}</div>
                      <div className="text-xs text-gray-400">পণ্য</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{categories.length || 0}</div>
                      <div className="text-xs text-gray-400">ক্যাটাগরি</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white flex items-center justify-center gap-1">
                        <FiPackage className="h-5 w-5" />
                      </div>
                      <div className="text-xs text-gray-400">ইন স্টক</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-2">
              <FiTrendingUp className="h-4 w-4" />
              <span>ক্যাটাগরি</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">আপনার প্রয়োজন অনুযায়ী বেছে নিন</h2>
          </div>
          <Link 
            to="/products" 
            className="group hidden sm:inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
          >
            সব দেখুন
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?category_id=${category.id}`}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:border-emerald-200 hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-emerald-50 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-green-500 text-white font-bold">
                    {category.category_name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{category.category_name}</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {category.description || 'ভেরিফায়েড ওষুধ ও স্বাস্থ্যপণ্য'}
                </p>
                <div className="mt-4 flex items-center text-emerald-600 font-semibold text-sm group-hover:gap-2 transition-all">
                  <span>ব্রাউজ করুন</span>
                  <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
          {!loading && categories.length === 0 && (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">কোন ক্যাটাগরি পাওয়া যায়নি</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-linear-to-b from-gray-50 to-white -mx-4 px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-2">
              <FiStar className="h-4 w-4" />
              <span>ফিচারড</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">জনপ্রিয় পণ্যসমূহ</h2>
          </div>
          <Link 
            to="/products" 
            className="group hidden sm:inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
          >
            আরও দেখুন
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-white p-4 animate-pulse">
                <div className="aspect-4/3 rounded-xl bg-gray-200 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="flex justify-between">
                  <div className="h-6 bg-gray-200 rounded w-1/3" />
                  <div className="h-6 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <FeaturedProduct key={product.id} product={product} />
            ))}
            {products.length === 0 && (
              <div className="col-span-full rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
                <FiShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-500">কোন পণ্য পাওয়া যায়নি</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Services Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">কেন আমাদের থেকে কিনবেন?</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            আমরা প্রদান করি সম্পূর্ণ নিরাপদ এবং নির্ভরযোগ্য ফার্মেসি সেবা
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg shadow-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br ${service.gradient} opacity-10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500`} />
                <div className="relative">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br ${service.gradient} text-white shadow-lg mb-5`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{service.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{service.text}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 to-green-700 p-8 md:p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="3" cy="3" r="1"/%3E%3Ccircle cx="13" cy="13" r="1"/%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        
        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-4">
              <FiClock className="h-5 w-5" />
              <span className="font-semibold">দ্রুত ও সহজ</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              প্রেসক্রিপশন আপলোড করে
              <br />
              <span className="text-emerald-200">অর্ডার প্রক্রিয়া শুরু করুন</span>
            </h2>
            <p className="text-emerald-50 text-lg max-w-2xl">
              প্রেসক্রিপশন রিভিউ সম্পন্ন হলে আপনার অর্ডার দ্রুত প্রসেস করা হবে।
              আমাদের অভিজ্ঞ ফার্মাসিস্ট টিম প্রতিটি প্রেসক্রিপশন যাচাই করে।
            </p>
          </div>
          
          <Link
            to="/upload-prescription"
            className="group inline-flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-lg font-bold text-emerald-700 shadow-2xl transition-all hover:shadow-emerald-900/30 hover:scale-105"
          >
            আপলোড করুন এখনই
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  )
}

function FeaturedProduct({ product }) {
  const image = product.primary_image?.image_url || product.images?.[0]?.image_url
  const imageUrl = image?.startsWith('http') ? image : image ? `${API_ORIGIN}${image}` : null

  return (
    <article className="group relative rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 overflow-hidden">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-4/3 overflow-hidden bg-linear-to-br from-gray-50 to-gray-100">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={product.product_name} 
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-green-500">
                <span className="text-3xl font-bold text-white">Rx</span>
              </div>
            </div>
          )}
          {product.requires_prescription && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400/90 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-amber-900 shadow-lg">
                <FiShield className="h-3 w-3" />
                Rx
              </span>
            </div>
          )}
          {product.discount_percentage > 0 && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                -{product.discount_percentage}%
              </span>
            </div>
          )}
        </div>
        
        <div className="p-5">
          <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {product.product_name}
          </h3>
          <p className="mt-1 text-sm text-gray-600 line-clamp-1">
            {product.generic_name || product.brand_name || 'জেনেরিক তথ্য নেই'}
          </p>
          
          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-emerald-600">
                  {money(product.display_price || product.lowest_valid_price)}
                </span>
                {product.original_price && product.original_price > product.display_price && (
                  <span className="text-sm text-gray-400 line-through">
                    {money(product.original_price)}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${product.available_stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-500">
                  {product.available_stock > 0 ? `স্টকে আছে (${product.available_stock})` : 'স্টক আউট'}
                </span>
              </div>
            </div>
            
            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-all hover:bg-emerald-100 hover:scale-110">
              <FiShoppingCart className="h-5 w-5" />
            </button>
          </div>
        </div>
      </Link>
    </article>
  )
}