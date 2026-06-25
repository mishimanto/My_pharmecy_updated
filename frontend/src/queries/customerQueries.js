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
import { returnApi } from '../api/returnApi'
import { siteSettingsApi } from '../api/siteSettingsApi'
import { supportApi } from '../api/supportApi'

const FIVE_MINUTES = 1000 * 60 * 5
const THIRTY_MINUTES = 1000 * 60 * 30

export const customerQueryKeys = {
  products: (params = {}, offerScope = 'default') => ['products', params, offerScope],
  product: (idOrSlug, offerScope = 'default') => ['product', String(idOrSlug || ''), offerScope],
  categories: ['categories'],
  manufacturers: ['manufacturers'],
  heroSlides: ['hero-slides'],
  bannerImages: (params = { placement: 'homepage' }) => ['banner-images', params],
  siteSettings: ['site-settings'],
  offers: ['offers'],
  marketingPopup: ['marketing-popup'],
  paymentMethods: ['payment-methods'],
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

  return useQuery({
    queryKey: customerQueryKeys.products(params, offerScope),
    queryFn: () => productApi.list(params, { cacheScope: offerScope }).then((response) => response.data.data),
    initialData: () => productApi.getCachedList(params, { cacheScope: offerScope }) || undefined,
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
    ...options,
  })
}

export function useProductQuery(idOrSlug, options = {}) {
  const offerScope = useOfferPricingScope()

  return useQuery({
    queryKey: customerQueryKeys.product(idOrSlug, offerScope),
    queryFn: () => productApi.show(idOrSlug, { cacheScope: offerScope }).then((response) => response.data.data),
    enabled: Boolean(idOrSlug),
    initialData: () => productApi.getCachedProduct(idOrSlug, { cacheScope: offerScope }) || undefined,
    ...options,
  })
}

export function useCategoriesQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.categories,
    queryFn: () => productApi.categories().then((response) => response.data.data || []),
    initialData: () => {
      const cached = productApi.getCachedCategories()
      return cached.length ? cached : undefined
    },
    staleTime: THIRTY_MINUTES,
    gcTime: THIRTY_MINUTES,
    ...options,
  })
}

export function useManufacturersQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.manufacturers,
    queryFn: () => productApi.manufacturers().then((response) => response.data.data || []),
    initialData: () => {
      const cached = productApi.getCachedManufacturers()
      return cached.length ? cached : undefined
    },
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
    staleTime: 1000 * 30,
    gcTime: FIVE_MINUTES,
    refetchOnMount: 'always',
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

export function useAddressesQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.addresses,
    queryFn: () => addressApi.list().then((response) => response.data.data || []),
    ...options,
  })
}

export function useOrdersQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.orders,
    queryFn: () => orderApi.list().then((response) => response.data.data || []),
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

export function useNotificationsQuery(options = {}) {
  return useQuery({
    queryKey: customerQueryKeys.notifications,
    queryFn: () => notificationApi.list().then((response) => response.data.data?.data || response.data.data || []),
    ...options,
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
    queryFn: () => returnApi.list().then((response) => response.data.data || []),
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
