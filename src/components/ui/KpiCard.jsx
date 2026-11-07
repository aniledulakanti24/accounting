import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * KpiCard — dashboard metric tile.
 * value:     formatted string
 * delta:     number (%) — positive = up, negative = down, null = no delta
 * sentiment: 'pos' | 'neg' | 'warn' | 'neutral'
 * subline:   small helper text below value
 * tooltip:   plain-English explanation shown on hover (for beginners)
 */
export default function KpiCard({
  label,
  value,
  delta,
  deltaLabel,
  sentiment,
  subline,
  icon: Icon,
  iconColor,
  tooltip,
  onClick,
  className,
}) {
  const [showTip, setShowTip] = useState(false)

  const isPos = delta > 0
  const isNeg = delta < 0

  const deltaColor = sentiment === 'pos'  ? 'text-[var(--pos)]'
    : sentiment === 'neg'  ? 'text-[var(--neg)]'
    : sentiment === 'warn' ? 'text-[var(--warn)]'
    : isPos                ? 'text-[var(--pos)]'
    : isNeg                ? 'text-[var(--neg)]'
    :                        'text-[var(--muted)]'

  const DeltaIcon = isPos ? TrendingUp : isNeg ? TrendingDown : Minus

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick(e) }}
      className={cn(
        'bg-[var(--surface)] rounded-[var(--radius)] p-5 relative',
        'shadow-[var(--shadow)] border border-[var(--border)]',
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-px transition-all duration-150',
        className
      )}
    >
      {/* Header row: label + icon */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] leading-tight">
            {label}
          </p>
          {/* Tooltip trigger — shows beginner-friendly explanation */}
          {tooltip && (
            <div className="relative flex-shrink-0">
              <button
                onClick={e => { e.stopPropagation(); setShowTip(v => !v) }}
                onBlur={() => setShowTip(false)}
                className="text-[var(--faint)] hover:text-[var(--muted)] transition-colors"
                aria-label="What is this?"
              >
                <HelpCircle size={12} />
              </button>
              {showTip && (
                <div className="absolute bottom-full left-0 mb-2 z-50 w-52 p-3 rounded-[var(--radius-sm)] bg-[var(--text)] text-white text-xs leading-relaxed shadow-xl pointer-events-none">
                  {tooltip}
                  <div className="absolute top-full left-3 border-4 border-transparent border-t-[var(--text)]" />
                </div>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ml-2"
            style={{ background: iconColor ? `${iconColor}18` : 'var(--primary-tint)' }}
          >
            <Icon size={16} style={{ color: iconColor ?? 'var(--primary)' }} strokeWidth={2} />
          </div>
        )}
      </div>

      {/* Value */}
      <p className="tabular text-2xl font-bold text-[var(--text)] mb-1 leading-none">
        {value}
      </p>

      {/* Subline */}
      {subline && (
        <p className="text-xs text-[var(--muted)] mt-1 leading-snug">{subline}</p>
      )}

      {/* Delta */}
      {delta != null && (
        <div className={cn('flex items-center gap-1 text-xs font-medium mt-2', deltaColor)}>
          <DeltaIcon size={12} strokeWidth={2.5} />
          <span>
            {isPos ? '+' : ''}{delta.toFixed(1)}% vs last month
            {deltaLabel && <span className="text-[var(--faint)] font-normal ml-1">{deltaLabel}</span>}
          </span>
        </div>
      )}
    </div>
  )
}
