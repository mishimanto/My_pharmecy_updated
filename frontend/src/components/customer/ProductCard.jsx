import { FiArrowRight, FiHeart, FiShoppingCart } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { productApi } from '../../api/productApi'
import { useLanguage } from '../../context/LanguageContext'
import { useStorefront } from '../../context/StorefrontContext'
import { money } from '../../utils/formatters'
import { getManufacturerImage, getProductImage, handleImageFallback } from '../../utils/imageUrl'
import { getProductPath, getProductRouteKey } from '../../utils/productRouting'

export default function ProductCard({ product, onAdd }) {
  const { isWishlisted, toggleWishlist } = useStorefront()
  const { isBangla } = useLanguage()
  const manufacturerImage = getManufacturerImage(product?.manufacturer)
  const saved = isWishlisted(product?.id)
  const productImage = getProductImage(product)
  const productPath = getProductPath(product)
  const productRouteKey = getProductRouteKey(product)

  const prefetch = () => {
    productApi.primeProduct(product)
    productApi.prefetch(productRouteKey)
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden border border-slate-200 bg-white p-4 transition duration-200 hover:border-slate-300 hover:shadow-sm">
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-3 bg-white/65 opacity-0 backdrop-blur-[2px] transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        <Link
          to={productPath}
          state={{ product }}
          onMouseEnter={prefetch}
          onFocus={prefetch}
          className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          aria-label={isBangla ? `${product.product_name} এর বিস্তারিত দেখুন` : `View ${product.product_name} details`}
        >
          <FiArrowRight className="h-4 w-4" />
        </Link>
        <button
          type="button"
          className={`pointer-events-auto inline-flex h-10 w-10 items-center justify-center border transition ${
            saved
              ? 'border-rose-200 bg-rose-50 text-rose-600'
              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-950'
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
            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center border border-slate-300 bg-white text-slate-800 transition hover:border-slate-400"
            onClick={() => onAdd(product)}
            aria-label={isBangla ? `${product.product_name} দ্রুত কার্টে যোগ করুন` : `Quick add ${product.product_name} to cart`}
          >
            <FiShoppingCart className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <Link
        to={productPath}
        state={{ product }}
        onMouseEnter={prefetch}
        onFocus={prefetch}
        className="flex items-center justify-center border border-slate-100 bg-slate-50 p-5"
      >
        <img
          src={productImage}
          alt={product.product_name}
          className="h-24 w-full object-contain"
          loading="lazy"
          onError={handleImageFallback}
        />
      </Link>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
        <span className="bg-slate-100 px-2.5 py-1 text-slate-600">
          {product.category?.category_name || (isBangla ? 'সাধারণ যত্ন' : 'General care')}
        </span>
        {product.requires_prescription ? (
          <span className="bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
            {isBangla ? 'প্রেসক্রিপশন' : 'Prescription'}
          </span>
        ) : null}
      </div>

      <div className="mt-3 min-w-0">
        <Link to={productPath} state={{ product }} className="flex items-start justify-between gap-3" onMouseEnter={prefetch} onFocus={prefetch}>
          <h3 className="line-clamp-2 min-w-0 flex-1 text-base font-semibold leading-6 text-slate-950">{product.product_name}</h3>
          {manufacturerImage ? (
            <img
              src={manufacturerImage}
              alt={product.manufacturer?.manufacturer_name || (isBangla ? 'ব্র্যান্ড লোগো' : 'Brand logo')}
              className="h-10 w-10 shrink-0 border border-slate-200 object-contain"
              loading="lazy"
              onError={handleImageFallback}
            />
          ) : null}
        </Link>
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="min-w-0">
            <div className="text-xs text-slate-500">{isBangla ? 'শুরু' : 'Starts at'}</div>
            <div className="text-lg font-semibold text-slate-950">{money(product.display_price)}</div>
          </div>
        </div>
      </div>
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="animate-pulse">
        <div className="flex h-[136px] items-center justify-center border border-slate-100 bg-slate-50">
          <div className="h-20 w-20 bg-slate-200" />
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-6 w-20 bg-slate-100" />
          <div className="h-6 w-16 bg-slate-100" />
        </div>
        <div className="mt-4 h-5 w-4/5 bg-slate-200" />
        <div className="mt-2 h-4 w-3/5 bg-slate-100" />
        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="h-3 w-16 bg-slate-100" />
          <div className="mt-2 h-5 w-24 bg-slate-200" />
        </div>
      </div>
    </div>
  )
}
