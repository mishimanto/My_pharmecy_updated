import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function HomeHeroSection({ heroSlides, currentSlide, slide, isBangla }) {
  return (
    <section className="relative overflow-hidden bg-[#083f49]">
      <div className="absolute inset-0">
        {heroSlides.map((item, index) => (
          <img
            key={item.id}
            src={item.image}
            alt=""
            aria-hidden={index !== currentSlide}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(5,34,42,0.94)_0%,rgba(8,63,73,0.78)_46%,rgba(19,184,176,0.34)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32" />
      </div>

      <div className="relative mx-auto grid min-h-[82vh] max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:px-8 xl:grid-cols-[1.12fr_0.88fr] xl:items-center xl:py-20">
        <div className="text-white">
          <div className="inline-flex items-center gap-2 border border-[#9de8e1]/45 bg-[#083f49]/55 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d7fffb] backdrop-blur-sm">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#13b8b0]" />
            {slide.eyebrow}
          </div>

          <h1 key={slide.id} className="mt-3 max-w-3xl animate-in text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
            {slide.title}
          </h1>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={slide.primaryUrl || '/products'} className="inline-flex items-center gap-2 bg-[#13b8b0] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-950/30 transition hover:bg-[#0ea8a1]">
              {slide.primaryLabel || (isBangla ? 'ওষুধ দেখুন' : 'Shop medicines')}
              <FiArrowRight className="h-4 w-4" />
            </Link>
            <Link to={slide.secondaryUrl || '/upload-prescription'} className="inline-flex items-center gap-2 border border-[#9de8e1]/35 bg-[#083f49]/40 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-[#0e6574]/55">
              {slide.secondaryLabel || (isBangla ? 'প্রেসক্রিপশন আপলোড' : 'Upload prescription')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
