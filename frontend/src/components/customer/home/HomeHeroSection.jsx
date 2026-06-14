import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function HomeHeroSection({ heroSlides, currentSlide, slide, isBangla }) {
  return (
    <section className="relative overflow-hidden bg-slate-950">
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
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.78)_45%,rgba(15,118,110,0.35)_100%)]" />
      </div>

      <div className="relative mx-auto grid min-h-[82vh] max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:px-8 xl:grid-cols-[1.12fr_0.88fr] xl:items-center xl:py-20">
        <div className="text-white">
          <div className="inline-flex items-center gap-2 border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-100 backdrop-blur-sm">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#13b8b0]" />
            {slide.eyebrow}
          </div>

          <h1 key={slide.id} className="mt-3 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem] animate-in">
            {slide.title}
          </h1>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/products" className="inline-flex items-center gap-2 bg-[#13b8b0] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-900/30 transition hover:bg-[#0ea8a1]">
              {isBangla ? 'ওষুধ দেখুন' : 'Shop medicines'}
              <FiArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/upload-prescription" className="inline-flex items-center gap-2 border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/15">
              {isBangla ? 'প্রেসক্রিপশন আপলোড' : 'Upload prescription'}
            </Link>
          </div>

          {/* <div className="mt-10 flex items-center gap-3">
            {heroSlides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={isBangla ? `স্লাইড ${index + 1} এ যান` : `Go to slide ${index + 1}`}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'w-10 bg-[#13b8b0]' : 'w-3 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div> */}
        </div>
      </div>
    </section>
  )
}
