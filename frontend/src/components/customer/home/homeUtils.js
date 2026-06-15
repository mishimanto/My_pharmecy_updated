import { getProductImage as getProductImageFromUrl, resolveImageUrl } from '../../../utils/imageUrl'

export const categoryTints = [
  'from-teal-50 via-white to-white',
  'from-sky-50 via-white to-white',
  'from-emerald-50 via-white to-white',
  'from-amber-50 via-white to-white',
  'from-cyan-50 via-white to-white',
  'from-rose-50 via-white to-white',
  'from-violet-50 via-white to-white',
  'from-lime-50 via-white to-white',
]

export function resolveImage(path) {
  return resolveImageUrl(path)
}

export function getProductImage(product) {
  return getProductImageFromUrl(product)
}

export function getHeroSlides(isBangla) {
  return [
    {
      id: 1,
      eyebrow: isBangla ? 'প্রেসক্রিপশনসহ নিরাপদ অর্ডার' : 'Prescription-aware ordering',
      title: isBangla ? 'বাংলাদেশের বিশ্বস্ত অনলাইন ফার্মেসি।' : 'Your trusted online pharmacy in Bangladesh.',
      titleBn: isBangla ? 'বাংলাদেশের বিশ্বস্ত অনলাইন ফার্মেসি' : 'Trusted online pharmacy',
      body: isBangla
        ? 'ওষুধ খুঁজুন, প্রেসক্রিপশন আপলোড করুন, আর ঘরে বসেই ডেলিভারি নিন। সবকিছু এক জায়গায় সহজভাবে সাজানো।'
        : 'Browse medicines, upload prescriptions, and get doorstep delivery from one clean pharmacy-first storefront.',
      image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1600&q=80',
    },
    {
      id: 2,
      eyebrow: isBangla ? 'রিভিউ ও সহায়তা' : 'Review and support',
      title: isBangla ? 'প্রেসক্রিপশন আপলোড, রিভিউ ও ডেলিভারি এক জায়গায়।' : 'Prescription upload, review, and delivery in one place.',
      titleBn: isBangla ? 'প্রেসক্রিপশন আপলোড, রিভিউ ও ডেলিভারি' : 'Prescription and delivery support',
      body: isBangla
        ? 'নিরাপদভাবে প্রেসক্রিপশন জমা দিন। আমাদের ফার্মেসি টিম রিভিউ করার পর নিশ্চিন্তে প্রয়োজনীয় ওষুধ অর্ডার করুন।'
        : 'Submit your prescription securely. Our pharmacy team reviews it so you can order restricted medicines with confidence.',
      image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=1600&q=80',
    },
    {
      id: 3,
      eyebrow: isBangla ? 'দ্রুত ওষুধ খুজুন' : 'Fast medicine discovery',
      title: isBangla ? 'নাম, জেনেরিক বা ক্যাটাগরি দিয়ে ওষুধ খুঁজুন।' : 'Find medicines by name, generic, or category.',
      titleBn: isBangla ? 'নাম, জেনেরিক, বা ক্যাটাগরি দিয়ে ওষুধ খুঁজুন' : 'Search by name, generic, or category',
      body: isBangla
        ? 'ওটিসি ও প্রেসক্রিপশন দুই ধরনের পণ্যই সহজে খুঁজুন, স্টক দেখুন, আর কয়েক সেকেন্ডে কার্টে যোগ করুন।'
        : 'Search across OTC essentials and prescription products, compare units, check stock, and add to cart in seconds.',
      image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1600&q=80',
    },
  ]
}
