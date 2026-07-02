import { ProductCardSkeleton } from '../ProductCard'

function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse bg-[#d6ece8] ${className}`} />
}

function SkeletonSectionHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl space-y-3">
        <SkeletonBlock className="h-8 w-52 sm:h-10 sm:w-72" />
      </div>
    </div>
  )
}

function SkeletonTrustItem() {
  return (
    <div className="flex items-start gap-4 bg-white px-4 py-4 sm:px-5">
      <SkeletonBlock className="h-12 w-12 shrink-0 border border-[#d8efeb] bg-[#effaf8]" />
      <div className="min-w-0 flex-1 space-y-2">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-2/3" />
      </div>
    </div>
  )
}

function SkeletonCategoryCard() {
  return (
    <div className="overflow-hidden border border-[#d4ebe7] bg-white shadow-[0_20px_42px_-34px_rgba(8,63,73,0.22)]">
      <SkeletonBlock className="aspect-[1.08/0.88] w-full bg-[#e8f5f2]" />
      <div className="px-2.5 py-2.5 sm:px-4 sm:py-4">
        <SkeletonBlock className="mx-auto h-4 w-4/5" />
      </div>
    </div>
  )
}

function SkeletonManufacturerCard({ compact = false }) {
  return (
    <div
      className={`flex items-center gap-3 border border-[#d9ece8] bg-white/90 shadow-[0_18px_34px_-30px_rgba(8,63,73,0.18)] ${
        compact ? 'px-2 py-2' : 'px-3 py-3'
      }`}
    >
      <SkeletonBlock className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} shrink-0 border border-[#d6ece8] bg-[#eef9f7]`} />
      <div className="min-w-0 flex-1">
        <SkeletonBlock className={`${compact ? 'h-3.5' : 'h-4'} w-3/4`} />
      </div>
    </div>
  )
}

function SkeletonProductRow({ titleWidth = 'w-48' }) {
  return (
    <div className="mb-10 lg:mb-15">
      <div className="flex items-center justify-between gap-4 pb-4">
        <SkeletonBlock className={`h-7 ${titleWidth}`} />
        <SkeletonBlock className="hidden h-4 w-16 sm:block" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <ProductCardSkeleton key={index} compact />
        ))}
      </div>
    </div>
  )
}

export default function HomePageSkeleton() {
  return (
    <div className="bg-[linear-gradient(180deg,#f3fcfa_0%,#f9fcfb_26%,#eef8f6_56%,#f7fbfa_100%)] text-slate-900">
      <section className="relative overflow-hidden bg-[#052b34]">
        <div className="absolute inset-0 bg-[linear-gradient(92deg,rgba(5,34,42,0.96)_0%,rgba(6,49,59,0.86)_36%,rgba(11,93,104,0.50)_64%,rgba(19,184,176,0.18)_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 sm:pb-18 sm:pt-16 lg:px-8 lg:pb-22 lg:pt-20 xl:pb-30 xl:pt-24">
          <div className="max-w-3xl">
            <SkeletonBlock className="h-8 w-32 bg-white/16 sm:h-10 sm:w-40" />
            <div className="mt-5 space-y-4 sm:mt-6">
              <SkeletonBlock className="h-10 w-full max-w-2xl bg-white/16 sm:h-14" />
              <SkeletonBlock className="h-10 w-5/6 max-w-xl bg-white/10 sm:h-14" />
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
              <SkeletonBlock className="h-12 w-full max-w-44 bg-white/18 sm:h-13" />
              <SkeletonBlock className="h-12 w-full max-w-48 bg-white/12 sm:h-13" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-9 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-px overflow-hidden border border-[#c6ebe6] bg-[#cfeee9] shadow-[0_32px_80px_-46px_rgba(8,63,73,0.48)] sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonTrustItem key={index} />
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="my-8 grid grid-cols-1 overflow-hidden bg-slate-100 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-[170px] border border-[#d9ece8] bg-[#d7ebe8] sm:h-[190px] lg:h-[220px]" />
          ))}
        </section>

        <section className="pb-10 pt-6">
          <SkeletonSectionHeader />
          <div className="mt-7 grid grid-cols-3 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <SkeletonCategoryCard key={index} />
            ))}
          </div>
        </section>

        <section className="pb-10 pt-2">
          <div className="overflow-hidden border border-[#d8ece9] bg-white shadow-[0_26px_56px_-40px_rgba(8,63,73,0.12)]">
            <div className="border-b border-[#e3f1ee] px-4 py-4 sm:px-6 sm:py-5">
              <SkeletonSectionHeader />
            </div>

            <div className="grid gap-2 p-3 sm:hidden">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonManufacturerCard key={index} compact />
              ))}
            </div>

            <div className="hidden gap-3 p-4 sm:grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonManufacturerCard key={index} />
              ))}
            </div>
          </div>
        </section>

        <section>
          <SkeletonSectionHeader />
          <div className="mt-2 space-y-10">
            <SkeletonProductRow titleWidth="w-44" />
            <SkeletonProductRow titleWidth="w-40" />
          </div>
        </section>

        <section className="pb-10">
          <div className="mt-7 grid gap-6 lg:grid-cols-[0.96fr_1.04fr] lg:items-stretch">
            <div className="overflow-hidden border border-[#d8ece9] bg-white shadow-[0_30px_70px_-42px_rgba(8,63,73,0.18)]">
              <SkeletonBlock className="h-[18rem] w-full bg-[#d7ece8] sm:h-[22rem] lg:h-full lg:min-h-96" />
            </div>

            <div className="border border-[#d8ece9] bg-white p-4 shadow-lg sm:p-5 lg:p-6">
              <div className="mb-6 flex justify-center sm:mb-8">
                <SkeletonBlock className="h-7 w-40" />
              </div>

              <div className="space-y-3 sm:space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="border border-[#e2f1ee] bg-[#fbfefd] p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex flex-1 gap-3 sm:gap-4">
                        <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full bg-[#d6ece8] sm:h-10 sm:w-10" />
                        <div className="flex-1 space-y-3">
                          <SkeletonBlock className="h-5 w-40" />
                          <SkeletonBlock className="h-4 w-full" />
                          <SkeletonBlock className="h-4 w-4/5" />
                        </div>
                      </div>
                      <SkeletonBlock className="h-10 w-10 shrink-0 bg-[#eef9f7] sm:h-11 sm:w-11" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pb-10 pt-2">
          <div className="overflow-hidden border border-[#0f5e69]/20 bg-[linear-gradient(135deg,#06252d_0%,#0a4d59_48%,#0f7680_100%)] px-5 py-7 shadow-[0_34px_90px_-30px_rgba(8,63,73,0.62)] sm:px-8 sm:py-10 xl:px-10">
            <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
              <div>
                <SkeletonBlock className="h-8 w-full max-w-2xl bg-white/18 sm:h-10" />
                <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
                  <SkeletonBlock className="h-11 w-52 bg-white/12" />
                  <SkeletonBlock className="h-11 w-40 bg-white/12" />
                </div>
              </div>

              <div className="grid gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-14 w-full bg-white/10" />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
