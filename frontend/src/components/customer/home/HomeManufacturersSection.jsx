import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiChevronDown } from 'react-icons/fi'
import HomeSectionHeader from './HomeSectionHeader'
import { handleImageFallback } from '../../../utils/imageUrl'
import { getManufacturerProductsPath } from '../../../utils/categoryNames'
import { resolveImage } from './homeUtils'

function ManufacturerCard({ manufacturer, compact = false }) {
  const logoSrc = resolveImage(manufacturer.logo_url)
  const productCount = Number(manufacturer.products_count || 0)

  return (
    <Link
      to={getManufacturerProductsPath(manufacturer)}
      className={`relative overflow-hidden border border-[#d9ece8] bg-gray-500/90 shadow-[0_18px_34px_-30px_rgba(8,63,73,0.18)] transition hover:border-[#13b8b0]/35 hover:bg-white ${
        compact ? 'px-2 py-2' : 'px-2 py-2'
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <img
          src={logoSrc}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-[0.08] blur-[1px] scale-110"
          onError={handleImageFallback}
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,255,255,0.82))]" />
      </div>

      <div className="relative flex items-center gap-3">
        <img
          src={logoSrc}
          alt={manufacturer.manufacturer_name}
          className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} border border-[#d6ece8] bg-white object-cover`}
          onError={handleImageFallback}
        />
        <div className="min-w-0">
          <div className={`${compact ? 'text-xs' : 'text-md'} truncate font-semibold text-[#07343d]`}>
            {manufacturer.manufacturer_name}
          </div>
          {/* <div className="mt-1 text-[11px] text-[#4e7b82] sm:text-xs">
            {productCount.toLocaleString()} {productCount === 1 ? 'product' : 'products'}
          </div> */}
        </div>
      </div>
    </Link>
  )
}

export default function HomeManufacturersSection({ isBangla, manufacturerHighlights = [] }) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)

  if (!manufacturerHighlights.length) {
    return null
  }

  const mobileCollapsedManufacturers = manufacturerHighlights.slice(0, 5)
  const mobileManufacturers = isMobileExpanded ? manufacturerHighlights : mobileCollapsedManufacturers
  const hasMobileOverflow = manufacturerHighlights.length > mobileCollapsedManufacturers.length

  return (
    <section className="pb-10 pt-2">
      <div className="overflow-hidden border border-[#d8ece9] bg-white shadow-[0_26px_56px_-40px_rgba(8,63,73,0.12)]">
        <div className="border-b border-[#e3f1ee] px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-3 sm:block">
            <div className="min-w-0 flex-1">
              <HomeSectionHeader
                eyebrow={isBangla ? 'প্রস্তুতকারক' : 'Manufacturers'}
                title={isBangla ? 'বিশ্বস্ত প্রস্তুতকারক' : 'Trusted Manufacturers'}
                subtitle={
                  isBangla
                    ? 'বিশ্বস্ত প্রস্তুতকারকের পণ্য সহজেই খুঁজে নিন।'
                    : 'Explore products from trusted manufacturers.'
                }
              />
            </div>

            {hasMobileOverflow ? (
              <button
                type="button"
                onClick={() => setIsMobileExpanded((current) => !current)}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-[#0e6574] transition hover:bg-white sm:hidden"
                aria-label={
                  isMobileExpanded
                    ? (isBangla ? 'সংক্ষিপ্ত করুন' : 'Show Less')
                    : (isBangla ? 'সব দেখুন' : 'Show All')
                }
                aria-expanded={isMobileExpanded}
              >
                <FiChevronDown className={`h-5 w-5 transition ${isMobileExpanded ? 'rotate-180' : ''}`} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="p-3 sm:p-4">
          <div className="grid gap-2 sm:hidden">
            {mobileManufacturers.map((manufacturer) => (
              <ManufacturerCard key={manufacturer.id} manufacturer={manufacturer} compact />
            ))}
          </div>

          <div className="hidden gap-3 sm:grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {manufacturerHighlights.map((manufacturer) => (
              <ManufacturerCard key={manufacturer.id} manufacturer={manufacturer} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
