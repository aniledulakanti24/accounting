import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Sparkles, CheckCircle2, AlertTriangle, X, Check, RefreshCw, Link2, Tag } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button     from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import { toast } from '../../lib/toast'

/* ── Mock AI-parsed rows from a "bank statement" ── */
const MOCK_PARSED = [
  { id: 1, date: '02 Dec 2024', desc: 'NEFT FROM INFOSYS BPO LTD',          credit: 850000, debit: 0,      balance: 8245000, aiTag: 'Payment Received',  aiParty: 'Infosys BPO Ltd',   confidence: 98, matchedInvoice: 'RCV-2024-0842', status: 'matched'   },
  { id: 2, date: '05 Dec 2024', desc: 'IMPS TO RELIANCE INDUSTRIES LTD',    credit: 0,      debit: 420000, balance: 7825000, aiTag: 'Payment Made',      aiParty: 'Reliance Ind',      confidence: 95, matchedInvoice: 'PAY-2024-0631', status: 'matched'   },
  { id: 3, date: '08 Dec 2024', desc: 'AMAZON WEB SERVICES INDIA',          credit: 0,      debit: 12500,  balance: 7812500, aiTag: 'Cloud Expense',     aiParty: 'Amazon Web Svcs',   confidence: 91, matchedInvoice: null,            status: 'unmatched' },
  { id: 4, date: '10 Dec 2024', desc: 'HDFC BANK CHARGES Q3',               credit: 0,      debit: 4200,   balance: 7808300, aiTag: 'Bank Charges',      aiParty: 'HDFC Bank',         confidence: 99, matchedInvoice: null,            status: 'new'       },
  { id: 5, date: '12 Dec 2024', desc: 'NEFT FROM TECH MAHINDRA LTD',       credit: 420000, debit: 0,      balance: 8228300, aiTag: 'Payment Received',  aiParty: 'Tech Mahindra',     confidence: 97, matchedInvoice: 'RCV-2024-0839', status: 'matched'   },
  { id: 6, date: '14 Dec 2024', desc: 'GST PAYMENT CHALLAN',                credit: 0,      debit: 693600, balance: 7534700, aiTag: 'GST Payment',       aiParty: 'GSTN',              confidence: 99, matchedInvoice: null,            status: 'new'       },
  { id: 7, date: '15 Dec 2024', desc: 'SALARY TRANSFER BATCH DEC',          credit: 0,      debit: 280000, balance: 7254700, aiTag: 'Payroll',           aiParty: 'Staff Payroll',     confidence: 94, matchedInvoice: null,            status: 'new'       },
  { id: 8, date: '18 Dec 2024', desc: 'INT INCOME ON FD 4821',              credit: 22500,  debit: 0,      balance: 7277200, aiTag: 'Interest Income',   aiParty: 'HDFC Bank',         confidence: 96, matchedInvoice: null,            status: 'new'       },
  { id: 9, date: '20 Dec 2024', desc: 'UPI FRESHWORKS INDIA PVTLTD',        credit: 0,      debit: 45000,  balance: 7232200, aiTag: 'Software Expense',  aiParty: 'Freshworks India',  confidence: 89, matchedInvoice: 'PAY-2024-0629', status: 'matched'   },
  { id:10, date: '22 Dec 2024', desc: 'UNKNOWN TRF 7834521',                credit: 0,      debit: 15000,  balance: 7217200, aiTag: 'Unclassified',      aiParty: null,                confidence: 42, matchedInvoice: null,            status: 'review'    },
]

const CONFIDENCE_STYLE = {
  high:   { label: 'High',   color: 'var(--pos)',  bg: 'var(--pos-tint)'  },
  medium: { label: 'Medium', color: 'var(--warn)', bg: 'var(--warn-tint)' },
  low:    { label: 'Low',    color: 'var(--neg)',  bg: 'var(--neg-tint)'  },
}
function confLevel(pct) { return pct >= 85 ? 'high' : pct >= 60 ? 'medium' : 'low' }

const STATUS_STYLE = {
  matched:   { icon: Link2,         color: 'var(--pos)',  bg: 'var(--pos-tint)',  label: 'Matched'   },
  unmatched: { icon: AlertTriangle, color: 'var(--warn)', bg: 'var(--warn-tint)', label: 'Unmatched' },
  new:       { icon: CheckCircle2,  color: 'var(--primary)', bg: 'var(--primary-tint)', label: 'New Entry' },
  review:    { icon: AlertTriangle, color: 'var(--neg)',  bg: 'var(--neg-tint)',  label: 'Review'    },
}

/* ── Drop zone ── */
function DropZone({ onFile }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }, [onFile])

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="flex flex-col items-center justify-center gap-4 py-14 px-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all"
      style={{
        borderColor:  drag ? 'var(--primary)' : 'var(--border)',
        background:   drag ? 'var(--primary-tint)' : 'var(--surface-2)',
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: drag ? 'var(--primary)' : 'var(--border)' }}
      >
        <Upload size={28} color={drag ? '#fff' : 'var(--faint)'} />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-[var(--text)] mb-1">
          {drag ? 'Drop your statement here' : 'Upload Bank Statement'}
        </p>
        <p className="text-xs text-[var(--muted)]">Drag & drop or click · CSV, Excel, PDF · Any Indian bank format</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-[var(--faint)]">
        <Sparkles size={11} style={{ color: 'var(--primary)' }} />
        <span style={{ color: 'var(--primary)' }}>AI will auto-categorise and match transactions</span>
      </div>
      <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.pdf" className="hidden" onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]) }} />
    </div>
  )
}

/* ── Parsing animation ── */
function ParseProgress({ fileName }) {
  return (
    <div className="flex flex-col items-center gap-5 py-12">
      <div className="relative">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-600))' }}
        >
          <FileText size={28} color="#fff" />
        </div>
        <div
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: 'var(--warn)', animation: 'aiSpin 1s linear infinite' }}
        >
          <Sparkles size={11} color="#fff" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-[var(--text)] mb-1">AI Reading Statement…</p>
        <p className="text-xs text-[var(--muted)]">{fileName}</p>
      </div>
      <div className="w-64 space-y-2">
        {['Parsing transactions', 'Matching to ledger', 'Categorising by AI', 'Ready to review'].map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary-tint)', animation: `parseStep 0.4s ${i * 0.5}s both` }}>
              <CheckCircle2 size={10} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ background: 'var(--primary)', width: '100%', animation: `parseBar 0.6s ${i * 0.5}s both` }} />
            </div>
            <span className="text-[10px] text-[var(--muted)] w-28">{step}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes aiSpin   { to { transform: rotate(360deg); } }
        @keyframes parseStep{ from { opacity:0; transform:scale(0.5) } to { opacity:1; transform:scale(1) } }
        @keyframes parseBar { from { width:0 } to { width:100% } }
      `}</style>
    </div>
  )
}

/* ── Review table ── */
function ReviewTable({ rows, accepted, onToggle, onAcceptAll, onImport }) {
  const acceptedCount = rows.filter(r => accepted.has(r.id)).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: 'var(--primary-tint)', color: 'var(--primary)' }}>
            <Sparkles size={10} />
            AI parsed {rows.length} transactions
          </div>
          <span className="text-xs text-[var(--muted)]">{acceptedCount} selected for import</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onAcceptAll} className="text-xs font-semibold text-[var(--primary)] hover:underline">Select All</button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Matched',   count: rows.filter(r=>r.status==='matched').length,   color: 'var(--pos)'     },
          { label: 'New Entry', count: rows.filter(r=>r.status==='new').length,        color: 'var(--primary)' },
          { label: 'Unmatched', count: rows.filter(r=>r.status==='unmatched').length,  color: 'var(--warn)'    },
          { label: 'Review',    count: rows.filter(r=>r.status==='review').length,     color: 'var(--neg)'     },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-center">
            <p className="text-lg font-black tabular" style={{ color: s.color }}>{s.count}</p>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                <th className="w-10 px-3 py-2.5"></th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Date</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Description</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">AI Category</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Credit</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Debit</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Confidence</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const isSelected = accepted.has(r.id)
                const conf = confLevel(r.confidence)
                const cs   = CONFIDENCE_STYLE[conf]
                const ss   = STATUS_STYLE[r.status]
                const Icon = ss.icon
                return (
                  <tr
                    key={r.id}
                    className="border-b border-[var(--border)] last:border-0 transition-colors cursor-pointer"
                    style={{ background: isSelected ? 'var(--primary-tint)' : undefined }}
                    onClick={() => onToggle(r.id)}
                  >
                    <td className="px-3 py-2.5">
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center border-2 transition-all"
                        style={{
                          borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                          background:  isSelected ? 'var(--primary)' : 'transparent',
                        }}
                      >
                        {isSelected && <Check size={11} color="#fff" />}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-[var(--muted)] whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-2.5 max-w-[200px]">
                      <p className="text-xs font-medium text-[var(--text)] truncate">{r.desc}</p>
                      {r.aiParty && <p className="text-[10px] text-[var(--faint)] truncate">{r.aiParty}</p>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
                        <Tag size={9} />{r.aiTag}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 tabular text-right font-semibold" style={{ color: r.credit > 0 ? 'var(--pos)' : 'var(--faint)' }}>
                      {r.credit > 0 ? formatCurrency(r.credit) : '—'}
                    </td>
                    <td className="px-3 py-2.5 tabular text-right font-semibold" style={{ color: r.debit > 0 ? 'var(--neg)' : 'var(--faint)' }}>
                      {r.debit > 0 ? formatCurrency(r.debit) : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cs.bg, color: cs.color }}>
                        {r.confidence}% {cs.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: ss.bg, color: ss.color }}>
                        <Icon size={9} />{ss.label}
                        {r.matchedInvoice && <span className="font-mono opacity-80"> · {r.matchedInvoice}</span>}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-xs text-[var(--muted)]">{acceptedCount} of {rows.length} transactions selected</p>
        <Button
          variant="primary"
          icon={CheckCircle2}
          onClick={() => onImport(acceptedCount)}
          disabled={acceptedCount === 0}
        >
          Import {acceptedCount > 0 ? `${acceptedCount} Transactions` : 'Selected'}
        </Button>
      </div>
    </div>
  )
}

/* ── Main ── */
export default function BankStatementImport() {
  const [stage,    setStage]    = useState('upload')  // upload | parsing | review | done
  const [fileName, setFileName] = useState('')
  const [accepted, setAccepted] = useState(new Set(MOCK_PARSED.filter(r => r.status !== 'review').map(r => r.id)))

  function handleFile(file) {
    setFileName(file.name)
    setStage('parsing')
    setTimeout(() => setStage('review'), 3200)
  }

  function toggleRow(id) {
    setAccepted(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function acceptAll() {
    setAccepted(new Set(MOCK_PARSED.map(r => r.id)))
  }

  function handleImport(count) {
    setStage('done')
    toast.success(`${count} bank transactions imported and matched to ledger`)
  }

  return (
    <div>
      <PageHeader
        title="Bank Statement Import"
        subtitle="AI-powered parsing · Auto-categorise · Auto-reconcile"
        breadcrumb={['Cash & Bank', 'Import Statement']}
        action={stage === 'review' && (
          <button
            onClick={() => { setStage('upload'); setFileName('') }}
            className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            <X size={12} /> Clear & re-upload
          </button>
        )}
      />

      {stage === 'upload'  && <DropZone onFile={handleFile} />}
      {stage === 'parsing' && <ParseProgress fileName={fileName} />}
      {stage === 'review'  && (
        <ReviewTable
          rows={MOCK_PARSED}
          accepted={accepted}
          onToggle={toggleRow}
          onAcceptAll={acceptAll}
          onImport={handleImport}
        />
      )}

      {stage === 'done' && (
        <div className="flex flex-col items-center py-12 gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--pos)' }}>
            <CheckCircle2 size={32} color="#fff" />
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-[var(--text)]">Import Complete</p>
            <p className="text-sm text-[var(--muted)] mt-1">Transactions have been added to your ledger and reconciliation queue.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" icon={RefreshCw} onClick={() => { setStage('upload'); setFileName('') }}>Import Another</Button>
            <Button variant="primary" onClick={() => toast.info('Opening reconciliation…')}>View Reconciliation →</Button>
          </div>
        </div>
      )}
    </div>
  )
}
