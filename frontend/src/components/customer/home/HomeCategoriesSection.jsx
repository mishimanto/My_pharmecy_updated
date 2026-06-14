import { Link } from 'react-router-dom'
import HomeSectionHeader from './HomeSectionHeader'
import { categoryTints } from './homeUtils'

export default function HomeCategoriesSection({ isBangla, categories }) {
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
            className={`group border border-slate-200/80 bg-gradient-to-br ${categoryTints[index % categoryTints.length]} p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
          >
            <div className="flex items-start justify-center gap-3">
              <div>
                <h3 className="text-xl text-center font-bold tracking-tight text-slate-950 group-hover:text-[#0e6574]">
                  {category.category_name}
                </h3>
              </div>
              
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
