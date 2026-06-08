import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiClock, FiFileText, FiMapPin, FiPackage, FiPhoneCall, FiSearch, FiShield, FiTruck } from 'react-icons/fi'
import ProductCard, { ProductCardSkeleton } from '../../components/customer/ProductCard'
import { productApi } from '../../api/productApi'
import { useStorefront } from '../../context/StorefrontContext'
import { money } from '../../utils/formatters'
import { getDefaultPurchaseOption } from '../../utils/purchaseUnits'

const heroSlides = [
  {
    id: 1,
    title: 'Order medicines online with a clearer pharmacy-first shopping flow.',
    body: 'Browse prescription medicines, OTC essentials, and healthcare products with faster search, cleaner product discovery, and direct prescription upload.',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 2,
    title: 'Prescription upload, trusted support, and doorstep delivery in one place.',
    body: 'A modern online pharmacy experience designed around medicine ordering, prescription review, and practical support actions.',
    image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 3,
    title: 'Find medicines, compare units, and place orders with less friction.',
    body: 'Product-first browsing, category-led discovery, and a cleaner route from search to checkout.',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1600&q=80',
  },
]

const serviceItems = [
  {
    icon: FiShield,
    title: 'Prescription-sensitive ordering',
    body: 'Products that require review stay clearly marked and close to upload actions.',
  },
  {
    icon: FiTruck,
    title: 'Delivery-friendly workflow',
    body: 'Search, cart, checkout, and tracking routes stay close together for faster completion.',
  },
  {
    icon: FiClock,
    title: 'Practical customer support',
    body: 'Prescription, order, and support flows are easy to reach from one storefront shell.',
  },
]

const workflowItems = [
  {
    icon: FiSearch,
    title: 'Search and filter',
    body: 'Find medicine by product name, generic name, category, or manufacturer.',
  },
  {
    icon: FiFileText,
    title: 'Upload prescription',
    body: 'Submit prescription files for review when restricted products are needed.',
  },
  {
    icon: FiPackage,
    title: 'Checkout and track',
    body: 'Place medicine orders and follow delivery progress from your account flow.',
  },
]

const categoryTints = [
  'from-emerald-50 to-white',
  'from-sky-50 to-white',
  'from-amber-50 to-white',
  'from-rose-50 to-white',
  'from-cyan-50 to-white',
  'from-teal-50 to-white',
]

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://my_pharmecy.test/api').replace(/\/api\/?$/, '')

function resolveImage(path) {
  if (!path) return null
  return path.startsWith('http') ? path : new URL(path, `${API_ORIGIN}/`).toString()
}

function getProductImage(product) {
  return resolveImage(product?.primary_image?.image_url || product?.images?.[0]?.image_url)
}

export default function Home() {
  const { addToCart } = useStorefront()
  const navigate = useNavigate()
  const cachedFeatured = productApi.getCachedList({ per_page: 12 })
  const [products, setProducts] = useState(cachedFeatured?.data || [])
  const [categories, setCategories] = useState(() => productApi.getCachedCategories())
  const [manufacturers, setManufacturers] = useState(() => productApi.getCachedManufacturers())
  const [loading, setLoading] = useState(!cachedFeatured)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([productApi.list({ per_page: 12 }), productApi.categories(), productApi.manufacturers()])
      .then(([productRes, categoryRes, manufacturerRes]) => {
        setProducts(productRes.data.data?.data || [])
        setCategories(categoryRes.data.data || [])
        setManufacturers(manufacturerRes.data.data || [])
      })
      .catch(() => toast.error('Unable to load the storefront right now.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 6500)

    return () => clearInterval(timer)
  }, [])

  const slide = heroSlides[currentSlide]

  const featuredProducts = useMemo(() => products.slice(0, 6), [products])
  const otcProducts = useMemo(() => products.filter((product) => !product.requires_prescription).slice(0, 4), [products])
  const prescriptionProducts = useMemo(() => products.filter((product) => product.requires_prescription).slice(0, 4), [products])
  const categoryHighlights = useMemo(() => categories.slice(0, 8), [categories])
  const manufacturerHighlights = useMemo(() => manufacturers.slice(0, 6), [manufacturers])

  const spotlightProduct = featuredProducts[0]
  const spotlightImage = getProductImage(spotlightProduct) || heroSlides[1].image

  const handleSearch = (event) => {
    event.preventDefault()
    const query = search.trim()
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products')
  }

  const add = async (product) => {
    const option = getDefaultPurchaseOption(product)

    try {
      await addToCart({
        product_id: product.id,
        purchase_unit: option?.code || 'piece',
        quantity: 1,
      })
      toast.success(`Added 1 ${option?.label || 'Piece'} to cart.`)
    } catch {
      toast.error('Could not add this item to the cart.')
    }
  }

  return (
    <div className="bg-[#f4f6f8] text-slate-900">
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.88),rgba(2,6,23,0.70),rgba(2,6,23,0.46))]" />
        </div>

        <div className="relative mx-auto grid min-h-[76vh] max-w-7xl gap-10 px-4 py-16 sm:px-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-center lg:px-8">
          <div className="text-white">
            <div className="inline-flex border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 backdrop-blur-sm">
              Trusted online pharmacy in Bangladesh
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">{slide.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200">{slide.body}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                Shop medicines
              </Link>
              <Link to="/upload-prescription" className="border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15">
                Upload prescription
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Support line</div>
                <div className="mt-3 flex items-center gap-2 text-lg font-semibold">
                  <FiPhoneCall className="h-4 w-4" />
                  09610-001122
                </div>
              </div>
              <div className="border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Delivery area</div>
                <div className="mt-3 flex items-center gap-2 text-lg font-semibold">
                  <FiMapPin className="h-4 w-4" />
                  Dhaka city coverage
                </div>
              </div>
              <div className="border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Order type</div>
                <div className="mt-3 flex items-center gap-2 text-lg font-semibold">
                  <FiShield className="h-4 w-4" />
                  OTC and prescription
                </div>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-6 shadow-[0_28px_80px_-45px_rgba(15,23,42,0.6)] sm:p-7">
            <div className="border-b border-slate-200 pb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">Start an order</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Search, upload, or browse.</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Choose the fastest route for medicine ordering based on whether you already know the product or need prescription review.
              </p>
            </div>

            <form onSubmit={handleSearch} className="mt-5 border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3 border border-slate-300 bg-white px-4 py-3 text-slate-500">
                <FiSearch className="h-5 w-5" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Search medicine, generic, brand, wellness"
                />
              </div>
              <button type="submit" className="mt-3 w-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Find products
              </button>
            </form>

            <div className="mt-5 grid gap-3">
              <Link to="/upload-prescription" className="flex items-start justify-between border border-slate-200 bg-white p-4 transition hover:border-slate-400">
                <div>
                  <div className="text-sm font-semibold text-slate-950">Upload prescription</div>
                  <div className="mt-1 text-sm leading-6 text-slate-500">Submit image or PDF and continue medicine ordering after review.</div>
                </div>
                <FiArrowRight className="mt-1 h-4 w-4 text-slate-500" />
              </Link>
              <Link to="/products?requires_prescription=0" className="flex items-start justify-between border border-slate-200 bg-white p-4 transition hover:border-slate-400">
                <div>
                  <div className="text-sm font-semibold text-slate-950">Browse OTC medicines</div>
                  <div className="mt-1 text-sm leading-6 text-slate-500">Shop non-prescription products, wellness, and everyday care items.</div>
                </div>
                <FiArrowRight className="mt-1 h-4 w-4 text-slate-500" />
              </Link>
              <Link to="/support" className="flex items-start justify-between border border-slate-200 bg-white p-4 transition hover:border-slate-400">
                <div>
                  <div className="text-sm font-semibold text-slate-950">Need pharmacy support?</div>
                  <div className="mt-1 text-sm leading-6 text-slate-500">Reach support for order, prescription, or delivery-related help.</div>
                </div>
                <FiArrowRight className="mt-1 h-4 w-4 text-slate-500" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="grid gap-4 py-10 md:grid-cols-2 xl:grid-cols-4">
          <Link to="/upload-prescription" className="border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Prescription</div>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">Upload and order</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500">Restricted medicines stay close to prescription review and ordering actions.</p>
          </Link>
          <Link to="/products" className="border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Catalog</div>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">Browse all medicines</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500">Filter by category, manufacturer, and prescription requirement.</p>
          </Link>
          <Link to="/cart" className="border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Checkout</div>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">Complete your order</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500">Move quickly from selected products to delivery details and payment.</p>
          </Link>
          <Link to="/orders" className="border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Tracking</div>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">Monitor your orders</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500">Follow status changes, delivery progress, and prescription-linked orders.</p>
          </Link>
        </section>

        <section className="pb-16">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">Shop by category</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Department-first medicine browsing.</h2>
            </div>
            <Link to="/products" className="hidden text-sm font-semibold text-slate-600 hover:text-slate-950 sm:inline-flex">
              Browse all products
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categoryHighlights.map((category, index) => (
              <Link
                key={category.id}
                to={`/products?category_id=${category.id}`}
                className={`border border-slate-200 bg-gradient-to-br ${categoryTints[index % categoryTints.length]} p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5`}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Category</div>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{category.category_name}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">Open this department and continue with category-led medicine search.</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6 pb-16 xl:grid-cols-2">
          <div className="border border-slate-200 bg-white shadow-[0_24px_70px_-46px_rgba(15,23,42,0.36)]">
            <div className="border-b border-slate-200 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">Prescription medicines</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Products that need review.</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">Keep prescription-required medicines in a separate, clearer pathway.</p>
            </div>
            <div className="space-y-px bg-slate-200">
              {prescriptionProducts.length > 0 ? prescriptionProducts.map((product) => (
                <MiniProductRow key={product.id} product={product} />
              )) : (
                <div className="bg-white p-6 text-sm text-slate-500">Prescription products will appear here as catalog data expands.</div>
              )}
            </div>
            <div className="border-t border-slate-200 p-6">
              <Link to="/upload-prescription" className="inline-flex items-center gap-2 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Upload prescription
                <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="border border-slate-200 bg-white shadow-[0_24px_70px_-46px_rgba(15,23,42,0.36)]">
            <div className="border-b border-slate-200 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">OTC and healthcare products</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Everyday products with faster entry.</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">Browse direct-purchase items with fewer steps and clearer discovery.</p>
            </div>
            <div className="space-y-px bg-slate-200">
              {otcProducts.length > 0 ? otcProducts.map((product) => (
                <MiniProductRow key={product.id} product={product} />
              )) : (
                <div className="bg-white p-6 text-sm text-slate-500">OTC and wellness products will appear here as catalog data expands.</div>
              )}
            </div>
            <div className="border-t border-slate-200 p-6">
              <Link to="/products?requires_prescription=0" className="inline-flex items-center gap-2 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Browse OTC products
                <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">Featured medicines</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Product-first cards for faster shopping.</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {(loading ? Array.from({ length: 6 }, (_, index) => ({ id: `placeholder-${index}` })) : featuredProducts).map((product) => {
              if (loading) {
                return <ProductCardSkeleton key={product.id} />
              }

              return <ProductCard key={product.id} product={product} onAdd={add} />
            })}
          </div>
        </section>

        <section className="grid gap-6 pb-16 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden border border-slate-200 bg-white shadow-[0_24px_70px_-46px_rgba(15,23,42,0.36)]">
            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="relative min-h-[320px]">
                <img src={spotlightImage} alt={spotlightProduct?.product_name || 'Featured medicine'} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12),rgba(15,23,42,0.68))]" />
                <div className="relative flex min-h-[320px] items-end p-6 text-white">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">Storefront spotlight</div>
                    <h3 className="mt-3 text-3xl font-semibold tracking-tight">{spotlightProduct?.product_name || 'Popular medicine display'}</h3>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">How the storefront works</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Designed around medicine ordering.</h2>
                <div className="mt-6 grid gap-4">
                  {workflowItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.title} className="border border-slate-200 bg-slate-50 p-5">
                        <div className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-white text-slate-950">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-950">{item.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-500">{item.body}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-46px_rgba(15,23,42,0.36)]">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">Popular manufacturers</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Recognizable healthcare brands.</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {manufacturerHighlights.map((manufacturer) => (
                  <div key={manufacturer.id} className="flex items-center gap-3 border border-slate-200 bg-slate-50 p-4">
                    {manufacturer.logo_url ? (
                      <img src={resolveImage(manufacturer.logo_url)} alt={manufacturer.manufacturer_name} className="h-12 w-12 border border-slate-200 object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center border border-slate-200 bg-white text-xs font-semibold text-slate-500">
                        {manufacturer.manufacturer_name?.slice(0, 2)?.toUpperCase() || 'NA'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-950">{manufacturer.manufacturer_name}</div>
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Manufacturer</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-46px_rgba(15,23,42,0.36)]">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">Why this feels better</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Clearer than a generic ecommerce site.</h2>
              <div className="mt-6 grid gap-4">
                {serviceItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="border border-slate-200 bg-slate-50 p-5">
                      <div className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-white text-slate-950">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-slate-950">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-500">{item.body}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="border border-slate-200 bg-slate-950 p-8 text-white shadow-[0_24px_70px_-46px_rgba(15,23,42,0.44)] sm:p-10">
            <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">Need help ordering?</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Prescription, support, and delivery actions stay close.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-300">
                  Build your order directly from the catalog, submit prescription files when needed, and keep order-related support visible throughout the storefront.
                </p>
              </div>

              <div className="grid gap-3">
                <Link to="/upload-prescription" className="flex items-center justify-between border border-white/15 bg-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/15">
                  Upload prescription
                  <FiArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/products" className="flex items-center justify-between border border-white/15 bg-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/15">
                  Browse all medicines
                  <FiArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/support" className="flex items-center justify-between border border-white/15 bg-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/15">
                  Contact support
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function MiniProductRow({ product }) {
  const image = getProductImage(product)

  return (
    <Link to={`/products/${product.id}`} state={{ product }} className="grid gap-4 bg-white p-5 transition hover:bg-slate-50 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center">
      <div className="overflow-hidden border border-slate-200 bg-slate-50">
        {image ? (
          <img src={image} alt={product.product_name} className="h-[72px] w-full object-cover" />
        ) : (
          <div className="flex h-[72px] items-center justify-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Rx</div>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          {product.manufacturer?.manufacturer_name || product.category?.category_name || 'Healthcare'}
        </div>
        <h3 className="mt-1 line-clamp-2 text-lg font-semibold tracking-tight text-slate-950">{product.product_name}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {product.requires_prescription ? 'Prescription required' : 'Direct purchase'}
        </p>
      </div>
      <div className="text-left sm:text-right">
        <div className="text-lg font-semibold text-slate-950">{money(product.display_price)}</div>
        <div className="mt-1 text-xs text-slate-500">Starting price</div>
      </div>
    </Link>
  )
}
