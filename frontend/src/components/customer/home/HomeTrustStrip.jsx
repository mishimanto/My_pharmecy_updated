export default function HomeTrustStrip({ trustItems }) {
  return (
    <section className="relative z-10 mx-auto -mt-9 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-px overflow-hidden border border-[#c6ebe6] bg-[#cfeee9] shadow-[0_32px_80px_-46px_rgba(8,63,73,0.48)] sm:grid-cols-2 lg:grid-cols-4">
        {trustItems.map((item) => {
          const Icon = item.icon

          return (
            <div key={item.label} className="flex items-start gap-4 bg-white px-4 py-4 sm:px-5">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center border border-[#d8efeb] bg-[#effaf8] text-[#0b5d68]">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#07343d]">{item.label}</div>
                <div className="mt-1 text-xs leading-6 text-[#5d7c84]">{item.detail}</div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
