import { useEffect, useState } from 'react'
import {
  FiChevronDown,
  FiFileText,
  FiHeart,
  FiLogOut,
  FiMapPin,
  FiMenu,
  FiMessageSquare,
  FiPackage,
  FiPhoneCall,
  FiSearch,
  FiShoppingCart,
  FiTruck,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { productApi } from '../api/productApi'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { useStorefront } from '../context/StorefrontContext'

const nav = [
  ['/', 'Home'],
  ['/products', 'Medicines'],
  ['/upload-prescription', 'Upload Prescription'],
  ['/orders', 'Orders'],
  ['/account', 'Account'],
  ['/support', 'Support'],
]

const footerGroups = [
  {
    title: 'Shop',
    items: [
      ['All medicines', '/products'],
      ['Prescription upload', '/upload-prescription'],
      ['Track order', '/track-order'],
      ['Cart', '/cart'],
    ],
  },
  {
    title: 'Support',
    items: [
      ['Customer help', '/support'],
      ['FAQ', '/faq'],
      ['Privacy policy', '/privacy-policy'],
      ['Terms and conditions', '/terms-and-conditions'],
    ],
  },
]

export default function CustomerLayout() {
  const { customer, logout } = useCustomerAuth()
  const { cartCount, wishlistCount, refreshCart } = useStorefront()
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [search, setSearch] = useState('')
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      productApi.prefetchList({ page: 1 })
      productApi.prefetchList({ per_page: 6 })
      productApi.prefetchCategories()
      productApi.prefetchManufacturers()
      refreshCart().catch(() => {})
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [refreshCart])

  const signOut = async () => {
    closeMenus()
    await logout()
    navigate('/')
  }

  const prefetchProducts = () => {
    productApi.prefetchList({ page: 1 })
    productApi.prefetchCategories()
    productApi.prefetchManufacturers()
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const query = search.trim()
    closeMenus()
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products')
  }

  const trackOrdersTo = customer ? '/orders' : '/track-order'
  const customerName = customer?.full_name?.trim() || 'Sign in'
  const avatarName = customer?.full_name?.trim() || 'Guest'
  const closeMenus = () => {
    setIsAccountMenuOpen(false)
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-[#d4dde7] bg-[#eef3f7]">
        <div className="mx-auto flex max-w-[1380px] items-center gap-3 px-4 py-3 sm:px-6 lg:gap-5 lg:px-8">
          <Link to="/" onClick={closeMenus} className="shrink-0" aria-label="My Pharmecy home">
            <BrandMark />
          </Link>

          <form onSubmit={handleSearchSubmit} className="min-w-0 flex-1" role="search">
            <div className="flex h-[46px] items-center rounded-[14px] border border-[#b9c5d2] bg-white pl-4 pr-1 shadow-[0_2px_0_rgba(255,255,255,0.7)_inset]">
              <FiSearch className="h-5 w-5 shrink-0 text-[#0e6574]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onFocus={prefetchProducts}
                className="min-w-0 flex-1 bg-transparent px-3 text-[15px] font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
                placeholder="Find your medicine"
              />
              <button
                type="submit"
                onMouseEnter={prefetchProducts}
                className="h-[36px] min-w-[92px] rounded-[9px] bg-[#13b8b0] px-5 text-[14px] font-semibold text-white transition hover:bg-[#0ea8a1]"
              >
                Search
              </button>
            </div>
          </form>

          <div className="hidden shrink-0 items-center gap-6 lg:flex">
            <Link to={trackOrdersTo} onClick={closeMenus} className="flex items-center gap-2.5 text-[#0f6475] transition hover:opacity-80">
              <FiTruck className="h-7 w-7 shrink-0" />
              <span className="text-[13px] font-extrabold leading-[0.95] text-[#132238]">
                <span className="block">Track</span>
                <span className="block whitespace-nowrap">Your Order</span>
              </span>
            </Link>

            <HeaderActionLink to="/cart" label="Cart" count={cartCount} icon={FiShoppingCart} onClick={closeMenus} />

            <div className="h-12 w-px bg-[#ccd4de]" />

            {customer ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen((current) => !current)}
                  className="flex items-center gap-3 text-left transition hover:opacity-90"
                >
                  <div className="min-w-0 text-right">
                    <div className="text-[12px] font-semibold leading-none text-slate-500">Hello,</div>
                    <div className="truncate text-[15px] font-bold text-slate-950">{customerName}</div>
                  </div>
                  <UserAvatar customer={customer} fallbackName={avatarName} />
                  <FiChevronDown className={`h-4 w-4 text-slate-400 transition ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAccountMenuOpen ? (
                  <div className="absolute right-0 top-full mt-3 w-60 overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_30px_60px_-36px_rgba(15,23,42,0.38)]">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <div className="text-sm font-semibold text-slate-950">{customerName}</div>
                      <div className="text-xs text-slate-500">{customer?.email || customer?.phone || 'Customer account'}</div>
                    </div>

                    <div className="p-2">
                      <AccountMenuLink to="/account" label="Account" icon={FiUser} onClick={closeMenus} />
                      <AccountMenuLink to="/orders" label="My orders" icon={FiPackage} onClick={closeMenus} />
                      <AccountMenuLink to="/wishlist" label={`Wishlist${wishlistCount ? ` (${wishlistCount})` : ''}`} icon={FiHeart} onClick={closeMenus} />
                      <AccountMenuLink to="/upload-prescription" label="Upload prescription" icon={FiFileText} onClick={closeMenus} />
                      <AccountMenuLink to="/support" label="Support" icon={FiMessageSquare} onClick={closeMenus} />
                      <button
                        type="button"
                        onClick={signOut}
                        className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        <FiLogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link to="/login" onClick={closeMenus} className="flex items-center gap-3 text-left transition hover:opacity-90">
                <div className="min-w-0 text-right">
                  <div className="text-[12px] font-semibold leading-none text-slate-500">Hello,</div>
                  <div className="truncate text-[15px] font-bold text-slate-950">Sign in</div>
                </div>
                <UserAvatar fallbackName="Guest" />
              </Link>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            <HeaderActionLink to="/cart" count={cartCount} icon={FiShoppingCart} mobileOnly onClick={closeMenus} />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#c5d0db] bg-white text-slate-700"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div className="border-t border-[#d4dde7] bg-white lg:hidden">
            <div className="space-y-5 px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <Link to={customer ? '/account' : '/login'} onClick={closeMenus} className="flex min-w-0 items-center gap-3">
                  <UserAvatar customer={customer} fallbackName={avatarName} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-950">{customer ? customerName : 'Sign in to your account'}</div>
                    <div className="text-xs text-slate-500">{customer?.email || customer?.phone || 'Track orders, prescriptions, and support.'}</div>
                  </div>
                </Link>
                {customer ? (
                  <button type="button" onClick={signOut} className="text-sm font-semibold text-rose-600">
                    Logout
                  </button>
                ) : null}
              </div>

              <div className="grid gap-2">
                {nav.map(([to, label]) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={closeMenus}
                    onMouseEnter={to === '/products' ? prefetchProducts : undefined}
                    onFocus={to === '/products' ? prefetchProducts : undefined}
                    className={({ isActive }) =>
                      `rounded-[14px] border px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? 'border-[#13b8b0] bg-[#eefbfa] text-[#0e6574]'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
                <NavLink to="/wishlist" onClick={closeMenus} className="rounded-[14px] border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                  Wishlist{wishlistCount ? ` (${wishlistCount})` : ''}
                </NavLink>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className={isHome ? '' : 'mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'}>
        <Outlet />
      </main>

      <footer className="mt-20 border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center bg-[linear-gradient(135deg,#0f172a,#0f766e)] text-sm font-bold uppercase tracking-[0.18em] text-white">
                  Rx
                </span>
                <div>
                  <div className="text-lg font-semibold text-slate-950">My Pharmecy</div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Digital pharmacy support</div>
                </div>
              </div>
              <p className="max-w-md text-sm leading-7 text-slate-500">
                Order medicines, upload prescriptions, and get pharmacy support from one clean storefront.
              </p>

              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3 border border-slate-200 bg-slate-50 px-4 py-3">
                  <FiPhoneCall className="mt-0.5 h-4 w-4 text-teal-700" />
                  <div>
                    <div className="font-medium text-slate-900">09610-001122</div>
                    <div>8AM to 11PM support</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 border border-slate-200 bg-slate-50 px-4 py-3">
                  <FiMapPin className="mt-0.5 h-4 w-4 text-teal-700" />
                  <div>
                    <div className="font-medium text-slate-900">Dhaka service point</div>
                    <div>Fast medicine delivery and prescription assistance</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Location</div>
                <div className="mt-1 text-sm text-slate-500">Find us on the map for pharmacy support and delivery coordination.</div>
              </div>
              <div className="overflow-hidden border border-slate-200 bg-slate-100">
                <iframe
                  title="My Pharmecy location map"
                  src="https://www.google.com/maps?q=Dhaka%2C%20Bangladesh&z=12&output=embed"
                  className="h-[260px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">{group.title}</h3>
                <div className="mt-4 space-y-3">
                  {group.items.map(([label, to]) => (
                    <Link key={to} to={to} className="block text-sm text-slate-600 transition hover:text-slate-950">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="border border-slate-200 bg-slate-50 px-5 py-5">
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Need help?</div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>Upload your prescription and our team will help prepare the order.</p>
                <p>Need quick support? Use the helpline or open a support request from your account.</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/upload-prescription" className="border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950">
                  Upload Rx
                </Link>
                <Link to="/support" className="bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
                  Get support
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex items-center gap-4">
              <span>(c) 2026 My Pharmecy</span>
              <span className="hidden text-slate-300 lg:inline">|</span>
              <span>Prescription-aware online pharmacy experience</span>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/privacy-policy" className="transition hover:text-slate-950">Privacy policy</Link>
              <Link to="/terms-and-conditions" className="transition hover:text-slate-950">Terms</Link>
              <Link to="/refund-and-return-policy" className="transition hover:text-slate-950">Refund policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function HeaderActionLink({ to, label, count, icon: Icon, mobileOnly = false, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 text-[#132238] transition hover:opacity-80 ${
        mobileOnly ? 'h-11 w-11 justify-center rounded-[14px] border border-[#c5d0db] bg-white' : ''
      }`}
      aria-label={label || 'Cart'}
    >
      <Icon className={`${mobileOnly ? 'h-5 w-5' : 'h-6 w-6'} shrink-0 text-[#0f6475]`} />
      {label ? <span className="text-[15px] font-semibold text-slate-950">{label}</span> : null}
      {count > 0 ? (
        <span className={`absolute inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#dff7f4] px-1.5 text-[10px] font-bold text-[#0e6574] ${mobileOnly ? '-right-1 -top-1 h-[18px]' : 'left-3 top-0 h-[18px]'}`}>
          {count}
        </span>
      ) : null}
    </Link>
  )
}

function AccountMenuLink({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink to={to} onClick={onClick} className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950">
      <Icon className="h-4 w-4 text-slate-400" />
      {label}
    </NavLink>
  )
}

function UserAvatar({ customer, fallbackName }) {
  const avatar = customer?.avatar?.trim()
  const name = fallbackName || customer?.full_name || 'Guest'

  if (avatar) {
    return <img src={avatar} alt={name} className="h-11 w-11 rounded-full border border-slate-200 object-cover" />
  }

  return (
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#dfe8ef)] text-sm font-bold uppercase text-slate-700">
      {initials(name)}
    </span>
  )
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 74 44" className="h-11 w-[74px] shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M35.5 40.5C29.6 35.9 15.5 25.4 8.7 17.2C4.5 12.2 4.6 4.9 10.4 2.1C16.3 -0.6 23.3 1.2 27.3 6.5L31.4 11.9L35.8 6.7C40.1 1.5 47.3 -0.1 53.1 2.8C58.6 5.5 60.2 12.4 56.5 17.3C49.9 25.8 41.3 33 35.5 40.5Z" stroke="#ef4444" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 22H28L30.6 16L34.1 28L37.3 18.5L40.1 22H47" stroke="#26b0af" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="text-[26px] font-extrabold leading-none tracking-[-0.03em] text-[#2b8d99]">
        My<span className="text-[#39b7b1]">Pharmecy</span>
      </div>
    </div>
  )
}

function initials(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
