import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import ProductCard from '../../components/customer/ProductCard'
import { useStorefront } from '../../context/StorefrontContext'

export default function Wishlist() {
  const { wishlist, addToCart } = useStorefront()

  const add = async (product) => {
    try {
      await addToCart({
        product_id: product.id,
        purchase_unit: product.default_purchase_unit || product.purchase_options?.[0]?.code || 'piece',
        quantity: 1,
      })
      toast.success('Added to cart.')
    } catch {
      toast.error('Could not add this item to the cart.')
    }
  }

  return (
    <>
      <PageHeader title="Wishlist" subtitle="Saved products stay here so you can come back and add them faster." />

      {!wishlist.length ? (
        <EmptyState title="Wishlist is empty" text="Save products from cards or details pages and they will appear here." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={add} />
          ))}
        </div>
      )}
    </>
  )
}
