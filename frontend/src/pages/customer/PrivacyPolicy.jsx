import ContentPage from '../../components/common/ContentPage'

const sections = [
  {
    title: 'Customer information',
    body: 'The storefront stores customer profile details, delivery addresses, order records, prescriptions, and support history to operate the pharmacy ordering workflow.',
  },
  {
    title: 'Prescription handling',
    body: 'Prescription uploads are used for pharmacist review, restricted-medicine validation, and order fulfillment. They should be treated as sensitive healthcare-related records.',
  },
  {
    title: 'Order and delivery data',
    body: 'Order status, payment status, delivery assignments, and notifications are retained so customers can review progress and receive support.',
  },
  {
    title: 'Account protection',
    body: 'Customers should protect their login credentials and use updated contact information so pharmacy communication reaches the right person.',
  },
]

export default function PrivacyPolicy() {
  return <ContentPage eyebrow="Policy" title="Privacy policy" subtitle="How customer, prescription, order, and delivery information is used inside this pharmacy storefront." sections={sections} />
}
