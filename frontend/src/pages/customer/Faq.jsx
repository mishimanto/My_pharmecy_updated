import ContentPage from '../../components/common/ContentPage'

const sections = [
  {
    title: 'How do I place a medicine order?',
    body: 'Search the catalog, choose your unit and quantity, add products to the cart, then continue into checkout with a saved or guest delivery address.',
  },
  {
    title: 'What if my medicine needs a prescription?',
    body: 'Prescription-required items stay clearly marked. Upload a prescription file and use the approved prescription during checkout.',
  },
  {
    title: 'How can I track an order?',
    body: 'Use the track-order page or open tracking from your order history. Guest tracking works best from the same browser session that placed the order.',
  },
  {
    title: 'Which payment methods are currently available?',
    body: 'The current storefront flow supports cash on delivery and keeps payment status visible from the order details page.',
  },
]

export default function Faq() {
  return <ContentPage eyebrow="Help center" title="Frequently asked questions" subtitle="Common answers about medicine ordering, prescriptions, delivery flow, and customer account activity." sections={sections} />
}
