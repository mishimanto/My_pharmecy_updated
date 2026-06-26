import { FiActivity } from 'react-icons/fi'

const statStyles = {
  emerald: {
    panel: 'border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#d1fae5_100%)] shadow-[0_18px_45px_-34px_rgba(16,185,129,0.9)]',
    bubble: 'from-white/80 via-emerald-100 to-emerald-300/80 shadow-[-14px_18px_34px_-24px_rgba(5,150,105,0.9),inset_12px_-12px_24px_rgba(5,150,105,0.22),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
    value: 'text-emerald-700',
  },
  sky: {
    panel: 'border-sky-200 bg-[linear-gradient(135deg,#f0f9ff_0%,#dbeafe_100%)] shadow-[0_18px_45px_-34px_rgba(14,165,233,0.9)]',
    bubble: 'from-white/80 via-sky-100 to-sky-300/80 shadow-[-14px_18px_34px_-24px_rgba(2,132,199,0.9),inset_12px_-12px_24px_rgba(2,132,199,0.22),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
    value: 'text-sky-700',
  },
  amber: {
    panel: 'border-amber-200 bg-[linear-gradient(135deg,#fffbeb_0%,#fef3c7_100%)] shadow-[0_18px_45px_-34px_rgba(245,158,11,0.9)]',
    bubble: 'from-white/80 via-amber-100 to-amber-300/80 shadow-[-14px_18px_34px_-24px_rgba(217,119,6,0.9),inset_12px_-12px_24px_rgba(217,119,6,0.22),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
    value: 'text-amber-700',
  },
  rose: {
    panel: 'border-rose-200 bg-[linear-gradient(135deg,#fff1f2_0%,#ffe4e6_100%)] shadow-[0_18px_45px_-34px_rgba(244,63,94,0.75)]',
    bubble: 'from-white/80 via-rose-100 to-rose-300/80 shadow-[-14px_18px_34px_-24px_rgba(225,29,72,0.75),inset_12px_-12px_24px_rgba(225,29,72,0.2),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
    value: 'text-rose-700',
  },
  violet: {
    panel: 'border-violet-200 bg-[linear-gradient(135deg,#f5f3ff_0%,#ede9fe_100%)] shadow-[0_18px_45px_-34px_rgba(124,58,237,0.75)]',
    bubble: 'from-white/80 via-violet-100 to-violet-300/80 shadow-[-14px_18px_34px_-24px_rgba(109,40,217,0.75),inset_12px_-12px_24px_rgba(109,40,217,0.2),inset_-10px_10px_18px_rgba(255,255,255,0.8)]',
    value: 'text-violet-700',
  },
  slate: {
    panel: 'border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)] shadow-[0_18px_45px_-34px_rgba(71,85,105,0.8)]',
    bubble: 'from-white/80 via-slate-100 to-slate-300/80 shadow-[-14px_18px_34px_-24px_rgba(71,85,105,0.75),inset_12px_-12px_24px_rgba(71,85,105,0.18),inset_-10px_10px_18px_rgba(255,255,255,0.85)]',
    value: 'text-slate-800',
  },
}

export default function AdminStatCard({ label, value, variant, tone, icon: Icon = FiActivity, className = '' }) {
  const style = statStyles[variant || tone] || statStyles.sky

  return (
    <div className={`relative overflow-hidden rounded-lg border p-4 ${style.panel} ${className}`}>
      <span className={`pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-linear-to-br ${style.bubble}`}>
        <span className="absolute left-5 top-5 h-5 w-5 rounded-full bg-white/70 blur-[1px]" />
      </span>
      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className={`mt-2 text-2xl font-semibold ${style.value}`}>{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-slate-500">
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </div>
  )
}
