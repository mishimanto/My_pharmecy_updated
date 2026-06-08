import { Link } from 'react-router-dom'

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="min-h-screen bg-[#eef2f5]">
      <div className="mx-auto grid min-h-screen max-w-7xl xl:grid-cols-[0.98fr_0.72fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 xl:flex">
          <img
            src="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1400&q=80"
            alt="Pharmacy shelves"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.55),rgba(2,6,23,0.86))]" />
          <div className="relative flex w-full flex-col justify-between p-12 text-white">
            <div>
              <Link to="/" className="inline-flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center border border-white/15 bg-white/10 text-sm font-bold uppercase tracking-[0.18em] text-white">
                  Rx
                </span>
                <div>
                  <div className="text-lg font-semibold tracking-tight">My Pharmecy</div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-300">Online pharmacy platform</div>
                </div>
              </Link>
            </div>

            <div className="max-w-xl">
              <div className="inline-flex border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">
                Pharmacy account access
              </div>
              <h1 className="mt-6 text-5xl font-semibold tracking-tight">Medicines, prescriptions, and orders in one customer account.</h1>
              <p className="mt-5 text-base leading-8 text-slate-200">
                Access your medicine orders, save delivery addresses, upload prescriptions, and stay updated with pharmacy support from a cleaner customer account area.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-xl border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-46px_rgba(15,23,42,0.22)] sm:p-8">
            <div className="border-b border-slate-200 pb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">Customer access</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
              {subtitle ? <p className="mt-3 text-sm leading-7 text-slate-500">{subtitle}</p> : null}
            </div>
            <div className="mt-6">{children}</div>
          </div>
        </section>
      </div>
    </main>
  )
}
