import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  FiCheckCircle,
  FiCreditCard,
  FiFileText,
  FiPhoneCall,
  FiSearch,
  FiShield,
  FiTruck,
} from 'react-icons/fi'
import HomeCategoriesSection from '../../components/customer/home/HomeCategoriesSection'
import HomeBannerSection from '../../components/customer/home/HomeBannerSection'
import HomeCategoryProductSections from '../../components/customer/home/HomeCategoryProductSections'
import HomeHeroSection from '../../components/customer/home/HomeHeroSection'
import HomePageSkeleton from '../../components/customer/home/HomePageSkeleton'
// import HomeQuickPathsSection from '../../components/customer/home/HomeQuickPathsSection'
import HomeManufacturersSection from '../../components/customer/home/HomeManufacturersSection'
import HomeSupportCtaSection from '../../components/customer/home/HomeSupportCtaSection'
import HomeTrustStrip from '../../components/customer/home/HomeTrustStrip'
import HomeWorkflowSpotlightSection from '../../components/customer/home/HomeWorkflowSpotlightSection'
import { getHeroSlides } from '../../components/customer/home/homeUtils'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useStorefront } from '../../context/StorefrontContext'
import { useBannerImagesQuery, useCategoriesQuery, useHeroSlidesQuery, useManufacturersQuery, useProductsQuery } from '../../queries/customerQueries'
import { getDefaultPurchaseOption, getOptionUnitLabel } from '../../utils/purchaseUnits'
import { isPrescriptionLoginRequiredError, requiresPrescriptionLogin, showPrescriptionLoginRequiredAlert } from '../../utils/prescriptionCartAlert'

export default function Home() {
  const { addToCart } = useStorefront()
  const { customer } = useCustomerAuth()
  const { isBangla } = useLanguage()
  const fallbackHeroSlides = useMemo(() => getHeroSlides(isBangla), [isBangla])
  const productsQuery = useProductsQuery({ type: 'medicine', per_page: 72 })
  const nonMedicineProductsQuery = useProductsQuery({ type: 'other', per_page: 72 })
  const categoriesQuery = useCategoriesQuery({ has_sellable_products: 1 })
  const manufacturersQuery = useManufacturersQuery()
  const heroSlidesQuery = useHeroSlidesQuery()
  const bannerImagesQuery = useBannerImagesQuery()
  const products = useMemo(() => productsQuery.data?.data || [], [productsQuery.data])
  const categories = useMemo(() => categoriesQuery.data || [], [categoriesQuery.data])
  const manufacturers = useMemo(() => manufacturersQuery.data || [], [manufacturersQuery.data])
  const heroSlideRecords = useMemo(() => heroSlidesQuery.data || [], [heroSlidesQuery.data])
  const bannerRecords = useMemo(() => bannerImagesQuery.data || [], [bannerImagesQuery.data])
  const medicineLoading = productsQuery.isLoading && products.length === 0
  const heroSlides = useMemo(() => {
    if (!heroSlideRecords.length) return fallbackHeroSlides

    const mappedSlides = heroSlideRecords.map((item) => ({
      id: item.id,
      eyebrow: isBangla ? item.eyebrow_bn || item.eyebrow : item.eyebrow,
      title: isBangla ? item.title_bn || item.title : item.title,
      image: item.image_src || item.image_url,
      primaryLabel: isBangla ? item.primary_label_bn || item.primary_label : item.primary_label,
      primaryUrl: item.primary_url || '/products',
      secondaryLabel: isBangla ? item.secondary_label_bn || item.secondary_label : item.secondary_label,
      secondaryUrl: item.secondary_url || '/upload-prescription',
    })).filter((item) => item.title && item.image)

    return mappedSlides.length ? mappedSlides : fallbackHeroSlides
  }, [fallbackHeroSlides, heroSlideRecords, isBangla])
  const trustItems = useMemo(() => ([
    {
      icon: FiShield,
      label: isBangla ? 'বিশ্বস্ত ফার্মেসি সেবা' : 'Trusted Pharmacy Service',
      detail: isBangla ? 'প্রেসক্রিপশন যাচাইসহ' : 'With Prescription Review',
    },
    {
      icon: FiTruck,
      label: isBangla ? 'দ্রুত হোম ডেলিভারি' : 'Fast Home Delivery',
      detail: isBangla ? 'সময়মতো নিরাপদে ওষুধ পৌঁছে দিই' : 'Safe & On-Time Delivery',
    },
    {
      icon: FiCreditCard,
      label: isBangla ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery',
      detail: isBangla ? 'পণ্য গ্রহণের পর মূল্য পরিশোধ করুন' : 'Pay After Receiving Your Order',
    },
    {
      icon: FiPhoneCall,
      label: '09610-001122',
      detail: isBangla ? 'প্রতিদিন সকাল ১০টা থেকে রাত ৯টা' : 'Support: 10 AM – 9 PM Daily',
    },
  ]), [isBangla])
  const banners = useMemo(() => bannerRecords.map((item) => ({
    id: item.id,
    label: isBangla ? item.label_bn || item.label : item.label,
    title: isBangla ? item.title_bn || item.title : item.title,
    body: isBangla ? item.body_bn || item.body : item.body,
    buttonLabel: isBangla ? item.button_label_bn || item.button_label : item.button_label,
    linkUrl: item.link_url || '/products',
    image: item.image_src || item.image_url,
  })).filter((item) => item.title && item.image), [bannerRecords, isBangla])

  const workflowSteps = useMemo(() => ([
    {
      step: formatStepNumber(1, isBangla),
      icon: FiSearch,
      title: isBangla ? 'খুঁজুন ও নির্বাচন করুন' : 'Search and Discover',
      body: isBangla
        ? 'পণ্যের নাম, জেনেরিক নাম, ক্যাটাগরি বা ব্র্যান্ড দিয়ে সহজেই আপনার প্রয়োজনীয় ওষুধ ও স্বাস্থ্যসেবা পণ্য খুঁজে নিন।'
        : 'Find medicines and healthcare products by product name, generic name, category, or brand.',
    },
    {
      step: formatStepNumber(2, isBangla),
      icon: FiFileText,
      title: isBangla ? 'প্রেসক্রিপশন আপলোড করুন' : 'Upload Prescription',
      body: isBangla
        ? 'প্রেসক্রিপশন প্রয়োজন এমন ওষুধের জন্য বৈধ প্রেসক্রিপশন আপলোড করুন। আমাদের ফার্মাসিস্ট যাচাই করার পর অর্ডার প্রক্রিয়া সম্পন্ন হবে।'
        : 'Upload a valid prescription for prescription-only medicines. Our pharmacist will review it before processing your order.',
    },
    {
      step: formatStepNumber(3, isBangla),
      icon: FiCheckCircle,
      title: isBangla ? 'অর্ডার করুন ও ট্র্যাক করুন' : 'Place Order & Track',
      body: isBangla
        ? 'ক্যাশ অন ডেলিভারি বা উপলব্ধ পেমেন্ট পদ্ধতিতে অর্ডার সম্পন্ন করুন এবং আপনার অ্যাকাউন্ট থেকে ডেলিভারির অগ্রগতি ট্র্যাক করুন।'
        : 'Complete your order using Cash on Delivery or available payment methods and track your delivery from your account.',
    },
  ]), [isBangla])
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (productsQuery.isError) {
      toast.error(
        isBangla
          ? 'দুঃখিত, স্টোরফ্রন্ট লোড করতে অক্ষম।'
          : 'Unable to load the storefront right now.'
      )
    }
  }, [isBangla, productsQuery.isError])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 7000)

    return () => clearInterval(timer)
  }, [heroSlides.length])

  const slide = heroSlides[currentSlide] || heroSlides[0]
  const medicineProducts = useMemo(() => products.filter(isMedicineProduct), [products])
  const featuredProducts = useMemo(() => medicineProducts.length ? medicineProducts : products.slice(0, 8), [medicineProducts, products])
  const nonMedicineProducts = useMemo(
    () => nonMedicineProductsQuery.data?.data || products.filter(isNonMedicineProduct),
    [nonMedicineProductsQuery.data, products],
  )
  const nonMedicineLoading = nonMedicineProductsQuery.isLoading && nonMedicineProducts.length === 0
  const categoryHighlights = useMemo(() => categories, [categories])
  const manufacturerHighlights = useMemo(() => manufacturers.slice(0, 12), [manufacturers])
  const homeInitialLoading = (
    heroSlidesQuery.isLoading
    || categoriesQuery.isLoading
    || manufacturersQuery.isLoading
    || bannerImagesQuery.isLoading
    || medicineLoading
    || nonMedicineLoading
  ) && (
    heroSlideRecords.length === 0
    || categories.length === 0
    || manufacturers.length === 0
    || products.length === 0
  )
  const add = async (product) => {
    const option = getDefaultPurchaseOption(product)
    const unitCode = option?.code || 'piece'
    const unitLabel = getOptionUnitLabel(option || { code: unitCode }, isBangla)

    if (requiresPrescriptionLogin(product, customer)) {
      await showPrescriptionLoginRequiredAlert(isBangla)
      return
    }

    const successToastId = toast.success(
      isBangla
        ? `১ ${unitLabel} কার্টে যোগ করা হয়েছে।`
        : `Added 1 ${unitLabel} to cart.`
    )

    try {
      await addToCart({
        product_id: product.id,
        purchase_unit: unitCode,
        quantity: 1,
      }, {
        product_name: product.product_name,
        product_name_bn: product.product_name_bn,
        generic_name: product.generic_name,
        generic_name_bn: product.generic_name_bn,
        strength: product.strength,
        dosage_form: product.dosage_form,
        requires_prescription: product.requires_prescription,
        image_url: product.primary_image?.image_url || product.images?.[0]?.image_url || null,
        thumbnail_url: product.primary_image?.thumbnail_url || product.images?.[0]?.thumbnail_url || null,
        purchase_unit_label: unitLabel,
        pieces_per_unit: option?.pieces_per_unit || 1,
        conversion_label: option?.conversion_label || '',
        unit_price: option?.unit_price || product.display_price || 0,
        available_stock: product.available_stock || 0,
      })
    } catch (error) {
      toast.dismiss(successToastId)
      if (isPrescriptionLoginRequiredError(error)) {
        await showPrescriptionLoginRequiredAlert(isBangla)
        return
      }
      toast.error(
        isBangla
          ? 'দুঃখিত, পণ্যটি কার্টে যোগ করা যায়নি।'
          : 'Sorry, the product could not be added to the cart.'
      )
    }
  }

  if (homeInitialLoading) {
    return <HomePageSkeleton />
  }

  return (
    <div className="bg-[linear-gradient(180deg,#f3fcfa_0%,#f9fcfb_26%,#eef8f6_56%,#f7fbfa_100%)] text-slate-900">
      <HomeHeroSection heroSlides={heroSlides} currentSlide={currentSlide} setCurrentSlide={setCurrentSlide} slide={slide} isBangla={isBangla} />
      <HomeTrustStrip trustItems={trustItems} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* <HomeQuickPathsSection quickPaths={quickPaths} /> */}
        <HomeBannerSection banners={banners} />
        <HomeCategoriesSection isBangla={isBangla} categories={categoryHighlights} />
        <HomeManufacturersSection isBangla={isBangla} manufacturerHighlights={manufacturerHighlights} />
        <HomeCategoryProductSections
          isBangla={isBangla}
          loading={medicineLoading}
          products={medicineProducts}
          categories={categories}
          type="medicine"
          onAdd={add}
        />
        <HomeCategoryProductSections
          isBangla={isBangla}
          loading={nonMedicineLoading}
          products={nonMedicineProducts}
          categories={categories}
          type="other"
          onAdd={add}
        />
        <HomeWorkflowSpotlightSection
          isBangla={isBangla}
          spotlightProducts={featuredProducts}
          workflowSteps={workflowSteps}
        />
        <HomeSupportCtaSection isBangla={isBangla} />
      </div>
    </div>
  )
}

const nonMedicineCategoryKeywords = [
  'medical device',
  'medical devices',
  'first aid',
  'hygiene',
  'mother & baby',
  'mother and baby',
  'personal care',
  'skin care',
  'vitamins',
  'supplements',
  "women's health",
]

const nonMedicineProductKeywords = [
  'mask',
  'diaper',
  'wipes',
  'feeding bottle',
  'mouthwash',
  'lotion',
  'thermometer',
  'nebulizer',
  'glucometer',
  'gauge',
  'gauze',
  'antiseptic',
]

function isNonMedicineProduct(product) {
  if (product?.product_type && product.product_type !== 'medicine') {
    return true
  }

  const categoryText = [
    product?.category?.category_name,
    product?.category?.category_name_bn,
  ].filter(Boolean).join(' ').toLowerCase()

  if (nonMedicineCategoryKeywords.some((keyword) => categoryText.includes(keyword))) {
    return true
  }

  const productText = [
    product?.product_name,
    product?.brand_name,
    product?.generic_name,
    product?.dosage_form,
  ].filter(Boolean).join(' ').toLowerCase()

  return nonMedicineProductKeywords.some((keyword) => productText.includes(keyword))
}

function isMedicineProduct(product) {
  return !isNonMedicineProduct(product)
}

function formatStepNumber(value, isBangla) {
  return String(value).padStart(2, '0').replace(/\d/g, (digit) => (
    isBangla ? Number(digit).toLocaleString('bn-BD') : digit
  ))
}
