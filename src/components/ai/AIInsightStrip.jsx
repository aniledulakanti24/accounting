import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sparkles, ChevronRight, X, RotateCcw } from 'lucide-react'
import { cn } from '../../lib/cn'
import { getSectionInsights } from '../../data/services/aiContextService'

const TYPE_CFG = {
  warn:    { text: 'text-[var(--warn)]',    borderColor: 'var(--warn)'    },
  info:    { text: 'text-[var(--primary)]', borderColor: 'var(--primary)' },
  success: { text: 'text-[var(--pos)]',     borderColor: 'var(--pos)'     },
}

export default function AIInsightStrip({ inline = false }) {
  const location = useLocation()
  const navigate = useNavigate()
  const ref      = useRef(null)

  const sectionId = location.pathname.split('/')[1] || 'dashboard'
  const insights  = getSectionInsights(sectionId)

  const [dismissed,  setDismissed]  = useState(new Set())
  const [open,       setOpen]       = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [hidden,     setHidden]     = useState(false)

  const visible = insights.filter((_, i) => !dismissed.has(`${sectionId}-${i}-${refreshKey}`))

  /* Close on outside click */
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (hidden || visible.length === 0) return null

  function dismiss(origIdx) {
    setDismissed(s => new Set([...s, `${sectionId}-${origIdx}-${refreshKey}`]))
    if (visible.length === 1) setOpen(false)
  }

  function refresh() {
    setDismissed(new Set())
    setRefreshKey(k => k + 1)
  }

  return (
    <>
      <div
        ref={ref}
        style={inline
          ? { position: 'relative', zIndex: 20, flexShrink: 0 }
          : { position: 'fixed', top: 60, right: 16, zIndex: 800 }
        }
      >
        {/* ── Popover — drops down, right-aligned ── */}
        {open && (
          <div
            className="absolute top-full mt-2 right-0 w-[300px] rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden"
            style={{ animation: 'insightDown 160ms cubic-bezier(0.16,1,0.3,1) both' }}
          >
            {/* Header — label + count + refresh + close */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)]">
              <Sparkles size={13} className="text-[var(--primary)] flex-shrink-0" />
              <span className="text-xs font-semibold text-[var(--text)] flex-1">
                AI Insights
                <span className="ml-1.5 text-[var(--faint)] font-normal">· {visible.length}</span>
              </span>
              <button
                onClick={refresh}
                title="Refresh"
                className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--faint)] hover:text-[var(--muted)] transition-colors"
              >
                <RotateCcw size={11} />
              </button>
              <button
                onClick={() => { setHidden(true); setOpen(false) }}
                title="Close"
                className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--faint)] hover:text-[var(--muted)] transition-colors"
              >
                <X size={11} />
              </button>
            </div>

            {/* Insight rows */}
            <div className="max-h-[280px] overflow-y-auto">
              {visible.map((insight) => {
                const cfg     = TYPE_CFG[insight.type] ?? TYPE_CFG.info
                const origIdx = insights.indexOf(insight)
                return (
                  <div
                    key={`${sectionId}-${origIdx}-${refreshKey}`}
                    className="flex gap-3 px-4 py-3 group hover:bg-[var(--surface-2)] transition-colors border-b border-[var(--border)] last:border-0"
                    style={{ borderLeft: `3px solid ${cfg.borderColor}` }}
                  >
                    {/* Emoji */}
                    <span className="text-base leading-none mt-0.5 flex-shrink-0 select-none">
                      {insight.icon}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed text-[var(--text)] font-medium">
                        {insight.text}
                      </p>
                      {insight.cta && insight.href && (
                        <button
                          onClick={() => { navigate(insight.href); setOpen(false) }}
                          className={cn(
                            'mt-1.5 text-[11px] font-semibold flex items-center gap-0.5 transition-opacity opacity-75 hover:opacity-100',
                            cfg.text
                          )}
                        >
                          {insight.cta} <ChevronRight size={10} />
                        </button>
                      )}
                    </div>

                    {/* Dismiss — visible on hover */}
                    <button
                      onClick={() => dismiss(origIdx)}
                      title="Dismiss"
                      className="flex-shrink-0 opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-opacity self-start mt-0.5"
                    >
                      <X size={11} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Trigger pill ── */}
        <button
          onClick={() => setOpen(o => !o)}
          className={cn(
            'flex items-center gap-2 border text-xs font-semibold transition-all duration-150 select-none',
            inline ? 'h-7 px-2.5 rounded-lg' : 'h-8 px-3.5 rounded-full',
            open
              ? 'bg-[var(--primary)] text-white border-transparent shadow-lg'
              : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] shadow-sm hover:border-[var(--primary)]/50 hover:shadow-md'
          )}
        >
          <Sparkles size={12} className={open ? 'text-white' : 'text-[var(--primary)]'} />
          AI Insights
          <span className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none tabular-nums',
            open ? 'bg-white/25 text-white' : 'bg-[var(--primary)] text-white'
          )}>
            {visible.length}
          </span>
        </button>
      </div>

      <style>{`
        @keyframes insightDown {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </>
  )
}
