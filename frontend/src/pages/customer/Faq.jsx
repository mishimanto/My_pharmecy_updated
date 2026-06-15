import ContentPage from '../../components/common/ContentPage'
import { useLanguage } from '../../context/LanguageContext'

const sections = [
  {
    titleBn: 'কিভাবে ওষুধ অর্ডার করব?',
    titleEn: 'How do I place a medicine order?',
    bodyBn: 'ক্যাটালগে পণ্য খুঁজুন, ইউনিট ও পরিমাণ বেছে কার্টে যোগ করুন, তারপর সেভ করা ঠিকানা বা গেস্ট ডেলিভারি ঠিকানা দিয়ে চেকআউট সম্পন্ন করুন।',
    bodyEn: 'Search the catalog, choose your unit and quantity, add products to the cart, then continue into checkout with a saved or guest delivery address.',
  },
  {
    titleBn: 'কোনো ওষুধে প্রেসক্রিপশন লাগলে কী করব?',
    titleEn: 'What if my medicine needs a prescription?',
    bodyBn: 'যে পণ্যে প্রেসক্রিপশন প্রয়োজন সেটি স্পষ্টভাবে চিহ্নিত থাকে। প্রেসক্রিপশন ফাইল আপলোড করুন এবং চেকআউটের সময় অনুমোদিত প্রেসক্রিপশন নির্বাচন করুন।',
    bodyEn: 'Prescription-required items stay clearly marked. Upload a prescription file and use the approved prescription during checkout.',
  },
  {
    titleBn: 'অর্ডার কিভাবে ট্র্যাক করব?',
    titleEn: 'How can I track an order?',
    bodyBn: 'ট্র্যাক অর্ডার পেজ ব্যবহার করুন অথবা অর্ডার হিস্ট্রি থেকে ট্র্যাকিং খুলুন। গেস্ট অর্ডারের ক্ষেত্রে যে ব্রাউজার থেকে অর্ডার করা হয়েছে, সেখান থেকেই ট্র্যাক করা সবচেয়ে ভালো।',
    bodyEn: 'Use the track-order page or open tracking from your order history. Guest tracking works best from the same browser session that placed the order.',
  },
  {
    titleBn: 'কোন পেমেন্ট মেথড পাওয়া যায়?',
    titleEn: 'Which payment methods are currently available?',
    bodyBn: 'বর্তমানে ক্যাশ অন ডেলিভারি এবং ফুল পেমেন্ট অপশন সাপোর্ট করা হয়। অর্ডার ডিটেইলস পেজ থেকে পেমেন্ট স্ট্যাটাস দেখা যায়।',
    bodyEn: 'The storefront supports cash on delivery and available full-payment options while keeping payment status visible from the order details page.',
  },
  {
    titleBn: 'কুপন কোথায় ব্যবহার করব?',
    titleEn: 'Where can I use a coupon?',
    bodyBn: 'চেকআউট পেজের অর্ডার সামারিতে কুপন কোড লিখে অ্যাপ্লাই করুন। কুপন সঠিক হলে ছাড় মোট টাকার মধ্যে দেখাবে।',
    bodyEn: 'Use the coupon field inside the checkout order summary. If the code is valid, the discount appears in the final total.',
  },
]

export default function Faq() {
  const { isBangla } = useLanguage()
  const t = (bn, en) => (isBangla ? bn : en)
  const localizedSections = sections.map((section) => ({
    title: t(section.titleBn, section.titleEn),
    body: t(section.bodyBn, section.bodyEn),
  }))

  return (
    <ContentPage
      eyebrow={t('সহায়তা কেন্দ্র', 'Help center')}
      title={t('সাধারণ প্রশ্নোত্তর', 'Frequently asked questions')}
      subtitle={t('ওষুধ অর্ডার, প্রেসক্রিপশন, ডেলিভারি, পেমেন্ট ও অ্যাকাউন্ট সম্পর্কিত সাধারণ উত্তর।', 'Common answers about medicine ordering, prescriptions, delivery, payments, and account activity.')}
      sections={localizedSections}
      variant="faq"
    />
  )
}
