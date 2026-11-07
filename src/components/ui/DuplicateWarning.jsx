import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, ExternalLink, X, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency } from '../../lib/currency'

/**
 * DuplicateWarning — real-time inline duplicate detection.
 *
 * Props:
 *   party     string   — party name currently being entered
 *   amount    number   — amount currently being entered
 *   existing  array    — existing records [{ id, party, amount, date, status }]
 *   onView    (rec) => void   — navigate to existing record
 *   className string   — extra class on root
 *
 * Renders nothing when no matches found.
 * Match criteria: party name similarity ≥ 80% AND amount within 2%.
 */

/* ── Similarity helpers ── */
function normalize(s) {
  return (s ?? '').toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Simple token-based similarity: intersection / union of word sets.
 * Returns 0–1.
 */
function similarity(a, b) {
  if (!a || !b) return 0
  const wa = new Set(normalize(a).split(' '))
  const wb = new Set(normalize(b).split(' '))
  let shared = 0
  wa.forEach(w => { if (wb.has(w)) shared++ })
  const union = new Set([...wa, ...wb]).size
  return union === 0 ? 0 : shared / union
}

function amountClose(a, b) {
  if (!a || !b || a === 0) return false
  return Math.abs(a - b) / Math.max(Math.abs(a), 1) <= 0.02  // 2% tolerance
}

function findDuplicates(party, amount, existing) {
  if (!party || !amount || !existing?.length) return []
  return existing.filter(rec => {
    const partySim  = similarity(party, rec.party)
    const amtMatch  = amountClose(amount, rec.amount)
    return partySim >= 0.8 && amtMatch
  })
}

/* ── Status label colours ── */
const STATUS_COLOR = {
  paid:    { text: 'text-[var(--pos)]',  bg: 'bg-[var(--pos-tint)]'  },
  partial: { text: 'text-[var(--warn)]', bg: 'bg-[var(--warn-tint)]' },
  draft:   { text: 'text-[var(--faint)]',bg: 'bg-[var(--surface-2)]' },
  overdue: { text: 'text-[var(--neg)]',  bg: 'bg-[var(--neg-tint)]'  },
}

export default function DuplicateWarning({ party, amount, existing = [], onView, className = '' }) {
  const [matches,     setMatches]     = useState([])
  const [dismissed,   setDismissed]   = useState(new Set())
  const [expanded,    setExpanded]    = useState(false)
  const prevKey = useRef('')

  /* Re-run detection with debounce whenever inputs change */
  useEffect(() => {
    const key = `${normalize(party)}|${amount}`
    if (key === prevKey.current) return
    prevKey.current = key

    const tid = setTimeout(() => {
      const found = findDuplicates(party, amount, existing)
      setMatches(found)
      /* Reset dismissed list when query changes significantly */
      setDismissed(new Set())
      setExpanded(false)
    }, 300)
    return () => clearTimeout(tid)
  }, [party, amount, existing])

  const visible = matches.filter(m => !dismissed.has(m.id))
  if (!visible.length) return null

  const primary = visible[0]
  const extras  = visible.slice(1)
  const sc      = STATUS_COLOR[primary.status] ?? STATUS_COLOR.draft

  return (
    <div
      className={`rounded-xl border overflow-hidden ${className}`}
      style={{
        borderColor: 'var(--warn)',
        background:  'var(--warn-tint)',
        animation:   'dupIn 200ms cubic-bezier(0.16,1,0.3,1) both',
      }}
      role="alert"
    >
      {/* Main row */}
      <div className="flex items-start gap-3 px-4 py-3">
        <AlertTriangle
          size={15}
          className="flex-shrink-0 mt-0.5"
          style={{ color: 'var(--warn)' }}
        />

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[var(--text)] mb-0.5">
            Possible Duplicate Detected
          </p>
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            <span className="font-semibold text-[var(--text)]">{primary.id}</span>
            {' · '}
            {primary.party}
            {' · '}
            <span className="tabular font-semibold">{formatCurrency(primary.amount)}</span>
            {primary.date ? ` · ${primary.date}` : ''}
          </p>
        </div>

        {/* Status chip */}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${sc.bg} ${sc.text}`}>
          {primary.status}
        </span>

        {/* View button */}
        {onView && (
          <button
            onClick={() => onView(primary)}
            title="Open existing record"
            className="flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline flex-shrink-0"
          >
            View <ExternalLink size={10} />
          </button>
        )}

        {/* Dismiss primary */}
        <button
          onClick={() => setDismissed(s => new Set([...s, primary.id]))}
          className="p-0.5 rounded hover:bg-black/10 text-[var(--faint)] flex-shrink-0 transition-colors"
          title="Dismiss"
        >
          <X size={12} />
        </button>
      </div>

      {/* Extra matches */}
      {extras.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] font-semibold text-[var(--warn)] border-t border-[var(--warn)]/20 hover:bg-black/5 transition-colors"
          >
            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {expanded ? 'Hide' : `+${extras.length} more similar record${extras.length > 1 ? 's' : ''}`}
          </button>

          {expanded && (
            <div className="border-t border-[var(--warn)]/20">
              {extras.map(rec => {
                const c = STATUS_COLOR[rec.status] ?? STATUS_COLOR.draft
                return (
                  <div
                    key={rec.id}
                    className="flex items-center gap-3 px-4 py-2 border-b border-[var(--warn)]/10 last:border-0"
                  >
                    <p className="flex-1 text-[11px] text-[var(--muted)] min-w-0 truncate">
                      <span className="font-semibold text-[var(--text)]">{rec.id}</span>
                      {' · '}{formatCurrency(rec.amount)}
                      {rec.date ? ` · ${rec.date}` : ''}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${c.bg} ${c.text}`}>
                      {rec.status}
                    </span>
                    {onView && (
                      <button
                        onClick={() => onView(rec)}
                        className="text-[11px] font-semibold text-[var(--primary)] hover:underline flex-shrink-0"
                      >
                        View
                      </button>
                    )}
                    <button
                      onClick={() => setDismissed(s => new Set([...s, rec.id]))}
                      className="p-0.5 rounded hover:bg-black/10 text-[var(--faint)] flex-shrink-0 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes dupIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
