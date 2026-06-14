import { Link } from 'react-router-dom'

export default function HomeQuickPathsSection({ quickPaths }) {
  return (
    <section className="grid gap-4 py-14 md:grid-cols-2 xl:grid-cols-4">
      {quickPaths.map((item) => {
        const Icon = item.icon

        return (
          <Link
            key={item.to}
            to={item.to}
            className="group rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#13b8b0]/30 hover:shadow-[0_24px_60px_-32px_rgba(19,184,176,0.35)]"
          >
            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ring-1 ring-inset ${item.accent}`}>
              {item.label}
            </span>
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">{item.body}</p>
              </div>
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-600 transition group-hover:bg-[#13b8b0] group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </Link>
        )
      })}
    </section>
  )
}
