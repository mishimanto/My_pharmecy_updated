import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import { useLanguage } from '../../context/LanguageContext'
import { useReturnQuery } from '../../queries/customerQueries'
import { date, money } from '../../utils/formatters'

export default function ReturnDetails() {
  const { id } = useParams()
  const { isBangla } = useLanguage()
  const t = (bn, en) => (isBangla ? bn : en)
  const {
    data: item,
    isLoading: loading,
  } = useReturnQuery(id, {
    placeholderData: (previous) => previous,
    onError: () => {
      toast.error(t('রিটার্ন বিস্তারিত লোড করা যায়নি।', 'Return details could not be loaded.'))
    },
  })

  if (loading) return <p className="text-sm text-slate-600">{t('লোড হচ্ছে...', 'Loading...')}</p>
  if (!item) return <p className="text-sm text-slate-600">{t('রিটার্ন পাওয়া যায়নি।', 'Return not found.')}</p>

  return (
    <>
      <PageHeader title={`${t('রিটার্ন', 'Return')} #${item.id}`} subtitle={`${item.order?.order_number || '-'} - ${item.status}`} />
      <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><span className="text-slate-500">{t('কারণ', 'Reason')}</span><p className="font-medium text-slate-950">{item.reason}</p></div>
          <div><span className="text-slate-500">{t('তারিখ', 'Date')}</span><p className="font-medium text-slate-950">{date(item.created_at)}</p></div>
          <div><span className="text-slate-500">{t('পণ্য', 'Product')}</span><p className="font-medium text-slate-950">{item.order_item?.product?.product_name || t('সম্পূর্ণ অর্ডার', 'Entire order')}</p></div>
          <div><span className="text-slate-500">{t('রিফান্ড', 'Refund')}</span><p className="font-medium text-slate-950">{item.refund ? `${item.refund.status} - ${money(item.refund.refund_amount)}` : '-'}</p></div>
        </div>
      </div>
    </>
  )
}
