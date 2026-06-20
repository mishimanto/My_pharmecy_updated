import { FiToggleLeft } from 'react-icons/fi'
import BannerImagesTool from './marketing/BannerImagesTool'
import CouponsTool from './marketing/CouponsTool'
import HeroImagesTool from './marketing/HeroImagesTool'
import OffersTool from './marketing/OffersTool'
import PopupsTool from './marketing/PopupsTool'
import { toolCopy } from './marketing/marketingConfig'
import { StatCard, ToolHeader } from './marketing/shared'

export default function MarketingTools({ type }) {
  if (type === 'coupons') return <CouponsTool />
  if (type === 'offers') return <OffersTool />
  if (type === 'popups') return <PopupsTool />
  if (type === 'heroImages') return <HeroImagesTool />
  if (type === 'bannerImages') return <BannerImagesTool />

  const tool = toolCopy[type] || toolCopy.coupons
  const Icon = tool.icon

  return (
    <div className="space-y-5">
      <ToolHeader tool={tool} icon={Icon} />
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
