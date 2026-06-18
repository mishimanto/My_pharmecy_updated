import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiCheckCircle, FiCreditCard, FiFileText, FiMapPin, FiShield, FiTruck, FiX } from 'react-icons/fi'
import { GrCurrency } from "react-icons/gr";
import { addressApi } from '../../api/addressApi'
import { orderApi } from '../../api/orderApi'
import { prescriptionApi } from '../../api/prescriptionApi'
import PageHeader from '../../components/common/PageHeader'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useStorefront } from '../../context/StorefrontContext'
import { clearCheckoutDraft, readCheckoutDraft, writeCheckoutDraft } from '../../utils/checkoutDraft'
import { money } from '../../utils/formatters'
import { getOrderPath } from '../../utils/orderRouting'
import { prescriptionDisplayName, prescriptionDisplayNameById } from '../../utils/prescriptionDisplay'
import { getUnitLabel } from '../../utils/purchaseUnits'
import { clearPreferredPrescriptionId, readPreferredPrescriptionId, writePreferredPrescriptionId } from '../../utils/prescriptionSelection'

function createGuestAddressForm() {
  return {
    full_name: '',
    phone: '',
    email: '',
    address_line_1: '',
    address_line_2: '',
    postal_code: '',
  }
}

function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

function matchesArea(address, area) {
  if (!address || !area) return false
  return normalize(address.area) === normalize(area.area_name) && normalize(address.city) === normalize(area.city)
}

const fullPaymentMethods = [
  {
    value: 'BKASH',
    label: 'bKash',
    badge: 'bK',
    logoUrl: 'https://cdn.brandfetch.io/id_4D40okd/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1773019907118',
    bodyBn: 'অর্ডারের পরে বিকাশে ফুল পেমেন্ট দিয়ে ট্রানজ্যাকশন আইডি জমা দিতে হবে।',
    bodyEn: 'After order placement, pay the full amount with bKash and submit the transaction ID.',
    brandClass: 'text-[#e2136e]',
  },
  {
    value: 'NAGAD',
    label: 'Nagad',
    badge: 'N',
    logoUrl: 'https://cdn.brandfetch.io/idPKXOsXfF/w/512/h/512/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1778051284059',
    bodyBn: 'অর্ডারের পরে নগদে ফুল পেমেন্ট দিয়ে ট্রানজ্যাকশন আইডি জমা দিতে হবে।',
    bodyEn: 'After order placement, pay the full amount with Nagad and submit the transaction ID.',
    brandClass: 'text-[#f28c16]',
  },
]

export default function Checkout() {
  const { customer, loading: authLoading } = useCustomerAuth()
  const { cart, cartLoading, clearCart } = useStorefront()
  const { isBangla } = useLanguage()
  const navigate = useNavigate()
  const loginPath = `/login?returnTo=${encodeURIComponent('/checkout')}`
  const t = useCallback((bn, en) => (isBangla ? bn : en), [isBangla])
  const locale = isBangla ? 'bn-BD' : 'en-US'
  const formatNumber = useCallback((value) => new Intl.NumberFormat(locale).format(Number(value || 0)), [locale])
  const draft = useMemo(() => readCheckoutDraft(), [])

  const [addresses, setAddresses] = useState([])
  const [deliveryAreas, setDeliveryAreas] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [useSavedAddress, setUseSavedAddress] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [guestAddress, setGuestAddress] = useState(createGuestAddressForm())
  const [couponInput, setCouponInput] = useState(draft.couponCode)
  const [appliedCouponCode, setAppliedCouponCode] = useState('')
  const [pricing, setPricing] = useState(null)
  const [pricingLoading, setPricingLoading] = useState(false)
  const [form, setForm] = useState({
    address_id: '',
    delivery_area_id: draft.deliveryAreaId,
    payment_method: 'COD',
    prescription_id: readPreferredPrescriptionId(),
    notes: '',
  })

  const loadPricing = useCallback(async (nextAreaId, nextCouponCode, { silent = false } = {}) => {
    if (!cart?.items?.length) {
      setPricing(null)
      return null
    }

    if (!nextAreaId) {
      setPricing({
        subtotal_amount: Number(cart?.subtotal || 0),
        delivery_charge: 0,
        discount_amount: 0,
        total_amount: Number(cart?.subtotal || 0),
        coupon: null,
      })
      return null
    }

    setPricingLoading(true)

    try {
      const { data } = await orderApi.quote({
        delivery_area_id: Number(nextAreaId),
        coupon_code: nextCouponCode || undefined,
      })

      setPricing(data.data)
      if (nextCouponCode && data.data?.coupon_error) {
        setAppliedCouponCode('')
        writeCheckoutDraft({ couponCode: '' })
        if (!silent) {
          toast.error(data.data.coupon_error)
        }
        return null
      }

      return data.data
    } catch (error) {
      if (nextCouponCode) {
        setAppliedCouponCode('')
        writeCheckoutDraft({ couponCode: '' })
        const fallback = await loadPricing(nextAreaId, '', { silent: true })
        if (!silent) {
          toast.error(error.response?.data?.message || t('কুপনটি ব্যবহার করা যায়নি।', 'Coupon could not be applied.'))
        }
        return fallback
      }

      if (!silent) {
        toast.error(error.response?.data?.message || t('চেকআউট সামারি আপডেট করা যায়নি।', 'Checkout summary could not be updated.'))
      }
      return null
    } finally {
      setPricingLoading(false)
    }
  }, [cart?.items?.length, cart?.subtotal, t])

  useEffect(() => {
    if (authLoading || !cart) return

    const requests = [
      orderApi.deliveryAreas().then((response) => ({
        type: 'deliveryAreas',
        payload: response.data.data || [],
      })),
    ]

    if (cart.requires_prescription && customer) {
      requests.push(
        prescriptionApi.list().then((response) => ({
          type: 'prescriptions',
          payload: response.data.data?.data || response.data.data || [],
        })),
      )
    }

    if (customer) {
      requests.push(
        addressApi.list().then((response) => ({
          type: 'addresses',
          payload: response.data.data?.data || response.data.data || [],
        })),
      )
    }

    Promise.all(requests)
      .then((responses) => {
        const nextAreas = responses.find((item) => item.type === 'deliveryAreas')?.payload || []
        const nextPrescriptions = responses.find((item) => item.type === 'prescriptions')?.payload || []
        const nextAddresses = responses.find((item) => item.type === 'addresses')?.payload || []
        const preferredAreaId = nextAreas.some((item) => String(item.id) === String(form.delivery_area_id || draft.deliveryAreaId))
          ? String(form.delivery_area_id || draft.deliveryAreaId)
          : (nextAreas[0]?.id ? String(nextAreas[0].id) : '')
        const preferredArea = nextAreas.find((item) => String(item.id) === preferredAreaId) || null
        const compatible = preferredArea ? nextAddresses.filter((item) => matchesArea(item, preferredArea)) : []
        const defaultAddressId = compatible.find((item) => item.is_default)?.id || compatible[0]?.id || ''
        const preferredPrescriptionId = form.prescription_id || readPreferredPrescriptionId()

        setDeliveryAreas(nextAreas)
        setPrescriptions(nextPrescriptions)
        setAddresses(nextAddresses)
        setUseSavedAddress(Boolean(customer && compatible.length > 0))
        writeCheckoutDraft({ deliveryAreaId: preferredAreaId })

        setForm((current) => ({
          ...current,
          delivery_area_id: preferredAreaId || current.delivery_area_id,
          address_id: defaultAddressId ? String(defaultAddressId) : '',
          prescription_id: cart.requires_prescription && nextPrescriptions.some((item) => String(item.id) === String(preferredPrescriptionId))
            ? String(preferredPrescriptionId)
            : '',
        }))

        setGuestAddress((current) => ({
          ...current,
          full_name: current.full_name || customer?.full_name || '',
          phone: current.phone || customer?.phone || '',
          email: current.email || customer?.email || '',
        }))
      })
      .catch(() => toast.error(t('চেকআউট তথ্য লোড করা যায়নি।', 'Checkout data could not be loaded.')))
      .finally(() => setLoading(false))
  }, [authLoading, cart, customer, draft.deliveryAreaId, t])

  const pageLoading = authLoading || (cartLoading && !cart)
  const selectedDeliveryArea = useMemo(
    () => deliveryAreas.find((item) => String(item.id) === String(form.delivery_area_id)) || null,
    [deliveryAreas, form.delivery_area_id],
  )
  const compatibleAddresses = useMemo(
    () => (selectedDeliveryArea ? addresses.filter((item) => matchesArea(item, selectedDeliveryArea)) : []),
    [addresses, selectedDeliveryArea],
  )
  const subtotal = Number(pricing?.subtotal_amount ?? cart?.subtotal ?? 0)
  const deliveryCharge = Number(pricing?.delivery_charge ?? selectedDeliveryArea?.delivery_charge ?? 0)
  const discountAmount = Number(pricing?.discount_amount ?? 0)
  const total = Number(pricing?.total_amount ?? Math.max(0, subtotal + deliveryCharge - discountAmount))
  const paymentNeedsProof = form.payment_method === 'BKASH' || form.payment_method === 'NAGAD'
  const paymentMode = paymentNeedsProof ? 'FULL' : 'COD'
  const selectedFullPaymentMethod = useMemo(
    () => fullPaymentMethods.find((method) => method.value === form.payment_method) || null,
    [form.payment_method],
  )
  const hasDeliveryAreas = deliveryAreas.length > 0
  const requiresPrescriptionLogin = Boolean(cart?.requires_prescription && !customer)
  const isAddressReady = customer && useSavedAddress
    ? Boolean(form.address_id)
    : Boolean(
      guestAddress.full_name.trim()
      && guestAddress.phone.trim()
      && guestAddress.email.trim()
      && guestAddress.address_line_1.trim()
      && form.delivery_area_id,
    )

  useEffect(() => {
    if (!cart?.items?.length || !selectedDeliveryArea) return
    loadPricing(selectedDeliveryArea.id, appliedCouponCode, { silent: true })
  }, [appliedCouponCode, cart?.items?.length, cart?.subtotal, loadPricing, selectedDeliveryArea])

  const setGuestField = (key, value) => {
    setGuestAddress((current) => ({ ...current, [key]: value }))
  }

  const handleDeliveryAreaChange = async (value) => {
    const nextArea = deliveryAreas.find((item) => String(item.id) === String(value)) || null
    const nextCompatible = nextArea ? addresses.filter((item) => matchesArea(item, nextArea)) : []

    writeCheckoutDraft({ deliveryAreaId: value })
    setForm((current) => ({
      ...current,
      delivery_area_id: value,
      address_id: nextCompatible[0]?.id ? String(nextCompatible[0].id) : '',
    }))

    if (customer) {
      setUseSavedAddress(nextCompatible.length > 0)
    }

    await loadPricing(value, appliedCouponCode, { silent: true })
  }

  const handleAddressModeToggle = () => {
    if (!useSavedAddress && compatibleAddresses.length > 0) {
      setUseSavedAddress(true)
      setForm((current) => ({
        ...current,
        address_id: compatibleAddresses[0]?.id ? String(compatibleAddresses[0].id) : '',
      }))
      return
    }

    setUseSavedAddress(false)
    setForm((current) => ({ ...current, address_id: '' }))
  }

  const applyCoupon = async () => {
    const nextCode = couponInput.trim().toUpperCase()

    if (!nextCode) {
      toast.error(t('আগে একটি কুপন কোড লিখুন।', 'Enter a coupon code first.'))
      return
    }

    if (!selectedDeliveryArea) {
      toast.error(t('আগে একটি ডেলিভারি এরিয়া নির্বাচন করুন।', 'Select a delivery area first.'))
      return
    }

    const quote = await loadPricing(selectedDeliveryArea.id, nextCode)

    if (!quote) return

    setCouponInput(nextCode)
    setAppliedCouponCode(nextCode)
    writeCheckoutDraft({ couponCode: nextCode })
    toast.success(t(`${nextCode} কুপনটি ব্যবহার হয়েছে।`, `${nextCode} applied successfully.`))
  }

  const removeCoupon = async () => {
    setCouponInput('')
    setAppliedCouponCode('')
    writeCheckoutDraft({ couponCode: '' })
    if (selectedDeliveryArea) {
      await loadPricing(selectedDeliveryArea.id, '', { silent: true })
    }
  }

  const handlePaymentModeSelect = (mode) => {
    if (mode === 'COD') {
      setPaymentModalOpen(false)
      setForm((current) => ({ ...current, payment_method: 'COD' }))
      return
    }

    setPaymentModalOpen(true)
  }

  const handleFullPaymentMethodSelect = (method) => {
    setForm((current) => ({ ...current, payment_method: method }))
    setPaymentModalOpen(false)
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!hasDeliveryAreas) {
      toast.error(t('এখন কোনো ডেলিভারি এরিয়া চালু নেই।', 'There is no active delivery area right now.'))
      return
    }

    if (requiresPrescriptionLogin) {
      toast.error(t('প্রেসক্রিপশনের ওষুধ অর্ডার করতে আগে লগইন করুন।', 'Please login before ordering prescription medicines.'))
      navigate(loginPath)
      return
    }

    if (cart?.requires_prescription && !form.prescription_id) {
      toast.error(t('অর্ডার দেওয়ার আগে একটি প্রেসক্রিপশন সিলেক্ট করুন।', 'Please select a prescription before placing this order.'))
      return
    }

    if (paymentMode === 'FULL' && !selectedFullPaymentMethod) {
      setPaymentModalOpen(true)
      toast.error(t('ফুল পেমেন্টের জন্য একটি পেমেন্ট অপশন বাছুন।', 'Choose a payment option for full payment.'))
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        delivery_area_id: Number(form.delivery_area_id),
        payment_method: form.payment_method,
        prescription_id: form.prescription_id || undefined,
        coupon_code: appliedCouponCode || undefined,
        notes: form.notes || undefined,
      }

      if (customer && useSavedAddress && form.address_id) {
        payload.address_id = Number(form.address_id)
      } else {
        payload.delivery_address = guestAddress
      }

      const { data } = await orderApi.checkout(payload)
      await clearCart()
      clearCheckoutDraft()
      clearPreferredPrescriptionId()

      toast.success(
        paymentNeedsProof
          ? t(`অর্ডার ${data.data.order_number} তৈরি হয়েছে। এখন পেমেন্ট প্রুফ দিন।`, `Order ${data.data.order_number} created. Submit payment proof now.`)
          : t(`অর্ডার ${data.data.order_number} সফলভাবে নেয়া হয়েছে।`, `Order ${data.data.order_number} placed successfully.`),
      )

      navigate(getOrderPath(data.data, paymentNeedsProof ? 'payment' : ''))
    } catch (error) {
      toast.error(error.response?.data?.message || t('অর্ডার করা যায়নি।', 'Order could not be placed.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (pageLoading) {
    return <p className="text-sm text-slate-500">{t('চেকআউট লোড হচ্ছে...', 'Loading checkout...')}</p>
  }

  if (!cart?.items?.length) {
    return (
      <>
        <PageHeader title={t('চেকআউট', 'Checkout')} />
        <button onClick={() => navigate('/products')} className="bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
          {t('ওষুধ দেখুন', 'Browse medicines')}
        </button>
      </>
    )
  }

  return (
    <>
      <PageHeader title={t('চেকআউট', 'Checkout')} />

      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="space-y-6">
          <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">{t('ডেলিভারি সেটআপ', 'Delivery setup')}</p>
              </div>
              {customer ? (
                <Link to="/addresses" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950">
                  {t('ঠিকানা ম্যানেজ করুন', 'Manage addresses')}
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>

            {/* <div className="mt-5 border border-slate-200 bg-slate-50 p-4">
              <label className="text-sm font-medium text-slate-700">{t('ডেলিভারি এরিয়া', 'Delivery area')}</label>
              <select
                value={form.delivery_area_id}
                onChange={(event) => handleDeliveryAreaChange(event.target.value)}
                className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
              >
                <option value="">{loading ? t('লোড হচ্ছে...', 'Loading...') : t('এরিয়া নির্বাচন করুন', 'Select an area')}</option>
                {deliveryAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {isBangla ? (area.area_name_bn || area.area_name) : area.area_name}, {isBangla ? (area.city_bn || area.city) : area.city} - {money(area.delivery_charge, locale)}
                  </option>
                ))}
              </select>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                {selectedDeliveryArea
                    ? t(
                    `এই এরিয়ায় ডেলিভারি চার্জ ${money(selectedDeliveryArea.delivery_charge, locale)}।`,
                    `Delivery charge for this area is ${money(selectedDeliveryArea.delivery_charge, locale)}.`,
                  )
                  : t('চালু ডেলিভারি এরিয়া না থাকলে অর্ডার করা যাবে না।', 'Orders cannot proceed unless an active delivery area is available.')}
              </p>
            </div> */}

            {customer && addresses.length > 0 ? (
              <div className="mt-5">
                <button
                  type="button"
                  className="border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleAddressModeToggle}
                  disabled={!useSavedAddress && compatibleAddresses.length === 0}
                >
                  {useSavedAddress
                    ? t('নতুন ঠিকানা ব্যবহার করুন', 'Use a new address')
                    : t('সেভ করা ঠিকানা ব্যবহার করুন', 'Use saved addresses')}
                </button>
              </div>
            ) : null}

            {customer && useSavedAddress && compatibleAddresses.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {compatibleAddresses.map((address) => (
                  <label key={address.id} className={`block cursor-pointer border p-4 transition ${String(form.address_id) === String(address.id) ? 'border-slate-950 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
                    <input
                      type="radio"
                      name="address_id"
                      value={address.id}
                      checked={String(form.address_id) === String(address.id)}
                      onChange={(event) => setForm((current) => ({ ...current, address_id: event.target.value }))}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-950">{address.full_name}</span>
                          {address.is_default ? <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">{t('ডিফল্ট', 'Default')}</span> : null}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate-500">
                          {address.phone}<br />
                          {address.address_line_1}
                          {address.address_line_2 ? `, ${address.address_line_2}` : ''}<br />
                          {isBangla ? (address.area_bn || address.area) : address.area}, {isBangla ? (address.city_bn || address.city) : address.city}
                          {address.postal_code ? `, ${address.postal_code}` : ''}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <CheckoutField label={t('পূর্ণ নাম', 'Full name')} value={guestAddress.full_name} onChange={(value) => setGuestField('full_name', value)} required />
                <CheckoutField label={t('ফোন নম্বর', 'Phone number')} value={guestAddress.phone} onChange={(value) => setGuestField('phone', value)} required />
                <CheckoutField label={t('ইমেইল', 'Email')} type="email" value={guestAddress.email} onChange={(value) => setGuestField('email', value)} required />
                <CheckoutField
                  label={t('সার্ভিস এরিয়া', 'Service area')}
                  value={selectedDeliveryArea ? (isBangla ? `${selectedDeliveryArea.area_name_bn || selectedDeliveryArea.area_name}, ${selectedDeliveryArea.city_bn || selectedDeliveryArea.city}` : `${selectedDeliveryArea.area_name}, ${selectedDeliveryArea.city}`) : t('এরিয়া বাছুন', 'Select an area')}
                  onChange={() => {}}
                  readOnly
                />
                <CheckoutField label={t('ঠিকানা লাইন 1', 'Address line 1')} value={guestAddress.address_line_1} onChange={(value) => setGuestField('address_line_1', value)} required className="md:col-span-2" />
                <CheckoutField label={t('ঠিকানা লাইন 2', 'Address line 2')} value={guestAddress.address_line_2} onChange={(value) => setGuestField('address_line_2', value)} className="md:col-span-2" />
                <CheckoutField label={t('পোস্টাল কোড', 'Postal code')} value={guestAddress.postal_code} onChange={(value) => setGuestField('postal_code', value)} className="md:col-span-2" />
              </div>
            )}

            {customer && useSavedAddress && compatibleAddresses.length === 0 ? (
              <div className="mt-5 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {t('এই এরিয়ার জন্য কোনো সেভ করা ঠিকানা নেই। নতুন ঠিকানা দিন অথবা অন্য এরিয়া বাছুন।', 'No saved address matches this service area. Add a new address or choose another area.')}
              </div>
            ) : null}
          </div>

          {cart.requires_prescription ? (
            <div className="border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center border border-amber-200 bg-white text-amber-700">
                  <FiFileText className="h-5 w-5" />
                </div>
                {customer ? (
                  <div className="flex-1">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">{t(
                      'অর্ডারটি সম্পন্ন করতে একটি অনুমোদিত প্রেসক্রিপশন সংযুক্ত করুন',
                      'Attach an approved prescription to complete this order'
                    )}</p>
                    <select
                      value={form.prescription_id}
                      onChange={(event) => {
                        const nextValue = event.target.value
                        setForm((current) => ({ ...current, prescription_id: nextValue }))
                        writePreferredPrescriptionId(nextValue)
                      }}
                      required
                      className="mt-4 w-72 border border-amber-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                    >
                      <option value="">{loading ? t('প্রেসক্রিপশন লোড হচ্ছে...', 'Loading prescriptions...') : t('একটি প্রেসক্রিপশন বাছুন', 'Select a prescription')}</option>
                      {prescriptions.map((item, index) => (
                        <option key={item.id} value={item.id}>{prescriptionDisplayName(index)}</option>
                      ))}
                    </select>
                    {form.prescription_id ? (
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {t(
                          `${prescriptionDisplayNameById(prescriptions, form.prescription_id)} এই অর্ডারের জন্য সিলেক্ট করা আছে।`,
                          `${prescriptionDisplayNameById(prescriptions, form.prescription_id)} is selected for this order.`,
                        )}
                      </p>
                    ) : null}
                    <Link to={`/upload-prescription?returnTo=${encodeURIComponent('/checkout')}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
                      {t('নতুন প্রেসক্রিপশন আপলোড করুন', 'Upload a new prescription')}
                      <FiArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="flex-1">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">{t('প্রেসক্রিপশন প্রয়োজন', 'Prescription required')}</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{t('চালিয়ে যেতে আগে লগইন করুন', 'Login to continue')}</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {t(
                        'প্রেসক্রিপশনের ওষুধের অর্ডার সম্পূর্ণ করতে আগে আপনার অ্যাকাউন্টে লগইন করতে হবে।',
                        'Please login to your account before selecting a prescription or placing this order.',
                      )}
                    </p>
                    <Link to={loginPath} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
                      {t('লগইন করে চালিয়ে যান', 'Login to continue')}
                      <FiArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <div className="flex justify-between border-b border-slate-200 pb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">{t('অর্ডারের মেথড বেছে নিন', 'Choose payment option')}</p>
              <div className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-950">{t('নির্বাচিত', 'Selected')}:</span>{' '}
                  {paymentMode === 'COD'
                    ? t('ক্যাশ অন ডেলিভারি', 'Cash on delivery')
                    : `${t('ফুল পেমেন্ট', 'Full payment')} - ${selectedFullPaymentMethod?.label || t('মেথড বাকি', 'method pending')}`}
                </div>
            </div>

            <div className="mt-5 grid gap-4">             

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    value: 'COD',
                    title: t('ক্যাশ অন ডেলিভারি', 'Cash on delivery'),
                    body: t('অগ্রিম লাগবে না। ডেলিভারির সময় পেমেন্ট দিলেই হবে।', 'No advance is needed. You can pay during delivery.'),
                    icon: FiTruck,
                    selected: paymentMode === 'COD',
                  },
                  {
                    value: 'FULL',
                    title: t('ফুল পেমেন্ট', 'Full payment'),
                    body: selectedFullPaymentMethod
                      ? t(
                        `নির্বাচিত অপশন: ${selectedFullPaymentMethod.label}. অর্ডারের পরে ট্রানজ্যাকশন আইডি ও স্ক্রিনশট জমা দিতে হবে।`,
                        `Selected option: ${selectedFullPaymentMethod.label}. After order placement, submit the transaction ID and screenshot.`,
                      )
                      : t('ক্লিক করলে অ্যাকটিভ পেমেন্ট অপশন দেখাবে। সেখান থেকে বিকাশ, নগদ ইত্যাদি বাছতে পারবেন।', 'Click to open active payment options. From there, choose bKash, Nagad, and similar options.'),
                    icon: GrCurrency,
                    selected: paymentMode === 'FULL',
                  },
                ].map((method) => {
                  const Icon = method.icon

                  return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => handlePaymentModeSelect(method.value)}
                    className={`group relative border p-3 text-left transition ${method.selected ? 'border-slate-950 bg-slate-50 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.35)]' : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50/60'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center">
                        <span
                          className="inline-flex h-12 w-12 items-center justify-center"                        >
                          <Icon className="h-5 w-5" />
                        </span>

                        <div className="text-lg font-semibold text-slate-950">
                          {method.title}
                        </div>
                      </div>

                      {method.selected ? (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                          <FiCheckCircle className="h-4 w-4" />
                        </span>
                      ) : null}
                    </div>
                  </button>
                  )
                })}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">{t('অতিরিক্ত নোট', 'Additional notes')}</label>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder={t('ডেলিভারি নির্দেশনা বা অর্ডার নোট', 'Delivery instructions or order notes')}
                  className="mt-2 min-h-28 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)] xl:sticky xl:top-24 xl:self-start">
            <div className="border-b border-slate-200 pb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">{t('অর্ডার সামারি', 'Order summary')}</p>
            </div>

            <div className="mt-4 space-y-3">
              {cart.items.map((item) => (
                <div key={item.cart_item_id} className="flex justify-between gap-3 border border-slate-200 bg-slate-50 p-4 text-sm">
                  <span className="text-slate-700">
                    {item.product_name}
                    <span className="mt-1 block text-xs text-slate-500">{formatNumber(item.quantity)} {getUnitLabel(item.purchase_unit, isBangla)} • {formatNumber(item.piece_quantity)} {t('পিস', 'pieces')}</span>
                  </span>
                  <span className="font-medium text-slate-950">{money(item.subtotal, locale)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-600">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t('কুপন', 'Coupon')}</label>
              <div className="mt-2 flex gap-2">
                <input
                  value={couponInput}
                  onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                  placeholder={t('কুপন কোড লিখুন', 'Enter coupon code')}
                  className="min-w-0 flex-1 border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={!selectedDeliveryArea || pricingLoading}
                  className="border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t('অ্যাপ্লাই', 'Apply')}
                </button>
              </div>

              {appliedCouponCode && pricing?.coupon ? (
                <div className="mt-2 flex items-center justify-between gap-3 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                  <span>{pricing.coupon.label} ({pricing.coupon.code})</span>
                  <button type="button" onClick={removeCoupon} className="text-emerald-800 underline">
                    {t('রিমুভ', 'Remove')}
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500">{t('ডেমো কোড: SAVE50, SAVE10, FREESHIP', 'Demo codes: SAVE50, SAVE10, FREESHIP')}</p>
              )}
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-600">
                <div className="flex justify-between"><span>{t('সাবটোটাল', 'Subtotal')}</span><span>{money(subtotal, locale)}</span></div>
              <div className="flex justify-between"><span>{t('ডেলিভারি', 'Delivery')}</span><span>{money(deliveryCharge, locale)}</span></div>
              <div className="flex justify-between"><span>{t('কুপন ডিসকাউন্ট', 'Coupon discount')}</span><span>-{money(discountAmount, locale)}</span></div>
              <div className="flex justify-between pt-2 text-base font-semibold text-slate-950"><span>{t('মোট', 'Total')}</span><span>{money(total, locale)}</span></div>
            </div>

            <button
              disabled={submitting || loading || pricingLoading || !isAddressReady || !selectedDeliveryArea || requiresPrescriptionLogin}
              className="mt-5 w-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? t('অর্ডার তৈরি হচ্ছে...', 'Creating order...')
                : paymentNeedsProof
                  ? t('অর্ডার করে পেমেন্ট পেজে যান', 'Place order and continue to payment')
                  : t('অর্ডার কনফার্ম করুন', 'Confirm order')}
            </button>            
          </div>
        </aside>
      </form>

      <PaymentMethodModal
        open={paymentModalOpen}
        isBangla={isBangla}
        selectedMethod={selectedFullPaymentMethod}
        onClose={() => setPaymentModalOpen(false)}
        onSelect={handleFullPaymentMethodSelect}
      />
    </>
  )
}

function PaymentMethodModal({ open, isBangla, selectedMethod, onClose, onSelect }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl border border-slate-200 bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.45)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
              {isBangla ? 'একটি পেমেন্ট মেথড বাছুন' : 'Choose a payment method'}
            </p>
            
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-4 w-4 items-start justify-center text-slate-700">
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-2">
          {fullPaymentMethods.map((method) => {
            const selected = selectedMethod?.value === method.value

            return (
              <button
                key={method.value}
                type="button"
                onClick={() => onSelect(method.value)}
                className={`border p-4 text-left transition ${selected ? 'border-slate-950 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <PaymentBrandMark method={method} />
                    <div className="text-lg font-semibold text-slate-950">{method.label}</div>
                  </div>
                  {selected ? (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <FiCheckCircle className="h-4 w-4" />
                    </span>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PaymentBrandMark({ method, large = false }) {
  const [imageFailed, setImageFailed] = useState(false)
  const sizeClass = large ? 'h-14 w-14' : 'h-8 w-8'
  const fallbackSizeClass = large ? 'text-base' : 'text-[11px]'

  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${sizeClass} ${method.brandClass}`}>
      {!imageFailed && method.logoUrl ? (
        <img
          src={method.logoUrl}
          alt={`${method.label} icon`}
          className="h-full w-full object-contain"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={`font-semibold ${fallbackSizeClass}`}>
          {method.badge}
        </span>
      )}
    </span>
  )
}

function CheckoutField({ label, value, onChange, required = false, className = '', type = 'text', readOnly = false }) {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        className={`mt-1 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none ${readOnly ? 'bg-slate-50 text-slate-600' : 'bg-white'}`}
      />
    </div>
  )
}

function CheckoutNote({ icon: Icon, title, body }) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-4">
      <div className="inline-flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-950">
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-950">{title}</div>
      <div className="mt-2 text-sm leading-7 text-slate-500">{body}</div>
    </div>
  )
}

