import { FiArrowRight, FiMapPin, FiPhoneCall } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function HomeSupportCtaSection({ isBangla }) {
  const actions = [
    { to: '/prescriptions', label: isBangla ? '\u09aa\u09cd\u09b0\u09c7\u09b8\u0995\u09cd\u09b0\u09bf\u09aa\u09b6\u09a8 \u0986\u09aa\u09b2\u09cb\u09a1 \u0995\u09b0\u09c1\u09a8' : 'Upload prescription' },
    { to: '/products', label: isBangla ? '\u09b8\u09ac \u09aa\u09a3\u09cd\u09af \u09a6\u09c7\u0996\u09c1\u09a8' : 'Browse all products' },
    { to: '/support', label: isBangla ? '\u09b8\u09be\u09aa\u09cb\u09b0\u09cd\u099f\u09c7 \u09af\u09cb\u0997\u09be\u09af\u09cb\u0997 \u0995\u09b0\u09c1\u09a8' : 'Contact support' },
  ]

  return (
    <section className="pb-10 pt-2">
      <div className="overflow-hidden border border-[#0f5e69]/20 bg-[linear-gradient(135deg,#06252d_0%,#0a4d59_48%,#0f7680_100%)] text-white shadow-[0_34px_90px_-30px_rgba(8,63,73,0.62)]">
        <div className="grid gap-6 px-5 py-7 sm:px-8 sm:py-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center xl:px-10">
          <div>
            <h2 className="max-w-2xl text-2xl font-bold tracking-tight sm:text-[2.2rem] xl:text-[2.5rem]">
              {isBangla
                ? '\u09aa\u09cd\u09b0\u09c7\u09b8\u0995\u09cd\u09b0\u09bf\u09aa\u09b6\u09a8, \u09b8\u09be\u09aa\u09cb\u09b0\u09cd\u099f \u0993 \u09a1\u09c7\u09b2\u09bf\u09ad\u09be\u09b0\u09bf \u098f\u0995 \u099c\u09be\u09df\u0997\u09be \u09a5\u09c7\u0995\u09c7 \u09aa\u09b0\u09bf\u099a\u09be\u09b2\u09a8\u09be \u0995\u09b0\u09c1\u09a8'
                : 'Handle prescriptions, support, and delivery from one place'}
            </h2>

            <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
              <span className="inline-flex items-center gap-2 border border-white/14 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white/95">
                <FiMapPin className="h-4 w-4 text-[#b8f6ef]" />
                {isBangla ? '\u09a2\u09be\u0995\u09be \u09a1\u09c7\u09b2\u09bf\u09ad\u09be\u09b0\u09bf \u0995\u09ad\u09be\u09b0\u09c7\u099c' : 'Dhaka delivery coverage'}
              </span>
              <span className="inline-flex items-center gap-2 border border-white/14 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white/95">
                <FiPhoneCall className="h-4 w-4 text-[#b8f6ef]" />
                09610-001122
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            {actions.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-center justify-between border border-white/12 bg-white/8 px-4 py-3.5 text-sm font-bold backdrop-blur-sm transition hover:bg-white/12 sm:px-5 sm:py-4"
              >
                <span>{item.label}</span>
                <FiArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
