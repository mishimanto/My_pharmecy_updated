import { useSiteSettings } from '../../context/SiteSettingsContext'

export default function AdminFooter() {
  const { settings } = useSiteSettings()
  const currentYear = new Date().getFullYear()
  const siteName = settings?.site_name || 'My Pharmecy'
  const supportPhone = settings?.support_phone || '09610-001122'
  const supportEmail = settings?.support_email || 'support@mypharmecy.test'
  const footerNote = settings?.footer_note || 'All rights reserved'

  return (
    <footer className="mt-auto py-5 border-t border-slate-300/80 bg-slate-200/50 text-slate-600">
      <div className="mx-auto flex flex-col gap-3 px-4 text-xs sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <span>&copy; {currentYear} {siteName}.</span>
          <span className="hidden text-slate-400 lg:inline">|</span>
          <span>{footerNote}</span>
          <span className="hidden text-slate-400 lg:inline">|</span>
          <span>Admin Workspace</span>
        </div>
        <div className="flex flex-wrap gap-4 text-slate-500">
          <a href={`tel:${supportPhone}`} className="transition hover:text-slate-800">
            {supportPhone}
          </a>
          <a href={`mailto:${supportEmail}`} className="transition hover:text-slate-800">
            {supportEmail}
          </a>
        </div>
      </div>
    </footer>
  )
}
