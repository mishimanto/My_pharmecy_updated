import { FiGift, FiImage, FiPercent, FiPlus, FiToggleLeft } from 'react-icons/fi'

const toolCopy = {
  coupons: {
    title: 'Coupons',
    subtitle: 'Manage discount codes used during checkout.',
    icon: FiPercent,
    stats: [
      ['Active Codes', '0'],
      ['Draft Codes', '0'],
      ['Checkout Ready', 'Config based'],
    ],
    items: ['Code', 'Discount type', 'Minimum subtotal', 'Usage status'],
  },
  offers: {
    title: 'Offers',
    subtitle: 'Prepare promotional offers for products and campaigns.',
    icon: FiGift,
    stats: [
      ['Active Offers', '0'],
      ['Scheduled', '0'],
      ['Placement', 'Storefront'],
    ],
    items: ['Offer title', 'Linked products', 'Start and end date', 'Visibility'],
  },
  heroImages: {
    title: 'Hero Images',
    subtitle: 'Control homepage hero slides and primary promotional visuals.',
    icon: FiImage,
    stats: [
      ['Hero Slides', '0'],
      ['Published', '0'],
      ['Recommended', 'Wide image'],
    ],
    items: ['Desktop image', 'Mobile image', 'Headline', 'Link target'],
  },
  bannerImages: {
    title: 'Banner Images',
    subtitle: 'Manage smaller homepage and campaign banner placements.',
    icon: FiImage,
    stats: [
      ['Banners', '0'],
      ['Active', '0'],
      ['Placement', 'Homepage'],
    ],
    items: ['Banner image', 'Placement', 'Display order', 'Click URL'],
  },
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}

export default function MarketingTools({ type }) {
  const tool = toolCopy[type] || toolCopy.coupons
  const Icon = tool.icon

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-950">{tool.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{tool.subtitle}</p>
          </div>
        </div>
        <button type="button" className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
          <FiPlus className="h-4 w-4" />
          Add New
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {tool.stats.map(([label, value]) => <StatCard key={label} label={label} value={value} />)}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">{tool.title} setup</h2>
          <p className="mt-1 text-xs text-slate-500">Admin controls are ready here; connect database/API fields when the module backend is added.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {tool.items.map((item) => (
            <div key={item} className="flex items-center justify-between gap-3 px-5 py-4 text-sm">
              <span className="font-medium text-slate-700">{item}</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                <FiToggleLeft className="h-4 w-4" />
                Pending backend
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
