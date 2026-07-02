import { useQuery } from '@tanstack/react-query'
import { addressApi } from '../api/addressApi'
import { bannerImageApi, readCachedBannerImages } from '../api/bannerImageApi'
import { heroSlideApi, readCachedHeroSlides } from '../api/heroSlideApi'
import { marketingPopupApi, readCachedMarketingPopup } from '../api/marketingPopupApi'
import { notificationApi } from '../api/notificationApi'
import { offerApi, readCachedOffers } from '../api/offerApi'
import { orderApi } from '../api/orderApi'
import { paymentMethodApi, readCachedPaymentMethods } from '../api/paymentMethodApi'
import { prescriptionApi } from '../api/prescriptionApi'
import { productApi } from '../api/productApi'
import { rewardApi } from '../api/rewardApi'
import { returnApi } from '../api/returnApi'
import { siteSettingsApi } from '../api/siteSettingsApi'
import { supportApi } from '../api/supportApi'

const FIVE_MINUTES = 1000 * 60 * 5
const THIRTY_MINUTES = 1000 * 60 * 30
const PRODUCT_LIST_STALE_TIME = 1000 * 30

export const customerQueryKeys = {
  products: (params = {}, offerScope = 'default') => ['products', params, offerScope],
  product: (idOrSlug, offerScope = 'default') => ['product', String(idOrSlug || ''), offerScope],
  categories: (params = {}) => ['categories', params],
  manufacturers: ['manufacturers'],
  heroSlides: ['hero-slides'],
  bannerImages: (params = { placement: 'homepage' }) => ['banner-images', params],
  siteSettings: ['site-settings'],
  offers: ['offers'],
  marketingPopup: ['marketing-popup'],
  paymentMethods: ['payment-methods'],
  customerAiConfig: ['customer', 'ai-config'],
  addresses: ['customer', 'addresses'],
  orders: ['customer', 'orders'],
  order: (id) => ['customer', 'orders', String(id || '')],
  orderTracking: (id) => ['customer', 'orders', String(id || ''), 'tracking'],
  notifications: ['customer', 'notifications'],
  prescriptions: ['customer', 'prescriptions'],
  prescription: (id) => ['customer', 'prescriptions', String(id || '')],
  returns: ['customer', 'returns'],
  return: (id) => ['customer', 'returns', String(id || '')],
  supportTickets: ['customer', 'support-tickets'],
  supportTicket: (id) => ['customer', 'support-tickets', String(id || '')],
  deliveryAreas: ['delivery-areas'],
  rewards: ['customer', 'rewards'],
}

export function setProductQueryData(queryClient, product, offerScope = 'default') {
  if (!queryClient || !product) return

  if (product.id != null) {
    queryClient.setQueryData(customerQueryKeys.product(product.id, offerScope), product)
  }

  if (product.slug) {
    queryClient.setQueryData(customerQueryKeys.product(product.slug, offerScope), product)
  }
}

export function setProductsListQueryData(queryClient, params = {}, payload = null, offerScope = 'default') {
  if (!queryClient || !payload) return

  queryClient.setQueryData(customerQueryKeys.products(params, offerScope), payload)
  ;(payload?.data || []).forEach((product) => setProductQueryData(queryClient, product, offerScope))
}

export function prefetchProductsQuery(queryClient, params = {}, offerScope = 'default') {
  if (!queryClient) return Promise.resolve(null)

  return queryClient.prefetchQuery({
    queryKey: customerQueryKeys.products(params, offerScope),
    queryFn: () => productApi.list(params, { cacheScope: offerScope }).then((response) => response.data.data),
    staleTime: PRODUCT_LIST_STALE_TIME,
    gcTime: THIRTY_MINUTES,
  })
}

export function prefetchProductQuery(queryClient, idOrSlug, offerScope = 'default') {
  if (!queryClient || !idOrSlug) return Promise.resolve(null)

  return queryClient.prefetchQuery({
    queryKey: customerQueryKeys.product(idOrSlug, offerScope),
    queryFn: () => productApi.show(idOrSlug, { cacheScope: offerScope }).then((response) => response.data.data),
    staleTime: PRODUCT_LIST_STALE_TIME,
    gcTime: THIRTY_MINUTES,
  })
}

export function prefetchCategoriesQuery(queryClient, params = {}) {
  if (!queryClient) return Promise.resolve(null)

  return queryClient.prefetchQuery({
    queryKey: customerQueryKeys.categories(params),
    queryFn: () => productApi.categories(params).then((response) => response.data.data || []),
    staleTime: THIRTY_MINUTES,
    gcTime: THIRTY_MINUTES,
  })
}

export function prefetchManufacturersQuery(queryClient) {
  if (!queryClient) return Promise.resolve(null)

  return queryClient.prefetchQuery({
    queryKey: customerQueryKeys.manufacturers,
    queryFn: () => productApi.manufacturers().then((response) => response.data.data || []),
    staleTime: THIRTY_MINUTES,
    gcTime: THIRTY_MINUTES,
  })
}

export function getOfferPricingSignature(offers = []) {
  const activeRules = offers
    .filter((offer) => offer?.status === 'active' && Number(offer.discount_value || 0) > 0)
    .map((offer) => ({
      id: offer.id,
      updated_at: offer.updated_at,
      discount_type: offer.discount_type || 'percent',
      discount_value: Number(offer.discount_value || 0),
      max_discount: offer.max_discount ?? null,
      applies_to: offer.applies_to || 'all',
      category_id: offer.category_id ?? null,
      manufacturer_id: offer.manufacturer_id ?? null,
      product_ids: offer.product_ids || [],
      starts_at: offer.starts_at || null,
      ends_at: offer.ends_at || null,
    }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))

  return activeRules.length ? JSON.stringify(activeRules) : 'no-active-offers'
}

function useOfferPricingScope() {
  const offersQuery = useOffersQuery()
  return getOfferPricingSignature(offersQuery.data || [])
}

export function useProductsQuery(params = {}, options = {}) {
  const offerScope = useOfferPricingScope()
  const { placeholderData, ...queryOptions } = options

  return useQuery({
    queryKey: customerQueryKeys.products(params, offerScope),
    queryFn: () => productApi.list(params, { cacheScope: offerScope }).then((response) => response.data.data),
    staleTime: PRODUCT_LIST_STALE_TIME,
    gcTime: THIRTY_MINUTES,
    placeholderData,
    ...queryOptions,
  })
}

export function useProductQuery(idOrSlug, options = {}) {
  const offerScope = useOfferPricingScope()

  return useQuery({
    queryKey: customerQueryKeys.product(idOrSlug, offerScope),
    queryFn: () => productApi.show(idOrSlug, { cacheScope: offerScope }).then((response) => response.data.data),
    enabled: Boolean(idOrSlug),
    ...options,
  })
}

export function useCategoriesQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.categories(params),
    queryFn: () => productApi.categories(params).then((response) => response.data.data || []),
    staleTime: THIRTY_MINUTES,
    gcTime: THIRTY_MINUTES,
    ...options,
  })
}

export function useManufacturersQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.manufacturers,
    queryFn: () => productApi.manufacturers().then((response) => response.data.data || []),
    staleTime: THIRTY_MINUTES,
    gcTime: THIRTY_MINUTES,
    ...options,
  })
}

export function useHeroSlidesQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.heroSlides,
    queryFn: () => heroSlideApi.list().then((response) => response.data.data || []),
    initialData: () => readCachedHeroSlides() || undefined,
    ...options,
  })
}

export function useBannerImagesQuery(params = { placement: 'homepage' }, options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.bannerImages(params),
    queryFn: () => bannerImageApi.list(params).then((response) => response.data.data || []),
    initialData: () => readCachedBannerImages() || undefined,
    ...options,
  })
}

export function useSiteSettingsQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.siteSettings,
    queryFn: () => siteSettingsApi.show().then((response) => response.data.data),
    staleTime: THIRTY_MINUTES,
    gcTime: THIRTY_MINUTES,
    ...options,
  })
}

export function useOffersQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.offers,
    queryFn: () => offerApi.list().then((response) => response.data.data || []),
    initialData: () => readCachedOffers() || undefined,
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
    ...options,
  })
}

export function useMarketingPopupQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.marketingPopup,
    queryFn: () => marketingPopupApi.show().then((response) => response.data.data || null),
    initialData: () => readCachedMarketingPopup() || undefined,
    ...options,
  })
}

export function usePaymentMethodsQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.paymentMethods,
    queryFn: () => paymentMethodApi.list().then((response) => response.data.data || []),
    initialData: () => readCachedPaymentMethods() || undefined,
    ...options,
  })
}

export function useCustomerAiConfigQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.customerAiConfig,
    queryFn: () => productApi.aiConfig().then((response) => response.data.data || { enabled: false, features: {} }),
    staleTime: 1000 * 15,
    gcTime: THIRTY_MINUTES,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 1000 * 60,
    ...options,
  })
}

export function useAddressesQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.addresses,
    queryFn: () => addressApi.list().then((response) => response.data.data?.data || response.data.data || []),
    ...options,
  })
}

export function useOrdersQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.orders,
    queryFn: () => orderApi.list().then((response) => response.data.data?.data || response.data.data || []),
    ...options,
  })
}

export function useOrderQuery(id, options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.order(id),
    queryFn: () => orderApi.show(id).then((response) => response.data.data),
    enabled: Boolean(id),
    ...options,
  })
}

export function useOrderTrackingQuery(id, options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.orderTracking(id),
    queryFn: () => orderApi.tracking(id).then((response) => response.data.data),
    enabled: Boolean(id),
    ...options,
  })
}

export function normalizeNotifications(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  return []
}

export function setNotificationsQueryData(queryClient, payload, params = {}) {
  if (!queryClient) return

  queryClient.setQueryData([...customerQueryKeys.notifications, params], normalizeNotifications(payload))
}

export function markNotificationReadInQueryData(queryClient, notificationId, params = {}) {
  if (!queryClient) return

  queryClient.setQueryData([...customerQueryKeys.notifications, params], (current = []) => (
    normalizeNotifications(current).map((item) => (
      item.id === notificationId
        ? { ...item, status: 'read', read_at: item.read_at || new Date().toISOString() }
        : item
    ))
  ))
}

export function useNotificationsQuery(options = {}) {
  const { params = {}, ...queryOptions } = options

  return useQuery({
    queryKey: [...customerQueryKeys.notifications, params],
    queryFn: () => notificationApi.list(params).then((response) => normalizeNotifications(response.data?.data)),
    ...queryOptions,
  })
}

export function usePrescriptionsQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.prescriptions,
    queryFn: () => prescriptionApi.refreshList().then((response) => response.data.data?.data || response.data.data || []),
    initialData: () => prescriptionApi.getCachedList() || undefined,
    ...options,
  })
}

export function usePrescriptionQuery(id, options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.prescription(id),
    queryFn: () => prescriptionApi.show(id).then((response) => response.data.data),
    enabled: Boolean(id),
    ...options,
  })
}

export function useReturnsQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.returns,
    queryFn: () => returnApi.list().then((response) => response.data.data?.data || response.data.data || []),
    ...options,
  })
}

export function useReturnQuery(id, options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.return(id),
    queryFn: () => returnApi.show(id).then((response) => response.data.data),
    enabled: Boolean(id),
    ...options,
  })
}

export function useSupportTicketsQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.supportTickets,
    queryFn: () => supportApi.list().then((response) => response.data.data || []),
    ...options,
  })
}

export function useSupportTicketQuery(id, options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.supportTicket(id),
    queryFn: () => supportApi.show(id).then((response) => response.data.data),
    enabled: Boolean(id),
    ...options,
  })
}

export function useDeliveryAreasQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.deliveryAreas,
    queryFn: () => orderApi.deliveryAreas().then((response) => response.data.data || []),
    ...options,
  })
}

export function useRewardsQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.rewards,
    queryFn: () => rewardApi.summary().then((response) => response.data.data),
    ...options,
  })
}
