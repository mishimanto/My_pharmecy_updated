import ProductCard, { ProductCardSkeleton } from '../ProductCard'
import HomeSectionHeader from './HomeSectionHeader'

export default function HomeNonMedicineProductsSection({ isBangla, loading, products, onAdd }) {
  if (!loading && products.length === 0) {
    return null
  }

  const rows = loading ? Array.from({ length: 4 }, (_, index) => ({ id: `non-medicine-placeholder-${index}` })) : products

  return (
    <section className="pb-16">
      <HomeSectionHeader
        eyebrow={isBangla ? 'ওষুধের বাইরে প্রয়োজনীয় পণ্য' : 'Beyond medicines'}
        title={isBangla ? 'হেলথকেয়ার, হাইজিন ও বেবি কেয়ার' : 'Healthcare, hygiene, and baby care'}
        subtitle={isBangla ? 'মেডিকেল ডিভাইস, ফার্স্ট এইড, ব্যক্তিগত যত্ন ও বেবি কেয়ার পণ্য আলাদা করে দেখুন।' : 'Browse medical devices, first aid, personal care, and baby care products separately.'}
        actionTo="/products?type=other"
        actionLabel={isBangla ? 'সব পণ্য দেখুন' : 'Browse products'}
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((product) => (
          loading
            ? <ProductCardSkeleton key={product.id} />
            : <ProductCard key={product.id} product={product} onAdd={onAdd} compact />
        ))}
      </div>
    </section>
  )
}
