import { Link } from 'react-router-dom'
import { Autoplay } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'

export default function HomeBannerSection({ banners }) {
  if (!banners.length) return null

  return (
    <section className="my-8">
      <Swiper
        modules={[Autoplay]}
        slidesPerView={1}
        spaceBetween={0}
        loop={banners.length > 1}
        speed={10400}
        autoplay={banners.length > 1 ? { delay: 0, disableOnInteraction: false, pauseOnMouseEnter: false } : false}
        breakpoints={{
          640: {
            slidesPerView: 2,
            spaceBetween: 0,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 0,
          },
          1280: {
            slidesPerView: 3,
            spaceBetween: 0,
          },
        }}
        className="home-banner-swiper overflow-hidden bg-slate-100"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <Link to={banner.linkUrl || '/products'} className="group block overflow-hidden bg-slate-100">
              <div className="relative">
                <img
                  src={banner.image}
                  alt={banner.title || ''}
                  className="h-[170px] w-full object-cover transition duration-500 group-hover:scale-[1.03] sm:h-[190px] lg:h-[220px]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.02)_0%,rgba(2,6,23,0.68)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                  <h2 className="line-clamp-2 text-base font-bold leading-tight sm:text-lg">{banner.title}</h2>
                  <span className="mt-3 inline-flex w-fit items-center bg-[#13b8b0] px-3 py-2 text-xs font-bold text-white transition group-hover:bg-[#0ea8a1]">
                    {banner.buttonLabel || 'View banner'}
                  </span>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}
