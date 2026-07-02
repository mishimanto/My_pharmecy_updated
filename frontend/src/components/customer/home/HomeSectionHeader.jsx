import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function HomeSectionHeader({ eyebrow, title, subtitle, actionTo, actionLabel }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {/* {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[#0e6574]">
            {eyebrow}
          </p>
        ) : null} */}
        <h2 className="text-[1.5rem] font-bold leading-tight tracking-tight text-[#07343d] sm:text-[2rem]">
          {title}
        </h2>
        {/* {subtitle ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5a7680] sm:text-[15px]">
            {subtitle}
          </p>
        ) : null} */}
      </div>

      {/* {actionTo && actionLabel ? (
        <Link
          to={actionTo}
          className="inline-flex shrink-0 items-center gap-2 border border-[#c4e9e4] bg-white px-4 py-2.5 text-sm font-semibold text-[#0b5d68] shadow-[0_18px_38px_-30px_rgba(8,63,73,0.22)] transition hover:border-[#13b8b0] hover:text-[#084b58]"
        >
          {actionLabel}
          <FiArrowRight className="h-4 w-4" />
        </Link>
      ) : null} */}
    </div>
  )
}
