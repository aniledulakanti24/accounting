import { useState, useEffect } from 'react'
import { X, Sparkles, TrendingUp, TrendingDown, ArrowRight, Copy, ThumbsUp, ThumbsDown } from 'lucide-react'
import { formatCurrency } from '../../lib/currency'
import { toast } from '../../lib/toast'

/* Mock AI explanations keyed by transaction type pattern */
function generateExplanation(tx) {
  if (!tx) return null
  const dir  = tx.dir === 'in' ? 'inflow' : tx.dir === 'out' ? 'outflow' : 'entry'
  const amt  = formatCurrency(tx.amount)

  const base = {
    'in': {
      what:    `This is a payment received from ${tx.party} for ${amt}.`,
      why:     `Your customer cleared their outstanding invoice, improving your cash position and reducing Accounts Receivable.`,
      impact:  [
        { account: 'Bank / Cash',         side: 'Dr', amt: tx.amount, color: 'var(--pos)'  },
        { account: 'Accounts Receivable', side: 'Cr', amt: tx.amount, color: 'var(--neg)'  },
      ],
      tip:     `If this doesn't match a specific invoice, go to Receivables → Receipts to link it.`,
    },
    'out': {
      what:    `This is a payment sent to ${tx.party} for ${amt}.`,
      why:     `You paid a supplier or vendor. This reduces your bank balance and clears the corresponding bill in Accounts Payable.`,
      impact:  [
        { account: 'Accounts Payable', side: 'Dr', amt: tx.amount, color: 'var(--pos)'  },
        { account: 'Bank / Cash',      side: 'Cr', amt: tx.amount, color: 'var(--neg)'  },
      ],
      tip:     `Verify this is linked to the correct bill in Payables → Bills to maintain accurate aging.`,
    },
    'null': {
      what:    `This is a manual journal entry for ${amt}.`,
      why:     `Journal entries record internal accounting adjustments such as depreciation, accruals, or corrections not captured by regular transactions.`,
      impact:  [
        { account: tx.party || 'Expense / Asset', side: 'Dr', amt: tx.amount, color: 'var(--warn)' },
        { account: 'Equity / Liability',          side: 'Cr', amt: tx.amount, color: 'var(--warn)' },
      ],
      tip:     `Ensure this entry has been reviewed by your accountant. Manual entries can affect trial balance if incorrect.`,
    },
  }

  return base[String(tx.dir)] ?? base['null']
}

/**
 * TransactionExplain — AI-powered transaction explanation panel.
 *
 * Props:
 *   open      boolean
 *   onClose   () => void
 *   transaction  { id, type, party, amount, status, date, dir }
 */
export default function TransactionExplain({ open, onClose, transaction }) {
  const [loading,     setLoading]     = useState(false)
  const [explanation, setExplanation] = useState(null)
  const [feedback,    setFeedback]    = useState(null) // 'up' | 'down'

  useEffect(() => {
    if (!open || !transaction) return
    setExplanation(null)
    setFeedback(null)
    setLoading(true)
    const t = setTimeout(() => {
      setExplanation(generateExplanation(transaction))
      setLoading(false)
    }, 900 + Math.random() * 600)
    return () => clearTimeout(t)
  }, [open, transaction?.id])

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open || !transaction) return null

  function copyExplanation() {
    const text = explanation
      ? `${explanation.what}\n\n${explanation.why}\n\nTip: ${explanation.tip}`
      : ''
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Explanation copied'))
      .catch(() => toast.error('Copy failed'))
  }

  const isIn = transaction.dir === 'in'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[870] bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
        style={{ animation: 'fadeIn 150ms ease both' }}
      />

      {/* Panel */}
      <div
        className="fixed top-0 end-0 h-full w-[400px] z-[880] flex flex-col bg-[var(--surface)] border-s border-[var(--border)] shadow-2xl"
        style={{ animation: 'slideInRight 220ms cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-600))' }}
          >
            <Sparkles size={14} color="#fff" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--text)]">AI Transaction Explain</p>
            <p className="text-[11px] text-[var(--faint)] mt-0.5">{transaction.id} · {transaction.date}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--faint)] transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">

          {/* Transaction card */}
          <div
            className="rounded-xl border p-4"
            style={{
              background:  isIn ? 'var(--pos-tint)'  : transaction.dir === 'out' ? 'var(--neg-tint)' : 'var(--warn-tint)',
              borderColor: isIn ? 'var(--pos)/30'    : transaction.dir === 'out' ? 'var(--neg)/30'   : 'var(--warn)/30',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: isIn ? 'var(--pos)' : transaction.dir === 'out' ? 'var(--neg)' : 'var(--warn)' }}
              >
                {isIn
                  ? <TrendingUp size={16} color="#fff" />
                  : <TrendingDown size={16} color="#fff" />
                }
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[var(--text)]">{transaction.type}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{transaction.party}</p>
              </div>
              <p className="text-lg font-black tabular" style={{ color: isIn ? 'var(--pos)' : 'var(--neg)' }}>
                {isIn ? '+' : '−'}{formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>

          {/* AI explanation */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)]">
              <Sparkles size={11} style={{ color: 'var(--primary)' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>
                AI Explanation
              </span>
            </div>

            {loading ? (
              <div className="px-4 py-6 space-y-2.5">
                {[80, 100, 65].map((w, i) => (
                  <div
                    key={i}
                    className="h-3 rounded-full"
                    style={{
                      width: `${w}%`,
                      background: 'var(--border)',
                      animation: `shimmer 1.5s ease-in-out ${i * 150}ms infinite alternate`,
                    }}
                  />
                ))}
              </div>
            ) : explanation ? (
              <div className="px-4 py-4 space-y-3">
                <p className="text-sm font-semibold text-[var(--text)] leading-relaxed">{explanation.what}</p>
                <p className="text-xs text-[var(--muted)] leading-relaxed">{explanation.why}</p>

                {/* Accounting entry */}
                <div className="mt-1 rounded-lg border border-[var(--border)] overflow-hidden">
                  <div className="px-3 py-1.5 bg-[var(--surface)] border-b border-[var(--border)]">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--faint)]">Accounting Entry</span>
                  </div>
                  {explanation.impact.map((row, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] last:border-0">
                      <span className="text-[11px] text-[var(--muted)]">{row.account}</span>
                      <span className="flex items-center gap-2 text-[11px] font-bold tabular" style={{ color: row.color }}>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: row.color + '20' }}>{row.side}</span>
                        {formatCurrency(row.amt)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tip */}
                <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'var(--primary-tint)' }}>
                  <ArrowRight size={12} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--primary)' }}>{explanation.tip}</p>
                </div>

                {/* Feedback */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-[var(--faint)] flex-1">Was this helpful?</span>
                  <button
                    onClick={() => { setFeedback('up'); toast.success('Thanks for the feedback!') }}
                    className={`p-1.5 rounded-lg transition-colors ${feedback === 'up' ? 'bg-[var(--pos-tint)]' : 'hover:bg-[var(--surface)]'}`}
                    style={{ color: feedback === 'up' ? 'var(--pos)' : 'var(--faint)' }}
                  >
                    <ThumbsUp size={12} />
                  </button>
                  <button
                    onClick={() => { setFeedback('down'); toast.info('We\'ll improve this explanation.') }}
                    className={`p-1.5 rounded-lg transition-colors ${feedback === 'down' ? 'bg-[var(--neg-tint)]' : 'hover:bg-[var(--surface)]'}`}
                    style={{ color: feedback === 'down' ? 'var(--neg)' : 'var(--faint)' }}
                  >
                    <ThumbsDown size={12} />
                  </button>
                  <button
                    onClick={copyExplanation}
                    className="p-1.5 rounded-lg hover:bg-[var(--surface)] transition-colors text-[var(--faint)]"
                    title="Copy explanation"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn      { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes shimmer {
          from { opacity: 0.4; }
          to   { opacity: 1;   }
        }
      `}</style>
    </>
  )
}
