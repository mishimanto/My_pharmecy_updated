import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiChevronUp, FiFilter, FiRotateCcw, FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { productApi } from '../../api/productApi'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useStorefront } from '../../context/StorefrontContext'
import { getOfferPricingSignature, prefetchProductsQuery, useCategoriesQuery, useManufacturersQuery, useOffersQuery, useProductsQuery } from '../../queries/customerQueries'
import { getDefaultPurchaseOption, getOptionUnitLabel } from '../../utils/purchaseUnits'
import { getCategoryName, getCategorySlug, getManufacturerSlug } from '../../utils/categoryNames'
import { isPrescriptionLoginRequiredError, requiresPrescriptionLogin, showPrescriptionLoginRequiredAlert } from '../../utils/prescriptionCartAlert'
import EmptyState from '../common/EmptyState'
import ProductCard, { ProductCardSkeleton } from './ProductCard'

export default function ProductGrid() {
  const { addToCart } = useStorefront()
  const { customer } = useCustomerAuth()
  const { isBangla } = useLanguage()
  const queryClient = useQueryClient()
  const offersQuery = useOffersQuery()
  const offerScope = getOfferPricingSignature(offersQuery.data || [])
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const initialSearch = searchParams.get('search') || ''
  const initialCategory = searchParams.get('category') || ''
  const initialCategoryId = searchParams.get('category_id') || ''
  const initialType = searchParams.get('type') || searchParams.get('product_type') || ''
  const initialManufacturer = searchParams.get('manufacturer') || ''
  const initialManufacturerId = searchParams.get('manufacturer_id') || ''
  const initialPrescription = searchParams.get('prescription') || ''
  const initialRequiresPrescription = searchParams.get('requires_prescription') || ''
  const initialPage = Math.max(1, Number(searchParams.get('page') || 1) || 1)
  const t = (bn, en) => (isBangla ? bn : en)

  const [search, setSearch] = useState(initialSearch)
  const [page, setPage] = useState(initialPage)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [filters, setFilters] = useState({
    category: initialCategory,
    category_id: initialCategoryId,
    type: initialType,
    manufacturer: initialManufacturer,
    manufacturer_id: initialManufacturerId,
    prescription: initialPrescription,
    requires_prescription: initialRequiresPrescription,
  })
  const deferredSearch = useDeferredValue(search)
  const categoryFilterValue = filters.category || filters.category_id
  const manufacturerFilterValue = filters.manufacturer || filters.manufacturer_id
  const prescriptionFilterValue = normalizePrescriptionFilter(filters.prescription, filters.requires_prescription)

  const requestParams = useMemo(
    () => {
      const params = {
        search: deferredSearch,
        page,
      }

      if (filters.category) {
        params.category = filters.category
      } else if (filters.category_id) {
        params.category_id = filters.category_id
      }

      if (filters.type) {
        params.type = filters.type
      }

      if (filters.manufacturer) {
        params.manufacturer = filters.manufacturer
      } else if (filters.manufacturer_id) {
        params.manufacturer_id = filters.manufacturer_id
      }

      if (prescriptionFilterValue) {
        params.prescription = prescriptionFilterValue
      }

      return params
    },
    [deferredSearch, page, filters, prescriptionFilterValue],
  )

  const productsQuery = useProductsQuery(requestParams, {
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: (previousData) => previousData,
  })
  const categoriesQuery = useCategoriesQuery()
  const manufacturersQuery = useManufacturersQuery()
  const meta = productsQuery.data
  const products = meta?.data || []
  const categories = categoriesQuery.data || []
  const manufacturers = manufacturersQuery.data || []
  const loading = productsQuery.isLoading

  useEffect(() => {
    const nextSearch = searchParams.get('search') || ''
    const nextPage = Math.max(1, Number(searchParams.get('page') || 1) || 1)
    const nextFilters = {
      category: searchParams.get('category') || '',
      category_id: searchParams.get('category_id') || '',
      type: searchParams.get('type') || searchParams.get('product_type') || '',
      manufacturer: searchParams.get('manufacturer') || '',
      manufacturer_id: searchParams.get('manufacturer_id') || '',
      prescription: searchParams.get('prescription') || '',
      requires_prescription: searchParams.get('requires_prescription') || '',
    }

    setSearch((current) => (current === nextSearch ? current : nextSearch))
    setPage((current) => (current === nextPage ? current : nextPage))
    setFilters((current) => (
      current.category === nextFilters.category
      && current.category_id === nextFilters.category_id
      && current.type === nextFilters.type
      && current.manufacturer === nextFilters.manufacturer
      && current.manufacturer_id === nextFilters.manufacturer_id
      && current.prescription === nextFilters.prescription
      && current.requires_prescription === nextFilters.requires_prescription
        ? current
        : nextFilters
    ))
  }, [searchParams, searchParamsKey])

  useEffect(() => {
    const nextParams = buildProductSearchParams(search, filters, page)
    const nextKey = nextParams.toString()

    if (nextKey !== searchParamsKey) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [search, filters, page, searchParamsKey, setSearchParams])

  useEffect(() => {
    if (filters.category || !filters.category_id || categories.length === 0) {
      return
    }

    const matchedCategory = categories.find((item) => String(item.id) === String(filters.category_id))

    if (!matchedCategory) {
      return
    }

    setFilters((current) => {
      if (current.category || String(current.category_id) !== String(filters.category_id)) {
        return current
      }

      return {
        ...current,
        category: getCategorySlug(matchedCategory),
        category_id: '',
      }
    })
  }, [categories, filters.category, filters.category_id])

  useEffect(() => {
    if (filters.manufacturer || !filters.manufacturer_id || manufacturers.length === 0) {
      return
    }

    const matchedManufacturer = manufacturers.find((item) => String(item.id) === String(filters.manufacturer_id))

    if (!matchedManufacturer) {
      return
    }

    setFilters((current) => {
      if (current.manufacturer || String(current.manufacturer_id) !== String(filters.manufacturer_id)) {
        return current
      }

      return {
        ...current,
        manufacturer: getManufacturerSlug(matchedManufacturer),
        manufacturer_id: '',
      }
    })
  }, [filters.manufacturer, filters.manufacturer_id, manufacturers])

  useEffect(() => {
    if (productsQuery.isError) {
      toast.error(
        isBangla
          ? 'পণ্য লোড করা যাচ্ছে না।'
          : 'Could not load products.'
      )
    }
  }, [isBangla, productsQuery.isError])

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

  useEffect(() => {
    if (!meta || !hasNext) {
      return
    }

    prefetchProductsQuery(queryClient, { ...requestParams, page: currentPage + 1 }, offerScope)
  }, [currentPage, hasNext, meta, offerScope, queryClient, requestParams])

  const add = async (product) => {
    const option = getDefaultPurchaseOption(product)
    const unitCode = option?.code || 'piece'
    const unitLabel = getOptionUnitLabel(option || { code: unitCode }, isBangla)

    if (requiresPrescriptionLogin(product, customer)) {
      await showPrescriptionLoginRequiredAlert(isBangla)
      return
    }

    const successToastId = toast.success(
      t(
        `${unitLabel} সফলভাবে কার্টে যোগ করা হয়েছে।`,
        `Added ${unitLabel} to cart successfully.`
      )
    )

    try {
      await addToCart({
        product_id: product.id,
        purchase_unit: unitCode,
        quantity: 1,
      }, {
        product_name: product.product_name,
        product_name_bn: product.product_name_bn,
        generic_name: product.generic_name,
        generic_name_bn: product.generic_name_bn,
        strength: product.strength,
        dosage_form: product.dosage_form,
        requires_prescription: product.requires_prescription,
        image_url: product.primary_image?.image_url || product.images?.[0]?.image_url || null,
        thumbnail_url: product.primary_image?.thumbnail_url || product.images?.[0]?.thumbnail_url || null,
        purchase_unit_label: unitLabel,
        pieces_per_unit: option?.pieces_per_unit || 1,
        conversion_label: option?.conversion_label || '',
        unit_price: option?.unit_price || product.display_price || 0,
        available_stock: product.available_stock || 0,
      })
    } catch (error) {
      toast.dismiss(successToastId)
      if (isPrescriptionLoginRequiredError(error)) {
        await showPrescriptionLoginRequiredAlert(isBangla)
        return
      }

      toast.error(
        t(
          'দুঃখিত, পণ্যটি কার্টে যোগ করা যায়নি।',
          'Sorry, the product could not be added to the cart.'
        )
      )
    }
  }

  const selectedCategory = useMemo(() => {
    if (!filters.category && !filters.category_id) {
      return null
    }

    return categories.find((item) => (
      filters.category
        ? getCategorySlug(item) === filters.category
        : String(item.id) === String(filters.category_id)
    )) || null
  }, [categories, filters.category, filters.category_id])

  const pageTitle = selectedCategory
    ? getCategoryName(selectedCategory, isBangla)
    : getTypeLabel(filters.type, isBangla, true)
  const pageSubtitle = selectedCategory
    ? getTypeLabel(filters.type, isBangla, false)
    : t(
        'ক্যাটাগরি, ব্র্যান্ড এবং প্রেসক্রিপশনের ধরন অনুযায়ী পণ্য খুঁজুন।',
        'Find products by category, brand, and prescription status.'
      )

  const activeFilterCount = [categoryFilterValue, manufacturerFilterValue, prescriptionFilterValue, filters.type].filter(Boolean).length

  const resetFilters = () => {
    setSearch('')
    setFilters({ category: '', category_id: '', type: '', manufacturer: '', manufacturer_id: '', prescription: '', requires_prescription: '' })
    setPage(1)
  }

  return (
    <div>
      {/* <div className="mb-5 flex flex-col gap-2 border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#07343d] sm:text-3xl">{pageTitle}</h1>
        {pageSubtitle ? <p className="text-sm leading-7 text-[#51727a]">{pageSubtitle}</p> : null}
      </div> */}

      <div className="mb-4 overflow-hidden border border-slate-200 bg-white shadow-[0_18px_45px_-36px_rgba(15,23,42,0.24)] lg:hidden">
        <div className="flex flex-col gap-3 p-3 sm:p-4">
          <div className="flex items-center gap-2 border border-slate-300 bg-white px-3">
            <FiSearch className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              placeholder={t('পণ্য, জেনেরিক বা ব্র্যান্ড খুঁজুন', 'Search product, generic, or brand')}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex flex-1 items-center justify-between border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700"
              onClick={() => setShowMobileFilters((value) => !value)}
            >
              <span className="inline-flex items-center gap-2">
                <FiFilter className="h-4 w-4" />
                {t('ফিল্টার', 'Filters')}
                {activeFilterCount ? <span className="inline-flex min-w-5 items-center justify-center bg-[#13b8b0] px-1.5 py-0.5 text-[11px] font-semibold text-white">{formatCount(activeFilterCount, isBangla)}</span> : null}
              </span>
              {showMobileFilters ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
            </button>

            <button
              type="button"
              className="inline-flex h-11.5 w-11.5 items-center justify-center border border-slate-300 bg-white text-slate-600"
              onClick={resetFilters}
              aria-label={t('রিসেট', 'Reset')}
            >
              <FiRotateCcw className="h-4 w-4" />
            </button>
          </div>

          {showMobileFilters ? (
            <div className="grid gap-3 border-t border-slate-200 pt-3">
              <select
                className="border border-slate-300 bg-white px-3 py-3 text-sm"
                value={categoryFilterValue}
                onChange={(event) => {
                  setFilters({ ...filters, category: event.target.value, category_id: '' })
                  setPage(1)
                }}
              >
                <option value="">{t('সকল ক্যাটাগরি', 'All Categories')}</option>
                {categories.map((item) => (
                  <option key={item.id} value={getCategorySlug(item)}>{getCategoryName(item, isBangla)}</option>
                ))}
              </select>
              <select
                className="border border-slate-300 bg-white px-3 py-3 text-sm"
                value={manufacturerFilterValue}
                onChange={(event) => {
                  setFilters({ ...filters, manufacturer: event.target.value, manufacturer_id: '' })
                  setPage(1)
                }}
              >
                <option value="">{t('সকল প্রস্তুতকারক', 'All Manufacturers')}</option>
                {manufacturers.map((item) => <option key={item.id} value={getManufacturerSlug(item)}>{item.manufacturer_name}</option>)}
              </select>
              <select
                className="border border-slate-300 bg-white px-3 py-3 text-sm"
                value={prescriptionFilterValue}
                onChange={(event) => {
                  setFilters({ ...filters, prescription: event.target.value, requires_prescription: '' })
                  setPage(1)
                }}
              >
                <option value="">{t('সকল পণ্য', 'All products')}</option>
                <option value="required">{t('প্রেসক্রিপশন প্রয়োজন', 'Prescription required')}</option>
                <option value="not-required">{t('প্রেসক্রিপশন প্রয়োজন নেই', 'No prescription')}</option>
              </select>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mb-6 hidden gap-3 lg:grid lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_auto]">
        <input
          className="border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          placeholder={t('পণ্য, জেনেরিক বা ব্র্যান্ড খুঁজুন', 'Search by product, generic, or brand')}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />
        <select
          className="border border-slate-300 bg-white px-3 py-3 text-sm"
          value={categoryFilterValue}
          onChange={(event) => {
            setFilters({ ...filters, category: event.target.value, category_id: '' })
            setPage(1)
          }}
        >
          <option value="">{t('সকল ক্যাটাগরি', 'All categories')}</option>
          {categories.map((item) => (
            <option key={item.id} value={getCategorySlug(item)}>{getCategoryName(item, isBangla)}</option>
          ))}
        </select>
        <select
          className="border border-slate-300 bg-white px-3 py-3 text-sm"
          value={manufacturerFilterValue}
          onChange={(event) => {
            setFilters({ ...filters, manufacturer: event.target.value, manufacturer_id: '' })
            setPage(1)
          }}
        >
          <option value="">{t('সকল প্রস্তুতকারক', 'All manufacturers')}</option>
          {manufacturers.map((item) => <option key={item.id} value={getManufacturerSlug(item)}>{item.manufacturer_name}</option>)}
        </select>
        <select
          className="border border-slate-300 bg-white px-3 py-3 text-sm"
          value={prescriptionFilterValue}
          onChange={(event) => {
            setFilters({ ...filters, prescription: event.target.value, requires_prescription: '' })
            setPage(1)
          }}
        >
          <option value="">{t('সকল পণ্য', 'All products')}</option>
          <option value="required">{t('প্রেসক্রিপশন প্রয়োজন', 'Prescription required')}</option>
          <option value="not-required">{t('প্রেসক্রিপশন প্রয়োজন নেই', 'No prescription')}</option>
        </select>
        <button
          className="border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
          onClick={resetFilters}
        >
          {t('রিসেট', 'Reset')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {loading && products.length === 0
          ? Array.from({ length: 10 }, (_, index) => <ProductCardSkeleton key={`product-skeleton-${index}`} compact />)
          : products.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={add} compact />
          ))}
      </div>

      {!loading && products.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title={t('কোনো পণ্য পাওয়া যায়নি', 'No Products Found')}
            text={t(
              'অন্য কিছু খুঁজে দেখুন অথবা ফিল্টার পরিবর্তন করুন।',
              'Try another search or adjust the filters.'
            )}
          />
        </div>
      )}

      {meta && lastPage > 1 && (
        <div className="mt-8 border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbfd)] p-2 shadow-[0_20px_45px_-36px_rgba(15,23,42,0.4)] sm:p-3">
          <div className="flex justify-end">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!hasPrevious}
                className="inline-flex h-11 min-w-11 items-center justify-center border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:min-w-24 sm:px-4 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <FiChevronLeft className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">{t('পূর্ববর্তী', 'Previous')}</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {paginationItems.map((item, index) => (
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${index}`} className="inline-flex h-11 min-w-11 items-center justify-center border border-transparent px-2 text-sm font-semibold text-slate-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      className={`inline-flex h-11 min-w-11 items-center justify-center border px-3 text-sm font-semibold transition ${
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
                className="inline-flex h-11 min-w-11 items-center justify-center border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:min-w-24 sm:px-4 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                onClick={() => setPage((value) => value + 1)}
              >
                <FiChevronRight className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">{t('পরবর্তী', 'Next')}</span>
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

function buildProductSearchParams(search, filters, page) {
  const params = new URLSearchParams()
  const trimmedSearch = String(search || '').trim()

  if (trimmedSearch) params.set('search', trimmedSearch)
  if (filters.category) {
    params.set('category', filters.category)
  } else if (filters.category_id) {
    params.set('category_id', filters.category_id)
  }
  if (filters.type) params.set('type', filters.type)
  if (filters.manufacturer) {
    params.set('manufacturer', filters.manufacturer)
  } else if (filters.manufacturer_id) {
    params.set('manufacturer_id', filters.manufacturer_id)
  }

  const prescription = normalizePrescriptionFilter(filters.prescription, filters.requires_prescription)
  if (prescription) params.set('prescription', prescription)
  if (Number(page) > 1) params.set('page', String(page))

  return params
}

function normalizePrescriptionFilter(prescription, legacyRequiresPrescription) {
  if (prescription === 'required' || prescription === 'not-required') {
    return prescription
  }

  if (legacyRequiresPrescription === '1' || legacyRequiresPrescription === 1 || legacyRequiresPrescription === true) {
    return 'required'
  }

  if (legacyRequiresPrescription === '0' || legacyRequiresPrescription === 0 || legacyRequiresPrescription === false) {
    return 'not-required'
  }

  return ''
}

function getTypeLabel(type, isBangla, fallbackToAll = false) {
  if (type === 'medicine') {
    return isBangla ? 'ওষুধ' : 'Medicines'
  }

  if (type === 'other') {
    return isBangla ? 'স্বাস্থ্যসেবা পণ্য' : 'Healthcare Products'
  }

  return fallbackToAll
    ? (isBangla ? 'সকল পণ্য' : 'All Products')
    : ''
}

function formatCount(value, isBangla) {
  return Number(value || 0).toLocaleString(isBangla ? 'bn-BD' : 'en-US')
}
