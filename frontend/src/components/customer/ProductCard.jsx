import { Link } from 'react-router-dom'
import { FiArrowRight, FiHeart, FiShoppingCart } from 'react-icons/fi'
import { productApi } from '../../api/productApi'
import { useStorefront } from '../../context/StorefrontContext'
import { money } from '../../utils/formatters'
import { getDefaultPurchaseOption, getPurchaseOption } from '../../utils/purchaseUnits'

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://my_pharmecy.test/api').replace(/\/api\/?$/, '')

function resolveImage(path) {
  if (!path) return null
  return path.startsWith('http') ? path : new URL(path, `${API_ORIGIN}/`).toString()
}

function manufacturerInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join('') || 'RX'
}

export default function ProductCard({ product, onAdd }) {
  const { isWishlisted, toggleWishlist } = useStorefront()
  const manufacturerImage = resolveImage(product?.manufacturer?.logo_url)
  const defaultOption = getDefaultPurchaseOption(product)
  const stripOption = getPurchaseOption(product, 'strip')
  const saved = isWishlisted(product?.id)

  const prefetch = () => {
    productApi.primeProduct(product)
    productApi.prefetch(product.id)
  }

  return (
    <article className="group relative overflow-hidden border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.34)] transition hover:-translate-y-0.5">
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-3 bg-white/55 opacity-0 backdrop-blur-[3px] transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        <Link
          to={`/products/${product.id}`}
          state={{ product }}
          onMouseEnter={prefetch}
          onFocus={prefetch}
          className="pointer-events-auto inline-flex h-11 w-11 cursor-pointer items-center justify-center border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          aria-label={`View ${product.product_name} details`}
        >
          <FiArrowRight className="h-4 w-4" />
        </Link>
        <button
          type="button"
          className={`pointer-events-auto inline-flex h-11 w-11 cursor-pointer items-center justify-center border transition ${
            saved
              ? 'border-rose-200 bg-rose-50 text-rose-600'
              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-950'
          }`}
          onClick={() => toggleWishlist(product)}
          aria-label={saved ? `Remove ${product.product_name} from wishlist` : `Save ${product.product_name} to wishlist`}
        >
          <FiHeart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
        </button>
        {onAdd ? (
          <button
            className="pointer-events-auto inline-flex h-11 w-11 cursor-pointer items-center justify-center border border-slate-300 bg-white text-slate-800 transition hover:border-slate-400"
            onClick={() => onAdd(product)}
            aria-label={`Quick add ${product.product_name} to cart`}
          >
            <FiShoppingCart className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {product.manufacturer?.manufacturer_name || product.category?.category_name || 'Healthcare'}
          </div>
          <Link to={`/products/${product.id}`} state={{ product }} className="mt-1 block" onMouseEnter={prefetch} onFocus={prefetch}>
            <h3 className="line-clamp-2 text-lg font-semibold tracking-tight text-slate-950">{product.product_name}</h3>
          </Link>
        </div>

        <Link
          to={`/products/${product.id}`}
          state={{ product }}
          onMouseEnter={prefetch}
          onFocus={prefetch}
          className="shrink-0"
        >
          {manufacturerImage ? (
            <img
              src={manufacturerImage}
              alt={product.manufacturer?.manufacturer_name || product.product_name}
              className="h-14 w-14 border border-slate-200 object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
              {manufacturerInitials(product.manufacturer?.manufacturer_name || product.product_name)}
            </div>
          )}
        </Link>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-slate-500">
        {product.generic_name || product.brand_name || 'Trusted medicine and wellness support.'}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <span className="bg-slate-100 px-2.5 py-1 text-slate-600">{product.category?.category_name || 'General care'}</span>
        {stripOption?.badge ? <span className="bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">{stripOption.badge}</span> : null}
        {product.requires_prescription ? <span className="bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">Prescription</span> : null}
      </div>

      <div className="mt-4 flex items-end justify-between gap-3 bg-slate-50 px-4 py-3">
        <div className="min-w-0">
          <div className="text-xs text-slate-500">Starts at</div>
          <div className="text-xl font-semibold text-slate-950">{money(product.display_price)}</div>
          {defaultOption ? <div className="mt-1 text-xs text-slate-500">{defaultOption.label} quick add</div> : null}
        </div>

        <div className="text-right text-xs text-slate-500">
          <div className="text-sm font-semibold text-slate-950">{product.available_stock ?? 0}</div>
          <div>available</div>
        </div>
      </div>
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.18)]">
      <div className="flex items-start justify-between gap-3 animate-pulse">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-3 w-24 bg-slate-100" />
          <div className="h-5 w-4/5 bg-slate-200" />
        </div>
        <div className="h-14 w-14 bg-slate-100" />
      </div>

      <div className="mt-3 animate-pulse">
        <div className="h-4 w-3/5 bg-slate-100" />
        <div className="mt-3 flex gap-2">
          <div className="h-6 w-20 bg-slate-100" />
          <div className="h-6 w-16 bg-slate-100" />
        </div>
      </div>

      <div className="mt-4 animate-pulse bg-slate-50 px-4 py-3">
        <div className="h-3 w-16 bg-slate-100" />
        <div className="mt-2 h-6 w-28 bg-slate-200" />
        <div className="mt-2 h-3 w-20 bg-slate-100" />
      </div>
    </div>
  )
}
