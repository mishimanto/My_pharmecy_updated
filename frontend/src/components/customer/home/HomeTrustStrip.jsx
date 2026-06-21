export default function HomeTrustStrip({ trustItems }) {
  return (
    <section className="relative z-10 mx-auto -mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-3 border border-[#9de8e1]/55 bg-[#f7fffd]/92 p-4 shadow-[0_22px_70px_-38px_rgba(8,63,73,0.42)] backdrop-blur sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
        {trustItems.map((item) => {
          const Icon = item.icon

          return (
            <div key={item.label} className="flex items-center gap-3 border border-transparent px-3 py-2 transition hover:border-[#9de8e1]/50 hover:bg-[#e8f7f4]">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#dff8f4] text-[#0b5d68]">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-[#07343d]">{item.label}</div>
                <div className="text-xs text-[#51727a]">{item.detail}</div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
