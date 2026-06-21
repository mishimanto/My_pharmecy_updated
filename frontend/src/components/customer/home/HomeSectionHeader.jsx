import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function HomeSectionHeader({ eyebrow, title, subtitle, actionTo, actionLabel }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#0e6574]">{eyebrow}</p> : null}
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#07343d] sm:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm leading-7 text-[#51727a]">{subtitle}</p> : null}
      </div>
      {actionTo && actionLabel ? (
        <Link
          to={actionTo}
          className="inline-flex shrink-0 items-center gap-2 border border-[#b7e5df] bg-[#e8f7f4] px-4 py-2 text-sm font-semibold text-[#0b5d68] transition hover:border-[#13b8b0] hover:bg-[#dff8f4] hover:text-[#083f49]"
        >
          {actionLabel}
          <FiArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  )
}
