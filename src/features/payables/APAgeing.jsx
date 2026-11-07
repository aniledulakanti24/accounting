import { useState, useEffect } from 'react'
import { Download, AlertTriangle, MailCheck, ShieldCheck, WalletCards } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact, formatCurrencyWhole } from '../../lib/currency'
import { getAPAgeing } from '../../data/services/payablesService'

function AgeBar({ row }) {
  const total = row.total || 1
  const segs = [
    { val: row.current, color: 'bg-[var(--pos)]',     label: 'Current' },
    { val: row.d31_60,  color: 'bg-amber-400',         label: '31–60' },
    { val: row.d61_90,  color: 'bg-orange-500',        label: '61–90' },
    { val: row.d90plus, color: 'bg-[var(--neg)]',      label: '90+' },
  ]
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex h-2 rounded-full overflow-hidden flex-1 bg-[var(--surface-2)]">
        {segs.map(s => s.val > 0 && (
          <div key={s.label} className={`${s.color} h-full`} style={{width:`${(s.val/total)*100}%`}} title={`${s.label}: ${formatCurrencyWhole(s.val)}`} />
        ))}
      </div>
    </div>
  )
}

export default function APAgeing() {
  const [rows, setRows]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getAPAgeing().then(d => { setRows(d); setLoading(false) }) }, [])

  const totals = {
    total:   rows.reduce((s,r) => s+r.total,   0),
    current: rows.reduce((s,r) => s+r.current, 0),
    d31_60:  rows.reduce((s,r) => s+r.d31_60,  0),
    d61_90:  rows.reduce((s,r) => s+r.d61_90,  0),
    d90plus: rows.reduce((s,r) => s+r.d90plus, 0),
  }
  const overdue = totals.d31_60 + totals.d61_90 + totals.d90plus
  const highRiskSuppliers = rows.filter(r => r.d61_90 + r.d90plus > 0).length
  const suggestedPayNow = rows.filter(r => r.d31_60 + r.d61_90 + r.d90plus > 0).reduce((sum, r) => sum + Math.min(r.total, r.d31_60 + r.d61_90 + r.d90plus), 0)

  return (
    <div>
      <PageHeader title="Overdue" subtitle="Supplier ageing with pay priority, supply-risk, and reminder actions" breadcrumb={['Money Out', 'Overdue']}
        action={<Button variant="secondary" icon={Download} size="sm">Export</Button>}
      />
      {overdue > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] bg-amber-50 border border-amber-200 text-xs text-amber-700 mb-4">
          <AlertTriangle size={13} />
          <span>{formatCompact(overdue)} overdue across {rows.filter(r=>r.d31_60+r.d61_90+r.d90plus>0).length} supplier(s). Clear urgently to avoid supply disruption.</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {[
          { label:'Current (0–30d)',color:'var(--pos)',   value:formatCompact(totals.current) },
          { label:'31–60 Days',     color:'#f59e0b',     value:formatCompact(totals.d31_60)  },
          { label:'61–90 Days',     color:'#f97316',     value:formatCompact(totals.d61_90)  },
          { label:'90+ Days',       color:'var(--neg)',  value:formatCompact(totals.d90plus) },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text)]"><WalletCards size={15} className="text-[var(--primary)]" /> Suggested Pay Now</div>
          <p className="tabular text-lg font-bold text-[var(--primary)]">{formatCurrency(suggestedPayNow)}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Prioritizes overdue suppliers before non-critical current bills.</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text)]"><ShieldCheck size={15} className="text-[var(--warn)]" /> Supply Risk</div>
          <p className="tabular text-lg font-bold text-[var(--warn)]">{highRiskSuppliers} supplier(s)</p>
          <p className="mt-1 text-xs text-[var(--muted)]">61+ day balances should be cleared or negotiated.</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text)]"><MailCheck size={15} className="text-[var(--pos)]" /> Supplier Communication</div>
          <p className="tabular text-lg font-bold text-[var(--pos)]">Advice ready</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Payment advice or promise-date messages can be sent from Pay Center.</p>
        </div>
      </div>
      <div className="mb-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Ageing Pressure Map</p>
          <p className="mt-1 text-xs text-[var(--faint)]">Older balances should be prioritized before normal-cycle payments</p>
        </div>
        {[
          { label: 'Current', value: totals.current, color: 'var(--pos)' },
          { label: '31-60 days', value: totals.d31_60, color: '#f59e0b' },
          { label: '61-90 days', value: totals.d61_90, color: '#f97316' },
          { label: '90+ days', value: totals.d90plus, color: 'var(--neg)' },
        ].map(item => (
          <div key={item.label} className="mb-3 last:mb-0">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--muted)]">{item.label}</span>
              <span className="tabular text-xs font-bold text-[var(--text)]">{formatCompact(item.value)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div className="h-full rounded-full" style={{ width: `${Math.max(5, (item.value / Math.max(totals.total, 1)) * 100)}%`, background: item.color }} />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Supplier</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Total</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Current</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">31–60d</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">61–90d</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">90+d</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] w-36">Age Profile</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-[var(--faint)] text-sm">Loading…</td></tr>
            ) : rows.map((r,i) => (
              <tr key={r.id} className={`border-b border-[var(--border)] ${i%2===1?'bg-[var(--surface-2)]':''}`}>
                <td className="px-4 py-2.5 font-medium text-[var(--text)]">{r.supplier}</td>
                <td className="px-4 py-2.5 tabular text-right font-semibold text-[var(--text)]">{formatCurrency(r.total)}</td>
                <td className="px-4 py-2.5 tabular text-right text-[var(--pos)]">{r.current > 0 ? formatCurrency(r.current) : '—'}</td>
                <td className="px-4 py-2.5 tabular text-right text-amber-600">{r.d31_60 > 0 ? formatCurrency(r.d31_60) : '—'}</td>
                <td className="px-4 py-2.5 tabular text-right text-orange-600">{r.d61_90 > 0 ? formatCurrency(r.d61_90) : '—'}</td>
                <td className="px-4 py-2.5 tabular text-right text-[var(--neg)]">{r.d90plus > 0 ? formatCurrency(r.d90plus) : '—'}</td>
                <td className="px-4 py-2.5"><AgeBar row={r} /></td>
              </tr>
            ))}
            <tr className="bg-[var(--surface-2)] border-t-2 border-[var(--primary)]">
              <td className="px-4 py-3 text-sm font-bold text-[var(--text)]">TOTAL</td>
              <td className="px-4 py-3 tabular text-right font-bold text-[var(--primary)]">{formatCurrency(totals.total)}</td>
              <td className="px-4 py-3 tabular text-right font-bold text-[var(--pos)]">{formatCurrency(totals.current)}</td>
              <td className="px-4 py-3 tabular text-right font-bold text-amber-600">{formatCurrency(totals.d31_60)}</td>
              <td className="px-4 py-3 tabular text-right font-bold text-orange-600">{formatCurrency(totals.d61_90)}</td>
              <td className="px-4 py-3 tabular text-right font-bold text-[var(--neg)]">{formatCurrency(totals.d90plus)}</td>
              <td className="px-4 py-3"><AgeBar row={totals} /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
