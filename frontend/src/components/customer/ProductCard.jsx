import { FiHeart, FiShoppingCart } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { productApi } from '../../api/productApi'
import OptimizedImage from '../common/OptimizedImage'
import { useLanguage } from '../../context/LanguageContext'
import { useStorefront } from '../../context/StorefrontContext'
import { money } from '../../utils/formatters'
import { getCategoryName } from '../../utils/categoryNames'
import { getManufacturerImage, getProductThumbnail, handleImageFallback } from '../../utils/imageUrl'
import { getProductPath, getProductRouteKey } from '../../utils/productRouting'

export default function ProductCard({ product, onAdd, compact = false }) {
  const { isWishlisted, toggleWishlist } = useStorefront()
  const { isBangla } = useLanguage()
  const manufacturerImage = getManufacturerImage(product?.manufacturer)
  const saved = isWishlisted(product?.id)
  const productImage = getProductThumbnail(product)
  const productPath = getProductPath(product)
  const productRouteKey = getProductRouteKey(product)
  const hasOffer = Number(product?.discount_amount || 0) > 0 && Number(product?.base_display_price || 0) > Number(product?.display_price || 0)
  const offerLabel = (isBangla ? product?.active_offer?.label_bn || product?.active_offer?.title_bn : null) || product?.active_offer?.label || product?.active_offer?.title
  const imageLinkClass = compact
    ? 'flex h-36 w-full items-center justify-center overflow-hidden sm:h-40'
    : 'flex h-44 w-full items-center justify-center overflow-hidden sm:h-48'
  const bodyClass = compact
    ? 'flex flex-1 flex-col bg-[linear-gradient(180deg,#dbeafe_0%,#ccfbf1_100%)] p-3'
    : 'flex flex-1 flex-col bg-[linear-gradient(180deg,#dbeafe_0%,#ccfbf1_100%)] p-4'
  const actionButtonClass = compact ? 'h-8 w-8' : 'h-9 w-9'
  const brandLogoClass = compact ? 'h-8 w-8' : 'h-10 w-10'
  const titleClass = compact
    ? 'line-clamp-2 text-sm font-semibold leading-5 text-[#102a43] transition group-hover:text-[#1d4ed8]'
    : 'line-clamp-2 text-base font-semibold leading-6 text-[#102a43] transition group-hover:text-[#1d4ed8]'
  const priceClass = compact ? 'text-base font-semibold text-[#1d4ed8]' : 'text-lg font-semibold text-[#1d4ed8]'

  const prefetch = () => {
    productApi.primeProduct(product)
    productApi.prefetch(productRouteKey)
  }

  return (
    <article className="group relative flex h-full flex-col overflow-visible border border-[#7dd3fc]/35 bg-[#15324a] shadow-[0_18px_46px_-40px_rgba(21,50,74,0.62)] transition duration-200 hover:border-[#38bdf8] hover:shadow-[0_24px_64px_-42px_rgba(14,116,144,0.68)]">
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
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            onError={handleImageFallback}
          />
        </Link>

        {hasOffer ? (
          <div className="absolute -left-1 top-3 z-20 flex items-center drop-shadow-md">
            <span className="bg-red-400 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.04em] text-white">
              {offerLabel || (isBangla ? 'অফার' : 'Offer')}
            </span>
            <span className="h-0 w-0 border-y-[13px] border-l-[12px] border-y-transparent border-l-red-600" />
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
            aria-label={saved
              ? (isBangla ? `${product.product_name} উইশলিস্ট থেকে সরান` : `Remove ${product.product_name} from wishlist`)
              : (isBangla ? `${product.product_name} উইশলিস্টে রাখুন` : `Save ${product.product_name} to wishlist`)}
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
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="border border-[#2563eb]/15 bg-white/45 px-2.5 py-1 font-medium text-[#1e3a5f]">
                {getCategoryName(product.category, isBangla, isBangla ? 'সাধারণ যত্ন' : 'General care')}
              </span>
              {product.requires_prescription ? (
                <span className="bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
                  {isBangla ? 'প্রেসক্রিপশন' : 'Prescription'}
                </span>
              ) : null}
            </div>

            <Link to={productPath} state={{ product }} className="mt-3 block" onMouseEnter={prefetch} onFocus={prefetch}>
              <h3 className={titleClass}>{product.product_name}</h3>
            </Link>
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

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-end gap-3 border-t border-[#7dd3fc]/45 pt-3">
            <div className="min-w-0 text-right">
              <div className="text-xs text-[#486581]">{isBangla ? 'শুরু' : 'Starts at'}</div>
              {hasOffer ? (
                <div className="mt-1 text-xs font-semibold text-[#486581] line-through">
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

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden border border-[#7dd3fc]/35 bg-[#dbeafe]">
      <div className="animate-pulse">
        <div className="flex h-44 items-center justify-center bg-[linear-gradient(135deg,#bfdbfe,#99f6e4)] sm:h-48">
          <div className="h-24 w-24 bg-[#7dd3fc]/55" />
        </div>
        <div className="bg-[linear-gradient(180deg,#dbeafe,#ccfbf1)] p-4">
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-[#7dd3fc]/45" />
            <div className="h-6 w-16 bg-[#7dd3fc]/35" />
          </div>
          <div className="mt-4 h-5 w-4/5 bg-[#7dd3fc]/45" />
          <div className="mt-2 h-4 w-3/5 bg-[#7dd3fc]/35" />
          <div className="mt-4 border-t border-[#7dd3fc]/45 pt-3">
            <div className="h-3 w-16 bg-[#7dd3fc]/35" />
            <div className="mt-2 h-5 w-24 bg-[#7dd3fc]/45" />
          </div>
        </div>
      </div>
    </div>
  )
}
