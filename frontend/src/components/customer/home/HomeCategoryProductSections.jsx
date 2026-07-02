import { useId } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import ProductCard, { ProductCardSkeleton } from '../ProductCard'
import HomeSectionHeader from './HomeSectionHeader'
import { getCategoryName, getCategorySlug } from '../../../utils/categoryNames'

export default function HomeCategoryProductSections({
  isBangla,
  title,
  subtitle,
  products,
  categories,
  loading,
  type,
  onAdd,
}) {
  const rows = loading ? buildSkeletonRows(isBangla, type) : buildCategoryRows(products, categories, isBangla, type)

  if (!loading && rows.length === 0) {
    return null
  }

  return (
    <section>
      <HomeSectionHeader
        eyebrow={
          type === 'other'
            ? (isBangla ? 'স্বাস্থ্যসেবা পণ্য' : 'Healthcare Products')
            : (isBangla ? 'ওষুধ' : 'Medicines')
        }
        title={title}
        subtitle={
          subtitle ||
          (type === 'other'
            ? (
                isBangla
                  ? 'স্বাস্থ্যসেবা পণ্য, ব্যক্তিগত পরিচর্যা, মেডিকেল ডিভাইস এবং দৈনন্দিন প্রয়োজনীয় সামগ্রী ক্যাটাগরি অনুযায়ী সহজেই খুঁজে নিন।'
                  : 'Browse healthcare products, personal care, medical devices, and everyday essentials by category.'
              )
            : (
                isBangla
                  ? 'প্রয়োজনীয় ওষুধগুলো ক্যাটাগরি অনুযায়ী সাজানো হয়েছে, যাতে সহজেই খুঁজে পাওয়া ও তুলনা করা যায়।'
                  : 'Explore essential medicine categories in a clean layout for easy browsing and comparison.'
              ))
        }
      />

      <div className="mt-2 space-y-10">
        {rows.map((row) => (
          <CategoryRow
            key={row.key}
            isBangla={isBangla}
            loading={loading}
            row={row}
            onAdd={onAdd}
          />
        ))}
      </div>
    </section>
  )
}

function CategoryRow({ isBangla, loading, row, onAdd }) {
  const rowId = useId().replace(/:/g, '')
  const prevClass = `home-category-prev-${rowId}`
  const nextClass = `home-category-next-${rowId}`
  const items = loading ? row.placeholders : row.products
  const shouldShowNavigation = loading || items.length > 4

  return (
    <div className="mb-10 lg:mb-15">
      <div className="flex items-center justify-between gap-4 pb-4">
        <div>
          <h3 className="text-lg font-bold text-[#07343d] sm:text-[1.35rem]">{row.title}</h3>
        </div>

        {!loading ? (
          <Link
            to={row.href}
            className="shrink-0 text-sm font-bold text-[#0b5d68] transition hover:text-[#13b8b0]"
          >
            {isBangla ? 'সব দেখুন' : 'See All'}
          </Link>
        ) : null}
      </div>

      <div className="relative overflow-hidden">
        {shouldShowNavigation ? (
          <button
            type="button"
            aria-label={isBangla ? 'আগের পণ্য' : 'Previous Products'}
            className={`home-category-nav ${prevClass} absolute left-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border border-[#d1ebe6] bg-white/96 text-[#0b5d68] shadow-[0_20px_36px_-28px_rgba(8,63,73,0.45)] transition hover:border-[#13b8b0] hover:text-[#13b8b0] lg:inline-flex`}
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>
        ) : null}

        {shouldShowNavigation ? (
          <button
            type="button"
            aria-label={isBangla ? 'পরবর্তী পণ্য' : 'Next Products'}
            className={`home-category-nav ${nextClass} absolute right-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border border-[#d1ebe6] bg-white/96 text-[#0b5d68] shadow-[0_20px_36px_-28px_rgba(8,63,73,0.45)] transition hover:border-[#13b8b0] hover:text-[#13b8b0] lg:inline-flex`}
          >
            <FiChevronRight className="h-5 w-5" />
          </button>
        ) : null}

        <Swiper
          modules={[Navigation]}
          navigation={shouldShowNavigation ? {
            prevEl: `.${prevClass}`,
            nextEl: `.${nextClass}`,
          } : false}
          watchOverflow
          spaceBetween={10}
          slidesPerView={2}
          breakpoints={{
            640: {
              slidesPerView: 2,
              spaceBetween: 16,
            },
            1024: {
              slidesPerView: 5,
              spaceBetween: 16,
            },
          }}
          className="overflow-hidden!"
        >
          {items.map((product) => (
            <SwiperSlide key={product.id} className="h-auto!">
              <div className="h-full">
                {loading ? <ProductCardSkeleton compact /> : <ProductCard product={product} onAdd={onAdd} compact />}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}

function buildCategoryRows(products = [], categories = [], isBangla = false, type = '') {
  const categoryOrder = new Map(categories.map((category, index) => [String(category.id), index]))
  const rowMap = new Map()

  products.forEach((product) => {
    const category = product?.category
    const categoryId = product?.category_id ?? category?.id ?? ''
    const categorySlug = getCategorySlug(category) || String(categoryId || '')
    const key = categorySlug || `category-${categoryId || 'general'}`

    if (!rowMap.has(key)) {
      rowMap.set(key, {
        key,
        categoryId,
        order: categoryOrder.get(String(categoryId)) ?? rowMap.size + categories.length,
        title: getCategoryName(
          category,
          isBangla,
          isBangla ? 'সাধারণ পণ্য' : 'General Products'
        ),
        href: buildCategoryHref(type, categorySlug, categoryId),
        products: [],
      })
    }

    rowMap.get(key).products.push(product)
  })

  return Array.from(rowMap.values())
    .map((row) => ({
      ...row,
      products: row.products.slice(0, 12),
    }))
    .filter((row) => row.products.length > 0)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
    .slice(0, 8)
}

function buildCategoryHref(type, categorySlug, categoryId) {
  const params = new URLSearchParams()

  if (type) {
    params.set('type', type)
  }

  if (categorySlug) {
    params.set('category', categorySlug)
  } else if (categoryId) {
    params.set('category_id', String(categoryId))
  }

  const query = params.toString()
  return query ? `/products?${query}` : '/products'
}

function buildSkeletonRows(isBangla, type) {
  const label =
  type === 'other'
    ? (isBangla ? 'স্বাস্থ্যসেবা পণ্য' : 'Healthcare Products')
    : (isBangla ? 'ওষুধ' : 'Medicines')

  return [
    {
      key: `${type || 'products'}-loading`,
      title: label,
      placeholders: Array.from({ length: 10 }, (_, index) => ({ id: `${type || 'products'}-placeholder-${index}` })),
    },
  ]
}
