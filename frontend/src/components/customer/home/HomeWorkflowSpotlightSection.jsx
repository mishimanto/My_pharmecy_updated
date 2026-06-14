import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { money } from '../../../utils/formatters'
import { handleImageFallback } from '../../../utils/imageUrl'
import { getProductPath } from '../../../utils/productRouting'
import HomeSectionHeader from './HomeSectionHeader'
import { getProductImage, resolveImage } from './homeUtils'

export default function HomeWorkflowSpotlightSection({
  isBangla,
  spotlightProduct,
  workflowSteps,
  manufacturerHighlights,
}) {
  const spotlightImage = getProductImage(spotlightProduct)

  return (
    <section className="grid gap-6 pb-16 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[300px] lg:min-h-[380px]">
            <img
              src={spotlightImage}
              alt={spotlightProduct?.product_name || (isBangla ? 'নির্বাচিত ওষুধ' : 'Featured medicine')}
              className="absolute inset-0 h-full w-full object-cover"
              onError={handleImageFallback}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05),rgba(15,23,42,0.75))]" />
            <div className="relative flex min-h-[300px] flex-col justify-end p-6 text-white lg:min-h-[380px]">
              
              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {spotlightProduct?.product_name || (isBangla ? 'জনপ্রিয় ওষুধ' : 'Popular medicine display')}
              </h3>
              {spotlightProduct ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur-sm">
                    {money(spotlightProduct.display_price)}
                  </span>
                  <Link
                    to={getProductPath(spotlightProduct)}
                    state={{ product: spotlightProduct }}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
                  >
                    {isBangla ? 'পণ্য দেখুন' : 'View product'}
                    <FiArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : null}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0e6574]">{isBangla ? '৩ ধাপে আপনার অর্ডার' : 'Three steps to your order'}</p>
            {/* <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{isBangla ? '৩ ধাপে আপনার অর্ডার' : 'Three steps to your order'}</h2> */}
            <div className="mt-6 space-y-4">
              {workflowSteps.map((item) => {
                const Icon = item.icon

                return (
                  <div key={item.step} className="flex gap-4 border border-slate-100 bg-slate-50/80 p-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[11px] font-bold text-[#13b8b0]">{item.step}</span>
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0e6574] shadow-sm">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-950">{item.title}</h3>
                      <p className="mt-1 text-sm leading-7 text-slate-500">{item.body}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <HomeSectionHeader title={isBangla ? 'জনপ্রিয় নির্মাতা' : 'Popular manufacturers'} />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {manufacturerHighlights.map((manufacturer) => (
              <div key={manufacturer.id} className="flex items-center gap-3 rounded-[14px] border border-slate-100 bg-slate-50/80 p-3.5">
                <img
                  src={resolveImage(manufacturer.logo_url)}
                  alt={manufacturer.manufacturer_name}
                  className="h-11 w-11 border border-slate-200 object-cover"
                  onError={handleImageFallback}
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-950">{manufacturer.manufacturer_name}</div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">{isBangla ? 'নির্মাতা' : 'Manufacturer'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* <div className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <HomeSectionHeader
            eyebrow={isBangla ? 'কেন My Pharmecy' : 'Why My Pharmecy'}
            title={isBangla ? 'সাধারণ ইকমার্স নয়, ফার্মেসির জন্য তৈরি' : 'Built for pharmacy, not generic ecommerce'}
          />
          <div className="mt-6 space-y-3">
            {serviceItems.map((item) => {
              const Icon = item.icon

              return (
                <div key={item.title} className="flex gap-4 rounded-[16px] border border-slate-100 bg-slate-50/80 p-4">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eefbfa] text-[#0e6574]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-950">{item.title}</h3>
                    <p className="mt-1 text-sm leading-7 text-slate-500">{item.body}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div> */}
      </div>
    </section>
  )
}
