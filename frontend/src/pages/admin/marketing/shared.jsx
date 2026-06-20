import { FiEdit, FiPlus, FiSave, FiTrash2, FiUploadCloud, FiX } from 'react-icons/fi'

export function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}

export function MarketingList({ title, items, emptyText, onEdit, onRemove, renderTitle, renderMeta, image = false }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.id} className={`grid gap-4 px-5 py-4 ${image ? 'lg:grid-cols-[120px_minmax(0,1fr)_auto]' : 'lg:grid-cols-[minmax(0,1fr)_auto]'} lg:items-center`}>
            {image ? <img src={item.image_src || item.image_url} alt="" className="h-20 w-full rounded-md bg-slate-100 object-cover" /> : null}
            <div className="min-w-0">
              {item.status ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${item.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                    {item.status}
                  </span>
                </div>
              ) : null}
              <h3 className="mt-2 truncate text-sm font-semibold text-slate-950">{renderTitle(item)}</h3>
              <p className="mt-1 truncate text-xs text-slate-500">{renderMeta(item)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onEdit(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50"><FiEdit className="h-4 w-4" /></button>
              <button type="button" onClick={() => onRemove(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rose-100 text-rose-600 transition hover:bg-rose-50"><FiTrash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 ? <div className="px-5 py-10 text-center text-sm text-slate-500">{emptyText}</div> : null}
      </div>
    </section>
  )
}

export function FormHeader({ title, editing, onCancel }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      {editing ? (
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <FiX className="h-4 w-4" />
          Cancel
        </button>
      ) : null}
    </div>
  )
}

export function StatusField({ value, onChange }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      Status
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none">
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </label>
  )
}

export function UploadField({ label, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700">
      <FiUploadCloud className="h-4 w-4" />
      <span>{label}</span>
      <input type="file" accept="image/*" onChange={(event) => onChange(event.target.files?.[0] || null)} className="hidden" />
    </label>
  )
}

export function SaveButton({ saving, label }) {
  return (
    <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
      <FiSave className="h-4 w-4" />
      {saving ? 'Saving...' : label}
    </button>
  )
}

export function ToolHeader({ tool, icon: Icon, actionLabel = 'Add New' }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-6 w-6 items-center justify-center text-emerald-700">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-slate-950">{tool.title}</h1>
        </div>
      </div>
      <span className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
        <FiPlus className="h-4 w-4" />
        {actionLabel}
      </span>
    </div>
  )
}

export function Field({ label, value, onChange, type = 'text', placeholder = '', required = false }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-400"
      />
    </label>
  )
}
