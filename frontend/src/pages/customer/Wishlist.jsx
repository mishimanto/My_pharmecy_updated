import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import ProductCard from '../../components/customer/ProductCard'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useStorefront } from '../../context/StorefrontContext'
import { isPrescriptionLoginRequiredError, requiresPrescriptionLogin, showPrescriptionLoginRequiredAlert } from '../../utils/prescriptionCartAlert'

export default function Wishlist() {
  const { customer } = useCustomerAuth()
  const { isBangla } = useLanguage()
  const { wishlist, addToCart } = useStorefront()

  const add = async (product) => {
    if (requiresPrescriptionLogin(product, customer)) {
      await showPrescriptionLoginRequiredAlert(isBangla)
      return
    }

    try {
      await addToCart({
        product_id: product.id,
        purchase_unit: product.default_purchase_unit || product.purchase_options?.[0]?.code || 'piece',
        quantity: 1,
      })
      toast.success(isBangla ? 'কার্টে যোগ করা হয়েছে।' : 'Added to cart.')
    } catch (error) {
      if (isPrescriptionLoginRequiredError(error)) {
        await showPrescriptionLoginRequiredAlert(isBangla)
        return
      }

      toast.error(isBangla ? 'এই পণ্যটি কার্টে যোগ করা যায়নি।' : 'Could not add this item to the cart.')
    }
  }

  return (
    <>
      <PageHeader title="Wishlist" />

      {!wishlist.length ? (
        <EmptyState title="Wishlist is empty" text="Save products from cards or details pages and they will appear here." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={add} />
          ))}
        </div>
      )}
    </>
  )
}
