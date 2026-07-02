import { getProductThumbnail, resolveImageUrl } from '../../../utils/imageUrl'

export const categoryTints = [
  'from-[#dff8f4] via-[#f4fffd] to-[#eaf7f4]',
  'from-[#e6f4ff] via-[#f8fcff] to-[#e9f7fb]',
  'from-[#e5f8ed] via-[#fbfffd] to-[#eaf8f0]',
  'from-[#fff4dd] via-[#fffdf8] to-[#f6f0e4]',
  'from-[#dff7fb] via-[#f7fffd] to-[#e7f7f8]',
  'from-[#fce8ee] via-[#fffafa] to-[#f6eef1]',
  'from-[#eeeaff] via-[#fbfaff] to-[#f0f4fb]',
  'from-[#edf8d8] via-[#fdfff8] to-[#eef7e5]',
]

export function resolveImage(path) {
  return resolveImageUrl(path)
}

export function getProductImage(product) {
  return getProductThumbnail(product)
}

export function getHeroSlides(isBangla) {
  return [
    {
      id: 1,
      eyebrow: isBangla ? 'প্রেসক্রিপশনসহ নিরাপদ অর্ডার' : 'Prescription-aware ordering',
      title: isBangla ? 'বিশ্বস্ত অনলাইন ফার্মেসি।' : 'Your trusted online pharmacy',
      titleBn: isBangla ? 'বিশ্বস্ত অনলাইন ফার্মেসি' : 'Trusted online pharmacy',
      body: isBangla
        ? 'ফার্মেসি পণ্য খুঁজুন, প্রেসক্রিপশন আপলোড করুন, আর ঘরে বসেই ডেলিভারি নিন। সবকিছু এক জায়গায় সহজভাবে সাজানো।'
        : 'Browse pharmacy products, upload prescriptions, and get doorstep delivery from one clean storefront.',
      image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1600&q=80',
    },
    {
      id: 2,
      eyebrow: isBangla ? 'রিভিউ ও সাপোর্ট' : 'Review and support',
      title: isBangla ? 'প্রেসক্রিপশন আপলোড, রিভিউ ও ডেলিভারি এক জায়গায়।' : 'Prescription upload, review, and delivery in one place.',
      titleBn: isBangla ? 'প্রেসক্রিপশন আপলোড, রিভিউ ও ডেলিভারি' : 'Prescription and delivery support',
      body: isBangla
        ? 'নিরাপদভাবে প্রেসক্রিপশন জমা দিন। নিশ্চিন্তে প্রয়োজনীয় ওষুধ অর্ডার করুন।'
        : 'Submit your prescription securely. Order prescription medicine with confidence.',
      image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=1600&q=80',
    },
    {
      id: 3,
      eyebrow: isBangla ? 'দ্রুত পণ্য খুঁজুন' : 'Fast product discovery',
      title: isBangla ? 'নাম, জেনেরিক বা ক্যাটাগরি দিয়ে ওষুধ খুঁজুন।' : 'Find medicines by name, generic, or category.',
      titleBn: isBangla ? 'নাম, জেনেরিক বা ক্যাটাগরি দিয়ে ওষুধ খুঁজুন' : 'Search by name, generic, or category',
      body: isBangla
        ? 'ওটিসি ও প্রেসক্রিপশন দুই ধরনের ওষুধই সহজে খুঁজুন, স্টক দেখুন, আর কয়েক সেকেন্ডে কার্টে যোগ করুন।'
        : 'Search across OTC essentials and prescription medicines, compare units, check stock, and add to cart in seconds.',
      image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1600&q=80',
    },
  ]
}
