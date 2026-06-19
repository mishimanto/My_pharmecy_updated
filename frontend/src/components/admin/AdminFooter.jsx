import { useSiteSettings } from '../../context/SiteSettingsContext'

export default function AdminFooter() {
  const { settings } = useSiteSettings()

  return (
    <footer className="mt-auto py-5 border-t border-slate-300/80 bg-slate-200/50 text-slate-600">
      <div className="mx-auto flex flex-col gap-3 px-4 text-xs sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} {settings?.site_name || 'My Pharmecy'}.</span>
          <span className="hidden text-slate-400 lg:inline">|</span>
          <span>Admin Workspace</span>
        </div>
        <div className="flex flex-wrap gap-4 text-slate-500">
          <span className="transition hover:text-slate-800 cursor-pointer">{settings?.support_phone || 'System Status'}</span>
          <span className="transition hover:text-slate-800 cursor-pointer">{settings?.support_email || 'Privacy Policy'}</span>
          <span className="transition hover:text-slate-800 cursor-pointer">{settings?.city || 'Support'}</span>
        </div>
      </div>
    </footer>
  )
}
