import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function HomeBannerSection({ banners }) {
  if (!banners.length) return null

  return (
    <section className="my-8 grid gap-4 lg:grid-cols-2">
      {banners.slice(0, 2).map((banner) => (
        <Link
          key={banner.id}
          to={banner.linkUrl || '/products'}
          className="group relative min-h-[220px] overflow-hidden bg-slate-950 text-white shadow-[0_22px_60px_-42px_rgba(15,23,42,0.75)]"
        >
          <img src={banner.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(2,6,23,0.86)_0%,rgba(2,6,23,0.58)_55%,rgba(15,118,110,0.25)_100%)]" />
          <div className="relative flex min-h-[220px] flex-col justify-center p-6 sm:p-7">
            {banner.label ? (
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-teal-100">{banner.label}</div>
            ) : null}
            <h2 className="mt-2 max-w-lg text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{banner.title}</h2>
            {banner.body ? <p className="mt-3 max-w-md text-sm leading-6 text-white/78">{banner.body}</p> : null}
            {banner.buttonLabel ? (
              <span className="mt-5 inline-flex w-fit items-center gap-2 bg-[#13b8b0] px-4 py-2.5 text-sm font-bold text-white transition group-hover:bg-[#0ea8a1]">
                {banner.buttonLabel}
                <FiArrowRight className="h-4 w-4" />
              </span>
            ) : null}
          </div>
        </Link>
      ))}
    </section>
  )
}
