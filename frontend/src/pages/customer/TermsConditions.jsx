import ContentPage from '../../components/common/ContentPage'
import { useLanguage } from '../../context/LanguageContext'

const sections = [
  {
    titleBn: 'স্টোরফ্রন্ট ব্যবহার',
    titleEn: 'Using the storefront',
    bodyBn: 'ফার্মেসি অর্ডারিং সিস্টেম ব্যবহার করার সময় গ্রাহককে সঠিক ব্যক্তিগত, ডেলিভারি এবং প্রেসক্রিপশন তথ্য দিতে হবে।',
    bodyEn: 'Customers should provide accurate personal, delivery, and prescription information while using the pharmacy ordering system.',
  },
  {
    titleBn: 'প্রেসক্রিপশন ওষুধ',
    titleEn: 'Prescription medicines',
    bodyBn: 'সীমিত পণ্য সরবরাহের আগে বৈধ প্রেসক্রিপশন রিভিউ প্রয়োজন হতে পারে। ফার্মেসি রিভিউতে অতিরিক্ত তথ্য লাগলে অর্ডার হোল্ড বা সংশোধন করা হতে পারে।',
    bodyEn: 'Restricted products may require valid prescription review before fulfillment. Orders can be held or adjusted if pharmacy review requires clarification.',
  },
  {
    titleBn: 'অর্ডার ফ্লো ও ডেলিভারি',
    titleEn: 'Order flow and delivery',
    bodyBn: 'সাবমিট করা অর্ডার ফার্মেসির স্ট্যাটাস ওয়ার্কফ্লোতে যায় এবং রিভিউ, কনফার্মেশন, প্যাকিং, ডেলিভারি, ক্যানসেল বা রিটার্ন ধাপে যেতে পারে।',
    bodyEn: 'Submitted orders enter the pharmacy order-status workflow and may move through review, confirmation, packing, delivery, cancellation, or return handling.',
  },
  {
    titleBn: 'সাপোর্ট ও রিটার্ন',
    titleEn: 'Support and returns',
    bodyBn: 'অভিযোগ, ডেলিভারি সমস্যা বা রিটার্ন অনুরোধ সাপোর্ট বা রিটার্ন সেকশন দিয়ে জমা দিতে হবে, যাতে ফার্মেসি টিম সঠিকভাবে রিভিউ করতে পারে।',
    bodyEn: 'Complaints, delivery issues, and return requests should be submitted through the support or returns sections so the pharmacy team can review them properly.',
  },
  {
    titleBn: 'পেমেন্ট ও কুপন',
    titleEn: 'Payments and coupons',
    bodyBn: 'অর্ডার কনফার্ম করার আগে পেমেন্ট মেথড এবং প্রযোজ্য কুপন যাচাই করুন। কুপন ব্যবহারের শর্ত পূরণ না হলে ছাড় প্রযোজ্য হবে না।',
    bodyEn: 'Review the payment method and any coupon before confirming an order. Coupon discounts only apply when the coupon conditions are met.',
  },
]

export default function TermsConditions() {
  const { isBangla } = useLanguage()
  const t = (bn, en) => (isBangla ? bn : en)
  const localizedSections = sections.map((section) => ({
    title: t(section.titleBn, section.titleEn),
    body: t(section.bodyBn, section.bodyEn),
  }))

  return (
    <ContentPage
      eyebrow={t('নীতিমালা', 'Policy')}
      title={t('শর্তাবলি', 'Terms and conditions')}
      subtitle={t('ওষুধ অর্ডার, প্রেসক্রিপশন ব্যবহার, ডেলিভারি, পেমেন্ট এবং সাপোর্ট ব্যবস্থাপনার মূল শর্ত।', 'Core storefront terms for medicine ordering, prescription use, delivery, payments, and support handling.')}
      sections={localizedSections}
    />
  )
}
