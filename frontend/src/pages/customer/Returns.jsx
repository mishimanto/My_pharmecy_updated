import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { returnApi } from '../../api/returnApi'
import PageHeader from '../../components/common/PageHeader'
import { useLanguage } from '../../context/LanguageContext'
import { customerQueryKeys, useOrdersQuery, useReturnsQuery } from '../../queries/customerQueries'
import { date } from '../../utils/formatters'
import { getReturnPath } from '../../utils/returnRouting'

export default function Returns() {
  const { isBangla } = useLanguage()
  const queryClient = useQueryClient()
  const t = (bn, en) => (isBangla ? bn : en)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ order_id: '', order_item_id: '', reason: '' })
  const {
    data: returns = [],
    isLoading: loading,
  } = useReturnsQuery({
    placeholderData: (previous) => previous,
    onError: () => {
      toast.error(t('রিটার্ন তালিকা লোড করা যায়নি।', 'Return list could not be loaded.'))
    },
  })
  const {
    data: orders = [],
    isLoading: ordersLoading,
  } = useOrdersQuery({
    placeholderData: (previous) => previous,
    onError: () => {
      toast.error(t('ডেলিভারড অর্ডার লোড করা যায়নি।', 'Delivered orders could not be loaded.'))
    },
  })

  const deliveredOrders = useMemo(
    () => orders.filter((order) => order.order_status === 'delivered'),
    [orders],
  )
  const selectedOrder = useMemo(
    () => deliveredOrders.find((order) => String(order.order_number || order.id) === String(form.order_id)),
    [deliveredOrders, form.order_id],
  )
  const selectedOrderItems = selectedOrder?.items || []

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await returnApi.create(form.order_id, {
        reason: form.reason,
        order_item_id: form.order_item_id || undefined,
      })
      toast.success(t('রিটার্ন অনুরোধ তৈরি হয়েছে।', 'Return request created.'))
      setForm({ order_id: '', order_item_id: '', reason: '' })
      await queryClient.invalidateQueries({ queryKey: customerQueryKeys.returns })
    } catch (error) {
      toast.error(error.response?.data?.message || t('রিটার্ন অনুরোধ করা যায়নি।', 'Return request could not be created.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader title={t('রিটার্ন', 'Returns')} subtitle={t('ডেলিভারড অর্ডারের জন্য রিটার্ন অনুরোধ করুন।', 'Create return requests for delivered orders.')} />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-950">{t('নতুন রিটার্ন', 'New return')}</h2>
          <select
            value={form.order_id}
            onChange={(event) => setForm({ ...form, order_id: event.target.value, order_item_id: '' })}
            required
            className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">{ordersLoading ? t('ডেলিভারড অর্ডার লোড হচ্ছে...', 'Loading delivered orders...') : t('ডেলিভারড অর্ডার নির্বাচন করুন', 'Select a delivered order')}</option>
            {deliveredOrders.map((order) => (
              <option key={order.id} value={order.order_number || order.id}>
                {order.order_number || `${t('অর্ডার', 'Order')} #${order.id}`}
              </option>
            ))}
          </select>
          <select
            value={form.order_item_id}
            onChange={(event) => setForm({ ...form, order_item_id: event.target.value })}
            disabled={!selectedOrder}
            className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">{selectedOrder ? t('সম্পূর্ণ অর্ডার', 'Entire order') : t('আগে অর্ডার নির্বাচন করুন', 'Select an order first')}</option>
            {selectedOrderItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.product?.product_name || item.product_name || `${t('আইটেম', 'Item')} #${item.id}`}
              </option>
            ))}
          </select>
          <textarea
            value={form.reason}
            onChange={(event) => setForm({ ...form, reason: event.target.value })}
            required
            placeholder={t('রিটার্নের কারণ', 'Reason for return')}
            className="mt-3 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button disabled={submitting} className="mt-4 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">
            {submitting ? t('পাঠানো হচ্ছে...', 'Submitting...') : t('রিটার্ন অনুরোধ করুন', 'Request return')}
          </button>
        </form>

        <section className="space-y-3">
          {loading ? <p className="text-sm text-slate-600">{t('লোড হচ্ছে...', 'Loading...')}</p> : null}
          {!loading && !returns.length ? <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">{t('কোনো রিটার্ন অনুরোধ নেই।', 'No return requests found.')}</p> : null}
          {returns.map((item) => (
            <Link key={item.id} to={getReturnPath(item)} className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-emerald-300">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{item.order?.order_number || `${t('রিটার্ন', 'Return')} #${item.id}`}</p>
                  <p className="text-sm text-slate-500">{date(item.created_at)} - {item.status}</p>
                </div>
                <span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">{item.status}</span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </>
  )
}
