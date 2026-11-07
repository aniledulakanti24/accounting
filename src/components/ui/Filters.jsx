import { Search } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * Filters toolbar — search input + optional filter slots.
 * Used in the DataTable toolbar row.
 */
export default function Filters({
  search,
  onSearchChange,
  placeholder = 'Search…',
  children,
  className,
}) {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {/* Search */}
      <div className="relative flex-1 min-w-48 max-w-72">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--faint)] pointer-events-none"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full h-9 pl-8 pr-3 text-sm rounded-[var(--radius-sm)]',
            'bg-[var(--surface)] border border-[var(--border)]',
            'text-[var(--text)] placeholder:text-[var(--faint)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]',
            'transition-colors duration-150'
          )}
        />
      </div>

      {/* Additional filter slots (PeriodSelector, dropdowns, etc.) */}
      {children}
    </div>
  )
}
