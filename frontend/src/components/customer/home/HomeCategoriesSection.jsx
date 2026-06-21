import { Link } from 'react-router-dom'
import HomeSectionHeader from './HomeSectionHeader'
import { useLanguage } from '../../../context/LanguageContext'
import { getCategoryName } from '../../../utils/categoryNames'
import { categoryTints } from './homeUtils'

export default function HomeCategoriesSection({ categories }) {
  const { isBangla } = useLanguage()

  return (
    <section className="py-16">
      <HomeSectionHeader        
        title={isBangla ? 'বিভাগভিত্তিক ওষুধ' : 'Medicine Category'}
        actionTo="/products"
        actionLabel={isBangla ? 'সব দেখুন' : 'Browse all'}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            to={`/products?category_id=${category.id}`}
            className={`group border border-[#b7e5df]/70 bg-linear-to-br ${categoryTints[index % categoryTints.length]} p-6 shadow-[0_18px_42px_-34px_rgba(8,63,73,0.35)] transition hover:-translate-y-0.5 hover:border-[#13b8b0]/55 hover:shadow-[0_22px_54px_-36px_rgba(8,63,73,0.42)]`}
          >
            <div className="flex items-start justify-center gap-3">
              <div>
                <h3 className="text-center text-xl font-bold tracking-tight text-[#07343d] group-hover:text-[#0e6574]">
                  {getCategoryName(category, isBangla)}
                </h3>
              </div>

            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
