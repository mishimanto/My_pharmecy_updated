import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../context/LanguageContext'
import { getCategoryName } from '../../../utils/categoryNames'
import { money } from '../../../utils/formatters'
import { handleImageFallback } from '../../../utils/imageUrl'
import { getProductPath } from '../../../utils/productRouting'
import { getProductImage } from './homeUtils'

export default function HomeProductPanelsSection({ isBangla, prescriptionProducts, otcProducts }) {
  return (
    <section className="grid gap-6 pb-16 xl:grid-cols-2">
      <ProductListPanel
        variant="prescription"
        title={isBangla ? 'প্রেসক্রিপশন ওষুধ' : 'Prescription medicines'}
        
        products={prescriptionProducts}
        emptyMessage={isBangla ? 'ক্যাটালগ বড় হলে প্রেসক্রিপশন পণ্য এখানে দেখাবে।' : 'Prescription products will appear here as the catalog grows.'}
        actionTo="/upload-prescription"
        actionLabel={isBangla ? 'প্রেসক্রিপশন আপলোড' : 'Upload prescription'}
      />
      <ProductListPanel
        variant="otc"
        title={isBangla ? 'ওটিসি ও হেলথকেয়ার পণ্য' : 'OTC and healthcare products'}
       
        products={otcProducts}
        emptyMessage={isBangla ? 'ক্যাটালগ বড় হলে ওটিসি ও ওয়েলনেস পণ্য এখানে দেখাবে।' : 'OTC and wellness products will appear here as the catalog grows.'}
        actionTo="/products?requires_prescription=0"
        actionLabel={isBangla ? 'ওটিসি পণ্য দেখুন' : 'Browse OTC products'}
      />
    </section>
  )
}

function ProductListPanel({ variant, title, products, emptyMessage, actionTo, actionLabel }) {
  const isRx = variant === 'prescription'

  return (
    <div className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
      <div className={`border-b px-6 py-5 ${isRx ? 'border-amber-100 bg-amber-50/50' : 'border-teal-100 bg-teal-50/50'}`}>
        {/* <p className={`text-xs font-bold uppercase tracking-[0.22em] ${isRx ? 'text-amber-700' : 'text-[#0e6574]'}`}>
          {isRx ? (isBangla ? 'প্রেসক্রিপশন প্রয়োজন' : 'Prescription required') : (isBangla ? 'সরাসরি কিনুন' : 'Direct purchase')}
        </p> */}
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{title}</h2>
      </div>

      <div className="divide-y divide-slate-100">
        {products.length > 0 ? (
          products.map((product) => <MiniProductRow key={product.id} product={product} />)
        ) : (
          <div className="px-6 py-8 text-sm text-slate-500">{emptyMessage}</div>
        )}
      </div>

      <div className="border-t border-slate-100 px-6 py-5">
        <Link
          to={actionTo}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition ${
            isRx ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#13b8b0] hover:bg-[#0ea8a1]'
          }`}
        >
          {actionLabel}
          <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

function MiniProductRow({ product }) {
  const { isBangla } = useLanguage()
  const locale = isBangla ? 'bn-BD' : 'en-US'
  const image = getProductImage(product)

  return (
    <Link
      to={getProductPath(product)}
      state={{ product }}
      className="grid gap-4 px-6 py-4 transition hover:bg-slate-50/80 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:items-center"
    >
      <div className="overflow-hidden ">
        {image ? (
          <img src={image} alt={product.product_name} className="h-16 w-full object-cover sm:h-[64px] sm:w-[64px]" onError={handleImageFallback} />
        ) : (
          <div className="flex h-16 w-full items-center justify-center text-xs font-bold uppercase tracking-[0.14em] text-slate-400 sm:h-[64px] sm:w-[64px]">
            {product.requires_prescription ? 'Rx' : (isBangla ? 'ওটিসি' : 'OTC')}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          {product.manufacturer?.manufacturer_name || getCategoryName(product.category, isBangla)}
        </div>
        <h3 className="mt-1 line-clamp-2 font-bold tracking-tight text-slate-950">{product.product_name}</h3>
        <p className="mt-1 text-xs text-slate-500">
          {product.requires_prescription ? (isBangla ? 'প্রেসক্রিপশন প্রয়োজন' : 'Prescription required') : (isBangla ? 'সরাসরি কিনুন' : 'Direct purchase')}
        </p>
      </div>
      <div className="text-left sm:text-right">
        <div className="text-lg font-bold text-slate-950">{money(product.display_price, locale)}</div>
        <div className="text-[11px] text-slate-500">{isBangla ? 'শুরুর মূল্য' : 'Starting price'}</div>
      </div>
    </Link>
  )
}
