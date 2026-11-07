import { cn } from '../../lib/cn'

/**
 * SegmentedFilter — saved-view style quick filter chips with optional counts.
 *
 * options:  Array<{ value, label, count? }>
 * value:    current selected value
 * onChange: (value) => void
 */
export default function SegmentedFilter({ options = [], value, onChange, className }) {
  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-1',
        className,
      )}
      role="tablist"
    >
      {options.map(opt => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-150',
              active
                ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text)]',
            )}
          >
            {opt.label}
            {opt.count != null && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-[10px] font-bold leading-4',
                  active ? 'bg-[var(--primary-tint)] text-[var(--primary)]' : 'bg-[var(--surface)] text-[var(--faint)]',
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
