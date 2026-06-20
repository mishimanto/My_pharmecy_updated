import { FiGift, FiImage, FiPercent } from 'react-icons/fi'

export const toolCopy = {
  coupons: {
    title: 'Coupons',
    subtitle: 'Manage discount codes used during checkout.',
    icon: FiPercent,
    stats: [['Active Codes', '0'], ['Draft Codes', '0'], ['Checkout Ready', 'Config based']],
    items: ['Code', 'Discount type', 'Minimum subtotal', 'Usage status'],
  },
  offers: {
    title: 'Offers',
    subtitle: 'Prepare promotional offers for products and campaigns.',
    icon: FiGift,
    stats: [['Active Offers', '0'], ['Scheduled', '0'], ['Placement', 'Storefront']],
    items: ['Offer title', 'Linked products', 'Start and end date', 'Visibility'],
  },
  popups: {
    title: 'Popups',
    subtitle: 'Manage the storefront entry popup independently from offers.',
    icon: FiGift,
  },
  heroImages: {
    title: 'Hero Images',
    subtitle: 'Control homepage hero slides and primary promotional visuals.',
    icon: FiImage,
  },
  bannerImages: {
    title: 'Banner Images',
    subtitle: 'Manage smaller homepage and campaign banner placements.',
    icon: FiImage,
    stats: [['Banners', '0'], ['Active', '0'], ['Placement', 'Homepage']],
    items: ['Banner image', 'Placement', 'Display order', 'Click URL'],
  },
}
