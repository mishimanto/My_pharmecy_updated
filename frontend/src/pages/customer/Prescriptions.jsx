import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { prescriptionApi } from '../../api/prescriptionApi'
import { date } from '../../utils/formatters'

const labels = { pending: 'পেন্ডিং', approved: 'অনুমোদিত', rejected: 'বাতিল', need_clarification: 'তথ্য প্রয়োজন' }

export default function Prescriptions() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    prescriptionApi.list().then(({ data }) => setItems(data.data.data || [])).catch(() => toast.error('প্রেসক্রিপশন লোড করা যায়নি')).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHeader title="প্রেসক্রিপশন" subtitle="আপলোড করা প্রেসক্রিপশন ও pharmacist review status দেখুন।" action={<Link className="rounded bg-emerald-600 px-4 py-2 text-sm text-white" to="/upload-prescription">আপলোড</Link>} />
      {loading && <p className="text-sm text-slate-500">লোড হচ্ছে...</p>}
      {!loading && items.length === 0 && <EmptyState title="প্রেসক্রিপশন নেই" text="নতুন প্রেসক্রিপশন আপলোড করুন।" />}
      {items.length > 0 && <div className="overflow-x-auto rounded border bg-white"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="px-3 py-2">রোগী</th><th className="px-3 py-2">ডাক্তার</th><th className="px-3 py-2">স্ট্যাটাস</th><th className="px-3 py-2">রিভিউ নোট</th><th className="px-3 py-2">তারিখ</th><th className="px-3 py-2">ফাইল</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t"><td className="px-3 py-2">{item.patient_name || '-'}</td><td className="px-3 py-2">{item.doctor_name || '-'}</td><td className="px-3 py-2">{labels[item.status] || item.status}</td><td className="px-3 py-2">{item.reviews?.[0]?.review_note || '-'}</td><td className="px-3 py-2">{date(item.uploaded_at || item.created_at)}</td><td className="px-3 py-2">{item.file_url && <a className="text-emerald-700" href={item.file_url} target="_blank">দেখুন</a>}</td></tr>)}</tbody></table></div>}
    </>
  )
}

