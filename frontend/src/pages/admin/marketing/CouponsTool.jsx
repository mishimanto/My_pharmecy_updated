import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { adminApi } from '../../../api/adminApi'
import AdminLoadingState from '../../../components/admin/AdminLoadingState'
import { toDateTimeLocal } from './dateUtils'
import { toolCopy } from './marketingConfig'
import { Field, FormHeader, MarketingList, SaveButton, StatCard, StatusField, ToolHeader } from './shared'

export default function CouponsTool() {
  const tool = toolCopy.coupons
  const empty = { code: '', label: '', label_bn: '', type: 'fixed', amount: 0, min_subtotal: 0, max_discount: '', usage_limit: '', used_count: 0, starts_at: '', ends_at: '', status: 'active' }
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const stats = useMemo(() => [['Coupons', items.length], ['Active', items.filter((item) => item.status === 'active').length]], [items])

  const load = () => {
    setLoading(true)
    adminApi.listFresh('coupons').then((res) => setItems(res.data.data || [])).catch(() => toast.error('Unable to load coupons.')).finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, [])

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const reset = () => { setForm(empty); setEditingId(null) }
  const edit = (item) => { setEditingId(item.id); setForm({ ...empty, ...item, starts_at: toDateTimeLocal(item.starts_at), ends_at: toDateTimeLocal(item.ends_at), max_discount: item.max_discount ?? '', usage_limit: item.usage_limit ?? '' }) }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.code.trim()) return toast.error('Coupon code is required.')
    setSaving(true)
    const payload = { ...form, code: form.code.trim().toUpperCase(), max_discount: form.max_discount || null, usage_limit: form.usage_limit || null, starts_at: form.starts_at || null, ends_at: form.ends_at || null }
    try {
      editingId ? await adminApi.update('coupons', editingId, payload) : await adminApi.create('coupons', payload)
      toast.success(editingId ? 'Coupon updated.' : 'Coupon created.')
      reset(); load()
    } catch (error) {
      const errors = error.response?.data?.errors
      toast.error((errors ? Object.values(errors).flat()[0] : null) || error.response?.data?.message || 'Unable to save coupon.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`Delete coupon ${item.code}?`)) return
    await adminApi.remove('coupons', item.id).then(() => { toast.success('Coupon deleted.'); load() }).catch(() => toast.error('Unable to delete coupon.'))
  }

  if (loading && items.length === 0) return <AdminLoadingState className="py-8" />

  return (
    <div className="space-y-5">
      <ToolHeader tool={tool} icon={tool.icon} actionLabel={editingId ? 'Editing Coupon' : 'Add New'} />
      <div className="grid gap-4 md:grid-cols-2">{stats.map(([label, value]) => <StatCard key={label} label={label} value={value} />)}</div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <MarketingList title="Checkout coupons" items={items} emptyText="No coupons yet." onEdit={edit} onRemove={remove} renderMeta={(item) => `${item.type} / Tk ${item.amount || 0}`} renderTitle={(item) => item.code} />
        <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <FormHeader title={editingId ? 'Edit coupon' : 'Add coupon'} editing={Boolean(editingId)} onCancel={reset} />
          <Field label="Code" value={form.code} onChange={(value) => setField('code', value.toUpperCase())} required />
          <Field label="Label" value={form.label} onChange={(value) => setField('label', value)} />
          <Field label="Label (Bangla)" value={form.label_bn} onChange={(value) => setField('label_bn', value)} />
          <label className="block text-sm font-medium text-slate-700">Type<select value={form.type} onChange={(event) => setField('type', event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none"><option value="fixed">Fixed</option><option value="percent">Percent</option><option value="free_delivery">Free delivery</option></select></label>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Amount" type="number" value={form.amount} onChange={(value) => setField('amount', value)} /><Field label="Min subtotal" type="number" value={form.min_subtotal} onChange={(value) => setField('min_subtotal', value)} /></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Max discount" type="number" value={form.max_discount} onChange={(value) => setField('max_discount', value)} /><Field label="Usage limit" type="number" value={form.usage_limit} onChange={(value) => setField('usage_limit', value)} /></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Starts at" type="datetime-local" value={form.starts_at} onChange={(value) => setField('starts_at', value)} /><Field label="Ends at" type="datetime-local" value={form.ends_at} onChange={(value) => setField('ends_at', value)} /></div>
          <StatusField value={form.status} onChange={(value) => setField('status', value)} />
          <SaveButton saving={saving} label={editingId ? 'Update Coupon' : 'Create Coupon'} />
        </form>
      </div>
    </div>
  )
}
