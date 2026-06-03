export default function EmptyState({ title = 'এখনও কিছু নেই', text = 'ডাটা পাওয়া গেলে এখানে দেখাবে।' }) {
  return <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600"><strong className="block text-slate-900">{title}</strong><span>{text}</span></div>
}
