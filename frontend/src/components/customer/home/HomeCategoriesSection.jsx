import { Link } from 'react-router-dom'
import HomeSectionHeader from './HomeSectionHeader'
import { useLanguage } from '../../../context/LanguageContext'
import { getCategoryName, getCategoryProductsPath } from '../../../utils/categoryNames'
import { getCategoryImage, handleImageFallback } from '../../../utils/imageUrl'

export default function HomeCategoriesSection({ categories }) {
  const { isBangla } = useLanguage()
  const banglaFontClass = isBangla ? 'font-bangla' : ''

  if (!categories?.length) {
    return null
  }

  return (
    <section className={`pb-10 pt-6 ${banglaFontClass}`}>
      <HomeSectionHeader
        title={isBangla ? 'আপনার প্রয়োজন অনুযায়ী খুঁজুন' : 'Find What You Need'}
        subtitle={
          isBangla
            ? 'ওষুধ, স্বাস্থ্যসেবা পণ্য, ব্যক্তিগত পরিচর্যা এবং দৈনন্দিন প্রয়োজনীয় সামগ্রী ক্যাটাগরি অনুযায়ী সহজেই খুঁজে নিন।'
            : 'Explore medicines, healthcare products, personal care, and everyday essentials by category.'
        }
        actionTo="/products"
        actionLabel={isBangla ? 'সকল ক্যাটাগরি' : 'All Categories'}
      />

      <div className="mt-6 grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-4 sm:gap-x-3 sm:gap-y-4 lg:grid-cols-5 xl:grid-cols-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={getCategoryProductsPath(category)}
            className="group block"
          >
            <div className="overflow-hidden border border-[#d4ebe7] bg-white shadow-[0_20px_42px_-34px_rgba(8,63,73,0.22)] transition hover:-translate-y-1 hover:border-[#13b8b0]/45 hover:shadow-[0_30px_52px_-36px_rgba(8,63,73,0.28)]">
              <div className="aspect-[1/0.8] overflow-hidden bg-[#f4fbfa]">
                <img
                  src={getCategoryImage(category)}
                  alt={getCategoryName(category, isBangla)}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  onError={handleImageFallback}
                />
              </div>
            </div>

            <h3 className="mt-2 line-clamp-2 text-center text-[11px] font-bold leading-4 text-[#07343d] transition group-hover:text-[#0e6574] sm:text-xs lg:text-[13px]">
              {getCategoryName(category, isBangla)}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  )
}
