import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * StatCard — premium KPI tile with tone accent, icon chip, value, and optional delta/hint.
 *
 * label:  string — uppercase caption
 * value:  string | number — main figure (rendered tabular)
 * icon:   LucideIcon — optional icon in a tinted chip
 * tone:   'primary' | 'pos' | 'neg' | 'warn' | 'text' | 'muted' (drives accent + value colour)
 * delta:  { value: string, dir?: 'up' | 'down' } — optional trend pill
 * hint:   string — small caption under the value
 * onClick: () => void — makes the card interactive (hover lift)
 */
const TONE = {
  primary: 'var(--primary)',
  pos:     'var(--pos)',
  neg:     'var(--neg)',
  warn:    'var(--warn)',
  text:    'var(--text)',
  muted:   'var(--muted)',
}
const TINT = {
  primary: 'var(--primary-tint)',
  pos:     'var(--pos-tint)',
  neg:     'var(--neg-tint)',
  warn:    'var(--warn-tint)',
  text:    'var(--surface-2)',
  muted:   'var(--surface-2)',
}

export default function StatCard({ label, value, icon: Icon, tone = 'text', delta, hint, onClick, className }) {
  const color = TONE[tone] ?? TONE.text
  const tint  = TINT[tone] ?? TINT.text
  const clickable = typeof onClick === 'function'
  const deltaUp = delta && delta.dir !== 'down'

  return (
    <div
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      className={cn(
        'group relative overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition-all duration-150',
        clickable && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow)]',
        className,
      )}
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: color }} aria-hidden />

      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</p>
        {Icon && (
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: tint, color }}>
            <Icon size={15} />
          </span>
        )}
      </div>

      <p className="tabular text-2xl font-bold leading-none" style={{ color }}>{value}</p>

      {(delta || hint) && (
        <div className="mt-2 flex items-center gap-2">
          {delta && (
            <span
              className="inline-flex items-center gap-0.5 text-[11px] font-bold"
              style={{ color: deltaUp ? 'var(--pos)' : 'var(--neg)' }}
            >
              {deltaUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {delta.value}
            </span>
          )}
          {hint && <p className="truncate text-[11px] text-[var(--faint)]">{hint}</p>}
        </div>
      )}
    </div>
  )
}
