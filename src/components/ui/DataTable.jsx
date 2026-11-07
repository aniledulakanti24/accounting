import { useState, useMemo } from 'react'
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, X,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import EmptyState from './EmptyState'
import { formatAmount, getActiveLocale } from '../../lib/currency'

/**
 * DataTable — standard table primitive.
 *
 * columns:      Array<{ key, label, align?, sortable?, render?, className?, sum? }>
 *               sum: true  → column is included in the running-total footer row
 * data:         Array<object>
 * toolbar:      ReactNode — search + filter slot (above table)
 * actions:      (row) => ReactNode — per-row action menu
 * emptyState:   ReactNode | { icon, title, description, action }
 * pageSize:     number (default 20)
 * loading:      boolean
 * rowKey:       string (default 'id')
 * onRowClick:   (row) => void
 * stickyHeader: boolean (default true)
 *
 * Phase-1 additions:
 * selectable:   boolean — adds checkbox column
 * bulkActions:  Array<{ label, icon: LucideIcon, onClick(selectedRows) }>
 *               → floating action bar appears when rows selected
 * rowClassName: (row) => string — conditional row class (e.g. overdue tint)
 * showTotals:   boolean — renders a sticky tfoot with sums for cols where sum:true
 */
export default function DataTable({
  columns      = [],
  data         = [],
  toolbar,
  actions,
  emptyState,
  pageSize     = 20,
  loading,
  className,
  rowKey       = 'id',
  onRowClick,
  stickyHeader = true,
  // Phase-1
  selectable   = false,
  bulkActions  = [],
  rowClassName,
  showTotals   = false,
}) {
  const [sort,     setSort]     = useState({ key: null, dir: 'asc' })
  const [page,     setPage]     = useState(1)
  const [selected, setSelected] = useState(new Set())

  /* ── Sort ── */
  const sorted = useMemo(() => {
    if (!sort.key) return data
    return [...data].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key]
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = typeof av === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), getActiveLocale())
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [data, sort])

  /* ── Paginate ── */
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated  = sorted.slice((page - 1) * pageSize, page * pageSize)

  function toggleSort(key) {
    setSort(s => s.key === key
      ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' }
    )
    setPage(1)
  }

  /* ── Selection helpers ── */
  const pageKeys       = paginated.map(r => r[rowKey] ?? r)
  const allPageSel     = pageKeys.length > 0 && pageKeys.every(k => selected.has(k))
  const someSel        = pageKeys.some(k => selected.has(k))
  const selectedRows   = data.filter(r => selected.has(r[rowKey] ?? r))

  function toggleRow(key) {
    setSelected(s => {
      const n = new Set(s)
      n.has(key) ? n.delete(key) : n.add(key)
      return n
    })
  }

  function togglePage() {
    setSelected(s => {
      const n = new Set(s)
      if (allPageSel) pageKeys.forEach(k => n.delete(k))
      else            pageKeys.forEach(k => n.add(k))
      return n
    })
  }

  function clearSelection() { setSelected(new Set()) }

  /* ── Column totals ── */
  const totals = useMemo(() => {
    if (!showTotals) return {}
    const out = {}
    columns.forEach(col => {
      if (!col.sum) return
      out[col.key] = data.reduce((acc, row) => {
        const v = row[col.key]
        return acc + (typeof v === 'number' ? v : 0)
      }, 0)
    })
    return out
  }, [data, columns, showTotals])

  const hasTotals  = showTotals && Object.keys(totals).length > 0
  const colSpanAll = columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0)
  const isEmpty    = !loading && data.length === 0

  function SortIcon({ colKey }) {
    if (sort.key !== colKey) return <ChevronsUpDown size={12} className="text-[var(--faint)]" />
    return sort.dir === 'asc'
      ? <ChevronUp   size={12} style={{ color: 'var(--primary)' }} />
      : <ChevronDown size={12} style={{ color: 'var(--primary)' }} />
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Toolbar */}
      {toolbar && <div className="mb-3">{toolbar}</div>}

      {/* Table wrapper */}
      <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <table className="w-full text-sm border-collapse">

          {/* ── Head ── */}
          <thead>
            <tr className={cn(
              'bg-[var(--surface-2)] text-left',
              stickyHeader && 'sticky top-0 z-10'
            )}>
              {/* Checkbox column */}
              {selectable && (
                <th className="px-3 py-3 border-b border-[var(--border)] w-10">
                  <input
                    type="checkbox"
                    checked={allPageSel}
                    ref={el => { if (el) el.indeterminate = someSel && !allPageSel }}
                    onChange={togglePage}
                    className="w-3.5 h-3.5 rounded accent-[var(--primary)] cursor-pointer"
                  />
                </th>
              )}

              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap select-none',
                    'border-b border-[var(--border)]',
                    'text-[var(--muted)]',
                    col.align === 'right'  && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.sortable && 'cursor-pointer hover:text-[var(--text)]',
                    col.className
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </span>
                </th>
              ))}

              {actions && (
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b border-[var(--border)] w-12" />
              )}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {loading && (
              <tr>
                <td colSpan={colSpanAll} className="py-12 text-center text-sm text-[var(--faint)]">
                  Loading…
                </td>
              </tr>
            )}

            {!loading && isEmpty && (
              <tr>
                <td colSpan={colSpanAll}>
                  {emptyState ?? <EmptyState title="No records matching the current filter" />}
                </td>
              </tr>
            )}

            {!loading && !isEmpty && paginated.map((row, i) => {
              const key        = row[rowKey] ?? i
              const isSel      = selected.has(key)
              const extraClass = rowClassName ? rowClassName(row) : ''

              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-[var(--border)] last:border-0',
                    'transition-colors duration-100',
                    onRowClick && 'cursor-pointer',
                    isSel
                      ? 'bg-[var(--primary-tint)]'
                      : 'hover:bg-[var(--surface-2)]',
                    extraClass
                  )}
                >
                  {/* Checkbox */}
                  {selectable && (
                    <td className="px-3 py-3" onClick={e => { e.stopPropagation(); toggleRow(key) }}>
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleRow(key)}
                        className="w-3.5 h-3.5 rounded accent-[var(--primary)] cursor-pointer"
                      />
                    </td>
                  )}

                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-[var(--text)]',
                        col.align === 'right'  && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.className
                      )}
                    >
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}

                  {actions && (
                    <td className="px-3 py-3 text-right">{actions(row)}</td>
                  )}
                </tr>
              )
            })}
          </tbody>

          {/* ── Running totals footer ── */}
          {hasTotals && !isEmpty && !loading && (
            <tfoot>
              <tr className="bg-[var(--surface-2)] border-t-2 border-[var(--border)] sticky bottom-0">
                {selectable && <td className="px-3 py-2.5" />}
                {columns.map((col, i) => {
                  const total = totals[col.key]
                  const isFirst = i === 0
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-2.5 text-xs font-bold',
                        col.align === 'right'  && 'text-right',
                        col.align === 'center' && 'text-center',
                        isFirst ? 'text-[var(--muted)]' : 'text-[var(--text)]'
                      )}
                    >
                      {isFirst && !total
                        ? <span className="uppercase tracking-wider text-[10px]">Total</span>
                        : total != null
                          ? (col.render
                              ? col.render(total, { _isTotal: true })
                              : formatAmount(total))
                          : null
                      }
                    </td>
                  )
                })}
                {actions && <td className="px-3 py-2.5" />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-[var(--muted)]">
          <span>
            {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-md hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2
              if (p < 1 || p > totalPages) return null
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-7 h-7 rounded-md text-xs font-medium transition-colors',
                    p === page
                      ? 'bg-[var(--primary)] text-white'
                      : 'hover:bg-[var(--surface-2)]'
                  )}
                >
                  {p}
                </button>
              )
            })}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-md hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Bulk action floating bar ── */}
      {selectable && selected.size > 0 && bulkActions.length > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[850] flex items-center gap-2 px-4 py-2.5 rounded-2xl border shadow-2xl"
          style={{
            background:   'var(--surface)',
            borderColor:  'var(--border)',
            boxShadow:    '0 8px 32px rgba(15,23,42,0.18)',
            animation:    'bulkBarIn 180ms cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          {/* Count badge */}
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full mr-1"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            {selected.size} selected
          </span>

          <div className="w-px h-5 bg-[var(--border)]" />

          {/* Action buttons */}
          {bulkActions.map(({ label, icon: Icon, onClick, variant }) => (
            <button
              key={label}
              onClick={() => { onClick(selectedRows); clearSelection() }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105',
                variant === 'danger'
                  ? 'bg-[var(--neg-tint)] text-[var(--neg)] hover:bg-[var(--neg)] hover:text-white'
                  : 'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--primary-tint)] hover:text-[var(--primary)]'
              )}
            >
              {Icon && <Icon size={13} />}
              {label}
            </button>
          ))}

          <div className="w-px h-5 bg-[var(--border)]" />

          {/* Clear */}
          <button
            onClick={clearSelection}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors text-[var(--faint)] hover:text-[var(--muted)]"
            title="Clear selection"
          >
            <X size={13} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes bulkBarIn {
          from { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)     scale(1);    }
        }
      `}</style>
    </div>
  )
}
