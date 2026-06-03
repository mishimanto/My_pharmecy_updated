import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { returnApi } from '../../api/returnApi'
import PageHeader from '../../components/common/PageHeader'
import { date } from '../../utils/formatters'

export default function Returns() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ order_id: '', order_item_id: '', reason: '' })

  const load = () => {
    returnApi.list()
      .then((res) => setReturns(res.data.data?.data || []))
      .catch(() => toast.error('রিটার্ন তালিকা লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await returnApi.create(form.order_id, {
        reason: form.reason,
        order_item_id: form.order_item_id || undefined,
      })
      toast.success('রিটার্ন অনুরোধ তৈরি হয়েছে।')
      setForm({ order_id: '', order_item_id: '', reason: '' })
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'রিটার্ন অনুরোধ করা যায়নি।')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader title="রিটার্ন" subtitle="ডেলিভারড অর্ডারের জন্য রিটার্ন অনুরোধ করুন।" />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-950">নতুন রিটার্ন</h2>
          <input value={form.order_id} onChange={(event) => setForm({ ...form, order_id: event.target.value })} required placeholder="অর্ডার আইডি" className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input value={form.order_item_id} onChange={(event) => setForm({ ...form, order_item_id: event.target.value })} placeholder="অর্ডার আইটেম আইডি (ঐচ্ছিক)" className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <textarea value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} required placeholder="রিটার্নের কারণ" className="mt-3 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <button disabled={submitting} className="mt-4 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">{submitting ? 'পাঠানো হচ্ছে...' : 'রিটার্ন অনুরোধ করুন'}</button>
        </form>

        <section className="space-y-3">
          {loading ? <p className="text-sm text-slate-600">লোড হচ্ছে...</p> : null}
          {!loading && !returns.length ? <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">কোনো রিটার্ন অনুরোধ নেই।</p> : null}
          {returns.map((item) => (
            <Link key={item.id} to={`/returns/${item.id}`} className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-emerald-300">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{item.order?.order_number || `রিটার্ন #${item.id}`}</p>
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
