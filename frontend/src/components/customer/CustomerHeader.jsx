import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  FiBell,
  FiChevronDown,
  FiFileText,
  FiHeart,
  FiKey,
  FiLogOut,
  FiMenu,
  FiCpu,
  FiMessageSquare,
  FiPackage,
  FiSearch,
  FiShoppingCart,
  FiTruck,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { notificationApi } from '../../api/notificationApi'
import { productApi } from '../../api/productApi'
import OptimizedImage from '../common/OptimizedImage'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useStorefront } from '../../context/StorefrontContext'
import {
  customerQueryKeys,
  getOfferPricingSignature,
  markNotificationReadInQueryData,
  normalizeNotifications,
  prefetchCategoriesQuery,
  prefetchManufacturersQuery,
  prefetchProductQuery,
  prefetchProductsQuery,
  setProductQueryData,
  setProductsListQueryData,
  useCustomerAiConfigQuery,
  useNotificationsQuery,
  useOffersQuery,
} from '../../queries/customerQueries'
import { getCategoryName } from '../../utils/categoryNames'
import { getProductThumbnail, handleImageFallback } from '../../utils/imageUrl'
import { getLocalizedOffer, getOfferTimeLeft } from '../../utils/offerDisplay'
import { getProductPath, getProductRouteKey } from '../../utils/productRouting'
import { date } from '../../utils/formatters'
import { getCustomerNotificationLink, getCustomerNotificationMessage, getCustomerNotificationTitle } from '../../utils/customerNotificationDisplay'
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications'
import CustomerLogo from './CustomerLogo'

export default function CustomerHeader() {
  const { customer, loading: authLoading, logout } = useCustomerAuth()
  const { cartCount, wishlistCount } = useStorefront()
  const { language, setLanguage, isBangla } = useLanguage()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const headerRef = useRef(null)
  const searchContainerRef = useRef(null)
  const accountMenuRef = useRef(null)
  const notificationMenuRef = useRef(null)
  const quickLinksMenuRef = useRef(null)
  const searchRequestRef = useRef(0)
  const offerBarHiddenRef = useRef(false)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [aiSearchResult, setAiSearchResult] = useState(null)
  const [isAiSearching, setIsAiSearching] = useState(false)
  const [aiSearchError, setAiSearchError] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false)
  const [isQuickLinksMenuOpen, setIsQuickLinksMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const offersQuery = useOffersQuery()
  const aiConfigQuery = useCustomerAiConfigQuery()
  const aiSmartSearchEnabled = Boolean(aiConfigQuery.data?.features?.smart_search)
  const offerRecords = offersQuery.data || []
  const offerScope = getOfferPricingSignature(offerRecords)
  const [isOfferBarHidden, setIsOfferBarHidden] = useState(false)
  const [nowTick, setNowTick] = useState(0)
  const trimmedSearch = search.trim()
  const cachedSearchResults =
    trimmedSearch.length >= 2
      ? queryClient.getQueryData(customerQueryKeys.products({ search: trimmedSearch, per_page: 6 }, offerScope))?.data?.slice(0, 6)
        || []
      : []
  const visibleSearchResults = searchResults.length > 0 ? searchResults : cachedSearchResults
  const isAuthPending = authLoading && !customer
  const customerToken = typeof window !== 'undefined' ? window.localStorage.getItem('customer_token') : null
  const notificationsQuery = useNotificationsQuery({
    enabled: Boolean(customer?.id && customerToken),
    staleTime: 1000 * 30,
  })
  const notifications = useMemo(
    () => (customer ? normalizeNotifications(notificationsQuery.data) : []),
    [customer, notificationsQuery.data],
  )
  const locale = isBangla ? 'bn-BD' : 'en-US'
  const unreadNotificationCount = notifications.filter((item) => item.status !== 'read').length
  const latestNotifications = notifications.slice(0, 5)

  const handleRealtimeNotification = useCallback(
    (notification) => {
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.notifications })
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.orders })
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.returns })
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.supportTickets })

      if (notification?.title) {
        toast.success(notification.title)
      }
    },
    [queryClient],
  )

  useRealtimeNotifications({
    type: 'customer',
    id: customer?.id,
    token: customerToken,
    enabled: Boolean(customer?.id && customerToken),
    onNotification: handleRealtimeNotification,
  })

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick((current) => current + 1), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let frameId = 0

    const updateOfferBar = () => {
      const shouldHide = offerBarHiddenRef.current
        ? window.scrollY > 4
        : window.scrollY > 28

      if (shouldHide !== offerBarHiddenRef.current) {
        offerBarHiddenRef.current = shouldHide
        setIsOfferBarHidden(shouldHide)
      }
    }

    const handleScroll = () => {
      if (frameId) return
      frameId = window.requestAnimationFrame(() => {
        frameId = 0
        updateOfferBar()
      })
    }

    updateOfferBar()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const closeMenus = () => {
    setIsAccountMenuOpen(false)
    setIsNotificationMenuOpen(false)
    setIsQuickLinksMenuOpen(false)
    setIsMobileMenuOpen(false)
    setIsSearchOpen(false)
  }

  const signOut = async () => {
    closeMenus()
    await logout()
    navigate('/')
  }

  const prefetchProducts = () => {
    prefetchProductsQuery(queryClient, { page: 1 }, offerScope)
    prefetchCategoriesQuery(queryClient)
    prefetchManufacturersQuery(queryClient)
  }

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        setIsMobileMenuOpen(false)
      }

      if (!searchContainerRef.current?.contains(event.target)) {
        setIsSearchOpen(false)
      }

      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false)
      }

      if (!notificationMenuRef.current?.contains(event.target)) {
        setIsNotificationMenuOpen(false)
      }

      if (!quickLinksMenuRef.current?.contains(event.target)) {
        setIsQuickLinksMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  useEffect(() => {
    if (trimmedSearch.length < 2) {
      return undefined
    }

    const params = { search: trimmedSearch, per_page: 6 }
    const requestId = searchRequestRef.current + 1
    searchRequestRef.current = requestId

    const timeoutId = window.setTimeout(async () => {
      try {
        const payload = await queryClient.fetchQuery({
          queryKey: customerQueryKeys.products(params, offerScope),
          queryFn: () => productApi.list(params, { cacheScope: offerScope }).then((response) => response.data.data),
          staleTime: 1000 * 30,
        })

        if (searchRequestRef.current !== requestId) {
          return
        }

        setProductsListQueryData(queryClient, params, payload, offerScope)
        setSearchResults(payload?.data || [])
        setIsSearchOpen(true)
      } catch {
        if (searchRequestRef.current === requestId) {
          setSearchResults([])
        }
      } finally {
        if (searchRequestRef.current === requestId) {
          setIsSearching(false)
        }
      }
    }, 220)

    return () => window.clearTimeout(timeoutId)
  }, [offerScope, trimmedSearch])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const query = search.trim()
    closeMenus()
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products')
  }

  const handleAiSearch = async () => {
    const query = search.trim()
    if (query.length < 2 || isAiSearching || !aiSmartSearchEnabled) return

    setIsSearchOpen(true)
    setIsAiSearching(true)
    setAiSearchError('')

    try {
      const response = await productApi.aiSearch(query, 8)
      const payload = response.data?.data || null

      setAiSearchResult(payload)

      if (payload?.products?.length) {
        payload.products.forEach((product) => setProductQueryData(queryClient, product, offerScope))
      }
    } catch (error) {
      setAiSearchResult(null)
      setAiSearchError(error?.response?.data?.message || t('AI সার্চ এখন পাওয়া যাচ্ছে না।', 'AI search is not available right now.'))
    } finally {
      setIsAiSearching(false)
    }
  }

  const handleSearchFocus = () => {
    prefetchProducts()
    setIsMobileMenuOpen(false)

    if (trimmedSearch) {
      setIsSearchOpen(true)
    }
  }

  const handleSearchChange = (event) => {
    const nextSearch = event.target.value
    const nextTrimmed = nextSearch.trim()

    setSearch(nextSearch)
    setSearchResults([])
    setAiSearchResult(null)
    setAiSearchError('')

    if (!nextTrimmed) {
      setIsSearchOpen(false)
      setIsSearching(false)
      return
    }

    if (nextTrimmed.length < 2) {
      setIsSearchOpen(true)
      setIsSearching(false)
      return
    }

    setIsSearchOpen(true)
    setIsSearching(true)
  }

  const handleSearchResultClick = (product) => {
    setProductQueryData(queryClient, product, offerScope)
    closeMenus()
    navigate(getProductPath(product), { state: { product } })
  }

  const markNotificationRead = async (notification) => {
    closeMenus()

    if (notification?.status !== 'read') {
      try {
        await notificationApi.read(notification.id)
        markNotificationReadInQueryData(queryClient, notification.id)
      } catch {
        queryClient.invalidateQueries({ queryKey: customerQueryKeys.notifications })
      }
    }

    navigate(getCustomerNotificationLink(notification) || '/notifications')
  }

  const trackOrdersTo = customer ? '/orders' : '/track-order'
  const t = (bn, en) => (isBangla ? bn : en)
  const liveOffers = offerRecords.filter((offer) => getOfferTimeLeft(offer.ends_at)?.expired !== true)
  const activeOffer = liveOffers.find((offer) => offer.show_in_nav) || liveOffers[0] || offerRecords[0]
  const offerBar = activeOffer ? getLocalizedOffer(activeOffer, isBangla) : null
  const offerTimeLeft = nowTick >= 0 ? getOfferTimeLeft(offerBar?.endsAt) : null
  const customerName = customer?.full_name?.trim() || t('সাইন ইন', 'Sign in')
  const displayCustomerName = customerName.length > 12 ? `${customerName.slice(0, 12)}...` : customerName
  const avatarName = customer?.full_name?.trim() || t('গেস্ট', 'Guest')
  const nav = [
    ['/', t('হোম', 'Home')],
    ['/products', t('পণ্য', 'Products')],
    ['/offers', t('অফার', 'Offers')],
    ['/prescriptions', t('প্রেসক্রিপশন আপলোড', 'Upload Prescription')],
    ['/orders', t('অর্ডার', 'Orders')],
    ['/account', t('অ্যাকাউন্ট', 'Account')],
    ['/support', t('সাপোর্ট সেন্টার', 'Support Center')],
  ]
  const subNav = [
    ['/', t('হোম', 'Home')],
    ['/products', t('পণ্য', 'Products')],
    ['/offers', t('অফার', 'Offers')],
    ['/track-order', t('ট্র্যাক অর্ডার', 'Track Order')],
    ['/faq', t('জিজ্ঞাসা', 'FAQ')],
  ]
  const quickTileLinks = [
    { to: trackOrdersTo, label: t('ট্র্যাক অর্ডার', 'Track order'), icon: FiTruck, count: 0 },
    { to: '/wishlist', label: t('উইশলিস্ট', 'Wishlist'), icon: FiHeart, count: wishlistCount },
  ]

  return (
    <header ref={headerRef} className="sticky top-0 z-50 border-b border-slate-200 bg-[#e7f8f6]">
      {offerBar ? (
        <div className={`border-b border-[#9de8e1]/35 bg-[linear-gradient(90deg,#0e6574,#13b8b0)] text-white shadow-[0_10px_30px_-26px_rgba(14,101,116,0.9)] transition-[max-height,opacity,transform] duration-200 ease-out ${isOfferBarHidden ? 'max-h-0 -translate-y-2 overflow-hidden opacity-0' : 'max-h-12 translate-y-0 opacity-100'}`}>
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-2 px-4 py-2 text-xs font-semibold sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:text-sm lg:px-8">
            <div className="flex min-w-0 items-center gap-2">
              <span className="min-w-0 truncate text-cyan-50">{offerBar.title}</span>
             
              <Link to="/offers" onClick={closeMenus} className="shrink-0 underline text-cyan-200 hover:text-white">
                {t('অফার দেখুন', 'Explore offers')}
              </Link>
            </div>
            <div className="hidden items-center gap-1.5 self-end sm:self-auto xl:flex">
              <span className="text-sm text-gray-700 shrink-0">{t('অফার শেষ হতে', 'Offer ends in')}: </span>
              <span className="text-sm text-gray-600">
                {offerTimeLeft?.label || '00:00:00'}
              </span>
            </div>
              
          </div>          
        </div>
      ) : null}
      <div className="relative z-50 border-b border-slate-200/80 bg-[linear-gradient(180deg,#f4fffd_0%,#e7f8f6_100%)] backdrop-blur supports-backdrop-filter:bg-[#f4fffd]/78">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:gap-4 lg:px-8 lg:py-4">
          <Link to="/" onClick={closeMenus} className="order-1 shrink-0 lg:order-1" aria-label="My Pharmecy home">
            <CustomerLogo />
          </Link>

          <div className="order-2 ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:hidden">
            {customer ? (
              <HeaderActionLink to="/notifications" label={t('নোটিফিকেশন', 'Notifications')} count={unreadNotificationCount} icon={FiBell} mobileOnly onClick={closeMenus} isBangla={isBangla} />
            ) : null}
            <HeaderActionLink to="/cart" label={t('কার্ট', 'Cart')} count={cartCount} icon={FiShoppingCart} mobileOnly onClick={closeMenus} isBangla={isBangla} />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center border border-slate-200 bg-[#f4fffd] text-slate-700 shadow-sm"
              aria-label={t('মেনু টগল করুন', 'Toggle navigation menu')}
            >
              {isMobileMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
            </button>
          </div>

          <form
            ref={searchContainerRef}
            onSubmit={handleSearchSubmit}
            className={`relative order-3 min-w-0 basis-full lg:order-2 lg:flex-1 lg:basis-auto lg:mx-3 xl:mx-4 ${
              isMobileMenuOpen ? 'hidden lg:block' : ''
            }`}
            role="search"
          >
            <div className="group flex h-11 items-center border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#e7f8f6)] pl-3 pr-2 shadow-[0_16px_35px_-28px_rgba(15,23,42,0.42)] transition focus-within:border-[#8fd8d2] focus-within:shadow-[0_24px_45px_-30px_rgba(19,184,176,0.45)] sm:h-12 sm:pl-4 lg:h-12.5">
              <FiSearch className="h-4 w-4 shrink-0 text-[#0e6574] sm:h-5 sm:w-5 lg:hidden" />
              <input
                value={search}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                className="min-w-0 flex-1 bg-transparent px-2 text-[14px] font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 sm:text-[15px] lg:px-1.5"
                placeholder={t('পণ্য, জেনেরিক বা ব্র্যান্ড খুঁজুন', 'Search product, generic, or brand')}
              />
              <button
                type="submit"
                onMouseEnter={prefetchProducts}
                className="inline-flex h-8.5 items-center gap-2 border border-[#13b8b0] bg-[#13b8b0] px-3 text-[13px] font-semibold text-white transition hover:border-[#0ea8a1] hover:bg-[#0ea8a1] sm:h-9.5 sm:px-4 sm:text-[14px]"
              >
                <FiSearch className="h-4 w-4" />
              </button>
            </div>

            {isSearchOpen && trimmedSearch ? (
              <div className="absolute left-0 right-0 top-full z-90 mt-2 overflow-hidden border border-slate-200 bg-[#f4fffd] shadow-[0_30px_60px_-30px_rgba(15,23,42,0.32)]">
                {trimmedSearch.length < 2 ? (
                  <div className="px-4 py-3 text-sm text-slate-500">
                    {t('ফলাফলের জন্য কমপক্ষে ২টি অক্ষর লিখুন।', 'Type at least 2 characters to see results.')}
                  </div>
                ) : (
                  <>
                    {/* <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {t('সার্চ ফলাফল', 'Live results')}
                      </div>
                      {isSearching ? (
                        <div className="flex items-center gap-2 text-xs font-medium text-[#0e6574]">
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#13b8b0]/25 border-t-[#13b8b0]" />
                          {t('খোঁজা হচ্ছে...', 'Searching...')}
                        </div>
                      ) : null}
                    </div> */}

                    {visibleSearchResults.length > 0 ? (
                      <div className="max-h-85 overflow-y-auto">
                        {visibleSearchResults.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleSearchResultClick(product)}
                            onMouseEnter={() => prefetchProductQuery(queryClient, getProductRouteKey(product), offerScope)}
                            className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-[#e7f8f6]"
                          >
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-[#e7f8f6]">
                              {getProductThumbnail(product) ? (
                                <OptimizedImage src={getProductThumbnail(product)} alt={product.product_name} className="h-full w-full object-cover" onError={handleImageFallback} />
                              ) : (
                                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                  {product.requires_prescription ? 'Rx' : 'OTC'}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-slate-950">{product.product_name}</div>
                              <div className="mt-1 truncate text-xs text-slate-500">
                                {product.manufacturer?.manufacturer_name || getCategoryName(product.category, isBangla, t('স্বাস্থ্যসেবা', 'Healthcare'))}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="text-sm font-bold text-[#0e6574]">{formatPrice(product.display_price)}</div>
                              <div className="text-[11px] text-slate-400">{t('দেখুন', 'Open')}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : !isSearching ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-500">
                        {t('কোনো মিল পাওয়া যায়নি।', 'No matching products found.')}
                      </div>
                    ) : null}

                    {aiSmartSearchEnabled ? (
                    <div className="border-t border-slate-100 bg-white/70 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm font-semibold text-[#0e6574]">
                            <FiCpu className="h-4 w-4" />
                            {t('AI স্মার্ট সার্চ', 'AI smart search')}
                          </div>
                          <div className="mt-1 text-xs leading-5 text-slate-500">
                            {t('লক্ষণ বা সাধারণ ভাষায় লেখা সার্চকে পণ্যের সাথে মিলিয়ে দেখুন।', 'Match natural language or symptom-style searches to products.')}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAiSearch}
                          disabled={isAiSearching || trimmedSearch.length < 2}
                          className="inline-flex items-center gap-2 border border-[#13b8b0] bg-[#13b8b0] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#0ea8a1] hover:bg-[#0ea8a1] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500"
                        >
                          {isAiSearching ? t('খোঁজা হচ্ছে...', 'Searching...') : t('AI দিয়ে খুঁজুন', 'Search with AI')}
                        </button>
                      </div>

                      {aiSearchError ? (
                        <div className="mt-3 border border-rose-100 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">
                          {aiSearchError}
                        </div>
                      ) : null}

                      {aiSearchResult ? (
                        <div className="mt-3 border border-[#b7d5d2] bg-[#f4fffd]">
                          <div className="border-b border-[#d7ebe8] px-3 py-2 text-xs leading-5 text-slate-600">
                            <span className="font-semibold text-[#0e6574]">{aiSearchResult.intent || trimmedSearch}</span>
                            {aiSearchResult.note ? <span> - {aiSearchResult.note}</span> : null}
                          </div>
                          {aiSearchResult.products?.length ? (
                            <div className="max-h-72 overflow-y-auto">
                              {aiSearchResult.products.map((product) => (
                                <button
                                  key={`ai-${product.id}`}
                                  type="button"
                                  onClick={() => handleSearchResultClick(product)}
                                  className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-3 text-left transition last:border-b-0 hover:bg-[#e7f8f6]"
                                >
                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-[#e7f8f6]">
                                    {getProductThumbnail(product) ? (
                                      <OptimizedImage src={getProductThumbnail(product)} alt={product.product_name} className="h-full w-full object-cover" onError={handleImageFallback} />
                                    ) : (
                                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                        {product.requires_prescription ? 'Rx' : 'OTC'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-semibold text-slate-950">{product.product_name}</div>
                                    <div className="mt-1 truncate text-xs text-slate-500">
                                      {product.generic_name || product.manufacturer?.manufacturer_name || getCategoryName(product.category, isBangla)}
                                    </div>
                                  </div>
                                  <div className="shrink-0 text-sm font-bold text-[#0e6574]">{formatPrice(product.display_price)}</div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="px-3 py-4 text-center text-xs text-slate-500">
                              {t('AI কোনো মিল পাওয়া পণ্য খুঁজে পায়নি।', 'AI did not find matching products.')}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                    ) : null}

                    <button
                      type="submit"
                      className="flex w-full items-center justify-between border-t border-slate-100 bg-[#f4fffd] px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#e7f8f6] hover:text-[#0e6574]"
                    >
                      <span>{t('সব ফলাফল দেখুন', 'View all results')}</span>
                      <FiSearch className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </form>

          <div className="order-4 hidden shrink-0 items-center gap-3 lg:order-3 lg:flex">
            <div className="flex items-center border border-slate-200 bg-[#e7f8f6]/90 p-1 shadow-[0_18px_38px_-32px_rgba(15,23,42,0.3)]">
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`px-3 py-2 text-[12px] font-semibold transition ${language === 'bn' ? 'bg-[#13b8b0] text-white' : 'text-slate-600 hover:bg-[#f4fffd]'}`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-2 text-[12px] font-semibold transition ${language === 'en' ? 'bg-[#13b8b0] text-white' : 'text-slate-600 hover:bg-[#f4fffd]'}`}
              >
                En
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div ref={quickLinksMenuRef} className="hidden">
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickLinksMenuOpen((current) => !current)
                    setIsNotificationMenuOpen(false)
                    setIsAccountMenuOpen(false)
                    setIsMobileMenuOpen(false)
                  }}
                  className="inline-flex h-11 items-center gap-2 border border-slate-200 bg-[#f4fffd] px-3 text-[13px] font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-[#e7f8f6]"
                  aria-expanded={isQuickLinksMenuOpen}
                  aria-label={t('দ্রুত লিংক', 'Quick links')}
                >
                  <FiMenu className="h-4 w-4 text-[#0f6475]" />
                  <span>{t('Tiles', 'Tiles')}</span>
                  <FiChevronDown className={`h-4 w-4 text-slate-400 transition ${isQuickLinksMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isQuickLinksMenuOpen ? (
                  <div className="absolute right-0 top-full mt-3 w-66 overflow-hidden border border-slate-200 bg-[#f4fffd] shadow-[0_30px_60px_-36px_rgba(15,23,42,0.38)]">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <div className="text-sm font-semibold text-slate-950">{t('দ্রুত লিংক', 'Quick links')}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 p-3">
                      {quickTileLinks.map(({ to, label, icon: Icon, count }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={closeMenus}
                          className="relative flex min-h-21 flex-col items-start justify-between border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-[#13b8b0] hover:bg-[#eefbfa]"
                        >
                          {count > 0 ? (
                            <span className="absolute right-2 top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#13b8b0] px-1.5 text-[11px] font-bold leading-5 text-white">
                              {formatCounterBadge(count, locale)}
                            </span>
                          ) : null}
                          <span className="inline-flex h-9 w-9 items-center justify-center bg-[#eefbfa] text-[#0f6475]">
                            <Icon className="h-4.5 w-4.5" />
                          </span>
                          <span className="text-sm font-semibold leading-5 text-slate-900">{label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="hidden xl:flex">
                <HeaderActionLink to={trackOrdersTo} icon={FiTruck} compact onClick={closeMenus} isBangla={isBangla} />
              </div>
              {customer ? (
                <div ref={notificationMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotificationMenuOpen((current) => !current)
                      setIsAccountMenuOpen(false)
                    }}
                    className="relative inline-flex h-11 items-center justify-center border border-transparent bg-[#f4fffd] px-3 text-[#132238] shadow-sm transition hover:border-slate-200 hover:bg-[#e7f8f6]"
                    aria-label={t('নোটিফিকেশন', 'Notifications')}
                  >
                    <FiBell className="h-5 w-5 shrink-0 text-[#0f6475]" />
                    {unreadNotificationCount > 0 ? (
                      <span className="absolute -right-1.5 -top-1.5 inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-full border border-white/85 bg-red-600 px-1.5 text-[12px] font-extrabold leading-none text-white shadow-[0_14px_28px_-12px_rgba(220,38,38,0.78)] ring-2 ring-[#e7f8f6]">
                        {formatCounterBadge(unreadNotificationCount, locale)}
                      </span>
                    ) : null}
                  </button>

                  {isNotificationMenuOpen ? (
                    <div className="absolute right-0 top-full mt-3 w-[20rem] overflow-hidden border border-slate-200 bg-[#f4fffd] shadow-[0_30px_60px_-36px_rgba(15,23,42,0.38)] xl:w-88">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div className="text-sm font-semibold text-slate-950">{t('নোটিফিকেশন', 'Notifications')}</div>
                        <Link to="/notifications" onClick={closeMenus} className="text-xs font-semibold text-[#0e6574] hover:underline">
                          {t('সব দেখুন', 'View all')}
                        </Link>
                      </div>
                      <div className="max-h-96 overflow-y-auto p-2">
                        {notificationsQuery.isLoading ? (
                          <div className="px-3 py-4 text-sm text-slate-500">{t('লোড হচ্ছে...', 'Loading...')}</div>
                        ) : latestNotifications.length ? (
                          latestNotifications.map((notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() => markNotificationRead(notification)}
                              className={`w-full border-b border-slate-100 px-3 py-3 text-left transition last:border-b-0 hover:bg-[#e7f8f6] ${notification.status !== 'read' ? 'bg-white' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-950">{getCustomerNotificationTitle(notification, isBangla)}</p>
                                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{getCustomerNotificationMessage(notification, isBangla)}</p>
                                  <p className="mt-2 text-[11px] text-slate-400">{date(notification.created_at)}</p>
                                </div>
                                {notification.status !== 'read' ? (
                                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#13b8b0]" />
                                ) : null}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-6 text-center text-sm text-slate-500">{t('এখনও কোনো নোটিফিকেশন নেই।', 'No notifications yet.')}</div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="hidden xl:flex">
                <HeaderActionLink to="/wishlist" count={wishlistCount} icon={FiHeart} compact onClick={closeMenus} isBangla={isBangla} />
              </div>
              <HeaderActionLink to="/cart" count={cartCount} icon={FiShoppingCart} compact onClick={closeMenus} isBangla={isBangla} />
            </div>

            {customer ? (
              <div ref={accountMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen((current) => !current)}
                  className="flex items-center gap-1 border border-slate-200 bg-[#f4fffd] px-3 py-2 text-left shadow-[0_18px_38px_-32px_rgba(15,23,42,0.3)] transition hover:border-slate-300"
                >
                  <UserAvatar customer={customer} fallbackName={avatarName} />
                  <div className="min-w-0 max-w-24 text-right xl:max-w-37">
                    <div className="truncate text-[15px] font-bold text-slate-950">{displayCustomerName}</div>
                  </div>
                  
                  <FiChevronDown className={`h-4 w-4 text-slate-400 transition ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAccountMenuOpen ? (
                  <div className="absolute right-0 top-full mt-3 w-56 overflow-hidden border border-slate-200 bg-[#f4fffd] shadow-[0_30px_60px_-36px_rgba(15,23,42,0.38)] xl:w-60">
                    <div className="p-2">
                      <AccountMenuLink to="/account" label={t('অ্যাকাউন্ট', 'Account')} icon={FiUser} onClick={closeMenus} />
                      <AccountMenuLink to="/account/password" label={t('পাসওয়ার্ড পরিবর্তন', 'Change password')} icon={FiKey} onClick={closeMenus} />
                      <AccountMenuLink to="/orders" label={t('আমার অর্ডার', 'My orders')} icon={FiPackage} onClick={closeMenus} />                      
                      <AccountMenuLink to="/prescriptions" label={t('প্রেসক্রিপশন', 'Prescriptions')} icon={FiFileText} onClick={closeMenus} />
                      <AccountMenuLink to="/support" label={t('সাপোর্ট সেন্টার', 'Support Center')} icon={FiMessageSquare} onClick={closeMenus} />
                      <button
                        type="button"
                        onClick={signOut}
                        className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        <FiLogOut className="h-4 w-4" />
                        {t('লগআউট', 'Logout')}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : isAuthPending ? (
              <div className="flex items-center gap-3 border border-slate-200 bg-[#f4fffd] px-3 py-2.5 shadow-[0_18px_38px_-32px_rgba(15,23,42,0.3)]">
                <span className="inline-flex h-9 w-9 animate-pulse rounded-full border border-slate-200 bg-slate-100" />
                <div className="w-24">
                  <div className="h-3 animate-pulse bg-slate-100" />
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={closeMenus}
                className="flex items-center gap-3 border border-slate-200 bg-[#f4fffd] px-3 py-2.5 text-left shadow-[0_18px_38px_-32px_rgba(15,23,42,0.3)] transition hover:border-slate-300"
              >
                <div className="min-w-0 text-right">
                  <div className="truncate text-[15px] font-bold text-slate-950">{t('সাইন ইন', 'Sign in')}</div>
                </div>
              </Link>
            )}
          </div>
        </div>

        <div className="hidden border-t border-slate-100 bg-[#e7f8f6] lg:block">
          <nav className="mx-auto flex max-w-7xl items-center justify-center gap-6 overflow-x-auto px-4 py-2 text-sm sm:px-6 lg:px-8" aria-label="Storefront links">
            {subNav.map(([to, label]) => {
              const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`whitespace-nowrap border px-3 py-1.5 font-medium transition ${
                    isActive
                      ? 'border-[#13b8b0] bg-[#eefbfa] text-[#0e6574]'
                      : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-[#f4fffd] hover:text-slate-950'
                  }`}
                >
                  {label}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="absolute inset-x-0 top-full z-70 border-t border-[#d4dde7] bg-[#f4fffd] shadow-[0_24px_60px_-32px_rgba(15,23,42,0.38)] lg:hidden">
          <div className="mx-auto max-w-7xl space-y-5 px-4 py-4 sm:px-6">
            <div className="space-y-4 border-b border-slate-100 pb-4">
              {customer ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <UserAvatar customer={customer} fallbackName={avatarName} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-950">{displayCustomerName}</div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        to="/account"
                        onClick={closeMenus}
                        className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-white text-[#0f6475] transition hover:border-[#13b8b0] hover:bg-[#eefbfa]"
                        aria-label={t('প্রোফাইল', 'Profile')}
                        title={t('প্রোফাইল', 'Profile')}
                      >
                        <FiUser className="h-4.5 w-4.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={signOut}
                        className="inline-flex h-10 w-10 items-center justify-center border border-rose-200 bg-white text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                        aria-label={t('লগআউট', 'Logout')}
                        title={t('লগআউট', 'Logout')}
                      >
                        <FiLogOut className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : isAuthPending ? (
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 animate-pulse rounded-full border border-slate-200 bg-slate-100" />
                  <div className="w-28">
                    <div className="h-3 animate-pulse bg-slate-100" />
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMenus}
                  className="inline-flex w-full items-center justify-center border border-slate-200 bg-[#f4fffd] px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
                >
                  {t('সাইন ইন', 'Sign in')}
                </Link>
              )}
            </div>

            <div className="flex items-stretch gap-2">
              <Link
                to={trackOrdersTo}
                onClick={closeMenus}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center border border-slate-200 bg-white text-[#0f6475] transition hover:border-[#13b8b0] hover:bg-[#eefbfa]"
                aria-label={t('ট্র্যাক অর্ডার', 'Track order')}
                title={t('ট্র্যাক অর্ডার', 'Track order')}
              >
                <FiTruck className="h-5 w-5" />
              </Link>
              <Link
                to="/wishlist"
                onClick={closeMenus}
                className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center border border-slate-200 bg-white text-[#0f6475] transition hover:border-[#13b8b0] hover:bg-[#eefbfa]"
                aria-label={t('ওয়িশলিস্ট', 'Wishlist')}
                title={t('ওয়িশলিস্ট', 'Wishlist')}
              >
                <FiHeart className="h-5 w-5" />
                {wishlistCount > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-[#13b8b0] px-1.5 text-[11px] font-bold leading-5 text-white">
                    {formatCounterBadge(wishlistCount, locale)}
                  </span>
                ) : null}
              </Link>
              <div className="flex h-12 min-w-0 flex-1 items-center border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`flex-1 px-3 py-2 text-sm font-semibold transition ${language === 'bn' ? 'bg-[#13b8b0] text-white' : 'text-slate-600 hover:bg-[#eefbfa]'}`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`flex-1 px-3 py-2 text-sm font-semibold transition ${language === 'en' ? 'bg-[#13b8b0] text-white' : 'text-slate-600 hover:bg-[#eefbfa]'}`}
                >
                  En
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              {subNav.map(([to, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={closeMenus}
                  onMouseEnter={to === '/products' ? prefetchProducts : undefined}
                  onFocus={to === '/products' ? prefetchProducts : undefined}
                  className={({ isActive }) =>
                    `border px-4 py-3 text-center text-sm font-medium transition ${
                      isActive
                        ? 'border-[#13b8b0] bg-[#eefbfa] text-[#0e6574]'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-[#e7f8f6]'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}

function HeaderActionLink({ to, label, count, icon: Icon, mobileOnly = false, compact = false, onClick, isBangla = false }) {
  const badgeClass = to === '/notifications'
    ? 'bg-red-600 shadow-[0_14px_28px_-12px_rgba(220,38,38,0.78)]'
    : 'bg-[linear-gradient(135deg,#0f766e,#13b8b0)] shadow-[0_14px_28px_-12px_rgba(15,118,110,0.9)]'
  const badgeLocale = isBangla ? 'bn-BD' : 'en-US'

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`relative inline-flex items-center text-[#132238] transition ${
        mobileOnly
          ? 'h-10 w-10 justify-center border border-slate-200 bg-[#f4fffd] shadow-sm hover:border-slate-300 sm:h-11 sm:w-11'
          : compact
            ? 'h-11 gap-2 border border-transparent bg-[#f4fffd] px-3 shadow-sm hover:border-slate-200 hover:bg-[#e7f8f6]'
            : 'gap-2 hover:opacity-80'
      }`}
      aria-label={label || 'Cart'}
    >
      <Icon className={`${mobileOnly || compact ? 'h-5 w-5' : 'h-6 w-6'} shrink-0 text-[#0f6475]`} />
      {label && !mobileOnly ? (
        <span className={`${compact ? 'hidden text-[13px] font-semibold text-slate-900 xl:inline' : 'text-[15px] font-semibold text-slate-950'}`}>
          {label}
        </span>
      ) : null}
      {count > 0 ? (
        <span
          className={`absolute inline-flex min-w-5.5 items-center justify-center rounded-full border border-white/85 px-1.5 text-[12px] font-extrabold leading-none text-white ring-2 ring-[#e7f8f6] ${badgeClass} ${
            mobileOnly ? '-right-1.5 -top-1.5 h-5.5' : compact ? '-right-1.5 -top-1.5 h-5.5' : 'left-4 top-0 h-5.5'
          }`}
        >
          {formatCounterBadge(count, badgeLocale)}
        </span>
      ) : null}
    </Link>
  )
}

function AccountMenuLink({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink to={to} onClick={onClick} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950">
      <Icon className="h-4 w-4 text-slate-400" />
      {label}
    </NavLink>
  )
}

function UserAvatar({ customer, fallbackName }) {
  const avatar = customer?.avatar?.trim()
  const name = fallbackName || customer?.full_name || 'Guest'

  if (avatar) {
    return <img src={avatar} alt={name} className="h-9 w-9 rounded-full border border-slate-200 object-cover" />
  }

  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#dfe8ef)] text-sm font-bold uppercase text-slate-700">
      {initials(name)}
    </span>
  )
}

function formatCounterBadge(count, locale = 'en-US') {
  const total = Number(count || 0)

  if (total > 99) {
    return `${new Intl.NumberFormat(locale).format(99)}+`
  }

  return new Intl.NumberFormat(locale).format(total)
}

function formatPrice(value) {
  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return '৳0'
  }

  return `৳${amount.toLocaleString()}`
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

