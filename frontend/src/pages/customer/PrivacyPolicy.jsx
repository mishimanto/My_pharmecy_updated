import ContentPage from '../../components/common/ContentPage'
import { useLanguage } from '../../context/LanguageContext'

const sections = [
  {
    titleBn: 'গ্রাহকের তথ্য',
    titleEn: 'Customer information',
    bodyBn: 'ফার্মেসি অর্ডারিং সেবা চালানোর জন্য গ্রাহকের প্রোফাইল, ডেলিভারি ঠিকানা, অর্ডার রেকর্ড, প্রেসক্রিপশন এবং সাপোর্ট হিস্ট্রি সংরক্ষণ করা হয়।',
    bodyEn: 'The storefront stores customer profile details, delivery addresses, order records, prescriptions, and support history to operate the pharmacy ordering workflow.',
  },
  {
    titleBn: 'প্রেসক্রিপশন ব্যবস্থাপনা',
    titleEn: 'Prescription handling',
    bodyBn: 'প্রেসক্রিপশন আপলোড ফার্মাসিস্ট রিভিউ, সীমিত ওষুধ যাচাই এবং অর্ডার পূরণের জন্য ব্যবহার করা হয়। এগুলো সংবেদনশীল স্বাস্থ্য-সম্পর্কিত রেকর্ড হিসেবে বিবেচিত।',
    bodyEn: 'Prescription uploads are used for pharmacist review, restricted-medicine validation, and order fulfillment. They should be treated as sensitive healthcare-related records.',
  },
  {
    titleBn: 'অর্ডার ও ডেলিভারি ডাটা',
    titleEn: 'Order and delivery data',
    bodyBn: 'অর্ডার স্ট্যাটাস, পেমেন্ট স্ট্যাটাস, ডেলিভারি অ্যাসাইনমেন্ট এবং নোটিফিকেশন সংরক্ষণ করা হয়, যাতে গ্রাহক অগ্রগতি দেখতে এবং সাপোর্ট নিতে পারেন।',
    bodyEn: 'Order status, payment status, delivery assignments, and notifications are retained so customers can review progress and receive support.',
  },
  {
    titleBn: 'অ্যাকাউন্ট নিরাপত্তা',
    titleEn: 'Account protection',
    bodyBn: 'গ্রাহকের উচিত লগইন তথ্য নিরাপদ রাখা এবং সঠিক যোগাযোগের তথ্য ব্যবহার করা, যাতে ফার্মেসির বার্তা সঠিক ব্যক্তির কাছে পৌঁছায়।',
    bodyEn: 'Customers should protect their login credentials and use updated contact information so pharmacy communication reaches the right person.',
  },
  {
    titleBn: 'তথ্য ব্যবহারের উদ্দেশ্য',
    titleEn: 'How information is used',
    bodyBn: 'তথ্য ব্যবহার করা হয় অর্ডার প্রসেসিং, প্রেসক্রিপশন যাচাই, ডেলিভারি সমন্বয়, পেমেন্ট আপডেট এবং গ্রাহক সাপোর্টের জন্য।',
    bodyEn: 'Information is used for order processing, prescription checks, delivery coordination, payment updates, and customer support.',
  },
]

export default function PrivacyPolicy() {
  const { isBangla } = useLanguage()
  const t = (bn, en) => (isBangla ? bn : en)
  const localizedSections = sections.map((section) => ({
    title: t(section.titleBn, section.titleEn),
    body: t(section.bodyBn, section.bodyEn),
  }))

  return (
    <ContentPage
      eyebrow={t('নীতিমালা', 'Policy')}
      title={t('প্রাইভেসি পলিসি', 'Privacy policy')}
      subtitle={t('এই ফার্মেসি স্টোরফ্রন্টে গ্রাহক, প্রেসক্রিপশন, অর্ডার ও ডেলিভারি তথ্য কীভাবে ব্যবহার করা হয়।', 'How customer, prescription, order, and delivery information is used inside this pharmacy storefront.')}
      sections={localizedSections}
    />
  )
}
