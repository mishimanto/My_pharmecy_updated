const CATEGORY_NAME_TRANSLATIONS = {
  'Cardiac Care': 'কার্ডিয়াক কেয়ার',
  'Child Care': 'চাইল্ড কেয়ার',
  'Diabetes Care': 'ডায়াবেটিস কেয়ার',
  'Gastric Care': 'গ্যাস্ট্রিক কেয়ার',
  'Pain Relief': 'ব্যথা উপশম',
  'Prescription Medicines': 'প্রেসক্রিপশন পণ্য',
  'Prescription Products': 'প্রেসক্রিপশন পণ্য',
  'Respiratory': 'শ্বাসযন্ত্রিক',
  'Skin Care': 'ত্বকের যত্ন',
  'Vitamins & Supplements': 'ভিটামিন ও সাপ্লিমেন্ট',
  "Women's Health": 'মহিলাদের স্বাস্থ্য',
  'Medical Devices': 'মেডিকেল ডিভাইস',
  'First Aid & Hygiene': 'ফার্স্ট এইড ও হাইজিন',
  'Mother & Baby Care': 'মা ও শিশু যত্ন',
  'Personal Care': 'পার্সোনাল কেয়ার',
}

export function getCategoryName(category, isBangla = false, fallback = null) {
  const effectiveFallback = fallback ?? (isBangla ? 'স্বাস্থ্যসেবা' : 'Healthcare')
  if (!category) return effectiveFallback

  const categoryName = typeof category === 'string' ? category : category.category_name || ''
  if (!categoryName) return effectiveFallback

  if (!isBangla) {
    return categoryName
  }

  if (typeof category === 'object' && category.category_name_bn) {
    return category.category_name_bn
  }

  return CATEGORY_NAME_TRANSLATIONS[categoryName] || categoryName
}
