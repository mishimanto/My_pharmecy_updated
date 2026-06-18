import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { FiChevronDown } from 'react-icons/fi'

function matchesPath(pathname, item) {
  if (!item?.to) {
    return false
  }

  if (item.end) {
    return pathname === item.to
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

function hasActiveDescendant(pathname, item) {
  if (matchesPath(pathname, item)) {
    return true
  }

  return item.children?.some((child) => hasActiveDescendant(pathname, child)) || false
}

function itemKey(item) {
  return item.to || item.label
}

export default function AdminSidebar({ sidebarOpen, visibleGroups }) {
  const location = useLocation()
  const [openItems, setOpenItems] = useState({})

  const activeParentKeys = useMemo(() => {
    const keys = {}

    visibleGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.children?.length && hasActiveDescendant(location.pathname, item)) {
          keys[itemKey(item)] = true
        }
      })
    })

    return keys
  }, [location.pathname, visibleGroups])

  useEffect(() => {
    if (Object.keys(activeParentKeys).length === 0) return
    setOpenItems((current) => ({ ...current, ...activeParentKeys }))
  }, [activeParentKeys])

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
                <div className="flex items-center gap-3 px-3">
                  <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">{group.title}</p>
                  <span className="h-px flex-1 bg-white/35" />
                </div>
                <div className="mt-3 space-y-1.5">
                  {group.items.map((item) => (
                    <NavItem
                      key={itemKey(item)}
                      item={item}
                      pathname={location.pathname}
                      openItems={openItems}
                      onToggle={(key) => setOpenItems((current) => ({ ...current, [key]: !current[key] }))}
                    />
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

function NavItem({ item, pathname, openItems, onToggle, level = 0 }) {
  const active = hasActiveDescendant(pathname, item)
  const key = itemKey(item)

  if (item.children?.length) {
    const open = openItems[key] || active

    return (
      <div>
        <button
          type="button"
          onClick={() => onToggle(key)}
          className="group flex w-full items-center gap-3 rounded-sm px-3 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/8 hover:text-white"
        >
          <span className={`h-2.5 w-2.5 rounded-full transition ${active ? 'bg-emerald-500' : 'bg-slate-600 group-hover:bg-slate-400'}`} />
          <span className="flex-1">{item.label}</span>
          <FiChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
        </button>

        {open ? (
          <div className="mt-1 ml-6 space-y-1 border-l border-white/15 pl-1">
            {item.children.map((child) => (
              <NavItem
                key={itemKey(child)}
                item={child}
                pathname={pathname}
                openItems={openItems}
                onToggle={onToggle}
                level={level + 1}
              />
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-sm px-3 py-3 text-sm font-medium transition ${
          level > 0 ? 'py-2.5 text-[13px]' : ''
        } ${
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
