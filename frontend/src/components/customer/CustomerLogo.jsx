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
        <img src={logoUrl} alt={alt} className="h-full w-auto max-w-full object-contain" />
      </div>
    )
  }

  if (variant === 'footer') {
    return (
      <span className="flex h-12 w-12 items-center justify-center bg-white text-sm font-bold uppercase tracking-[0.18em] text-[#0f766e] shadow-[0_18px_35px_-20px_rgba(15,23,42,0.55)]">
        Rx
      </span>
    )
  }

  return (
    <div className="flex items-center">
      <svg viewBox="0 0 74 44" className="h-9 w-15 shrink-0 sm:h-11 sm:w-18.5" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M35.5 40.5C29.6 35.9 15.5 25.4 8.7 17.2C4.5 12.2 4.6 4.9 10.4 2.1C16.3 -0.6 23.3 1.2 27.3 6.5L31.4 11.9L35.8 6.7C40.1 1.5 47.3 -0.1 53.1 2.8C58.6 5.5 60.2 12.4 56.5 17.3C49.9 25.8 41.3 33 35.5 40.5Z" stroke="#ef4444" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 22H28L30.6 16L34.1 28L37.3 18.5L40.1 22H47" stroke="#26b0af" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
