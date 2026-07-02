import { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'

export default function ContentPage({ eyebrow, title, subtitle, sections, variant = 'standard' }) {
  const { isBangla } = useLanguage()
  const isFaq = variant === 'faq'
  const [openIndex, setOpenIndex] = useState(null)
  const formatIndex = (index) => String(index + 1).padStart(2, '0').replace(/\d/g, (digit) => (
    isBangla ? '০১২৩৪৫৬৭৮৯'[Number(digit)] : digit
  ))

  return (
    <div className="mx-auto max-w-7xl">
      <div className="border border-green-300 bg-green-50 p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            {/* <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">{eyebrow}</p> */}
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          </div>
          {/* <div className="max-w-xl border-l-0 border-slate-200 text-sm leading-8 text-slate-600 md:border-l md:pl-6">
            {subtitle}
          </div> */}
        </div>
      </div>

      <div className={`mt-6 ${isFaq ? 'space-y-3' : 'grid gap-4 md:grid-cols-2'}`}>
        {sections.map((section, index) => (
          isFaq ? (
            <section
              key={section.title}
              className={`border bg-white shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] transition duration-300 ${
                openIndex === index ? 'border-emerald-200' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <button
                type="button"
                className="flex w-full items-center gap-4 p-4 text-left sm:p-5"
                onClick={() => setOpenIndex((current) => (current === index ? null : index))}
                aria-expanded={openIndex === index}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700">
                  {formatIndex(index)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-semibold leading-7 text-slate-950">{section.title}</span>
                </span>
                <span className={`mt-1 text-2xl leading-none text-slate-400 transition duration-300 ${openIndex === index ? 'rotate-45 text-emerald-600' : ''}`}>+</span>
              </button>
              <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${openIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="border-t border-slate-100 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
                    <p className="text-sm leading-8 text-slate-600">{section.body}</p>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section key={section.title} className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] sm:p-7">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600">
                  {formatIndex(index)}
                </span>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-950">{section.title}</h2>
                  {section.body ? <p className="mt-3 text-sm leading-8 text-slate-600">{section.body}</p> : null}
                  {section.items?.length ? (
                    <div className="mt-4 space-y-3 text-sm leading-8 text-slate-600">
                      {section.items.map((item) => (
                        <p key={item} className="border-l-2 border-emerald-200 pl-3">{item}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          )
        ))}
      </div>
    </div>
  )
}
