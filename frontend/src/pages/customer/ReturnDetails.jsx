import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { returnApi } from '../../api/returnApi'
import PageHeader from '../../components/common/PageHeader'
import { date, money } from '../../utils/formatters'

export default function ReturnDetails() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    returnApi.show(id)
      .then((res) => setItem(res.data.data))
      .catch(() => toast.error('রিটার্ন বিস্তারিত লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-sm text-slate-600">লোড হচ্ছে...</p>
  if (!item) return <p className="text-sm text-slate-600">রিটার্ন পাওয়া যায়নি।</p>

  return (
    <>
      <PageHeader title={`রিটার্ন #${item.id}`} subtitle={`${item.order?.order_number || '-'} - ${item.status}`} />
      <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><span className="text-slate-500">কারণ</span><p className="font-medium text-slate-950">{item.reason}</p></div>
          <div><span className="text-slate-500">তারিখ</span><p className="font-medium text-slate-950">{date(item.created_at)}</p></div>
          <div><span className="text-slate-500">পণ্য</span><p className="font-medium text-slate-950">{item.order_item?.product?.product_name || 'সম্পূর্ণ অর্ডার'}</p></div>
          <div><span className="text-slate-500">রিফান্ড</span><p className="font-medium text-slate-950">{item.refund ? `${item.refund.status} - ${money(item.refund.refund_amount)}` : '-'}</p></div>
        </div>
      </div>
    </>
  )
}
