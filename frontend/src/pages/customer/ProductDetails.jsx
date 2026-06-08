import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiCheckCircle, FiClock, FiHeart, FiPackage, FiShield, FiShoppingCart, FiTruck } from 'react-icons/fi'
import { productApi } from '../../api/productApi'
import { useStorefront } from '../../context/StorefrontContext'
import { money } from '../../utils/formatters'
import { getDefaultPurchaseOption, getPurchaseOptions, getUnitSummary } from '../../utils/purchaseUnits'

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://my_pharmecy.test/api').replace(/\/api\/?$/, '')

function resolveImage(path) {
  if (!path) return null
  return path.startsWith('http') ? path : new URL(path, `${API_ORIGIN}/`).toString()
}

export default function ProductDetails() {
  const { addToCart, isWishlisted, toggleWishlist } = useStorefront()
  const { id } = useParams()
  const location = useLocation()
  const seededProduct = location.state?.product || productApi.getCachedProduct(id)
  const [viewState, setViewState] = useState({
    id,
    product: seededProduct,
    pending: !seededProduct,
  })
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    let cancelled = false

    productApi
      .show(id)
      .then(({ data }) => {
        if (cancelled) return
        productApi.primeProduct(data.data)
        setViewState({ id, product: data.data, pending: false })
      })
      .catch(() => {
        if (cancelled) return
        setViewState({ id, product: seededProduct || null, pending: false })
        if (!seededProduct) {
          toast.error('Unable to load the product details right now.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [id, seededProduct])

  const product = viewState.id === id ? viewState.product : seededProduct
  const isLoading = viewState.id === id ? viewState.pending && !product : !seededProduct

  const gallery = !product
    ? []
    : [...new Set([product.primary_image?.image_url, ...(product.images || []).map((image) => image.image_url)].map(resolveImage).filter(Boolean))]

  const activeImage = selectedImage && gallery.includes(selectedImage) ? selectedImage : gallery[0] || null
  const purchaseOptions = useMemo(() => getPurchaseOptions(product), [product])
  const activeOption = useMemo(
    () => purchaseOptions.find((option) => option.code === selectedUnit) || getDefaultPurchaseOption(product),
    [product, purchaseOptions, selectedUnit],
  )
  const effectiveQuantity = activeOption ? Math.min(Math.max(1, quantity), Math.max(1, activeOption.available_quantity || 1)) : 1

  const batch = product?.batches?.[0]
  const description = product?.description || 'Detailed customer-facing medicine information appears here in a clearer and more product-focused layout.'
  const overviewItems = [
    { label: 'Category', value: product?.category?.category_name || 'Healthcare' },
    { label: 'Manufacturer', value: product?.manufacturer?.manufacturer_name || product?.brand_name || 'Trusted brand' },
    { label: 'Dosage form', value: product?.dosage_form || 'General form' },
    { label: 'Strength', value: product?.strength || 'Not specified' },
  ]
  const infoCards = [
    { icon: FiShield, title: 'Verified source', body: 'Stronger trust cues with a cleaner buying flow.' },
    { icon: FiTruck, title: 'Delivery ready', body: 'Fast action paths into order and support flows.' },
    { icon: FiClock, title: 'Support nearby', body: 'Prescription upload and follow-up stay easy to find.' },
  ]
  const totalPrice = (activeOption?.unit_price || 0) * effectiveQuantity
  const totalPieces = (activeOption?.pieces_per_unit || 0) * effectiveQuantity
  const totalSavings = (activeOption?.savings || 0) * effectiveQuantity
  const saved = isWishlisted(product?.id)
  const stockPieces = product?.available_stock ?? 0
  const stockLabel = activeOption?.is_available ? `${activeOption.available_quantity} ${activeOption.label.toLowerCase()} available` : 'Currently unavailable'

  const add = async () => {
    if (!product || !activeOption || !activeOption.is_available) return

    try {
      await addToCart({
        product_id: product.id,
        purchase_unit: activeOption.code,
        quantity: effectiveQuantity,
      })
      toast.success(`Added ${getUnitSummary(effectiveQuantity, activeOption.label)} to cart.`)
    } catch {
      toast.error('Could not add this item to the cart.')
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-[560px] animate-pulse border border-slate-200 bg-white" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-slate-950">Product not found.</h1>
        <Link to="/products" className="mt-6 inline-flex items-center gap-2 bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          Back to catalog
          <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-[#f4f6f8]">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.28)] sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <Link to="/" className="font-medium text-slate-700 transition hover:text-slate-950">
                Home
              </Link>
              <span>/</span>
              <Link to="/products" className="font-medium text-slate-700 transition hover:text-slate-950">
                Products
              </Link>
              <span>/</span>
              <span className="truncate text-slate-950">{product.product_name}</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                {product.requires_prescription ? 'Prescription required' : 'No prescription needed'}
              </div>
              <div className="border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                {stockPieces > 0 ? `${stockPieces} pieces in stock` : 'Check availability'}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.02fr_1.18fr]">
          <div className="space-y-6">
            <div className="border border-slate-200 bg-white shadow-[0_24px_70px_-46px_rgba(15,23,42,0.28)]">
              <div className="border-b border-slate-200 bg-slate-100 p-5 sm:p-6">
                <div className="overflow-hidden border border-slate-200 bg-white">
                  {activeImage ? (
                    <img src={activeImage} alt={product.product_name} className="h-[340px] w-full object-cover sm:h-[460px] lg:h-[560px]" />
                  ) : (
                    <div className="flex h-[340px] items-center justify-center bg-slate-50 text-6xl font-bold text-emerald-600 sm:h-[460px] lg:h-[560px]">
                      Rx
                    </div>
                  )}
                </div>

                {gallery.length > 1 ? (
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {gallery.slice(0, 4).map((image) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setSelectedImage(image)}
                        className={`overflow-hidden border bg-white transition ${activeImage === image ? 'border-slate-950' : 'border-slate-200 hover:border-slate-400'}`}
                      >
                        <img src={image} alt="Product thumbnail" className="h-20 w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-px border-t border-slate-200 bg-slate-200 sm:grid-cols-3">
                {infoCards.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="bg-white p-5">
                      <div className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-slate-50 text-slate-900">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-slate-950">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-500">{item.body}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.28)]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Product overview</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Clean information block.</h2>
                </div>
                <div className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  <FiCheckCircle className="h-4 w-4" />
                  Verified display
                </div>
              </div>

              <div className="mt-6 grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2">
                {overviewItems.map((item) => (
                  <div key={item.label} className="bg-slate-50 p-5">
                    <div className="text-sm text-slate-500">{item.label}</div>
                    <div className="mt-2 text-lg font-semibold text-slate-950">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 border border-slate-200 bg-white p-5 text-sm leading-8 text-slate-600">
                {description}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <section className="border border-slate-200 bg-white shadow-[0_24px_70px_-46px_rgba(15,23,42,0.28)]">
              <div className="border-b border-slate-200 p-6 sm:p-8">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Product details</div>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{product.product_name}</h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{description}</p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {[product.category?.category_name || 'Healthcare', product.manufacturer?.manufacturer_name || product.brand_name || 'Trusted brand', product.dosage_form || 'General form'].map((item) => (
                    <span key={item} className="border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-6 grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-3">
                  <div className="bg-slate-50 p-5">
                    <div className="text-sm text-slate-500">Piece price</div>
                    <div className="mt-2 text-3xl font-semibold text-slate-950">{money(product.display_price || batch?.selling_price)}</div>
                  </div>
                  <div className="bg-slate-50 p-5">
                    <div className="text-sm text-slate-500">Available stock</div>
                    <div className="mt-2 text-3xl font-semibold text-slate-950">{stockPieces}</div>
                    <div className="mt-1 text-sm text-slate-500">pieces</div>
                  </div>
                  <div className="bg-slate-50 p-5">
                    <div className="text-sm text-slate-500">Batch status</div>
                    <div className="mt-2 text-3xl font-semibold text-slate-950">{batch?.status || 'Active'}</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-8 p-6 sm:p-8">
                <div className="border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Purchase units</div>
                      <div className="mt-2 text-sm leading-7 text-slate-500">Choose the format you want. Stock still deducts from piece inventory automatically.</div>
                    </div>
                    {activeOption?.badge ? (
                      <div className="border border-emerald-200 bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                        {activeOption.badge}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 space-y-3">
                    {purchaseOptions.map((option) => {
                      const isSelected = option.code === activeOption?.code

                      return (
                        <button
                          key={option.code}
                          type="button"
                          disabled={!option.is_available}
                          onClick={() => setSelectedUnit(option.code)}
                          className={`grid w-full gap-4 border px-4 py-4 text-left transition sm:grid-cols-[minmax(0,1fr)_160px] ${
                            isSelected ? 'border-slate-950 bg-white' : 'border-slate-200 bg-white'
                          } ${!option.is_available ? 'cursor-not-allowed opacity-50' : 'hover:border-slate-400'}`}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-lg font-semibold text-slate-950">{option.label}</span>
                              {option.badge ? (
                                <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                                  {option.badge}
                                </span>
                              ) : null}
                              {option.code === 'box' && option.savings > 0 ? (
                                <span className="border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                                  Save {money(option.savings)}
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-2 text-sm text-slate-500">{option.conversion_label}</div>
                            <div className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                              Up to {option.available_quantity} {option.label.toLowerCase()}
                            </div>
                          </div>
                          <div className="border-t border-slate-200 pt-4 text-left sm:border-t-0 sm:border-l sm:border-slate-200 sm:pl-4 sm:pt-0 sm:text-right">
                            <div className="text-xl font-semibold text-slate-950">{money(option.unit_price)}</div>
                            {option.savings > 0 ? (
                              <div className="mt-1 text-xs font-medium text-emerald-700">
                                Save {money(option.savings)} vs pieces
                              </div>
                            ) : (
                              <div className="mt-1 text-xs text-slate-500">No extra savings</div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="border border-slate-200 bg-white">
                    <div className="grid gap-px bg-slate-200 sm:grid-cols-[1fr_220px]">
                      <div className="bg-white p-5">
                        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Quantity</div>
                        <div className="mt-4 flex items-center gap-3">
                          <button
                            type="button"
                            className="flex h-11 w-11 items-center justify-center border border-slate-300 text-lg font-semibold text-slate-900 disabled:opacity-40"
                            disabled={!activeOption || effectiveQuantity <= 1}
                            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                          >
                            -
                          </button>
                          <div className="flex h-11 min-w-[84px] items-center justify-center border border-slate-300 px-4 text-lg font-semibold text-slate-950">
                            {effectiveQuantity}
                          </div>
                          <button
                            type="button"
                            className="flex h-11 w-11 items-center justify-center border border-slate-300 text-lg font-semibold text-slate-900 disabled:opacity-40"
                            disabled={!activeOption || effectiveQuantity >= (activeOption.available_quantity || 0)}
                            onClick={() => setQuantity((current) => current + 1)}
                          >
                            +
                          </button>
                        </div>
                        <div className="mt-3 text-sm text-slate-500">
                          {activeOption ? `${getUnitSummary(effectiveQuantity, activeOption.label)} = ${totalPieces} pieces` : 'Select a unit'}
                        </div>
                      </div>

                      <div className="bg-slate-950 p-5 text-white">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Live total</div>
                        <div className="mt-3 text-3xl font-semibold">{money(totalPrice)}</div>
                        <div className="mt-2 text-sm text-slate-300">{activeOption ? `${effectiveQuantity} x ${activeOption.label}` : 'Unit not available'}</div>
                        {totalSavings > 0 ? (
                          <div className="mt-3 inline-flex border border-emerald-400/30 bg-emerald-500/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                            Saving {money(totalSavings)}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="border-t border-slate-200 p-5">
                      <div className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2">
                        <div className="bg-slate-50 p-5">
                          <div className="text-sm text-slate-500">Selected unit</div>
                          <div className="mt-2 text-2xl font-semibold text-slate-950">{activeOption?.label || 'Unavailable'}</div>
                          <div className="mt-2 text-sm text-slate-500">{activeOption?.conversion_label || 'No unit available'}</div>
                        </div>
                        <div className="bg-slate-50 p-5">
                          <div className="text-sm text-slate-500">Stock status</div>
                          <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-slate-950">
                            <FiPackage className="h-5 w-5 text-emerald-600" />
                            {stockLabel}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <aside className="border border-slate-200 bg-white p-5 lg:sticky lg:top-24 lg:self-start">
                    <div className="border-b border-slate-200 pb-4">
                      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Order panel</div>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Fast, clear actions.</h2>
                    </div>

                    <div className="mt-5 space-y-3">
                      <button
                        className="w-full bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        onClick={add}
                        disabled={!activeOption?.is_available}
                      >
                        <span className="inline-flex items-center gap-2">
                          <FiShoppingCart className="h-4 w-4" />
                          Add {activeOption ? getUnitSummary(effectiveQuantity, activeOption.label) : 'to cart'}
                        </span>
                      </button>

                      <button
                        type="button"
                        className={`w-full border px-5 py-3.5 text-sm font-semibold transition ${
                          saved
                            ? 'border-rose-200 bg-rose-50 text-rose-600'
                            : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                        }`}
                        onClick={() => toggleWishlist(product)}
                      >
                        <span className="inline-flex items-center gap-2">
                          <FiHeart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
                          {saved ? 'Saved to wishlist' : 'Save to wishlist'}
                        </span>
                      </button>

                      {product.requires_prescription ? (
                        <Link to="/upload-prescription" className="flex w-full items-center justify-center gap-2 border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400">
                          <FiShield className="h-4 w-4" />
                          Upload prescription
                        </Link>
                      ) : (
                        <Link to="/products" className="flex w-full items-center justify-center gap-2 border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400">
                          Continue shopping
                          <FiArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>

                    <div className="mt-5 border-t border-slate-200 pt-5 text-sm leading-7 text-slate-500">
                      Product details stay primary, while support and prescription actions remain easy to access.
                    </div>
                  </aside>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  )
}
