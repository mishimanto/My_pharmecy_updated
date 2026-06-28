import { Link } from 'react-router-dom'
import { useSiteSettings } from '../context/SiteSettingsContext'

export default function AuthLayout({ title, children, variant = 'customer' }) {
  const { settings } = useSiteSettings()
  const layoutClassName = variant === 'admin' ? 'auth-app--admin' : 'auth-app--customer'

  return (
    <main className={`min-h-screen bg-[#eef2f5] ${layoutClassName}`}>
      <div className="mx-auto grid min-h-screen  xl:grid-cols-[0.98fr_0.72fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 xl:flex">
          <img
            src="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1400&q=80"
            alt="Pharmacy shelves"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.55),rgba(2,6,23,0.86))]" />
          <div className="relative flex w-full flex-col justify-between p-12 text-white">
            <div className="flex items-center justify-between gap-4">
              <Link to="/" className="inline-flex items-center gap-4">
                {settings?.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt={settings.site_name || 'Site logo'}
                    className="h-12 w-48 object-contain"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center border border-white/15 bg-white/10 text-sm font-bold uppercase tracking-[0.18em] text-white">
                    Rx
                  </span>
                )}
                
              </Link>

              <div>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                >
                  Back to home
                </Link>
              </div>
            </div>

            <div className="max-w-xl">
              {/* <div className="inline-flex border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">
                Pharmacy account access
              </div> */}
              <h1 className="mt-6 text-5xl font-semibold tracking-tight">Medicines, prescriptions, and orders in one customer account.</h1>
              {/* <p className="mt-5 text-base leading-8 text-slate-200">
                Access your medicine orders, save delivery addresses, upload prescriptions, and stay updated with pharmacy support from a cleaner customer account area.
              </p> */}
            </div>
          </div>
        </section>

        <section className="flex items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-xl border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-46px_rgba(15,23,42,0.22)] sm:p-8">
            <div className="pb-5">
              <h1 className="mt-2 text-3xl text-center font-semibold tracking-tight text-slate-950">{title}</h1>
            </div>
            <div className="mt-2">{children}</div>
          </div>
        </section>
      </div>
    </main>
  )
}
