import { cn } from '../../lib/cn'

/**
 * Tabs — the CRM's segmented control: a grey track with the active tab raised in white.
 * Counts sit beside each label in a lighter tone.
 */
export default function Tabs({ tabs, active, onChange, className }) {
  return (
    <div className={cn('inline-flex max-w-full flex-wrap gap-0.5 rounded-[8px] bg-[var(--surface-2)] p-[3px]', className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[6px] border-0 px-2.5 py-1 text-[13px] font-[550] transition-colors duration-150 cursor-pointer',
              isActive
                ? 'bg-[var(--surface)] text-[var(--text)] shadow-[0_1px_2px_rgba(0,0,0,0.12)]'
                : 'bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
            )}
          >
            {tab.label}
            {tab.count != null && <span className="tabular text-[12px] font-medium text-[var(--faint)]">{tab.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
