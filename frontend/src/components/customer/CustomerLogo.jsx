import { useId } from 'react'
import { useSiteSettings } from '../../context/SiteSettingsContext'

export default function CustomerLogo({ variant = 'header' }) {
  const { settings } = useSiteSettings()
  const logoUrl = settings?.logo_url
  const alt = settings?.site_name || 'Site logo'

  if (logoUrl) {
    const wrapperClass = variant === 'footer'
      ? 'flex h-14 max-w-[180px] items-center overflow-hidden'
      : 'flex h-11 max-w-[150px] items-center sm:h-12 sm:max-w-[180px]'

    return (
      <div className={wrapperClass}>
        <img
          src={logoUrl}
          alt={alt}
          className="h-full w-auto max-w-full object-contain"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>
    )
  }

  if (variant === 'footer') {
    return (
      <span className="flex h-12 w-12 items-center justify-center bg-white shadow-[0_18px_35px_-20px_rgba(15,23,42,0.55)]">
        <LogoMark className="h-9 w-9" />
      </span>
    )
  }

  return (
    <div className="flex items-center">
      <LogoMark className="h-11 w-11 shrink-0 sm:h-12 sm:w-12" />
    </div>
  )
}

function LogoMark({ className = '' }) {
  const gradientId = `customer-logo-gradient-${useId().replace(/:/g, '')}`

  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="6" y="6" width="52" height="52" rx="16" fill={`url(#${gradientId})`} />
      <path d="M32 16C24.4 16 18.25 22.15 18.25 29.75C18.25 40.05 32 48 32 48C32 48 45.75 40.05 45.75 29.75C45.75 22.15 39.6 16 32 16Z" fill="white" fillOpacity="0.95" />
      <path d="M32 20.2C26.72 20.2 22.45 24.48 22.45 29.75C22.45 36.03 29.54 41.63 32 43.4C34.46 41.63 41.55 36.03 41.55 29.75C41.55 24.48 37.28 20.2 32 20.2Z" fill="#ecfeff" />
      <path d="M31.95 25.2V35.05" stroke="#0f766e" strokeWidth="4.2" strokeLinecap="round" />
      <path d="M27.05 30.12H36.9" stroke="#0f766e" strokeWidth="4.2" strokeLinecap="round" />
      <path d="M20.5 47.5C24.35 51.1 29.2 53 32 53C34.8 53 39.65 51.1 43.5 47.5" stroke="#99f6e4" strokeWidth="3.2" strokeLinecap="round" />
      <defs>
        <linearGradient id={gradientId} x1="10" y1="8" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0f766e" />
          <stop offset="0.55" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#ef4444" />
        </linearGradient>
      </defs>
    </svg>
  )
}
