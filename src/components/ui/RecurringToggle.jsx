import { useState } from 'react'
import { RefreshCw, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'

const FREQUENCIES = [
  { value: 'weekly',    label: 'Weekly'    },
  { value: 'monthly',   label: 'Monthly'   },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly',    label: 'Yearly'    },
]

const END_OPTIONS = [
  { value: 'never',  label: 'Never'          },
  { value: 'count',  label: 'After N times'  },
  { value: 'date',   label: 'On a date'      },
]

/**
 * RecurringToggle — self-contained toggle + schedule picker.
 *
 * Props:
 *   value    { enabled, frequency, endType, endCount, endDate }
 *   onChange (newValue) => void
 *   compact  boolean — minimal mode for table rows
 */
export default function RecurringToggle({ value, onChange, compact = false }) {
  const [open, setOpen] = useState(false)

  const cfg = value ?? { enabled: false, frequency: 'monthly', endType: 'never', endCount: 3, endDate: '' }

  function patch(update) {
    onChange?.({ ...cfg, ...update })
  }

  function toggleEnabled() {
    const next = !cfg.enabled
    patch({ enabled: next })
    if (next) setOpen(true)
    else setOpen(false)
  }

  return (
    <div className={cn('rounded-xl border transition-colors', cfg.enabled ? 'border-[var(--primary)]/40 bg-[var(--primary-tint)]' : 'border-[var(--border)] bg-[var(--surface-2)]')}>
      {/* Toggle row */}
      <button
        type="button"
        onClick={toggleEnabled}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <RefreshCw size={15} style={{ color: cfg.enabled ? 'var(--primary)' : 'var(--faint)', flexShrink: 0 }} />
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: cfg.enabled ? 'var(--primary)' : 'var(--text)' }}>
            Recurring Transaction
          </p>
          {cfg.enabled && (
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--primary)', opacity: 0.75 }}>
              Repeats {cfg.frequency} · {cfg.endType === 'never' ? 'until cancelled' : cfg.endType === 'count' ? `${cfg.endCount} times` : `until ${cfg.endDate}`}
            </p>
          )}
        </div>

        {/* Toggle pill */}
        <div
          className="relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200"
          style={{ background: cfg.enabled ? 'var(--primary)' : 'var(--border)' }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200"
            style={{ left: cfg.enabled ? '18px' : '2px' }}
          />
        </div>

        {cfg.enabled && (
          <ChevronDown
            size={14}
            style={{
              color: 'var(--primary)',
              transform: open ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 200ms',
              flexShrink: 0,
            }}
            onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
          />
        )}
      </button>

      {/* Expanded schedule config */}
      {cfg.enabled && open && (
        <div className="border-t border-[var(--primary)]/20 px-4 py-3 grid grid-cols-2 gap-3" style={{ animation: 'expandDown 180ms ease both' }}>

          {/* Frequency */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--primary)', opacity: 0.7 }}>
              Frequency
            </label>
            <div className="flex flex-wrap gap-1.5">
              {FREQUENCIES.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => patch({ frequency: f.value })}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all"
                  style={cfg.frequency === f.value
                    ? { background: 'var(--primary)', color: '#fff' }
                    : { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* End condition */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--primary)', opacity: 0.7 }}>
              Ends
            </label>
            <select
              value={cfg.endType}
              onChange={e => patch({ endType: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border focus:outline-none focus:border-[var(--primary)]"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              {END_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {cfg.endType === 'count' && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={cfg.endCount}
                  onChange={e => patch({ endCount: Number(e.target.value) })}
                  className="w-16 h-8 px-2 text-xs rounded-lg border focus:outline-none focus:border-[var(--primary)] text-center"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
                <span className="text-xs text-[var(--muted)]">occurrences</span>
              </div>
            )}

            {cfg.endType === 'date' && (
              <input
                type="date"
                value={cfg.endDate}
                onChange={e => patch({ endDate: e.target.value })}
                className="mt-2 w-full h-8 px-2.5 text-xs rounded-lg border focus:outline-none focus:border-[var(--primary)]"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes expandDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
