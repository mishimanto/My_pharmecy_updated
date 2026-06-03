import PageHeader from '../../components/common/PageHeader'
import ProductGrid from '../../components/customer/ProductGrid'

export default function Products() {
  return (
    <>
      <PageHeader title="ওষুধ" subtitle="স্টকে থাকা সক্রিয় ওষুধ খুঁজুন, ফিল্টার করুন এবং কার্টে যোগ করুন।" />
      <ProductGrid />
    </>
  )
}
