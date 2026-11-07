import { useState } from 'react'
import { ChevronDown, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '../../lib/cn'
import { fyMonths, fyQuarters, currentFYYear, fyLabel } from '../../lib/fy'

/**
 * PeriodSelector — backbone period picker for all reports/statements.
 * Emits: { mode, value, from, to } via onChange.
 * mode: 'month' | 'quarter' | 'half' | 'year' | 'custom'
 * fyYear: FY start year (e.g. 2024 → FY 2024-25)
 */
export default function PeriodSelector({ value, onChange, fyYear, className }) {
  const [open, setOpen] = useState(false)
  const [localMode, setLocalMode] = useState(value?.mode ?? 'year')

  const fy = fyYear ?? currentFYYear()

  const modes = [
    { id: 'month',   label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'half',    label: 'Half-Year' },
    { id: 'year',    label: 'Full Year' },
    { id: 'custom',  label: 'Custom' },
  ]

  const months   = fyMonths(fy)
  const quarters = fyQuarters(fy)

  function select(mode, val, from, to) {
    onChange?.({ mode, value: val, from, to })
    if (mode !== 'custom') setOpen(false)
  }

  function switchMode(id) {
    setLocalMode(id)
    if (id === 'year') {
      select('year', fy, new Date(fy, 3, 1), new Date(fy + 1, 2, 31))
    }
  }

  function displayLabel() {
    if (!value) return `${fyLabel(fy)}`
    switch (value.mode) {
      case 'month':   return value.from ? format(value.from, 'MMM yyyy') : 'Month'
      case 'quarter': return `Q${value.value} ${fyLabel(fy)}`
      case 'half':    return `H${value.value} ${fyLabel(fy)}`
      case 'year':    return `${fyLabel(fy)}`
      case 'custom':
        return value.from && value.to
          ? `${format(value.from, 'd MMM')} – ${format(value.to, 'd MMM yy')}`
          : 'Custom range'
      default: return '—'
    }
  }

  const activeMode = value?.mode ?? localMode

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 h-9 px-3 text-sm font-medium rounded-[var(--radius-sm)]',
          'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]',
          'hover:bg-[var(--surface-2)] transition-colors duration-150',
          open && 'ring-2 ring-[var(--primary)]/30 border-[var(--primary)]'
        )}
      >
        <Calendar size={14} className="text-[var(--faint)]" />
        <span>{displayLabel()}</span>
        <ChevronDown
          size={14}
          className={cn('text-[var(--faint)] transition-transform duration-150', open && 'rotate-180')}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className={cn(
              'absolute top-full mt-1.5 right-0 z-20 w-72',
              'bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)]',
              'shadow-[var(--shadow)] p-3'
            )}
          >
            {/* Mode strip */}
            <div className="flex gap-1 mb-3 bg-[var(--surface-2)] rounded-[var(--radius-sm)] p-1">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => switchMode(m.id)}
                  className={cn(
                    'flex-1 text-xs py-1 rounded-md font-medium transition-colors',
                    activeMode === m.id
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Options */}
            {activeMode === 'month' && (
              <div className="grid grid-cols-3 gap-1">
                {months.map((m) => {
                  const to = new Date(m.date.getFullYear(), m.date.getMonth() + 1, 0)
                  return (
                    <button
                      key={m.label}
                      onClick={() => select('month', m.date, m.date, to)}
                      className="text-xs py-1.5 px-2 rounded-md text-[var(--text)] hover:bg-[var(--primary-tint)] hover:text-[var(--primary)] transition-colors"
                    >
                      {m.label}
                    </button>
                  )
                })}
              </div>
            )}

            {activeMode === 'quarter' && (
              <div className="grid grid-cols-2 gap-1">
                {quarters.map((q) => (
                  <button
                    key={q.quarter}
                    onClick={() => select('quarter', q.quarter, q.from, q.to)}
                    className="text-xs py-2 px-3 rounded-md text-[var(--text)] hover:bg-[var(--primary-tint)] hover:text-[var(--primary)] transition-colors text-left"
                  >
                    <span className="font-semibold">{q.label}</span>
                    <span className="text-[var(--faint)] ml-1.5">
                      {format(q.from, 'MMM')}–{format(q.to, 'MMM')}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeMode === 'half' && (
              <div className="grid grid-cols-2 gap-1">
                {[
                  { id: 1, label: 'H1', sub: 'Apr – Sep', from: new Date(fy, 3, 1),  to: new Date(fy, 8, 30) },
                  { id: 2, label: 'H2', sub: 'Oct – Mar', from: new Date(fy, 9, 1),  to: new Date(fy + 1, 2, 31) },
                ].map((h) => (
                  <button
                    key={h.id}
                    onClick={() => select('half', h.id, h.from, h.to)}
                    className="text-xs py-2 px-3 rounded-md text-[var(--text)] hover:bg-[var(--primary-tint)] hover:text-[var(--primary)] transition-colors text-left"
                  >
                    <span className="font-semibold">{h.label}</span>
                    <span className="text-[var(--faint)] ml-1.5">{h.sub}</span>
                  </button>
                ))}
              </div>
            )}

            {activeMode === 'custom' && (
              <div className="flex flex-col gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-[var(--muted)]">From</span>
                  <input
                    type="date"
                    className="text-sm h-8 px-2 border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--surface-2)] focus:outline-none focus:border-[var(--primary)]"
                    onChange={(e) => onChange?.({ ...value, mode: 'custom', from: new Date(e.target.value) })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-[var(--muted)]">To</span>
                  <input
                    type="date"
                    className="text-sm h-8 px-2 border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--surface-2)] focus:outline-none focus:border-[var(--primary)]"
                    onChange={(e) => onChange?.({ ...value, mode: 'custom', to: new Date(e.target.value) })}
                  />
                </label>
                <button
                  onClick={() => setOpen(false)}
                  className="text-xs py-1.5 px-3 bg-[var(--primary)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--primary-600)] transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
