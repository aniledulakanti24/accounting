import { cn } from '../../lib/cn'

/**
 * EmptyState — shown when a list has no results.
 * Every list must have one.
 */
export default function EmptyState({
  icon: Icon,
  title = 'No records found',
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mb-4 shadow-sm">
          <Icon size={28} className="text-[var(--faint)]" strokeWidth={1.5} />
        </div>
      )}
      <p className="text-sm font-semibold text-[var(--text)] mb-1">{title}</p>
      {description && (
        <p className="text-sm text-[var(--muted)] max-w-xs mb-5">{description}</p>
      )}
      {action}
    </div>
  )
}
