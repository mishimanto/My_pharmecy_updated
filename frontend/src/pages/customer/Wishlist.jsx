import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import ProductCard from '../../components/customer/ProductCard'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useStorefront } from '../../context/StorefrontContext'
import { getDefaultPurchaseOption, getOptionUnitLabel } from '../../utils/purchaseUnits'
import { isPrescriptionLoginRequiredError, requiresPrescriptionLogin, showPrescriptionLoginRequiredAlert } from '../../utils/prescriptionCartAlert'

export default function Wishlist() {
  const { customer } = useCustomerAuth()
  const { isBangla } = useLanguage()
  const { wishlist, addToCart } = useStorefront()
  const t = (bn, en) => (isBangla ? bn : en)

  const add = async (product) => {
    const option = getDefaultPurchaseOption(product)
    const unitCode = option?.code || product.default_purchase_unit || product.purchase_options?.[0]?.code || 'piece'
    const unitLabel = getOptionUnitLabel(option || { code: unitCode }, isBangla)

    if (requiresPrescriptionLogin(product, customer)) {
      await showPrescriptionLoginRequiredAlert(isBangla)
      return
    }

    const successToastId = toast.success(t(`\u09E7 ${unitLabel} \u0995\u09BE\u09B0\u09CD\u099F\u09C7 \u09AF\u09CB\u0997 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7\u0964`, `Added 1 ${unitLabel} to cart.`))

    try {
      await addToCart({
        product_id: product.id,
        purchase_unit: unitCode,
        quantity: 1,
      }, {
        product_name: product.product_name,
        product_name_bn: product.product_name_bn,
        generic_name: product.generic_name,
        generic_name_bn: product.generic_name_bn,
        strength: product.strength,
        dosage_form: product.dosage_form,
        requires_prescription: product.requires_prescription,
        image_url: product.primary_image?.image_url || product.images?.[0]?.image_url || null,
        thumbnail_url: product.primary_image?.thumbnail_url || product.images?.[0]?.thumbnail_url || null,
        purchase_unit_label: unitLabel,
        pieces_per_unit: option?.pieces_per_unit || 1,
        conversion_label: option?.conversion_label || '',
        unit_price: option?.unit_price || product.display_price || 0,
        available_stock: product.available_stock || 0,
      })
    } catch (error) {
      toast.dismiss(successToastId)
      if (isPrescriptionLoginRequiredError(error)) {
        await showPrescriptionLoginRequiredAlert(isBangla)
        return
      }

      toast.error(
        t(
          'এই পণ্যটি কার্টে যোগ করা যায়নি।',
          'Could not add this item to the cart.'
        )
      )
    }
  }

  return (
    <>
      <PageHeader title={t('উইশলিস্ট', 'Wishlist')} />

      {!wishlist.length ? (
        <EmptyState
          title={t('উইশলিস্ট খালি', 'Wishlist is empty')}
          text={t('কার্ড বা বিবরণ পৃষ্ঠা থেকে পণ্যগুলি সংরক্ষণ করুন এবং তারা এখানে দেখাবে।', 'Save products from cards or details pages and they will appear here.')}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={add} compact />
          ))}
        </div>
      )}
    </>
  )
}