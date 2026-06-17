import { Link } from 'react-router-dom'

export default function EmptyState({
  title = 'No data found',
  text = 'Records will appear here once they are available.',
  action = null,
  actionLabel = '',
  actionTo = '',
  compact = false,
  className = '',
}) {
  return (
    <div className={`rounded-lg border border-dashed border-slate-300 bg-white text-center text-slate-600 ${compact ? 'p-5' : 'p-8'} ${className}`}>
      
      <strong className="mt-4 block text-base font-semibold text-slate-950">{title}</strong>
      {text ? <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{text}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
      {!action && actionTo && actionLabel ? (
        <Link to={actionTo} className="mt-4 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}
