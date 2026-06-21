import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiPhoneCall,
  FiSearch,
  FiShield,
  FiTruck,
} from 'react-icons/fi'
import { bannerImageApi, readCachedBannerImages } from '../../api/bannerImageApi'
import { heroSlideApi, readCachedHeroSlides } from '../../api/heroSlideApi'
import { productApi } from '../../api/productApi'
import HomeCategoriesSection from '../../components/customer/home/HomeCategoriesSection'
import HomeBannerSection from '../../components/customer/home/HomeBannerSection'
import HomeFeaturedProductsSection from '../../components/customer/home/HomeFeaturedProductsSection'
import HomeHeroSection from '../../components/customer/home/HomeHeroSection'
import HomeProductPanelsSection from '../../components/customer/home/HomeProductPanelsSection'
// import HomeQuickPathsSection from '../../components/customer/home/HomeQuickPathsSection'
import HomeSupportCtaSection from '../../components/customer/home/HomeSupportCtaSection'
import HomeTrustStrip from '../../components/customer/home/HomeTrustStrip'
import HomeWorkflowSpotlightSection from '../../components/customer/home/HomeWorkflowSpotlightSection'
import { getHeroSlides } from '../../components/customer/home/homeUtils'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useStorefront } from '../../context/StorefrontContext'
import { getDefaultPurchaseOption, getUnitLabel } from '../../utils/purchaseUnits'
import { isPrescriptionLoginRequiredError, requiresPrescriptionLogin, showPrescriptionLoginRequiredAlert } from '../../utils/prescriptionCartAlert'

export default function Home() {
  const { addToCart } = useStorefront()
  const { customer } = useCustomerAuth()
  const { isBangla } = useLanguage()
  const fallbackHeroSlides = useMemo(() => getHeroSlides(isBangla), [isBangla])
  const [heroSlideRecords, setHeroSlideRecords] = useState(() => readCachedHeroSlides() || [])
  const [bannerRecords, setBannerRecords] = useState(() => readCachedBannerImages() || [])
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
    { icon: FiShield, label: isBangla ? 'লাইসেন্সপ্রাপ্ত ফার্মেসি সেবা' : 'Licensed pharmacy service', detail: isBangla ? 'প্রেসক্রিপশন রিভিউসহ' : 'With prescription review' },
    { icon: FiTruck, label: isBangla ? 'ঢাকাজুড়ে হোম ডেলিভারি' : 'Doorstep delivery in Dhaka', detail: isBangla ? 'অর্ডারের প্রতিটি ধাপ ট্র্যাক করুন' : 'Track every order step' },
    { icon: FiCreditCard, label: isBangla ? 'ক্যাশ অন ডেলিভারি' : 'Cash on delivery', detail: isBangla ? 'পণ্য হাতে পেয়ে পেমেন্ট করুন' : 'Pay when you receive' },
    { icon: FiPhoneCall, label: '09610-001122', detail: isBangla ? 'সকাল ৮টা - রাত ১১টা সহায়তা' : '8AM - 11PM support' },
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
  // const quickPaths = useMemo(() => ([
  //   {
  //     to: '/upload-prescription',
  //     icon: FiFileText,
  //     label: isBangla ? 'প্রেসক্রিপশন' : 'Prescription',
  //     title: isBangla ? 'প্রেসক্রিপশন অর্ডার' : 'Prescription orders',
  //     body: isBangla ? 'চেকআউটের আগে রিভিউর জন্য ছবি বা PDF আপলোড করুন।' : 'Submit image or PDF for pharmacist review before checkout.',
  //     accent: 'bg-amber-50 text-amber-700 ring-amber-100',
  //   },
  //   {
  //     to: '/products',
  //     icon: FiShoppingBag,
  //     label: isBangla ? 'ক্যাটালগ' : 'Catalog',
  //     title: isBangla ? 'সব ওষুধ দেখুন' : 'Browse all medicines',
  //     body: isBangla ? 'ক্যাটাগরি, নির্মাতা ও প্রেসক্রিপশন অনুযায়ী ফিল্টার করুন।' : 'Filter by category, manufacturer, and prescription requirement.',
  //     accent: 'bg-teal-50 text-teal-700 ring-teal-100',
  //   },
  //   {
  //     to: '/cart',
  //     icon: FiPackage,
  //     label: isBangla ? 'চেকআউট' : 'Checkout',
  //     title: isBangla ? 'অর্ডার সম্পন্ন করুন' : 'Complete your order',
  //     body: isBangla ? 'কার্ট দেখুন, ঠিকানা দিন, আর COD দিয়ে নিশ্চিত করুন।' : 'Review cart, add delivery address, and confirm with COD.',
  //     accent: 'bg-sky-50 text-sky-700 ring-sky-100',
  //   },
  //   {
  //     to: '/orders',
  //     icon: FiTruck,
  //     label: isBangla ? 'ট্র্যাকিং' : 'Tracking',
  //     title: isBangla ? 'ডেলিভারি দেখুন' : 'Monitor deliveries',
  //     body: isBangla ? 'রিয়েল টাইমে অর্ডারের অবস্থা ও ডেলিভারির অগ্রগতি দেখুন।' : 'Follow status updates and delivery progress in real time.',
  //     accent: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  //   },
  // ]), [isBangla])
  const workflowSteps = useMemo(() => ([
    {
      step: '01',
      icon: FiSearch,
      title: isBangla ? 'খুঁজুন ও বেছে নিন' : 'Search and discover',
      body: isBangla ? 'পণ্যের নাম, জেনেরিক, ক্যাটাগরি বা নির্মাতা দিয়ে ওষুধ খুঁজুন।' : 'Find medicine by product name, generic name, category, or manufacturer.',
    },
    {
      step: '02',
      icon: FiFileText,
      title: isBangla ? 'প্রেসক্রিপশন আপলোড' : 'Upload prescription',
      body: isBangla ? 'যে পণ্যে প্রেসক্রিপশন লাগে সেখানে প্রয়োজনীয় ফাইল জমা দিন।' : 'Submit prescription files when restricted products are required.',
    },
    {
      step: '03',
      icon: FiCheckCircle,
      title: isBangla ? 'চেকআউট ও ট্র্যাক' : 'Checkout and track',
      body: isBangla ? 'ক্যাশ অন ডেলিভারি দিয়ে অর্ডার করুন এবং আপনার অ্যাকাউন্ট থেকে ডেলিভারি ট্র্যাক করুন।' : 'Place your order with COD and follow delivery from your account.',
    },
  ]), [isBangla])
  const serviceItems = useMemo(() => ([
    {
      icon: FiShield,
      title: isBangla ? 'প্রেসক্রিপশনভিত্তিক অর্ডার' : 'Prescription-sensitive ordering',
      body: isBangla ? 'যে পণ্যে প্রেসক্রিপশন লাগে সেগুলো স্পষ্টভাবে দেখানো আছে।' : 'Rx-required products are clearly marked and linked to upload actions.',
    },
    {
      icon: FiTruck,
      title: isBangla ? 'ডেলিভারি প্রস্তুত ব্যবস্থা' : 'Delivery-ready workflow',
      body: isBangla ? 'সার্চ, কার্ট, চেকআউট ও ট্র্যাকিং একসাথে থাকায় অর্ডার দ্রুত সম্পন্ন হয়।' : 'Search, cart, checkout, and tracking stay connected for faster completion.',
    },
    {
      icon: FiClock,
      title: isBangla ? 'দ্রুত সহায়তা' : 'Responsive support',
      body: isBangla ? 'অর্ডার, প্রেসক্রিপশন বা ডেলিভারি নিয়ে যেকোনো সময়ে সহায়তা নিন।' : 'Reach support for order, prescription, or delivery questions anytime.',
    },
  ]), [isBangla])
  const cachedFeatured = productApi.getCachedList({ per_page: 12 })
  const [products, setProducts] = useState(cachedFeatured?.data || [])
  const [categories, setCategories] = useState(() => productApi.getCachedCategories())
  const [manufacturers, setManufacturers] = useState(() => productApi.getCachedManufacturers())
  const [loading, setLoading] = useState(!cachedFeatured)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    Promise.all([
      productApi.list({ per_page: 12 }),
      productApi.categories(),
      productApi.manufacturers(),
      heroSlideApi.list(),
      bannerImageApi.list(),
    ])
      .then(([productRes, categoryRes, manufacturerRes, heroSlideRes, bannerRes]) => {
        setProducts(productRes.data.data?.data || [])
        setCategories(categoryRes.data.data || [])
        setManufacturers(manufacturerRes.data.data || [])
        setHeroSlideRecords(heroSlideRes.data.data || [])
        setBannerRecords(bannerRes.data.data || [])
      })
      .catch(() => toast.error(isBangla ? 'এই মুহূর্তে স্টোরফ্রন্ট লোড করা যাচ্ছে না।' : 'Unable to load the storefront right now.'))
      .finally(() => setLoading(false))
  }, [isBangla])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 7000)

    return () => clearInterval(timer)
  }, [heroSlides.length])

  const slide = heroSlides[currentSlide] || heroSlides[0]
  const featuredProducts = useMemo(() => products.slice(0, 8), [products])
  const otcProducts = useMemo(() => products.filter((product) => !product.requires_prescription).slice(0, 4), [products])
  const prescriptionProducts = useMemo(() => products.filter((product) => product.requires_prescription).slice(0, 4), [products])
  const categoryHighlights = useMemo(() => categories.slice(0, 8), [categories])
  const manufacturerHighlights = useMemo(() => manufacturers.slice(0, 8), [manufacturers])
  const add = async (product) => {
    const option = getDefaultPurchaseOption(product)
    const unitCode = option?.code || 'piece'
    const unitLabel = getUnitLabel(unitCode, isBangla)

    if (requiresPrescriptionLogin(product, customer)) {
      await showPrescriptionLoginRequiredAlert(isBangla)
      return
    }

    try {
      await addToCart({
        product_id: product.id,
        purchase_unit: unitCode,
        quantity: 1,
      })
      toast.success(isBangla ? `১ ${unitLabel} কার্টে যোগ করা হয়েছে।` : `Added 1 ${unitLabel} to cart.`)
    } catch (error) {
      if (isPrescriptionLoginRequiredError(error)) {
        await showPrescriptionLoginRequiredAlert(isBangla)
        return
      }

      toast.error(isBangla ? 'এই পণ্যটি কার্টে যোগ করা যায়নি।' : 'Could not add this item to the cart.')
    }
  }

  return (
    <div className="bg-[linear-gradient(180deg,#edfdfa_0%,#f7fbfa_34%,#eef8f6_68%,#f7fbfa_100%)] text-slate-900">
      <HomeHeroSection heroSlides={heroSlides} currentSlide={currentSlide} setCurrentSlide={setCurrentSlide} slide={slide} isBangla={isBangla} />
      <HomeTrustStrip trustItems={trustItems} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* <HomeQuickPathsSection quickPaths={quickPaths} /> */}
        <HomeBannerSection banners={banners} />
        <HomeCategoriesSection isBangla={isBangla} categories={categoryHighlights} />
        <HomeProductPanelsSection isBangla={isBangla} prescriptionProducts={prescriptionProducts} otcProducts={otcProducts} />
        <HomeFeaturedProductsSection isBangla={isBangla} loading={loading} featuredProducts={featuredProducts} onAdd={add} />
        <HomeWorkflowSpotlightSection
          isBangla={isBangla}
          spotlightProducts={featuredProducts}
          workflowSteps={workflowSteps}
          manufacturerHighlights={manufacturerHighlights}
          serviceItems={serviceItems}
        />
        <HomeSupportCtaSection isBangla={isBangla} />
      </div>
    </div>
  )
}
