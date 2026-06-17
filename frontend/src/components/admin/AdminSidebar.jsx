import { NavLink } from 'react-router-dom'

export default function AdminSidebar({ sidebarOpen, visibleGroups }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-500/20 bg-[linear-gradient(135deg,#0d4b59_0%,#0f766e_52%,#13b8b0_100%)] text-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-white/20 px-5 py-6">
          <div className="shadow-[0_24px_60px_-32px_rgba(16,185,129,0.85)]">                
            <p className="text-md font-semibold uppercase tracking-[0.22em] text-slate-400">Admin Workspace</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar px-4 py-5">
          <div className="space-y-6">
            {visibleGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">{group.title}</p>
                <div className="mt-3 space-y-1.5">
                  {group.items.map((item) => (
                    <NavItem key={item.to} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>            
      </div>
    </aside>
  )
}

function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-sm px-3 py-3 text-sm font-medium transition ${
          isActive
            ? 'bg-gray-100/20 text-slate-950 shadow-[0_16px_32px_-24px_rgba(255,255,255,0.9)]'
            : 'text-slate-300 hover:bg-white/8 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`h-2.5 w-2.5 rounded-full transition ${isActive ? 'bg-emerald-500' : 'bg-slate-600 group-hover:bg-slate-400'}`} />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}
