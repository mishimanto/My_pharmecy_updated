import ProductGrid from '../../components/customer/ProductGrid'

export default function Products() {
  return (
    <>
      {/* <PageHeader
        title={isBangla ? 'ওষুধ' : 'Medicines'}
        subtitle={isBangla ? 'স্টকে থাকা ওষুধ খুঁজুন, ফিল্টার করুন এবং সহজে কার্টে যোগ করুন।' : 'Find in-stock medicines, filter them, and add them to cart quickly.'}
      /> */}
      <ProductGrid />
    </>
  )
}
