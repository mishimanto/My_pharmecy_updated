import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { productApi } from '../../api/productApi'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useStorefront } from '../../context/StorefrontContext'
import { getDefaultPurchaseOption, getUnitLabel } from '../../utils/purchaseUnits'
import { getCategoryName } from '../../utils/categoryNames'
import { isPrescriptionLoginRequiredError, requiresPrescriptionLogin, showPrescriptionLoginRequiredAlert } from '../../utils/prescriptionCartAlert'
import EmptyState from '../common/EmptyState'
import ProductCard, { ProductCardSkeleton } from './ProductCard'

export default function ProductGrid() {
  const { addToCart } = useStorefront()
  const { customer } = useCustomerAuth()
  const { isBangla } = useLanguage()
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  const initialCategoryId = searchParams.get('category_id') || ''
  const initialRequiresPrescription = searchParams.get('requires_prescription') || ''
  const initialParams = {
    search: initialSearch,
    page: 1,
    category_id: initialCategoryId,
    manufacturer_id: '',
    requires_prescription: initialRequiresPrescription,
  }
  const initialCachedList = productApi.getCachedList(initialParams)
  const t = (bn, en) => (isBangla ? bn : en)

  const [products, setProducts] = useState(initialCachedList?.data || [])
  const [search, setSearch] = useState(initialSearch)
  const [loading, setLoading] = useState(!initialCachedList)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(initialCachedList)
  const [categories, setCategories] = useState(() => productApi.getCachedCategories())
  const [manufacturers, setManufacturers] = useState(() => productApi.getCachedManufacturers())
  const [filters, setFilters] = useState({
    category_id: initialCategoryId,
    manufacturer_id: '',
    requires_prescription: initialRequiresPrescription,
  })
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    productApi.categories().then(({ data }) => setCategories(data.data || [])).catch(() => {})
    productApi.manufacturers().then(({ data }) => setManufacturers(data.data || [])).catch(() => {})
  }, [])

  const requestParams = useMemo(
    () => ({ search: deferredSearch, page, ...filters }),
    [deferredSearch, page, filters],
  )

  const cachedPayload = useMemo(
    () => productApi.getCachedList(requestParams),
    [requestParams],
  )

  useEffect(() => {
    const hasSeedData = Boolean(cachedPayload?.data?.length)
    let syncTimer = null

    if (cachedPayload) {
      syncTimer = window.setTimeout(() => {
        setProducts(cachedPayload.data || [])
        setMeta(cachedPayload)
      }, 0)
    }

    const timer = setTimeout(() => {
      if (!hasSeedData) {
        setLoading(true)
      }

      productApi
        .list(requestParams)
        .then(({ data }) => {
          const payload = data.data
          setProducts(payload.data || [])
          setMeta(payload)
        })
        .catch(() => toast.error(isBangla ? 'পণ্য লোড করা যাচ্ছে না।' : 'Could not load products.'))
        .finally(() => setLoading(false))
    }, hasSeedData ? 0 : 120)

    return () => {
      clearTimeout(timer)
      if (syncTimer) window.clearTimeout(syncTimer)
    }
  }, [cachedPayload, requestParams, isBangla])

  const currentPage = meta?.current_page || page
  const lastPage = meta?.last_page || 1
  const hasPrevious = currentPage > 1
  const hasNext = currentPage < lastPage
  const paginationItems = useMemo(() => buildPaginationItems(currentPage, lastPage), [currentPage, lastPage])
  const resultSummary = useMemo(() => {
    if (!meta) {
      return null
    }

    const fallbackFrom = products.length > 0 ? ((currentPage - 1) * (meta.per_page || products.length)) + 1 : 0
    const from = meta.from ?? fallbackFrom
    const to = meta.to ?? (from > 0 ? from + products.length - 1 : 0)
    const total = meta.total ?? products.length

    return { from, to, total }
  }, [meta, currentPage, products.length])

  const add = async (product) => {
    const option = getDefaultPurchaseOption(product)
    const unitCode = option?.code || 'piece'
    const unitLabel = getUnitLabel(unitCode, isBangla)

    if (requiresPrescriptionLogin(product, customer)) {
      await showPrescriptionLoginRequiredAlert(isBangla)
      return
    }

    try {
      await addToCart({
        product_id: product.id,
        purchase_unit: unitCode,
        quantity: 1,
      })
      toast.success(t(`১ ${unitLabel} কার্টে যোগ করা হয়েছে।`, `Added 1 ${unitLabel} to cart.`))
    } catch (error) {
      if (isPrescriptionLoginRequiredError(error)) {
        await showPrescriptionLoginRequiredAlert(isBangla)
        return
      }

      toast.error(t('এই পণ্যটি কার্টে যোগ করা যায়নি।', 'Could not add this item to the cart.'))
    }
  }

  return (
    <div>
      <div className="mb-6 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_auto]">
        <input
          className="border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          placeholder={t('পণ্যের নাম, জেনেরিক বা ব্র্যান্ড দিয়ে খুঁজুন', 'Search by product, generic, or brand')}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />
        <select
          className="border border-slate-300 bg-white px-3 py-3 text-sm"
          value={filters.category_id}
          onChange={(event) => {
            setFilters({ ...filters, category_id: event.target.value })
            setPage(1)
          }}
        >
          <option value="">{t('সব ক্যাটাগরি', 'All categories')}</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>{getCategoryName(item, isBangla)}</option>
          ))}
        </select>
        <select
          className="border border-slate-300 bg-white px-3 py-3 text-sm"
          value={filters.manufacturer_id}
          onChange={(event) => {
            setFilters({ ...filters, manufacturer_id: event.target.value })
            setPage(1)
          }}
        >
          <option value="">{t('সব নির্মাতা', 'All manufacturers')}</option>
          {manufacturers.map((item) => <option key={item.id} value={item.id}>{item.manufacturer_name}</option>)}
        </select>
        <select
          className="border border-slate-300 bg-white px-3 py-3 text-sm"
          value={filters.requires_prescription}
          onChange={(event) => {
            setFilters({ ...filters, requires_prescription: event.target.value })
            setPage(1)
          }}
        >
          <option value="">{t('সব পণ্য', 'All products')}</option>
          <option value="1">{t('প্রেসক্রিপশন প্রয়োজন', 'Prescription required')}</option>
          <option value="0">{t('প্রেসক্রিপশন ছাড়াই', 'No prescription')}</option>
        </select>
        <button
          className="border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
          onClick={() => {
            setSearch('')
            setFilters({ category_id: '', manufacturer_id: '', requires_prescription: '' })
            setPage(1)
          }}
        >
          {t('রিসেট', 'Reset')}
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading && products.length === 0
          ? Array.from({ length: 8 }, (_, index) => <ProductCardSkeleton key={`product-skeleton-${index}`} />)
          : products.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={add} />
          ))}
      </div>

      {!loading && products.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title={t('কোনো পণ্য পাওয়া যায়নি', 'No products found')}
            text={t('অন্য কিছু খুঁজে দেখুন বা ফিল্টার পরিবর্তন করুন।', 'Try another search or adjust the filters.')}
          />
        </div>
      )}

      {meta && lastPage > 1 && (
        <div className="mt-8 border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbfd)] p-4 shadow-[0_20px_45px_-36px_rgba(15,23,42,0.4)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              {/* <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0e6574]">
                {t(`পৃষ্ঠা ${formatCount(currentPage, true)} / ${formatCount(lastPage, true)}`, `Page ${currentPage} / ${lastPage}`)}
              </div> */}
              {resultSummary ? (
                <div className="text-md text-slate-600">
                  {t(
                    `${formatCount(resultSummary.from, true)}-${formatCount(resultSummary.to, true)} টি দেখানো হচ্ছে, মোট ${formatCount(resultSummary.total, true)} টি ওষুধ`,
                    `Showing ${formatCount(resultSummary.from, false)}-${formatCount(resultSummary.to, false)} of ${formatCount(resultSummary.total, false)} medicines`,
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!hasPrevious}
                className="inline-flex min-w-[96px] items-center justify-center border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                {t('পূর্ববর্তী', 'Previous')}
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {paginationItems.map((item, index) => (
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${index}`} className="inline-flex h-11 min-w-[44px] items-center justify-center border border-transparent px-2 text-sm font-semibold text-slate-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      className={`inline-flex h-11 min-w-[44px] items-center justify-center border px-3 text-sm font-semibold transition ${
                        item === currentPage
                          ? 'border-[#13b8b0] bg-[#13b8b0] text-white shadow-[0_16px_32px_-18px_rgba(19,184,176,0.85)]'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {formatCount(item, isBangla)}
                    </button>
                  )
                ))}
              </div>

              <button
                type="button"
                disabled={!hasNext}
                className="inline-flex min-w-[96px] items-center justify-center border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                onClick={() => setPage((value) => value + 1)}
              >
                {t('পরবর্তী', 'Next')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function buildPaginationItems(currentPage, lastPage) {
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, index) => index + 1)
  }

  const items = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(lastPage - 1, currentPage + 1)

  if (start > 2) {
    items.push('ellipsis')
  }

  for (let value = start; value <= end; value += 1) {
    items.push(value)
  }

  if (end < lastPage - 1) {
    items.push('ellipsis')
  }

  items.push(lastPage)

  return items
}

function formatCount(value, isBangla) {
  return Number(value || 0).toLocaleString(isBangla ? 'bn-BD' : 'en-US')
}
