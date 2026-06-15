import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import ProductCard from '../../components/customer/ProductCard'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useStorefront } from '../../context/StorefrontContext'
import { getDefaultPurchaseOption, getUnitLabel } from '../../utils/purchaseUnits'
import { isPrescriptionLoginRequiredError, requiresPrescriptionLogin, showPrescriptionLoginRequiredAlert } from '../../utils/prescriptionCartAlert'

export default function Wishlist() {
  const { customer } = useCustomerAuth()
  const { isBangla } = useLanguage()
  const { wishlist, addToCart } = useStorefront()
  const t = (bn, en) => (isBangla ? bn : en)

  const add = async (product) => {
    const option = getDefaultPurchaseOption(product)
    const unitCode = option?.code || product.default_purchase_unit || product.purchase_options?.[0]?.code || 'piece'
    const unitLabel = getUnitLabel(unitCode, isBangla)

    if (requiresPrescriptionLogin(product, customer)) {
      await showPrescriptionLoginRequiredAlert(isBangla)
      return
    }

    try {
      await addToCart({
        product_id: product.id,
        purchase_unit: unitCode,
        quantity: 1,
      })
      toast.success(t(`১ ${unitLabel} কার্টে যোগ করা হয়েছে।`, `Added 1 ${unitLabel} to cart.`))
    } catch (error) {
      if (isPrescriptionLoginRequiredError(error)) {
        await showPrescriptionLoginRequiredAlert(isBangla)
        return
      }

      toast.error(t('এই পণ্যটি কার্টে যোগ করা যায়নি।', 'Could not add this item to the cart.'))
    }
  }

  return (
    <>
      <PageHeader title={t('উইশলিস্ট', 'Wishlist')} />

      {!wishlist.length ? (
        <EmptyState
          title={t('উইশলিস্ট খালি', 'Wishlist is empty')}
          text={t('পণ্যের কার্ড বা বিস্তারিত পেজ থেকে পছন্দের পণ্য রাখুন, সেগুলো এখানে দেখাবে।', 'Save products from cards or details pages and they will appear here.')}
        />
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
