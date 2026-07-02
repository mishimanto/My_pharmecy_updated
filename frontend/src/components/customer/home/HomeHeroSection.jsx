import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function HomeHeroSection({ heroSlides, currentSlide, slide, isBangla }) {
  return (
    <section className="relative overflow-hidden bg-[#052b34] min-h-[420px] sm:min-h-[500px] lg:min-h-[580px] xl:min-h-[640px]">
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
        <div className="absolute inset-0 bg-[linear-gradient(92deg,rgba(5,34,42,0.96)_0%,rgba(6,49,59,0.86)_36%,rgba(11,93,104,0.50)_64%,rgba(19,184,176,0.18)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,rgba(5,34,42,0)_0%,rgba(5,34,42,0.48)_100%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[420px] max-w-7xl items-center px-4 py-12 sm:min-h-[500px] sm:px-6 sm:py-14 lg:min-h-[580px] lg:px-8 lg:py-16 xl:min-h-[640px] xl:py-20">
        <div className="items-end gap-10 lg:flex lg:gap-16 xl:gap-20">
          <div className="max-w-3xl text-white">
            <div className="inline-flex items-center gap-2 border border-white/15 bg-white/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d6fffb] backdrop-blur-sm sm:px-4 sm:py-2 sm:text-[11px] sm:tracking-[0.22em]">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#13b8b0]" />
              {slide?.eyebrow}
            </div>

            <h1 className="mt-5 text-[2rem] font-bold leading-[1.06] tracking-tight text-white sm:mt-6 sm:text-[2.7rem] lg:text-[3.1rem] xl:text-[3.45rem]">
              {slide?.title}
            </h1>

            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link
                to={slide?.primaryUrl || '/products'}
                className="inline-flex items-center justify-center gap-2 bg-[#13b8b0] px-5 py-3 text-sm font-bold text-white shadow-[0_26px_50px_-24px_rgba(19,184,176,0.58)] transition hover:bg-[#0ea8a1] sm:justify-start sm:px-6 sm:py-3.5"
              >
                {slide?.primaryLabel || (isBangla ? 'পণ্য দেখুন' : 'Shop Products')}
                <FiArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={slide?.secondaryUrl || '/prescriptions'}
                className="inline-flex items-center justify-center gap-2 border border-white/18 bg-white/8 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/12 sm:justify-start sm:px-6 sm:py-3.5"
              >
                {slide?.secondaryLabel || (isBangla ? 'প্রেসক্রিপশন আপলোড করুন' : 'Upload Prescription')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
