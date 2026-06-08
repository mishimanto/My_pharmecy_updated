export default function ContentPage({ eyebrow, title, subtitle, sections }) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-500">{subtitle}</p>
      </div>

      <div className="mt-6 space-y-5">
        {sections.map((section) => (
          <section key={section.title} className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{section.title}</h2>
            {section.body ? <p className="mt-3 text-sm leading-8 text-slate-600">{section.body}</p> : null}
            {section.items?.length ? (
              <div className="mt-4 space-y-3 text-sm leading-8 text-slate-600">
                {section.items.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  )
}
