/* Small shared pieces for the pages that run on the books engine — styled like the UnifiedTree CRM */
import { formatCurrency } from '../../lib/currency'

export function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 shadow-[var(--shadow)] ${className}`}>
      {(title || action) && (
        <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-[14px] font-semibold text-[var(--text)]">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function Money({ value, strong, tone }) {
  const color = tone === 'pos' ? 'var(--pos)' : tone === 'neg' ? 'var(--neg)' : undefined
  return <span className={`tabular ${strong ? 'font-semibold' : ''}`} style={{ color }}>{formatCurrency(value ?? 0)}</span>
}

export function Table({ columns, rows, empty = 'Nothing here yet' }) {
  return (
    <div className="overflow-x-auto rounded-[8px] border border-[var(--border)]">
      <table className="w-full">
        <thead>
          <tr className="text-left">
            {columns.map(c => <th key={c.key} className={`px-3 ${c.align === 'right' ? 'text-right' : ''}`}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-[var(--muted)]">{empty}</td></tr>}
          {rows.map((r, i) => (
            <tr key={r.id ?? i} className="hover:bg-[var(--surface-2)]">
              {columns.map(c => <td key={c.key} className={`px-3 py-[9px] ${c.align === 'right' ? 'text-right' : ''}`}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Stat({ label, value, hint, tone }) {
  const color = tone === 'pos' ? 'var(--pos)' : tone === 'neg' ? 'var(--neg)' : tone === 'warn' ? 'var(--warn)' : 'var(--text)'
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 shadow-[var(--shadow)]">
      <p className="text-[12.5px] font-medium text-[var(--muted)]">{label}</p>
      <p className="tabular mt-1 text-[25px] font-bold leading-tight tracking-[-0.02em]" style={{ color }}>{value}</p>
      {hint && <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">{hint}</p>}
    </div>
  )
}

/* The CRM's segmented control: grey track, active option raised in white */
export function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex flex-wrap gap-0.5 rounded-[8px] bg-[var(--surface-2)] p-[3px]" role="tablist">
      {options.map(([id, label]) => (
        <button key={id} type="button" role="tab" aria-selected={value === id} onClick={() => onChange(id)}
          className={`rounded-[6px] border-0 px-2.5 py-1 text-[13px] font-[550] cursor-pointer transition-colors ${value === id ? 'bg-[var(--surface)] text-[var(--text)] shadow-[0_1px_2px_rgba(0,0,0,0.12)]' : 'bg-transparent text-[var(--muted)] hover:text-[var(--text)]'}`}>
          {label}
        </button>
      ))}
    </div>
  )
}
