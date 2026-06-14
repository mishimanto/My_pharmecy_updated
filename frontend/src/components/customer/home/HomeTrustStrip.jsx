export default function HomeTrustStrip({ trustItems }) {
  return (
    <section className="relative z-10 mx-auto -mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-3 border border-slate-200/80 bg-white p-4 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)] sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
        {trustItems.map((item) => {
          const Icon = item.icon

          return (
            <div key={item.label} className="flex items-center gap-3 rounded-[14px] px-3 py-2">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eefbfa] text-[#0e6574]">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-slate-950">{item.label}</div>
                <div className="text-xs text-slate-500">{item.detail}</div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
