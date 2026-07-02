import ProductCard, { ProductCardSkeleton } from '../ProductCard'
import HomeSectionHeader from './HomeSectionHeader'

export default function HomeFeaturedProductsSection({
  isBangla,
  loading,
  featuredProducts,
  onAdd,
  eyebrow = '',
  title,
  subtitle = '',
  actionTo = '/products',
  actionLabel,
}) {
  if (!loading && featuredProducts.length === 0) {
    return null
  }

  return (
    <section className="pb-16">
      <HomeSectionHeader
        eyebrow={eyebrow}
        title={title || (isBangla ? 'ঘরে বসেই পণ্য অর্ডার করুন' : 'Pharmacy products ready to order')}
        subtitle={subtitle}
        actionTo={actionTo}
        actionLabel={actionLabel || (isBangla ? 'সব দেখুন' : 'View all')}
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {(loading ? Array.from({ length: 8 }, (_, index) => ({ id: `placeholder-${index}` })) : featuredProducts).map((product) => {
          if (loading) {
            return <ProductCardSkeleton key={product.id} />
          }

          return <ProductCard key={product.id} product={product} onAdd={onAdd} />
        })}
      </div>
    </section>
  )
}
