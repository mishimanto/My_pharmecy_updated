import { useQueryClient } from '@tanstack/react-query'
import { FiHeart, FiShoppingCart } from 'react-icons/fi'
import { PiPrescriptionBold } from 'react-icons/pi'
import { Link } from 'react-router-dom'
import OptimizedImage from '../common/OptimizedImage'
import { useLanguage } from '../../context/LanguageContext'
import { useStorefront } from '../../context/StorefrontContext'
import { getOfferPricingSignature, prefetchProductQuery, setProductQueryData, useOffersQuery } from '../../queries/customerQueries'
import { money } from '../../utils/formatters'
import { getCategoryName } from '../../utils/categoryNames'
import { getManufacturerImage, getProductThumbnail, handleImageFallback } from '../../utils/imageUrl'
import { getProductPath, getProductRouteKey } from '../../utils/productRouting'

export default function ProductCard({ product, onAdd, compact = false }) {
  const { isWishlisted, toggleWishlist } = useStorefront()
  const { isBangla } = useLanguage()
  const queryClient = useQueryClient()
  const offersQuery = useOffersQuery()
  const offerScope = getOfferPricingSignature(offersQuery.data || [])
  const manufacturerImage = getManufacturerImage(product?.manufacturer)
  const saved = isWishlisted(product?.id)
  const productImage = getProductThumbnail(product)
  const productPath = getProductPath(product)
  const productRouteKey = getProductRouteKey(product)
  const hasOffer = Number(product?.discount_amount || 0) > 0 && Number(product?.base_display_price || 0) > Number(product?.display_price || 0)
  const requiresPrescription = Boolean(product?.requires_prescription)
  const offerLabel =
    (isBangla ? product?.active_offer?.label_bn || product?.active_offer?.title_bn : null) ||
    product?.active_offer?.label ||
    product?.active_offer?.title

  const imageLinkClass = compact
    ? 'flex h-28 w-full items-center justify-center overflow-hidden sm:h-[8.5rem] lg:h-36'
    : 'flex h-44 w-full items-center justify-center overflow-hidden sm:h-48'
  const bodyClass = compact
    ? 'flex flex-1 flex-col bg-[linear-gradient(180deg,#dbeafe_0%,#ccfbf1_100%)] p-2.5 sm:p-3'
    : 'flex flex-1 flex-col bg-[linear-gradient(180deg,#dbeafe_0%,#ccfbf1_100%)] p-4'
  const actionButtonClass = compact ? 'h-8 w-8' : 'h-9 w-9'
  const brandLogoClass = compact ? 'h-6 w-6 sm:h-7 sm:w-7' : 'h-10 w-10'
  const titleClass = compact
    ? 'line-clamp-2 text-[13px] font-semibold leading-[1.15rem] text-[#102a43] transition sm:group-hover:text-[#1d4ed8] sm:text-[15px] sm:leading-5'
    : 'line-clamp-2 text-base font-semibold leading-6 text-[#102a43] transition sm:group-hover:text-[#1d4ed8]'
  const priceClass = compact ? 'text-sm font-semibold text-[#1d4ed8] sm:text-base' : 'text-lg font-semibold text-[#1d4ed8]'

  const prefetch = () => {
    setProductQueryData(queryClient, product, offerScope)
    prefetchProductQuery(queryClient, productRouteKey, offerScope)
  }

  return (
    <article className="group relative flex h-full flex-col overflow-visible border border-slate-300 bg-[#15324a] shadow-[0_18px_46px_-40px_rgba(21,50,74,0.62)] transition duration-200 sm:hover:border-[#38bdf8]/40 sm:hover:shadow-[0_24px_64px_-42px_rgba(14,116,144,0.68)]">
      <div className="relative bg-[linear-gradient(135deg,#bfdbfe_0%,#c7d2fe_48%,#99f6e4_100%)]">
        <Link
          to={productPath}
          state={{ product }}
          onMouseEnter={prefetch}
          onFocus={prefetch}
          className={imageLinkClass}
        >
          <OptimizedImage
            src={productImage}
            alt={product.product_name}
            className="h-full w-full object-cover transition duration-500 sm:group-hover:scale-[1.04]"
            onError={handleImageFallback}
          />
        </Link>

        {hasOffer ? (
          <div className="absolute -left-1 top-3 z-20 flex items-center drop-shadow-md">
            <span className="bg-red-400 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.04em] text-white">
              {offerLabel || (isBangla ? 'অফার' : 'Offer')}
            </span>
            <span className="h-0 w-0 border-y-13px border-l-12px border-y-transparent border-l-red-600" />
          </div>
        ) : null}

        <div className="absolute right-3 top-3 flex gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <button
            type="button"
            className={`inline-flex ${actionButtonClass} items-center justify-center border shadow-sm backdrop-blur transition ${
              saved
                ? 'border-rose-200 bg-rose-50/95 text-rose-600'
                : 'border-sky-200/80 bg-white/95 text-[#1e3a5f] hover:border-[#38bdf8] hover:bg-[#2563eb] hover:text-white'
            }`}
            onClick={() => toggleWishlist(product)}
            aria-label={
              saved
                ? (isBangla ? `${product.product_name} উইশলিস্ট থেকে সরান` : `Remove ${product.product_name} from wishlist`)
                : (isBangla ? `${product.product_name} উইশলিস্টে রাখুন` : `Save ${product.product_name} to wishlist`)
            }
          >
            <FiHeart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
          </button>
          {onAdd ? (
            <button
              type="button"
              className={`inline-flex ${actionButtonClass} items-center justify-center border border-sky-200/80 bg-white/95 text-[#1e3a5f] shadow-sm backdrop-blur transition hover:border-[#38bdf8] hover:bg-[#2563eb] hover:text-white`}
              onClick={() => onAdd(product)}
              aria-label={isBangla ? `${product.product_name} দ্রুত কার্টে যোগ করুন` : `Quick add ${product.product_name} to cart`}
            >
              <FiShoppingCart className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className={bodyClass}>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex flex-wrap gap-1.5 text-[10px] sm:gap-2 sm:text-[11px]">
              <span className="border border-[#2563eb]/15 bg-white/45 px-2 py-0.75 font-medium text-[#1e3a5f] sm:px-2.5 sm:py-1">
                {getCategoryName(product.category, isBangla, isBangla ? 'সাধারণ যত্ন' : 'General care')}
              </span>
            </div>

            {manufacturerImage ? (
              <Link to={productPath} state={{ product }} className="shrink-0" onMouseEnter={prefetch} onFocus={prefetch}>
                <OptimizedImage
                  src={manufacturerImage}
                  alt={product.manufacturer?.manufacturer_name || (isBangla ? 'ব্র্যান্ড লোগো' : 'Brand logo')}
                  className={`${brandLogoClass} border border-[#2563eb]/15 bg-white/55 object-contain`}
                  onError={handleImageFallback}
                />
              </Link>
            ) : null}
          </div>

          <Link to={productPath} state={{ product }} className="block" onMouseEnter={prefetch} onFocus={prefetch}>
            <h3 className={titleClass}>{product.product_name}</h3>
          </Link>
        </div>

        <div className="mt-auto pt-3 sm:pt-4">
          <div className="flex items-end justify-between gap-2 border-t border-[#7dd3fc]/45 pt-2.5 sm:gap-3 sm:pt-3">
            <div className="min-h-[1.75rem]">
              {requiresPrescription ? (
                <span className="group/rx relative inline-flex">
                  <span
                    tabIndex={0}
                    className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.75 text-rose-700 sm:px-2.5 sm:py-1"
                    aria-label={isBangla ? '\u098f\u0987 \u09aa\u09a3\u09cd\u09af\u09c7\u09b0 \u099c\u09a8\u09cd\u09af \u09aa\u09cd\u09b0\u09c7\u09b8\u0995\u09cd\u09b0\u09bf\u09aa\u09b6\u09a8 \u09aa\u09cd\u09b0\u09af\u09bc\u09cb\u099c\u09a8' : 'This product requires a prescription'}
                  >
                    <PiPrescriptionBold className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>

                  <span className="pointer-events-none absolute bottom-[calc(100%+0.55rem)] left-0 z-30 w-56 translate-y-1 border border-slate-200 bg-white p-3 text-left text-xs leading-5 text-slate-600 opacity-0 shadow-[0_18px_48px_-28px_rgba(15,23,42,0.35)] transition duration-200 group-hover/rx:translate-y-0 group-hover/rx:opacity-100 group-focus-within/rx:translate-y-0 group-focus-within/rx:opacity-100">
                    <span className="block text-sm font-semibold text-slate-950">
                      {isBangla ? '\u098f\u0987 \u09aa\u09a3\u09cd\u09af\u09c7\u09b0 \u099c\u09a8\u09cd\u09af \u09aa\u09cd\u09b0\u09c7\u09b8\u0995\u09cd\u09b0\u09bf\u09aa\u09b6\u09a8 \u09aa\u09cd\u09b0\u09af\u09bc\u09cb\u099c\u09a8' : 'This medicine requires a prescription'}
                    </span>
                    <span className="mt-1 block">
                      {isBangla ? '\u09aa\u09cd\u09b0\u09c7\u09b8\u0995\u09cd\u09b0\u09bf\u09aa\u09b6\u09a8 \u09a8\u09be \u09a5\u09be\u0995\u09b2\u09c7 \u0986\u0997\u09c7 \u0986\u09aa\u09b2\u09cb\u09a1 \u0995\u09b0\u09c7 \u09a4\u09be\u09b0\u09aa\u09b0 \u0985\u09b0\u09cd\u09a1\u09be\u09b0 \u0995\u09b0\u09c1\u09a8\u0964' : 'Upload a prescription first, then continue with the order.'}
                    </span>
                    <span className="absolute left-4 top-full h-3 w-3 -translate-y-1/2 rotate-45 border-r border-b border-slate-200 bg-white" />
                  </span>
                </span>
              ) : null}
            </div>

            <div className="min-w-0 text-right">
              <div className="text-[11px] text-[#486581] sm:text-xs">{isBangla ? 'শুরু' : 'Starts at'}</div>
              {hasOffer ? (
                <div className="mt-1 text-[11px] font-semibold text-[#486581] line-through sm:text-xs">
                  {money(product.base_display_price, isBangla ? 'bn-BD' : 'en-US')}
                </div>
              ) : null}
              <div className={priceClass}>{money(product.display_price, isBangla ? 'bn-BD' : 'en-US')}</div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export function ProductCardSkeleton({ compact = false }) {
  return (
    <div className="overflow-hidden border border-[#7dd3fc]/35 bg-[#dbeafe]">
      <div className="animate-pulse">
        <div className={`flex items-center justify-center bg-[linear-gradient(135deg,#bfdbfe,#99f6e4)] ${compact ? 'h-32 sm:h-36' : 'h-44 sm:h-48'}`}>
          <div className={`${compact ? 'h-20 w-20' : 'h-24 w-24'} bg-[#7dd3fc]/55`} />
        </div>
        <div className={`bg-[linear-gradient(180deg,#dbeafe,#ccfbf1)] ${compact ? 'p-3' : 'p-4'}`}>
          <div className="flex gap-2">
            <div className={`${compact ? 'h-5 w-18' : 'h-6 w-20'} bg-[#7dd3fc]/45`} />
            <div className={`${compact ? 'h-5 w-14' : 'h-6 w-16'} bg-[#7dd3fc]/35`} />
          </div>
          <div className={`${compact ? 'mt-3 h-4' : 'mt-4 h-5'} w-4/5 bg-[#7dd3fc]/45`} />
          <div className="mt-2 h-4 w-3/5 bg-[#7dd3fc]/35" />
          <div className={`${compact ? 'mt-3 pt-2.5' : 'mt-4 pt-3'} border-t border-[#7dd3fc]/45`}>
            <div className="h-3 w-16 bg-[#7dd3fc]/35" />
            <div className={`${compact ? 'mt-1.5 h-4 w-20' : 'mt-2 h-5 w-24'} bg-[#7dd3fc]/45`} />
          </div>
        </div>
      </div>
    </div>
  )
}

