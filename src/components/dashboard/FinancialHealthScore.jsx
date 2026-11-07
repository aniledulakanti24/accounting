import { useEffect, useState } from 'react'
import { Sparkles, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { localizeMoneyText } from '../../lib/currency'

const OVERALL = 72

const SUB_SCORES = [
  { label: 'Cash Flow',    score: 72, icon: '💰', desc: '87-day runway',          href: '/cashbank/bank-accounts'       },
  { label: 'Receivables', score: 54, icon: '📬', desc: '₹7.9L overdue 30d+',     href: '/receivables/ageing'           },
  { label: 'Compliance',  score: 91, icon: '✅', desc: 'All filings current',     href: '/tax/gst-returns'              },
  { label: 'Profitability',score: 68, icon: '📈', desc: '18.4% net margin',       href: '/reports/financial-statements' },
]

function cfg(score) {
  if (score >= 75) return { color: 'var(--pos)',  bg: 'var(--pos-tint)',  grade: 'A', label: 'Healthy'           }
  if (score >= 55) return { color: 'var(--warn)', bg: 'var(--warn-tint)', grade: 'B', label: 'Fair'              }
  return                   { color: 'var(--neg)',  bg: 'var(--neg-tint)',  grade: 'C', label: 'Needs Attention'   }
}

const R   = 52
const C   = 2 * Math.PI * R
const ARC = 0.75   // gauge uses 270° of the circle

export default function FinancialHealthScore() {
  const navigate = useNavigate()
  const [anim, setAnim] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setAnim(OVERALL), 250)
    return () => clearTimeout(t)
  }, [])

  const { color, bg, grade, label } = cfg(OVERALL)
  const filled  = (anim / 100) * C * ARC
  const dashOff = C * (1 - ARC) / 2   // rotate so gap is at bottom

  return (
    <div
      className="bg-[var(--surface)] rounded-[var(--radius)] border border-[var(--border)] p-5 flex flex-col"
      style={{ boxShadow: 'var(--shadow)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={13} style={{ color: 'var(--primary)' }} />
        <span className="text-sm font-bold text-[var(--text)]">Financial Health Score</span>
        <span className="ml-auto text-[10px] text-[var(--faint)]">AI · live</span>
      </div>

      {/* Gauge + sub-scores */}
      <div className="flex items-center gap-5">

        {/* SVG gauge */}
        <div className="relative flex-shrink-0" style={{ width: 120, height: 120 }}>
          <svg width="120" height="120" viewBox="0 0 128 128">
            {/* Track */}
            <circle cx="64" cy="64" r={R}
              fill="none" stroke="var(--border)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${C * ARC} ${C * (1 - ARC)}`}
              strokeDashoffset={-dashOff}
              transform="rotate(135 64 64)"
            />
            {/* Fill — animated */}
            <circle cx="64" cy="64" r={R}
              fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${filled} ${C}`}
              strokeDashoffset={-dashOff}
              transform="rotate(135 64 64)"
              style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.34,1.56,0.64,1)' }}
            />
          </svg>
          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black tabular" style={{ color, lineHeight: 1 }}>{anim}</span>
            <span className="text-[11px] font-bold mt-0.5" style={{ color }}>{grade}</span>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="flex-1 space-y-2.5">
          {SUB_SCORES.map(s => {
            const c = cfg(s.score)
            return (
              <button
                key={s.label}
                onClick={() => navigate(s.href)}
                className="w-full text-left hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] text-[var(--muted)] font-medium">
                    {s.icon} {s.label}
                  </span>
                  <span className="text-[11px] font-bold tabular" style={{ color: c.color }}>
                    {s.score}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${s.score}%`,
                      background: c.color,
                      transition: 'width 1.2s cubic-bezier(0.34,1.56,0.64,1) 400ms',
                    }}
                  />
                </div>
                <p className="text-[10px] text-[var(--faint)] mt-0.5">{localizeMoneyText(s.desc)}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* AI recommendation pill */}
      <button
        onClick={() => navigate('/receivables/ageing')}
        className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-opacity hover:opacity-90"
        style={{ background: bg }}
      >
        <span className="text-[11px] font-medium flex-1" style={{ color }}>
          ● {label} — Collect overdue receivables to boost score +8 pts
        </span>
        <ArrowUpRight size={12} style={{ color, flexShrink: 0 }} />
      </button>
    </div>
  )
}
