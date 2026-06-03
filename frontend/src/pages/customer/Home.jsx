import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { productApi } from '../../api/productApi'
import { money } from '../../utils/formatters'
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
  FiTrendingUp,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiEye,
  FiAward,
  FiUsers,
  FiAlertCircle,
  FiPlay,
  FiPause,
  FiArrowUpRight,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPercent,
  FiZap,
  FiActivity,
  FiDroplet,
  FiThermometer,
  FiSun,
  FiMoon,
  FiSmile
} from 'react-icons/fi'

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '')

const heroSlides = [
  {
    id: 1,
    badge: "বিশ্বস্ত অনলাইন ফার্মেসি",
    title: "স্বাস্থ্যসেবা এখন",
    subtitle: "আপনার হাতের মুঠোয়",
    description: "লাইসেন্সড ফার্মেসি থেকে ভেরিফায়েড ওষুধ, প্রেসক্রিপশন রিভিউ, এবং দ্রুত ডেলিভারি - সবই এখন আপনার দোরগোড়ায়।",
    image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=1200&h=600&fit=crop",
    accent: "emerald",
    stats: [
      { icon: FiUsers, value: "১০,০০০+", label: "গ্রাহক" },
      { icon: FiCheckCircle, value: "১০০%", label: "অথেন্টিক" },
      { icon: FiZap, value: "দ্রুত", label: "ডেলিভারি" }
    ],
    cta: { primary: "পণ্য দেখুন", secondary: "প্রেসক্রিপশন আপলোড" }
  },
  {
    id: 2,
    badge: "২৪/৭ ফার্মাসিস্ট সাপোর্ট",
    title: "বিশেষজ্ঞ পরামর্শ",
    subtitle: "এখনই নিন",
    description: "অভিজ্ঞ ফার্মাসিস্ট টিম প্রতিটি প্রেসক্রিপশন যাচাই করে, নিশ্চিত করে সঠিক ওষুধ ও ডোজ নির্বাচন।",
    image: "https://images.unsplash.com/photo-1631549916768-4119b4123a21?w=1200&h=600&fit=crop",
    accent: "blue",
    stats: [
      { icon: FiSmile, value: "৫০০+", label: "ফার্মাসিস্ট" },
      { icon: FiShield, value: "১০০%", label: "যাচাইকৃত" },
      { icon: FiClock, value: "২৪/৭", label: "সাপোর্ট" }
    ],
    cta: { primary: "সব পণ্য", secondary: "যোগাযোগ" }
  },
  {
    id: 3,
    badge: "সীমিত সময়ের অফার",
    title: "বিশেষ ছাড়",
    subtitle: "৩০% পর্যন্ত",
    description: "প্রথম অর্ডারে বিশেষ ছাড়! নিয়মিত গ্রাহকদের জন্য রয়েছে লয়্যালটি পয়েন্ট ও এক্সক্লুসিভ অফার।",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&h=600&fit=crop",
    accent: "rose",
    stats: [
      { icon: FiPercent, value: "৩০%", label: "ছাড়" },
      { icon: FiTruck, value: "ফ্রি", label: "ডেলিভারি" },
      { icon: FiAward, value: "১০০%", label: "সেফ" }
    ],
    cta: { primary: "অফার দেখুন", secondary: "রেজিস্টার" }
  }
]

const services = [
  { 
    icon: FiShield,
    title: 'লাইসেন্সড ফার্মেসি', 
    description: 'সরকার অনুমোদিত ফার্মেসি থেকে ভেরিফায়েড ওষুধ ও ব্যাচভিত্তিক স্টক ম্যানেজমেন্ট।',
    gradient: 'from-emerald-500 to-teal-600',
    features: ['ভেরিফায়েড ওষুধ', 'ব্যাচ ট্র্যাকিং', 'অথেন্টিসিটি গ্যারান্টি']
  },
  { 
    icon: FiCheckCircle,
    title: 'প্রেসক্রিপশন রিভিউ', 
    description: 'অভিজ্ঞ ফার্মাসিস্ট দ্বারা প্রেসক্রিপশন যাচাইকরণ, ডোজ ও ড্রাগ ইন্টারঅ্যাকশন চেক।',
    gradient: 'from-blue-500 to-indigo-600',
    features: ['ফার্মাসিস্ট রিভিউ', 'ডোজ ভেরিফিকেশন', 'ড্রাগ সেফটি চেক']
  },
  { 
    icon: FiTruck,
    title: 'দ্রুত ডেলিভারি', 
    description: 'রিয়েল-টাইম ট্র্যাকিং, প্রফেশনাল রাইডার ও ক্যাশ অন ডেলিভারি সুবিধা।',
    gradient: 'from-violet-500 to-purple-600',
    features: ['লাইভ ট্র্যাকিং', 'COD পেমেন্ট', '২৪ ঘন্টায় ডেলিভারি']
  },
  { 
    icon: FiHeadphones,
    title: 'ডেডিকেটেড সাপোর্ট', 
    description: 'টিকিট সিস্টেম, সহজ রিটার্ন ও রিফান্ড প্রক্রিয়া, ইনস্ট্যান্ট নোটিফিকেশন।',
    gradient: 'from-orange-500 to-amber-600',
    features: ['টিকিট সাপোর্ট', 'সহজ রিটার্ন', 'রিফান্ড গ্যারান্টি']
  },
]

const categories_icons = {
  'ঔষধ': FiDroplet,
  'স্বাস্থ্য': FiActivity,
  'চিকিৎসা': FiThermometer,
  'ভিটামিন': FiSun,
  'হারবাল': FiMoon,
}

export default function Home() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [direction, setDirection] = useState(0)
  const timerRef = useRef(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const nextSlide = useCallback(() => {
    setDirection(1)
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
  }, [])

  const prevSlide = useCallback(() => {
    setDirection(-1)
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
  }, [])

  const goToSlide = (index) => {
    setDirection(index > currentSlide ? 1 : -1)
    setCurrentSlide(index)
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide()
      else prevSlide()
    }
  }

  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(nextSlide, 6000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, nextSlide])

  useEffect(() => {
    Promise.all([
      productApi.list({ per_page: 6 }),
      productApi.categories(),
    ]).then(([productRes, categoryRes]) => {
      setProducts(productRes.data.data?.data || [])
      setCategories((categoryRes.data.data || []).slice(0, 6))
    }).catch(() => toast.error('হোম পেজের তথ্য লোড করা যায়নি।')).finally(() => setLoading(false))
  }, [])

  const accentColors = {
    emerald: {
      bg: 'from-emerald-600 to-teal-700',
      badge: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200',
      button: 'bg-emerald-500 hover:bg-emerald-400',
      highlight: 'text-emerald-300',
      glow: 'shadow-emerald-500/25',
      indicator: 'bg-emerald-400'
    },
    blue: {
      bg: 'from-blue-600 to-indigo-700',
      badge: 'bg-blue-500/20 border-blue-400/30 text-blue-200',
      button: 'bg-blue-500 hover:bg-blue-400',
      highlight: 'text-blue-300',
      glow: 'shadow-blue-500/25',
      indicator: 'bg-blue-400'
    },
    rose: {
      bg: 'from-rose-600 to-pink-700',
      badge: 'bg-rose-500/20 border-rose-400/30 text-rose-200',
      button: 'bg-rose-500 hover:bg-rose-400',
      highlight: 'text-rose-300',
      glow: 'shadow-rose-500/25',
      indicator: 'bg-rose-400'
    }
  }

  const currentAccent = accentColors[heroSlides[currentSlide].accent]

  return (
    <div className="min-h-screen">
      {/* Hero Section - Full Width, No Border Radius */}
      <section 
        className="relative w-full min-h-screen overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Layer */}
        <div className="absolute inset-0 bg-slate-950">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            >
              <img 
                src={slide.image} 
                alt={slide.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60" />
            </div>
          ))}
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/10"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 2}s infinite`,
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="relative h-full min-h-screen flex items-center">
          <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-32">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Content */}
              <div className="relative z-10">
                {/* Slide Indicator */}
                <div className="flex items-center gap-3 mb-8">
                  <div className={`px-4 py-2 ${currentAccent.badge} backdrop-blur-xl border text-sm font-semibold inline-flex items-center gap-2`}>
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full ${currentAccent.indicator} opacity-75`} />
                      <span className={`relative inline-flex h-2 w-2 ${currentAccent.indicator}`} />
                    </span>
                    {heroSlides[currentSlide].badge}
                  </div>
                </div>

                {/* Animated Title */}
                <div className="overflow-hidden">
                  <h1 
                    key={`title-${currentSlide}`}
                    className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-none tracking-tight animate-slide-up"
                    style={{ animation: `slideUp 0.8s cubic-bezier(0.22, 1, 0.36, 1)` }}
                  >
                    {heroSlides[currentSlide].title}
                    <br />
                    <span className={`text-transparent bg-clip-text bg-gradient-to-r ${heroSlides[currentSlide].accent === 'emerald' ? 'from-emerald-400 to-teal-300' : heroSlides[currentSlide].accent === 'blue' ? 'from-blue-400 to-cyan-300' : 'from-rose-400 to-pink-300'}`}>
                      {heroSlides[currentSlide].subtitle}
                    </span>
                  </h1>
                </div>

                {/* Description */}
                <p 
                  key={`desc-${currentSlide}`}
                  className="mt-8 text-lg lg:text-xl text-slate-300 max-w-xl leading-relaxed animate-slide-up"
                  style={{ animation: `slideUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both` }}
                >
                  {heroSlides[currentSlide].description}
                </p>

                {/* Stats */}
                <div 
                  className="mt-10 flex gap-8 sm:gap-12 animate-slide-up"
                  style={{ animation: `slideUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both` }}
                >
                  {heroSlides[currentSlide].stats.map((stat, idx) => {
                    const Icon = stat.icon
                    return (
                      <div key={idx} className="group cursor-default">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`h-5 w-5 ${currentAccent.highlight}`} />
                          <span className="text-3xl sm:text-4xl font-black text-white group-hover:scale-110 transition-transform">
                            {stat.value}
                          </span>
                        </div>
                        <span className="text-sm text-slate-400">{stat.label}</span>
                      </div>
                    )
                  })}
                </div>

                {/* CTA Buttons */}
                <div 
                  className="mt-12 flex flex-col sm:flex-row gap-4 animate-slide-up"
                  style={{ animation: `slideUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.6s both` }}
                >
                  <Link 
                    to="/products"
                    className={`group inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold text-white ${currentAccent.button} transition-all duration-300 hover:scale-105 hover:shadow-2xl ${currentAccent.glow} active:scale-95`}
                  >
                    {heroSlides[currentSlide].cta.primary}
                    <FiArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Link>
                  <Link 
                    to="/upload-prescription"
                    className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold text-white border-2 border-white/30 hover:border-white/50 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 active:scale-95"
                  >
                    {heroSlides[currentSlide].cta.secondary}
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Right Visual */}
              <div className="hidden lg:block relative">
                <div 
                  key={`visual-${currentSlide}`}
                  className="relative animate-scale-in"
                  style={{ animation: `scaleIn 1s cubic-bezier(0.22, 1, 0.36, 1)` }}
                >
                  {/* Main Floating Card */}
                  <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 p-8 shadow-2xl">
                    <img 
                      src={heroSlides[currentSlide].image}
                      alt="Pharmacy"
                      className="w-full h-80 object-cover shadow-lg"
                    />
                    
                    {/* Info Overlay */}
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-bold text-lg">লাইভ স্ট্যাটাস</div>
                          <div className="text-slate-400 text-sm">রিয়েল-টাইম আপডেট</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`relative flex h-3 w-3`}>
                            <span className={`animate-ping absolute inline-flex h-full w-full ${currentAccent.indicator} opacity-75`} />
                            <span className={`relative inline-flex h-3 w-3 ${currentAccent.indicator}`} />
                          </span>
                          <span className="text-white text-sm font-semibold">অনলাইন</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                        <div className="text-center">
                          <div className="text-2xl font-black text-white">{products.length || 0}</div>
                          <div className="text-xs text-slate-400">পণ্য</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-black text-white">{categories.length || 0}</div>
                          <div className="text-xs text-slate-400">ক্যাটাগরি</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-black text-white flex items-center justify-center gap-1">
                            <FiPackage className="h-5 w-5" />
                          </div>
                          <div className="text-xs text-slate-400">ইন স্টক</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Small Cards */}
                  <div className="absolute -top-8 -left-8 animate-float-slow">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 shadow-xl">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 ${currentAccent.button}`}>
                          <FiShield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-bold text-sm">১০০% সিকিউর</div>
                          <div className="text-slate-400 text-xs">SSL এনক্রিপ্টেড</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -bottom-6 -right-6 animate-float-slow" style={{ animationDelay: '2s' }}>
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 shadow-xl">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 bg-gradient-to-br ${heroSlides[currentSlide].accent === 'emerald' ? 'from-emerald-500 to-teal-600' : heroSlides[currentSlide].accent === 'blue' ? 'from-blue-500 to-indigo-600' : 'from-rose-500 to-pink-600'}`}>
                          <FiTruck className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-bold text-sm">দ্রুত ডেলিভারি</div>
                          <div className="text-slate-400 text-xs">২৪ ঘন্টায়</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows - Left */}
        <button
          onClick={prevSlide}
          className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 p-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 transition-all duration-300 group hidden lg:block"
          aria-label="Previous slide"
        >
          <FiChevronLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
        </button>

        {/* Navigation Arrows - Right */}
        <button
          onClick={nextSlide}
          className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 p-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 transition-all duration-300 group hidden lg:block"
          aria-label="Next slide"
        >
          <FiChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Bottom Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
          {/* Pause/Play Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 transition-all duration-300"
            aria-label={isPaused ? 'Play slideshow' : 'Pause slideshow'}
          >
            {isPaused ? <FiPlay className="h-4 w-4" /> : <FiPause className="h-4 w-4" />}
          </button>

          {/* Dots */}
          <div className="flex gap-3">
            {heroSlides.map((slide, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-500 h-1 ${
                  index === currentSlide 
                    ? `w-12 ${currentAccent.indicator}` 
                    : 'w-6 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Slide Counter */}
          <span className="text-white/50 text-sm font-mono">
            {String(currentSlide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
          </span>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-slate-400 text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-slate-400 to-transparent" />
        </div>
      </section>

      {/* Trust Bar */}
      <section className="relative -mt-1 bg-slate-900 border-t border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: FiShield, text: 'লাইসেন্সড ফার্মেসি' },
              { icon: FiTruck, text: 'দ্রুত ডেলিভারি' },
              { icon: FiCheckCircle, text: '১০০% অথেন্টিক' },
              { icon: FiHeadphones, text: '২৪/৭ সাপোর্ট' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-slate-300">
                <item.icon className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-semibold">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-4">
                <div className="w-8 h-px bg-emerald-500" />
                <span className="uppercase tracking-widest">ক্যাটাগরি</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
                আপনার প্রয়োজন<br />অনুযায়ী বেছে নিন
              </h2>
            </div>
            <Link 
              to="/products" 
              className="group inline-flex items-center gap-2 text-slate-900 font-bold text-lg mt-4 lg:mt-0 hover:text-emerald-600 transition-colors"
            >
              সব ক্যাটাগরি দেখুন
              <FiArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => {
              const CatIcon = categories_icons[category.category_name] || FiPackage
              return (
                <Link
                  key={category.id}
                  to={`/products?category_id=${category.id}`}
                  className="group relative bg-slate-50 border border-slate-200 p-8 transition-all duration-500 hover:bg-slate-900 hover:border-slate-900"
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  
                  <div className="relative">
                    <div className="flex items-start justify-between mb-6">
                      <div className="p-4 bg-white border border-slate-200 group-hover:bg-slate-800 group-hover:border-slate-700 transition-colors duration-300">
                        <CatIcon className="h-8 w-8 text-slate-900 group-hover:text-emerald-400 transition-colors duration-300" />
                      </div>
                      <FiArrowUpRight className="h-6 w-6 text-slate-300 group-hover:text-emerald-400 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-white transition-colors duration-300 mb-2">
                      {category.category_name}
                    </h3>
                    <p className="text-slate-600 group-hover:text-slate-400 transition-colors duration-300 mb-6">
                      {category.description || 'ভেরিফায়েড ওষুধ ও স্বাস্থ্যপণ্য'}
                    </p>
                    
                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 group-hover:text-emerald-400 transition-colors duration-300">
                      <span>ব্রাউজ করুন</span>
                      <div className="w-4 h-px bg-current" />
                      <span>{category.products_count || '০'}+ পণ্য</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-4">
                <div className="w-8 h-px bg-emerald-500" />
                <span className="uppercase tracking-widest">ফিচারড</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
                জনপ্রিয়<br />পণ্যসমূহ
              </h2>
            </div>
            <Link 
              to="/products" 
              className="group inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-8 py-4 hover:bg-emerald-600 transition-all duration-300 mt-4 lg:mt-0"
            >
              সব পণ্য দেখুন
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-slate-200 p-6 animate-pulse">
                  <div className="aspect-square bg-slate-200 mb-6" />
                  <div className="h-5 bg-slate-200 w-3/4 mb-3" />
                  <div className="h-4 bg-slate-200 w-1/2 mb-4" />
                  <div className="flex justify-between">
                    <div className="h-8 bg-slate-200 w-1/3" />
                    <div className="h-8 bg-slate-200 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <FeaturedProduct key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-sm mb-4">
              <div className="w-8 h-px bg-emerald-500" />
              <span className="uppercase tracking-widest">কেন আমরা সেরা</span>
              <div className="w-8 h-px bg-emerald-500" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
              কেন আমাদের<br />থেকে কিনবেন?
            </h2>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <div
                  key={index}
                  className="group relative bg-slate-800 border border-slate-700 p-8 transition-all duration-500 hover:bg-slate-850 hover:border-slate-600 hover:-translate-y-1"
                >
                  {/* Gradient accent top */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${service.gradient} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
                  
                  <div className="relative">
                    {/* Icon */}
                    <div className={`inline-flex p-4 bg-gradient-to-br ${service.gradient} mb-6`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-xl font-bold text-white mb-3">
                      {service.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed mb-6">
                      {service.description}
                    </p>
                    
                    {/* Features */}
                    <ul className="space-y-2">
                      {service.features.map((feature, fidx) => (
                        <li key={fidx} className="flex items-center gap-2 text-sm text-slate-300">
                          <FiCheckCircle className="h-4 w-4 text-emerald-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-24 bg-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: FiUsers, value: "১০,০০০+", label: "সন্তুষ্ট গ্রাহক", color: "emerald" },
              { icon: FiPackage, value: "৫,০০০+", label: "পণ্য স্টকে", color: "blue" },
              { icon: FiTruck, value: "২৪ ঘন্টা", label: "ডেলিভারি", color: "violet" },
              { icon: FiAward, value: "১০০%", label: "অথেন্টিক পণ্য", color: "orange" }
            ].map((stat, idx) => (
              <div key={idx} className="text-center group">
                <div className={`inline-flex p-5 bg-slate-100 group-hover:bg-slate-900 transition-colors duration-300 mb-6`}>
                  <stat.icon className="h-8 w-8 text-slate-900 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-4xl font-black text-slate-900 mb-2">{stat.value}</div>
                <div className="text-slate-500 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 bg-gradient-to-r from-emerald-600 to-teal-700 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-96 h-96 bg-white blur-[128px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white blur-[128px]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-emerald-200 font-semibold text-sm mb-4">
                <div className="w-8 h-px bg-emerald-300" />
                <span className="uppercase tracking-widest">শুরু করুন</span>
              </div>
              <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight mb-6">
                প্রেসক্রিপশন আপলোড করে<br />
                <span className="text-emerald-200">অর্ডার শুরু করুন</span>
              </h2>
              <p className="text-emerald-100 text-lg lg:text-xl max-w-2xl">
                প্রেসক্রিপশন রিভিউ সম্পন্ন হলে আপনার অর্ডার দ্রুত প্রসেস করা হবে।
                আমাদের অভিজ্ঞ ফার্মাসিস্ট টিম প্রতিটি প্রেসক্রিপশন যাচাই করে।
              </p>
            </div>
            
            <Link
              to="/upload-prescription"
              className="group inline-flex items-center gap-4 bg-white text-emerald-700 px-10 py-5 text-xl font-black hover:bg-emerald-50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-900/30 active:scale-95"
            >
              আপলোড করুন
              <FiArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 text-slate-300">
              <FiPhone className="h-6 w-6 text-emerald-400" />
              <div>
                <div className="text-sm text-slate-500">কল করুন</div>
                <div className="font-bold">+৮৮০ ১২৩৪-৫৬৭৮৯০</div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-300">
              <FiMail className="h-6 w-6 text-emerald-400" />
              <div>
                <div className="text-sm text-slate-500">ইমেইল</div>
                <div className="font-bold">support@pharmacy.com</div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-300">
              <FiMapPin className="h-6 w-6 text-emerald-400" />
              <div>
                <div className="text-sm text-slate-500">ঠিকানা</div>
                <div className="font-bold">ঢাকা, বাংলাদেশ</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function FeaturedProduct({ product }) {
  const [isHovered, setIsHovered] = useState(false)
  const image = product.primary_image?.image_url || product.images?.[0]?.image_url
  const imageUrl = image?.startsWith('http') ? image : image ? `${API_ORIGIN}${image}` : null

  return (
    <article 
      className="group bg-white border border-slate-200 transition-all duration-500 hover:border-slate-900 hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/products/${product.id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          {imageUrl ? (
            <>
              <img 
                src={imageUrl} 
                alt={product.product_name} 
                className={`h-full w-full object-cover transition-transform duration-1000 ${
                  isHovered ? 'scale-105' : 'scale-100'
                }`}
              />
              {/* Hover Overlay */}
              <div className={`absolute inset-0 bg-slate-900/60 flex items-center justify-center gap-4 transition-opacity duration-300 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}>
                <button className="p-4 bg-white text-slate-900 hover:bg-emerald-500 hover:text-white transition-all duration-300">
                  <FiEye className="h-5 w-5" />
                </button>
                <button className="p-4 bg-white text-slate-900 hover:bg-emerald-500 hover:text-white transition-all duration-300">
                  <FiHeart className="h-5 w-5" />
                </button>
                <button className="p-4 bg-white text-slate-900 hover:bg-emerald-500 hover:text-white transition-all duration-300">
                  <FiShoppingCart className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="p-8 bg-slate-200">
                <span className="text-4xl font-black text-slate-400">Rx</span>
              </div>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-4 left-4 space-y-2">
            {product.requires_prescription && (
              <span className="inline-flex items-center gap-1.5 bg-amber-400 text-amber-900 px-3 py-1.5 text-xs font-black">
                <FiShield className="h-3 w-3" />
                Rx
              </span>
            )}
            {product.discount_percentage > 0 && (
              <span className="inline-flex items-center bg-red-500 text-white px-3 py-1.5 text-xs font-black">
                -{product.discount_percentage}%
              </span>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <h3 className="font-bold text-lg text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {product.product_name}
          </h3>
          <p className="mt-1 text-sm text-slate-500 line-clamp-1">
            {product.generic_name || product.brand_name || 'জেনেরিক তথ্য নেই'}
          </p>
          
          {/* Price */}
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {money(product.display_price || product.lowest_valid_price)}
                </span>
                {product.original_price && product.original_price > product.display_price && (
                  <span className="text-sm text-slate-400 line-through">
                    {money(product.original_price)}
                  </span>
                )}
              </div>
              {product.available_stock > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-2 w-2 bg-emerald-500" />
                  <span className="text-xs text-emerald-600 font-semibold">ইন স্টক</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}