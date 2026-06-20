import { Link } from 'react-router-dom'
import { FiMenu, FiChevronDown, FiLogOut } from 'react-icons/fi'

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AD'
}

export default function AdminHeader({
  setSidebarOpen,
  settingsOpen,
  setSettingsOpen,
  activeItem,
  roleNames,
  staff,
  visibleSettings,
  logout,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-gray-400/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 lg:hidden"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <span className="sr-only">Open sidebar</span>
            <FiMenu className="h-4 w-4" />
          </button>

          <div className="min-w-0">                  
            <h2 className="truncate text-xl font-semibold text-slate-950">{activeItem?.label || 'Admin Panel'}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 xl:flex">
            <span className="rounded-full bg-slate-100/60 px-3 py-1.5 text-xs font-medium text-slate-600">
              {roleNames}
            </span>                  
          </div>

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-3 px-3 py-1.5 shadow-sm transition hover:border-slate-300"
              onClick={() => setSettingsOpen((open) => !open)}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                {initials(staff?.full_name)}
              </span>
              <span className="hidden min-w-0 text-left md:block">
                <span className="block truncate text-sm font-semibold text-slate-950">{staff?.full_name || 'Admin User'}</span>
              </span>
              <FiChevronDown className={`h-4 w-4 text-slate-700 transition ${settingsOpen ? 'rotate-180' : ''}`} />
            </button>

            {settingsOpen ? (
              <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-md border border-slate-200 bg-white p-2 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.35)]">
                <div className="mt-2 space-y-1">
                  {visibleSettings.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-slate-400" />
                        <span>{item.label}</span>
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="mt-2 border-t border-slate-200 pt-2">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    onClick={logout}
                  >
                    <span className="flex items-center gap-3">
                      <FiLogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
