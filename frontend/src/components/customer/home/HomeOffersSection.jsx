import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import HomeSectionHeader from './HomeSectionHeader'

export default function HomeOffersSection({ isBangla, offers }) {
  if (!offers.length) return null

  return (
    <section className="my-10">
      <HomeSectionHeader title={isBangla ? 'চলমান অফার' : 'Current offers'} actionLabel={isBangla ? 'সব ওষুধ দেখুন' : 'Browse medicines'} actionTo="/products" />
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {offers.slice(0, 3).map((offer) => (
          <Link key={offer.id} to={offer.linkUrl || '/products'} className="group overflow-hidden border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            {offer.image ? <img src={offer.image} alt="" className="h-36 w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : null}
            <div className="p-5">
              {offer.label ? <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#0e6574]">{offer.label}</div> : null}
              <h3 className="mt-2 text-lg font-bold leading-snug text-slate-950">{offer.title}</h3>
              {offer.body ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{offer.body}</p> : null}
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#0e6574]">
                {offer.buttonLabel || (isBangla ? 'দেখুন' : 'View offer')}
                <FiArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
