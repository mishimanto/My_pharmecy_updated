export default function AdminLoadingState({ colSpan, className = '' }) {
  const content = (
    <div className={`flex items-center justify-center gap-3 text-sm font-medium text-slate-500 ${className}`}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
      <span>Please wait a while</span>
    </div>
  )

  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-4 py-7">
          {content}
        </td>
      </tr>
    )
  }

  return content
}
