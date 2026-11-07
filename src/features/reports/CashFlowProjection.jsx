import { useState, useEffect } from 'react'
import { Download, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact, formatCurrencyWhole } from '../../lib/currency'
import { getCashFlowProjection } from '../../data/services/reportsService'

// Extended monthly actuals + projections
const EXTENDED = [
  { month:'Oct 2025', openingBalance:3800000, inflows:4100000,  outflows:3600000,  closingBalance:4300000, projected:false },
  { month:'Nov 2025', openingBalance:4300000, inflows:3900000,  outflows:3500000,  closingBalance:4700000, projected:false },
  { month:'Dec 2025', openingBalance:4700000, inflows:5800000,  outflows:5650000,  closingBalance:4850000, projected:false },
]

function BarChart({ rows }) {
  const maxVal = Math.max(...rows.flatMap(r => [r.inflows, r.outflows]), 1)
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-5 shadow-sm mb-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">Inflows vs Outflows</p>
      <div className="flex items-end gap-3" style={{height:160}}>
        {rows.map(r => (
          <div key={r.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end gap-0.5" style={{height:140}}>
              <div className={`flex-1 rounded-t-sm transition-all ${r.projected?'opacity-60':''}`}
                style={{height:`${(r.inflows/maxVal)*140}px`, background:'var(--pos)'}} title={`Inflows: ${formatCurrencyWhole(r.inflows)}`} />
              <div className={`flex-1 rounded-t-sm transition-all ${r.projected?'opacity-60':''}`}
                style={{height:`${(r.outflows/maxVal)*140}px`, background:'var(--neg)'}} title={`Outflows: ${formatCurrencyWhole(r.outflows)}`} />
            </div>
            <span className="text-[9px] text-[var(--muted)] font-medium text-center leading-tight whitespace-nowrap">{r.month.replace(' ','\n')}</span>
            {r.projected && <span className="text-[8px] text-[var(--primary)] font-semibold">PROJ</span>}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[var(--pos)]" /><span className="text-[10px] text-[var(--muted)]">Inflows</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[var(--neg)]" /><span className="text-[10px] text-[var(--muted)]">Outflows</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[var(--primary)] opacity-60" /><span className="text-[10px] text-[var(--muted)]">Projected</span></div>
      </div>
    </div>
  )
}

export default function CashFlowProjection() {
  const [projected, setProjected] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => { getCashFlowProjection().then(d => { setProjected(d); setLoading(false) }) }, [])

  const allRows       = [...EXTENDED, ...projected]
  const lowestBalance = Math.min(...allRows.map(r => r.closingBalance))
  const highestInflow = Math.max(...allRows.map(r => r.inflows))
  const projRows      = projected

  return (
    <div>
      <PageHeader title="Cash Flow Projection" subtitle="Actuals + 3-month rolling forecast" breadcrumb={['Reports & Analytics', 'Cash Flow Projection']}
        action={<Button variant="secondary" icon={Download} size="sm">Export</Button>}
      />

      {lowestBalance < 1000000 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] bg-amber-50 border border-amber-200 text-xs text-amber-700 mb-4">
          <AlertTriangle size={13} />
          <span>Projected cash dips to {formatCompact(lowestBalance)} in {allRows.find(r=>r.closingBalance===lowestBalance)?.month}. Review outflows or arrange credit facility.</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label:'Current Balance',     value:formatCompact(EXTENDED[EXTENDED.length-1]?.closingBalance ?? 0), color:'var(--text)'    },
          { label:'Projected (3-month)', value:formatCompact(projRows[projRows.length-1]?.closingBalance ?? 0), color:'var(--primary)' },
          { label:'Lowest Point',        value:formatCompact(lowestBalance), color:lowestBalance<500000?'var(--neg)':'var(--warn)' },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>

      {!loading && <BarChart rows={allRows} />}

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Month</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Type</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Opening</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Inflows</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Outflows</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Net</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Closing</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-[var(--faint)] text-sm">Loading…</td></tr>
            ) : allRows.map((r,i) => {
              const net = r.inflows - r.outflows
              return (
                <tr key={r.month} className={`border-b border-[var(--border)] ${r.projected?'bg-[var(--primary-tint)]':i%2===1?'bg-[var(--surface-2)]':''}`}>
                  <td className="px-4 py-2.5 font-medium text-[var(--text)]">{r.month}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${r.projected?'bg-[var(--primary)] text-white':'bg-[var(--surface-2)] text-[var(--muted)]'}`}>
                      {r.projected ? 'Projected' : 'Actual'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 tabular text-right text-[var(--muted)]">{formatCurrency(r.openingBalance)}</td>
                  <td className="px-4 py-2.5 tabular text-right text-[var(--pos)] font-medium">{formatCurrency(r.inflows)}</td>
                  <td className="px-4 py-2.5 tabular text-right text-[var(--neg)] font-medium">{formatCurrency(r.outflows)}</td>
                  <td className="px-4 py-2.5 tabular text-right font-semibold" style={{color:net>=0?'var(--pos)':'var(--neg)'}}>
                    {net>=0?'+':''}{formatCurrency(net)}
                  </td>
                  <td className="px-4 py-2.5 tabular text-right font-bold text-[var(--text)]">{formatCurrency(r.closingBalance)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
