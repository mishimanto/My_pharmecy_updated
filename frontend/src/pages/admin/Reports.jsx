import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'

const reports = [
  ['sales', 'সেলস রিপোর্ট', 'দৈনিক/মাসিক সেলস এবং টপ সেলিং ওষুধ'],
  ['orders', 'অর্ডার রিপোর্ট', 'অর্ডার স্ট্যাটাস এবং সাম্প্রতিক অর্ডার'],
  ['inventory', 'ইনভেন্টরি রিপোর্ট', 'লো স্টক এবং নিয়ার এক্সপায়ারি'],
  ['payments', 'পেমেন্ট রিপোর্ট', 'পেমেন্ট স্ট্যাটাস এবং মেথড'],
  ['prescriptions', 'প্রেসক্রিপশন রিপোর্ট', 'রিভিউ স্ট্যাটাস'],
  ['deliveries', 'ডেলিভারি রিপোর্ট', 'রাইডার পারফরম্যান্স'],
  ['refunds', 'রিফান্ড রিপোর্ট', 'রিফান্ড ও রিটার্ন স্ট্যাটাস'],
]

export default function Reports() {
  return (
    <>
      <PageHeader title="রিপোর্ট" subtitle="সেলস, অর্ডার, স্টক, পেমেন্ট, প্রেসক্রিপশন, ডেলিভারি ও রিফান্ড রিপোর্ট।" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map(([type, title, subtitle]) => (
          <Link key={type} to={`/admin/reports/${type}`} className="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-emerald-300">
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
          </Link>
        ))}
      </div>
    </>
  )
}
