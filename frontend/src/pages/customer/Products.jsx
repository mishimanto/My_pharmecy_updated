import ProductGrid from '../../components/customer/ProductGrid'

export default function Products() {
  return (
    <>
      {/* <PageHeader
        title={isBangla ? 'পণ্য' : 'Products'}
        subtitle={isBangla ? 'স্টকে থাকা ফার্মেসি পণ্য খুঁজুন, ফিল্টার করুন এবং সহজে কার্টে যোগ করুন।' : 'Find in-stock pharmacy products, filter them, and add them to cart quickly.'}
      /> */}
      <ProductGrid />
    </>
  )
}
