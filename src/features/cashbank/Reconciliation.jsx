import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, AlertTriangle, Download, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getBankTransactions } from '../../data/services/cashBankService'

export default function Reconciliation() {
  const [txns, setTxns]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(new Set())

  useEffect(() => { getBankTransactions().then(d => { setTxns(d); setLoading(false) }) }, [])

  const unreconciled = txns.filter(t => !t.reconciled)
  const reconciled   = txns.filter(t => t.reconciled)
  const unreconciledAmt = unreconciled.reduce((s, t) => s + t.credit - t.debit, 0)

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div>
      <PageHeader title="Bank Reconciliation" subtitle="Match statement lines to ledger entries" breadcrumb={['Cash & Bank', 'Reconciliation']}
        action={<div className="flex gap-2"><Button variant="secondary" icon={Download} size="sm">Import Statement</Button><Button variant="primary" icon={RefreshCw} size="sm">Auto-Match</Button></div>}
      />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[{label:'Reconciled',value:reconciled.length,color:'var(--pos)'},{label:'Unreconciled',value:unreconciled.length,color:'var(--neg)'},{label:'Unreconciled Value',value:formatCompact(Math.abs(unreconciledAmt)),color:'var(--primary)'}].map(k=>(
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>

      {unreconciled.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] bg-amber-50 border border-amber-200 text-xs text-amber-700 mb-4">
          <AlertTriangle size={13} />
          <span>{unreconciled.length} unreconciled transactions. Select entries and click "Mark Reconciled" to clear them.</span>
          {selected.size > 0 && <Button variant="primary" size="sm" className="ml-auto">Mark {selected.size} Reconciled</Button>}
        </div>
      )}

      {/* Transaction table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
              <th className="w-10 px-4 py-2.5"></th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Date</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Description</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Ref</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Credit</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Debit</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Balance</th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-[var(--faint)] text-sm">Loading…</td></tr>
            ) : txns.map((t, i) => (
              <tr key={t.id} className={`border-b border-[var(--border)] ${!t.reconciled && selected.has(t.id) ? 'bg-[var(--primary-tint)]' : i % 2 === 0 ? '' : 'bg-[var(--surface-2)]'}`}>
                <td className="px-4 py-2.5">
                  {!t.reconciled && (
                    <button onClick={() => toggleSelect(t.id)} className="text-[var(--muted)] hover:text-[var(--primary)]">
                      {selected.has(t.id) ? <CheckCircle2 size={15} className="text-[var(--primary)]" /> : <Circle size={15} />}
                    </button>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-[var(--muted)]">{t.date}</td>
                <td className="px-4 py-2.5 text-[var(--text)] font-medium max-w-xs truncate">{t.desc}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-[var(--faint)]">{t.ref}</td>
                <td className="px-4 py-2.5 tabular text-right text-[var(--pos)] font-medium">{t.credit > 0 ? formatCurrency(t.credit) : '—'}</td>
                <td className="px-4 py-2.5 tabular text-right text-[var(--neg)] font-medium">{t.debit > 0 ? formatCurrency(t.debit) : '—'}</td>
                <td className="px-4 py-2.5 tabular text-right text-sm font-semibold text-[var(--text)]">{formatCurrency(t.balance)}</td>
                <td className="px-4 py-2.5 text-center">
                  {t.reconciled
                    ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--pos)]"><CheckCircle2 size={11}/>Matched</span>
                    : <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--warn)]"><AlertTriangle size={11}/>Unmatched</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
