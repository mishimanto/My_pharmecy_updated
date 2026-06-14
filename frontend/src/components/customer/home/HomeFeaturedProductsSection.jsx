import ProductCard, { ProductCardSkeleton } from '../ProductCard'
import HomeSectionHeader from './HomeSectionHeader'

export default function HomeFeaturedProductsSection({ isBangla, loading, featuredProducts, onAdd }) {
  return (
    <section className="pb-16">
      <HomeSectionHeader
        title={isBangla ? 'ঘরে বসেই অর্ডার করুন' : 'Medicines ready to order'}
        actionTo="/products"
        actionLabel={isBangla ? 'সব দেখুন' : 'View all'}
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
