import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiHeart, FiPlus, FiMinus, FiShoppingCart, FiUpload, FiLogIn } from 'react-icons/fi'
import { productApi } from '../../api/productApi'
import { prescriptionApi } from '../../api/prescriptionApi'
import OptimizedImage from '../../components/common/OptimizedImage'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useStorefront } from '../../context/StorefrontContext'
import { useProductQuery } from '../../queries/customerQueries'
import { handleImageFallback, MEDICINE_PLACEHOLDER_SRC, resolveImageUrl } from '../../utils/imageUrl'
import { isPrescriptionLoginRequiredError, requiresPrescriptionLogin as requiresPrescriptionLoginForProduct, showPrescriptionLoginRequiredAlert } from '../../utils/prescriptionCartAlert'
import { readPreferredPrescriptionId, writePreferredPrescriptionId } from '../../utils/prescriptionSelection'
import { getProductPath, getProductRouteKey } from '../../utils/productRouting'
import { getCategoryName } from '../../utils/categoryNames'
import { prescriptionDisplayName, prescriptionDisplayNameById } from '../../utils/prescriptionDisplay'
import { getDefaultPurchaseOption, getLocalizedConversionLabel, getPurchaseOptions, getUnitLabel, getUnitSummary } from '../../utils/purchaseUnits'

const selectablePrescriptionStatuses = ['approved', 'pending']

function roundedMoney(value, locale = 'en-US') {
  const amount = Number(value || 0)
  const rounded = Math.round(Number.isNaN(amount) ? 0 : amount)

  return `৳${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded)}`
}

export default function ProductDetails() {
  const { addToCart, isWishlisted, toggleWishlist } = useStorefront()
  const { customer, loading: authLoading } = useCustomerAuth()
  const { isBangla } = useLanguage()
  const { slug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const t = useCallback((bn, en) => (isBangla ? bn : en), [isBangla])
  const locale = isBangla ? 'bn-BD' : 'en-US'
  const banglaFontClass = isBangla ? 'font-bangla' : ''
  const seededProduct = location.state?.product || productApi.getCachedProduct(slug)
  const [viewState, setViewState] = useState({
    routeKey: slug,
    product: seededProduct,
    pending: !seededProduct,
  })
  const [selectedImageState, setSelectedImageState] = useState({ routeKey: slug, value: null })
  const [selectedUnitState, setSelectedUnitState] = useState({ routeKey: slug, value: null })
  const [quantityState, setQuantityState] = useState({ routeKey: slug, value: 1 })
  const [prescriptions, setPrescriptions] = useState([])
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false)
  const [prescriptionsReady, setPrescriptionsReady] = useState(false)
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(() => readPreferredPrescriptionId())

  useEffect(() => {
    if (authLoading) return

    if (!viewState.product?.requires_prescription) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrescriptions([])
      setPrescriptionsLoading(false)
      setPrescriptionsReady(false)
      return
    }

    if (!customer) {
      setPrescriptions([])
      setPrescriptionsLoading(false)
      setPrescriptionsReady(true)
      return
    }

    let cancelled = false

    const cachedPrescriptions = prescriptionApi.getCachedList()

    if (cachedPrescriptions.length > 0) {
      setPrescriptions(cachedPrescriptions)
      setPrescriptionsLoading(false)
      setPrescriptionsReady(true)
    } else {
      setPrescriptionsLoading(true)
      setPrescriptionsReady(false)
    }

    const request = cachedPrescriptions.length > 0
      ? prescriptionApi.refreshList()
      : prescriptionApi.list()

    request
      .then(({ data }) => {
        if (cancelled) return
        setPrescriptions(data.data?.data || data.data || [])
        setPrescriptionsReady(true)
      })
      .catch(() => {
        if (cancelled) return
        setPrescriptions([])
        setPrescriptionsReady(true)
      })
      .finally(() => {
        if (!cancelled) {
          setPrescriptionsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, customer, viewState.product?.requires_prescription])

  const product = viewState.routeKey === slug ? viewState.product : seededProduct
  const routeKey = getProductRouteKey(product)
  const isLoading = viewState.routeKey === slug ? viewState.pending && !product : !seededProduct
  const loginPath = `/login?returnTo=${encodeURIComponent(location.pathname)}`
  const productQuery = useProductQuery(slug)

  useEffect(() => {
    const nextProduct = productQuery.data
    if (!nextProduct) return

    const canonicalPath = getProductPath(nextProduct)
    productApi.primeProduct(nextProduct)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setViewState({ routeKey: slug, product: nextProduct, pending: false })

    if (canonicalPath !== `/products/${encodeURIComponent(slug)}`) {
      navigate(canonicalPath, { replace: true, state: { product: nextProduct } })
    }
  }, [navigate, productQuery.data, slug])

  useEffect(() => {
    if (productQuery.isError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewState({ routeKey: slug, product: seededProduct || null, pending: false })

      if (!seededProduct) {
        toast.error(t('এই মুহূর্তে পণ্যের বিস্তারিত লোড করা যাচ্ছে না।', 'Unable to load the product details right now.'))
      }
    }
  }, [productQuery.isError, seededProduct, slug, t])

  const gallery = useMemo(() => {
    if (!product) return [MEDICINE_PLACEHOLDER_SRC]

    const resolved = [
      ...new Set(
        [product.primary_image?.image_url, ...(product.images || []).map((image) => image.image_url)]
          .map((image) => resolveImageUrl(image, null))
          .filter(Boolean),
      ),
    ]

    return resolved.length > 0 ? resolved : [MEDICINE_PLACEHOLDER_SRC]
  }, [product])

  const purchaseOptions = useMemo(() => getPurchaseOptions(product), [product])
  const selectablePrescriptions = useMemo(
    () => prescriptions.filter((item) => selectablePrescriptionStatuses.includes(item.status)),
    [prescriptions],
  )
  const selectedPrescription = useMemo(
    () => selectablePrescriptions.find((item) => String(item.id) === String(selectedPrescriptionId)) || null,
    [selectablePrescriptions, selectedPrescriptionId],
  )
  const selectedPrescriptionValue = selectedPrescription ? String(selectedPrescription.id) : ''
  const selectedImage = selectedImageState.routeKey === routeKey ? selectedImageState.value : null
  const selectedUnit = selectedUnitState.routeKey === routeKey ? selectedUnitState.value : null
  const quantity = quantityState.routeKey === routeKey ? quantityState.value : 1
  const activeOption = useMemo(
    () => purchaseOptions.find((option) => option.code === selectedUnit) || getDefaultPurchaseOption(product),
    [product, purchaseOptions, selectedUnit],
  )

  useEffect(() => {
    if (!product?.requires_prescription) return

    const savedId = readPreferredPrescriptionId()
    const matched = selectablePrescriptions.find((item) => String(item.id) === String(savedId))

    if (matched) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPrescriptionId(String(matched.id))
      return
    }

    if (!selectablePrescriptions.find((item) => String(item.id) === String(selectedPrescriptionId))) {
      setSelectedPrescriptionId('')
    }
  }, [product?.requires_prescription, selectablePrescriptions, selectedPrescriptionId])

  const activeImage = selectedImage && gallery.includes(selectedImage) ? selectedImage : gallery[0] || MEDICINE_PLACEHOLDER_SRC
  const batch = product?.batches?.[0]
  const stockPieces = product?.available_stock ?? 0
  const effectiveQuantity = activeOption ? Math.min(Math.max(1, quantity), Math.max(1, activeOption.available_quantity || 1)) : 1
  const totalPieces = (activeOption?.pieces_per_unit || 0) * effectiveQuantity
  const totalPrice = (activeOption?.unit_price || 0) * effectiveQuantity
  const totalSavings = (activeOption?.savings || 0) * effectiveQuantity
  const saved = isWishlisted(product?.id)
  const productName = (isBangla ? product?.product_name_bn : null) || product?.product_name
  const categoryName = getCategoryName(product?.category, isBangla)
  const genericName = (isBangla ? product?.generic_name_bn : null) || product?.generic_name
  const dosageForm = (isBangla ? product?.dosage_form_bn : null) || product?.dosage_form
  const strength = (isBangla ? product?.strength_bn : null) || product?.strength
  const brandName = (isBangla ? product?.brand_name_bn : null) || product?.brand_name
  const manufacturerName = (isBangla ? product?.manufacturer?.manufacturer_name_bn : null) || product?.manufacturer?.manufacturer_name
  const description = ((isBangla ? product?.description_bn : null) || product?.description || '').trim()
  const activeUnitLabel = activeOption ? getUnitLabel(activeOption.code, isBangla) : ''
  const activeUnitSummary = activeOption ? getUnitSummary(effectiveQuantity, activeOption.code, isBangla) : ''
  const requiresPrescriptionLogin = requiresPrescriptionLoginForProduct(product, customer)

  const detailsRows = [
    { label: t('ক্যাটাগরি', 'Category'), value: categoryName || t('স্বাস্থ্যসেবা', 'Healthcare') },
    { label: t('জেনেরিক', 'Generic'), value: genericName || t('উল্লেখ নেই', 'Not specified') },
    { label: t('ডোজ ফর্ম', 'Dosage form'), value: dosageForm || t('সাধারণ ফর্ম', 'General form') },
    { label: t('শক্তিমাত্রা', 'Strength'), value: strength || t('উল্লেখ নেই', 'Not specified') },
    { label: t('ব্র্যান্ড', 'Brand'), value: brandName || manufacturerName || t('বিশ্বস্ত ব্র্যান্ড', 'Trusted brand') },
    { label: t('ব্যাচ নম্বর', 'Batch Number'), value: batch?.batch_number || t('সক্রিয়', 'Active') },
  ]

  const add = async () => {
    if (!product || !activeOption || !activeOption.is_available) return

    if (requiresPrescriptionLogin) {
      await showPrescriptionLoginRequiredAlert(isBangla)
      return
    }

    try {
      await addToCart({
        product_id: product.id,
        purchase_unit: activeOption.code,
        quantity: effectiveQuantity,
      })

      toast.success(
        product.requires_prescription && selectedPrescriptionId
          ? t(
            `${activeUnitSummary} কার্টে যোগ হয়েছে। Checkout-এ ${prescriptionDisplayNameById(selectablePrescriptions, selectedPrescriptionId)} আগে থেকেই সিলেক্ট থাকবে।`,
            `Added ${activeUnitSummary} to cart. ${prescriptionDisplayNameById(selectablePrescriptions, selectedPrescriptionId)} will be preselected at checkout.`,
          )
          : t(
            `${activeUnitSummary} কার্টে যোগ করা হয়েছে।`,
            `Added ${activeUnitSummary} to cart.`,
          ),
      )
    } catch (error) {
      if (isPrescriptionLoginRequiredError(error)) {
        await showPrescriptionLoginRequiredAlert(isBangla)
        return
      }

      toast.error(t('এই পণ্যটি কার্টে যোগ করা যায়নি।', 'Could not add this item to the cart.'))
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-140 animate-pulse border border-[#b7d5d2] bg-[#edf8f7]" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-slate-950">{t('পণ্যটি পাওয়া যায়নি।', 'Product not found.')}</h1>
        <Link to="/products" className="mt-6 inline-flex items-center gap-2 bg-[#0d4b59] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b5f69]">
          {t('পণ্যের তালিকায় ফিরে যান', 'Back to catalog')}
          <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className={`${banglaFontClass}`}>
      <div className="mx-auto max-w-7xl">
        <section className="border border-[#b7d5d2] bg-[#e8f5f3] px-5 py-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#4f6f6b]">
            <Link to="/" className="font-medium text-[#0d4b59] transition hover:text-[#0b5f69]">
              {t('হোম', 'Home')}
            </Link>
            <span>/</span>
            <Link to="/products" className="font-medium text-[#0d4b59] transition hover:text-[#0b5f69]">
              {t('ওষুধ', 'Medicines')}
            </Link>
            <span>/</span>
            <span className="truncate text-[#11343c]">{productName}</span>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-4">
            <div>
              <div className="overflow-hidden border border-[#b7d5d2] bg-[#e8f5f3] shadow-[0_24px_64px_-48px_rgba(13,75,89,0.34)]">
                <OptimizedImage
                  src={activeImage}
                  alt={productName || product?.product_name || 'Product image'}
                  className="h-90 w-full bg-white object-contain sm:h-125"
                  loading="eager"
                  onError={handleImageFallback}
                />
              </div>

              {gallery.length > 1 ? (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {gallery.slice(0, 4).map((image) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setSelectedImageState({ routeKey, value: image })}
                      className={`overflow-hidden border bg-[#edf8f7] transition ${
                        activeImage === image ? 'border-[#0f766e]' : 'border-[#b7d5d2] hover:border-[#13b8b0]'
                      }`}
                    >
                      <OptimizedImage src={image} alt={t('পণ্যের ছবি', 'Product thumbnail')} className="h-20 w-full object-cover" onError={handleImageFallback} />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <div className="grid gap-px border border-[#b7d5d2] bg-[#b7d5d2] sm:grid-cols-2">
                {detailsRows.map((item) => (
                  <MetaRow key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            </div>

            {description ? (
              <div className="border border-[#b7d5d2] bg-[#eef8f7] p-5 shadow-[0_22px_60px_-48px_rgba(13,75,89,0.28)] sm:p-6">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f766e]">{t('পণ্যের বিবরণ', 'Description')}</div>
                <p className="mt-3 text-sm leading-7 text-[#4f6f6b]">{description}</p>
              </div>
            ) : null}
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <section className="border border-[#b7d5d2] bg-[#eef8f7] shadow-[0_24px_64px_-48px_rgba(13,75,89,0.34)]">
              <div className="border-b border-[#b7d5d2] p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="border border-[#0f766e]/15 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0d4b59]">
                    {categoryName || t('স্বাস্থ্যসেবা', 'Healthcare')}
                  </span>
                  {product.requires_prescription ? (
                    <span className="border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                      {t('প্রেসক্রিপশন প্রয়োজন', 'Prescription required')}
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#11343c] sm:text-4xl">{productName}</h1>

                {/* {product.requires_prescription ? (
                  <div className="mt-5 border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-800">
                    <div className="font-semibold text-amber-900">
                      {t('এই পণ্যের জন্য প্রেসক্রিপশন লাগবে', 'This product requires a prescription')}
                    </div>
                    <p className="mt-1">
                      {t(
                        'প্রেসক্রিপশন ছাড়া এই পণ্যের অর্ডার কনফার্ম হবে না। অর্ডার করতে হলে প্রেসক্রিপশন আপলোড করে checkout-এ সেটা সিলেক্ট করতে হবে।',
                        'This product cannot be ordered without a prescription. Upload a prescription and select it during checkout to place the order.',
                      )}
                    </p>
                  </div>
                ) : null} */}

                <div className="mt-6 grid gap-px border border-[#b7d5d2] bg-[#b7d5d2] sm:grid-cols-3">
                  <FactTile
                    label={t('শুরু মূল্য', 'Starts at')}
                    value={roundedMoney(product.display_price || batch?.selling_price, locale)}
                    meta={t('প্রতি পিস', 'Per piece')}
                  />
                  <FactTile
                    label={t('স্টক', 'Stock')}
                    value={stockPieces.toLocaleString(locale)}
                    meta={t('পিস আছে', 'Pieces available')}
                  />
                  <FactTile
                    label={t('প্রস্তুতকারক', 'Manufacturer')}
                    value={manufacturerName || t('নির্ধারিত নয়', 'Not assigned')}
                    meta={brandName || t('ব্র্যান্ড তথ্য', 'Brand info')}
                  />
                </div>
              </div>

              <div className="grid gap-6 p-4 sm:p-5">
                {product.requires_prescription ? (
                  <section className="border border-amber-200 bg-amber-50/40 p-5 sm:p-6">
                    <div>
                      <div className="text-sm text-center font-semibold uppercase tracking-[0.18em] text-amber-700">
                        {t('প্রেসক্রিপশন সেকশন', 'Prescription section')}
                      </div>
                    </div>

                    {authLoading ? (
                      <div className="mt-5">
                        <select
                          value=""
                          className="w-full border border-amber-300 bg-white px-2 py-3 text-sm text-slate-900 outline-none"
                        >
                          <option value="">{t('প্রেসক্রিপশন লোড হচ্ছে...', 'Loading prescriptions...')}</option>
                        </select>
                      </div>
                    ) : customer ? (
                      <div className="mt-5 grid gap-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-stretch">
                      <div className="">
                        {/* <div className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
                          {t('প্রেসক্রিপশন নির্বাচন করুন', 'Choose a prescription')}
                        </div> */}

                        {prescriptionsLoading && !prescriptionsReady ? (
                          <select
                            value=""
                            className="w-full border border-amber-300 bg-white px-2 py-3 text-sm text-slate-900 outline-none"
                          >
                            <option value="">{t('প্রেসক্রিপশন লোড হচ্ছে...', 'Loading prescriptions...')}</option>
                          </select>
                        ) : selectablePrescriptions.length > 0 ? (
                          <>
                            <select
                              value={selectedPrescriptionValue}
                              onChange={(event) => {
                                const nextValue = event.target.value
                                setSelectedPrescriptionId(nextValue)
                                writePreferredPrescriptionId(nextValue)
                              }}
                              className="w-full border border-amber-300 bg-white px-2 py-3 text-sm text-slate-900 outline-none"
                            >
                              <option value="">{t('একটি প্রেসক্রিপশন সিলেক্ট করুন', 'Select a prescription')}</option>
                              {selectablePrescriptions.map((item, index) => (
                                <option key={item.id} value={item.id}>
                                  {prescriptionDisplayName(index)}
                                </option>
                              ))}
                            </select>
                            
                          </>
                        ) : (
                          <select
                            value={selectedPrescriptionValue}
                            onChange={(event) => {
                              const nextValue = event.target.value
                              setSelectedPrescriptionId(nextValue)
                              writePreferredPrescriptionId(nextValue)
                            }}
                            className="w-full border border-amber-300 bg-white px-2 py-3 text-sm text-slate-900 outline-none"
                          >
                            <option value="">{t('একটি প্রেসক্রিপশন সিলেক্ট করুন', 'Select a prescription')}</option>
                          </select>
                        )}
                      </div>

                      <div className="flex items-center justify-center">
                        <div className="flex w-full items-center gap-2 lg:w-auto lg:flex-col lg:gap-3">
                          
                          <span className="inline-flex items-center justify-center px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                            or
                          </span>
                          
                        </div>
                      </div>

                      <div className="">
                        {/* <div className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
                          {t('নতুন প্রেসক্রিপশন আপলোড করুন', 'Upload new prescription')}
                        </div> */}
                        
                        <Link
                          to={`/upload-prescription?returnTo=${encodeURIComponent(location.pathname)}`}
                          className="h-full inline-flex w-full items-center justify-center gap-2 border border-amber-300 bg-amber-50 px-2 py-3 text-sm font-semibold text-amber-800 transition hover:border-amber-400 hover:bg-white"
                        >
                          <FiUpload className="h-4 w-4" />
                          {t('নতুন প্রেসক্রিপশন আপলোড করুন', 'Upload new prescription')}
                        </Link>

                        
                      </div>
                      </div>
                    ) : (
                      <div className="mt-5 border border-amber-200 bg-white/65 p-4 text-center">
                        <p className="text-sm leading-6 text-[#4f6f6b]">
                          {t(
                            'প্রেসক্রিপশনের ওষুধ অর্ডার করতে আগে আপনার অ্যাকাউন্টে লগইন করুন।',
                            'Login to your account before uploading or selecting a prescription.',
                          )}
                        </p>
                        <Link
                          to={loginPath}
                          className="mt-4 inline-flex items-center justify-center gap-2 border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 transition hover:border-amber-400 hover:bg-white"
                        >
                          <FiLogIn className="h-4 w-4" />
                          {t('লগইন করে চালিয়ে যান', 'Login to continue')}
                        </Link>
                      </div>
                    )}
                  </section>
                ) : null}

                <div className="border border-[#b7d5d2] bg-[#e8f5f3] p-3 sm:p-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f766e]">
                      {t('দরকারি ইউনিটটি বেছে নিন', 'Choose the unit you need')}
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {purchaseOptions.map((option) => {
                      const isSelected = option.code === activeOption?.code

                      return (
                        <button
                          key={option.code}
                          type="button"
                          disabled={!option.is_available}
                          onClick={() => setSelectedUnitState({ routeKey, value: option.code })}
                          className={`grid w-full gap-4 border px-4 py-4 text-left transition sm:grid-cols-[minmax(0,1fr)_180px] ${
                            isSelected ? 'border-[#0f766e] bg-white shadow-[0_18px_46px_-36px_rgba(15,118,110,0.28)]' : 'border-[#b7d5d2] bg-white/75'
                          } ${!option.is_available ? 'cursor-not-allowed opacity-50' : 'hover:border-[#13b8b0]'}`}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-lg font-semibold text-[#11343c]">{getUnitLabel(option.code, isBangla)}</span>
                              {option.savings > 0 ? (
                                <span className="border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                                  {t('সাশ্রয়', 'Save')} {roundedMoney(option.savings, locale)}
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-2 text-sm text-[#4f6f6b]">{getLocalizedConversionLabel(option, isBangla) || option.conversion_label}</div>
                            <div className="mt-2 text-xs uppercase tracking-[0.16em] text-[#6a8883]">
                              {t('স্টক', 'Stock')} {option.available_quantity.toLocaleString(isBangla ? 'bn-BD' : 'en-US')} {getUnitLabel(option.code, isBangla)}
                            </div>
                          </div>

                          <div className="border-t border-[#b7d5d2] pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 sm:text-right">
                            <div className="text-xl font-semibold text-[#0f766e]">{roundedMoney(option.unit_price, locale)}</div>
                            <div className="mt-1 text-xs text-[#4f6f6b]">
                              {option.savings > 0 ? t('পিসের তুলনায় কম', 'Better than piece price') : t('স্ট্যান্ডার্ড মূল্য', 'Standard price')}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="border border-[#b7d5d2] bg-white/75 p-3 sm:p-4">
                  <div className="grid gap-5">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f6f6b]">{t('পরিমাণ', 'Quantity')}</div>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            className="flex h-11 w-11 items-center justify-center border border-[#b7d5d2] bg-white text-lg font-semibold text-[#11343c] disabled:opacity-40"
                            disabled={!activeOption || effectiveQuantity <= 1}
                            onClick={() => setQuantityState((current) => ({ routeKey, value: Math.max(1, (current.routeKey === routeKey ? current.value : 1) - 1) }))}
                          >
                            <FiMinus className="h-4 w-4" />
                          </button>
                          <div className="flex h-11 min-w-21 items-center justify-center border border-[#b7d5d2] bg-white px-4 text-lg font-semibold text-[#11343c]">
                            {effectiveQuantity.toLocaleString(locale)}
                          </div>
                          <button
                            type="button"
                            className="flex h-11 w-11 items-center justify-center border border-[#b7d5d2] bg-white text-lg font-semibold text-[#11343c] disabled:opacity-40"
                            disabled={!activeOption || effectiveQuantity >= (activeOption.available_quantity || 0)}
                            onClick={() => setQuantityState((current) => ({ routeKey, value: (current.routeKey === routeKey ? current.value : 1) + 1 }))}
                          >
                            <FiPlus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-px border border-[#b7d5d2] bg-[#b7d5d2] sm:grid-cols-2 2xl:grid-cols-3">
                        <FactTile
                          label={t('ইউনিট', 'Unit')}
                          value={activeUnitLabel || t('নেই', 'None')}
                          meta={(activeOption && getLocalizedConversionLabel(activeOption, isBangla)) || t('কোনো ইউনিট নেই', 'No unit available')}
                        />
                        <FactTile
                          label={t('মোট পিস', 'Total pieces')}
                          value={totalPieces.toLocaleString(locale)}
                          meta={activeOption ? activeUnitSummary : t('ইউনিট বেছে নিন', 'Select a unit')}
                        />
                        <FactTile
                          label={t('মোট মূল্য', 'Total')}
                          value={roundedMoney(totalPrice, locale)}
                          meta={totalSavings > 0 ? `${t('সাশ্রয়', 'Save')} ${roundedMoney(totalSavings, locale)}` : t('স্ট্যান্ডার্ড মূল্য', 'Standard price')}
                        />
                      </div>
                    </div>

                    <aside className="">
                      {/* <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0e6574]">{t('অর্ডার', 'Order')}</div>
                        <div className="text-2xl font-semibold tracking-tight text-slate-950">{roundedMoney(totalPrice)}</div>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {activeOption
                          ? `${activeUnitSummary} • ${totalPieces.toLocaleString(isBangla ? 'bn-BD' : 'en-US')} ${t('পিস', 'pieces')}`
                          : t('প্রথমে একটি ইউনিট বেছে নিন', 'Choose a unit first')}
                      </p> */}

                      {/* {product.requires_prescription ? (
                        <div className="mt-4 rounded-md border border-amber-200 bg-white p-4 text-sm text-slate-600">
                          {selectedPrescription
                            ? t(
                              `Prescription #${selectedPrescription.id} এই পণ্যের জন্য সিলেক্ট করা আছে।`,
                              `Prescription #${selectedPrescription.id} is selected for this product.`,
                            )
                            : t('অর্ডারের আগে উপরের সেকশন থেকে একটি প্রেসক্রিপশন বেছে নিন।', 'Choose a prescription from the section above before placing the order.')}
                        </div>
                      ) : null} */}

                      <div className="space-y-3">
                        <div className="flex gap-2">
                        <button
                          className="w-full bg-[#0d4b59] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0b5f69] disabled:cursor-not-allowed disabled:bg-slate-300"
                          onClick={add}
                          disabled={!activeOption?.is_available}
                        >
                          <span className="inline-flex items-center gap-2">
                            <FiShoppingCart className="h-4 w-4" />
                            {activeOption
                              ? t(`${activeUnitSummary} কার্টে যোগ করুন`, `Add ${activeUnitSummary}`)
                              : t('কার্টে যোগ করুন', 'Add to cart')}
                          </span>
                        </button>

                        <button
                          type="button"
                          className={`w-full border px-5 py-3.5 text-sm font-semibold transition ${
                            saved
                              ? 'border-rose-200 bg-rose-50 text-rose-600'
                              : 'border-[#b7d5d2] bg-white/75 text-[#0d4b59] hover:border-[#13b8b0] hover:bg-white'
                          }`}
                          onClick={() => toggleWishlist(product)}
                        >
                          <span className="inline-flex items-center gap-2">
                            <FiHeart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
                            {saved ? t('উইশলিস্টে রাখা হয়েছে', 'Saved to wishlist') : t('উইশলিস্টে রাখুন', 'Save to wishlist')}
                          </span>
                        </button>
                        </div>

                        {!product.requires_prescription ? (
                          <Link to="/products" className="flex w-full items-center justify-center gap-2 border border-[#b7d5d2] bg-white/75 px-5 py-3.5 text-sm font-semibold text-[#0d4b59] transition hover:border-[#13b8b0] hover:bg-white">
                            {t('আরও দেখুন', 'Browse more')}
                            <FiArrowRight className="h-4 w-4" />
                          </Link>
                        ) : null}
                      </div>
                    </aside>
                  </div>
                </div>
                
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  )
}

function FactTile({ label, value, meta }) {
  return (
    <div className="min-w-0 bg-white/80 p-4">
      <div className="text-sm text-[#4f6f6b]">{label}</div>
      <div className="mt-2 wrap-break-words text-xl font-semibold text-[#11343c]">{value}</div>
      <div className="mt-1 wrap-break-words text-sm leading-6 text-[#4f6f6b]">{meta}</div>
    </div>
  )
}

function MetaRow({ label, value }) {
  return (
    <div className="bg-white/80 px-4 py-4">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4f6f6b]">{label}</div>
      <div className="mt-2 text-sm font-semibold text-[#11343c]">{value}</div>
    </div>
  )
}


