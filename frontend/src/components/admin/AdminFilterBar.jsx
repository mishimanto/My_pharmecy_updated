import { FiRotateCcw, FiSearch } from 'react-icons/fi'

export default function AdminFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search',
  filters = [],
  onClear,
  hasActiveFilters = false,
  className = '',
  children,
}) {
  const shouldSplitRows = filters.length > 2
  const gridColumns = filters.length > 0 || onClear || children
    ? 'lg:grid-cols-[minmax(0,1fr)_auto]'
    : ''

  if (shouldSplitRows) {
    return (
      <div className={`mb-4 space-y-3 ${className}`}>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <SearchInput search={search} onSearchChange={onSearchChange} searchPlaceholder={searchPlaceholder} />
          {children}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {filters.map((filter) => (
            <FilterSelect key={filter.key} filter={filter} className="min-w-44 flex-1" />
          ))}

          {onClear ? (
            <ClearButton onClear={onClear} hasActiveFilters={hasActiveFilters} />
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className={`mb-4 grid gap-3 ${gridColumns} ${className}`}>
      <SearchInput search={search} onSearchChange={onSearchChange} searchPlaceholder={searchPlaceholder} />

      {filters.length > 0 || onClear || children ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          {filters.map((filter) => (
            <FilterSelect key={filter.key} filter={filter} />
          ))}

          {children}

          {onClear ? (
            <ClearButton onClear={onClear} hasActiveFilters={hasActiveFilters} />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function SearchInput({ search, onSearchChange, searchPlaceholder }) {
  return (
    <label className="relative block min-w-0">
      <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  )
}

function FilterSelect({ filter, className = '' }) {
  return (
    <select
      value={filter.value}
      onChange={(event) => filter.onChange(event.target.value)}
      className={`h-10 min-w-44 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 ${className}`}
    >
      {filter.options.map((option) => (
        <option key={option.value || 'all'} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function ClearButton({ onClear, hasActiveFilters }) {
  return (
    <button
      type="button"
      onClick={onClear}
      disabled={!hasActiveFilters}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <FiRotateCcw className="h-4 w-4" />
      Clear
    </button>
  )
}
