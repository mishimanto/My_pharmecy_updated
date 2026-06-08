import ContentPage from '../../components/common/ContentPage'

const sections = [
  {
    title: 'Return request eligibility',
    body: 'Return requests should be submitted against a completed order through the returns area, with a clear reason and any relevant order-item context.',
  },
  {
    title: 'Refund review flow',
    body: 'Approved returns can move into refund handling through the admin workflow, where payment status and refund status are updated together.',
  },
  {
    title: 'Prescription-sensitive items',
    body: 'Returns or refunds involving prescription products may require extra review because of product-safety and pharmacy handling constraints.',
  },
  {
    title: 'Customer support coordination',
    body: 'If a return or refund is unclear, customers should use the support center so pharmacy staff can review order details before the request is finalized.',
  },
]

export default function RefundPolicy() {
  return <ContentPage eyebrow="Policy" title="Refund and return policy" subtitle="How return requests and refund handling work in the pharmacy storefront." sections={sections} />
}
