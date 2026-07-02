import { useEffect, useMemo, useRef, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { money } from '../../../utils/formatters'
import { handleImageFallback } from '../../../utils/imageUrl'
import { getProductPath } from '../../../utils/productRouting'
import { getProductImage } from './homeUtils'

export default function HomeWorkflowSpotlightSection({
  isBangla,
  spotlightProducts = [],
  workflowSteps,
}) {
  const banglaFontClass = isBangla ? 'font-bangla' : ''
  const validSpotlightProducts = useMemo(
    () => (Array.isArray(spotlightProducts) ? spotlightProducts : []),
    [spotlightProducts],
  )
  const [currentSpotlightIndex, setCurrentSpotlightIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const transitionTimerRef = useRef(null)
  const intervalRef = useRef(null)
  const spotlightProduct = validSpotlightProducts[currentSpotlightIndex] || null

  useEffect(() => {
    if (!validSpotlightProducts.length) {
      return undefined
    }

    intervalRef.current = window.setInterval(() => {
      setIsVisible(false)
      transitionTimerRef.current = window.setTimeout(() => {
        setCurrentSpotlightIndex((prev) => (prev + 1) % validSpotlightProducts.length)
        setIsVisible(true)
      }, 320)
    }, 7000)

    return () => {
      window.clearInterval(intervalRef.current)
      window.clearTimeout(transitionTimerRef.current)
    }
  }, [validSpotlightProducts.length])

  useEffect(() => {
    if (currentSpotlightIndex >= validSpotlightProducts.length) {
      setCurrentSpotlightIndex(0)
    }
  }, [currentSpotlightIndex, validSpotlightProducts.length])

  const spotlightImage = getProductImage(spotlightProduct)
  const locale = isBangla ? 'bn-BD' : 'en-US'

  return (
    <section className={`pb-10 ${banglaFontClass}`}>
      <div className="mt-7 grid gap-6 md:grid-cols-[0.96fr_1.04fr] md:items-stretch">
        <div className="h-full overflow-hidden border border-[#d8ece9] bg-white shadow-[0_30px_70px_-42px_rgba(8,63,73,0.18)]">
          <div className="relative h-full min-h-72 sm:min-h-88 lg:min-h-96">
            <img
              src={spotlightImage}
              alt={spotlightProduct?.product_name || (isBangla ? '\u09a8\u09bf\u09b0\u09cd\u09ac\u09be\u099a\u09bf\u09a4 \u09aa\u09a3\u09cd\u09af' : 'Featured product')}
              className="absolute inset-0 h-full w-full object-cover"
              onError={handleImageFallback}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.8))]" />
            <div className="relative flex h-full min-h-[18rem] flex-col justify-end p-5 text-white sm:min-h-[22rem] sm:p-6 lg:min-h-96 lg:p-7">
              <div className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="inline-flex items-center border border-white/12 bg-white/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#d6fffb]">
                  {isBangla ? '\u09ab\u09bf\u099a\u09be\u09b0\u09cd\u09a1 \u09aa\u09a3\u09cd\u09af' : 'Featured product'}
                </div>
                <h3 className="mt-3 max-w-md text-2xl font-bold tracking-tight sm:text-3xl">
                  {spotlightProduct?.product_name || (isBangla ? '\u099c\u09a8\u09aa\u09cd\u09b0\u09bf\u09df \u09aa\u09a3\u09cd\u09af' : 'Popular product')}
                </h3>

                {spotlightProduct ? (
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span className="border border-white/12 bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur-sm">
                      {money(spotlightProduct.display_price, locale)}
                    </span>
                    <Link
                      to={getProductPath(spotlightProduct)}
                      state={{ product: spotlightProduct }}
                      className="inline-flex items-center gap-2 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
                    >
                      {isBangla ? '\u09aa\u09a3\u09cd\u09af \u09a6\u09c7\u0996\u09c1\u09a8' : 'View product'}
                      <FiArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="border border-[#d8ece9] bg-white p-4 shadow-lg sm:p-5 lg:p-6">
            <div className="mb-6 text-center sm:mb-8">
              <h2 className="text-lg font-bold text-[#07343d] sm:text-xl">
                {isBangla ? '\u0995\u09c0\u09ad\u09be\u09ac\u09c7 \u0985\u09b0\u09cd\u09a1\u09be\u09b0 \u0995\u09b0\u09ac\u09c7\u09a8' : 'How to order'}
              </h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {workflowSteps.map((item) => {
                const Icon = item.icon

                return (
                  <div
                    key={item.step}
                    className="group border border-[#e2f1ee] bg-[#fbfefd] p-4 transition-all duration-300 hover:border-[#13b8b0] hover:shadow-md sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex gap-3 sm:gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#13b8b0] text-sm font-semibold text-white sm:h-10 sm:w-10">
                          {item.step}
                        </div>

                        <div>
                          <h3 className="text-base font-semibold text-[#07343d] sm:text-lg">
                            {item.title}
                          </h3>

                          <p className="mt-1.5 text-sm leading-6 text-[#5f7d84] sm:mt-2 sm:leading-7">
                            {item.body}
                          </p>
                        </div>
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#eef9f7] text-[#13b8b0] transition-colors duration-300 group-hover:bg-[#13b8b0] group-hover:text-white sm:h-11 sm:w-11">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
