import ContentPage from '../../components/common/ContentPage'

const sections = [
  {
    title: 'Using the storefront',
    body: 'Customers should provide accurate personal, delivery, and prescription information while using the pharmacy ordering system.',
  },
  {
    title: 'Prescription medicines',
    body: 'Restricted products may require valid prescription review before fulfillment. Orders can be held or adjusted if pharmacy review requires clarification.',
  },
  {
    title: 'Order flow and delivery',
    body: 'Submitted orders enter the pharmacy order-status workflow and may move through review, confirmation, packing, delivery, cancellation, or return handling.',
  },
  {
    title: 'Support and returns',
    body: 'Complaints, delivery issues, and return requests should be submitted through the support or returns sections so the pharmacy team can review them properly.',
  },
]

export default function TermsConditions() {
  return <ContentPage eyebrow="Policy" title="Terms and conditions" subtitle="Core storefront terms for medicine ordering, prescription use, delivery, and support handling." sections={sections} />
}
