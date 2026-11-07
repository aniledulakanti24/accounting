import { useState, useEffect } from 'react'
import { Download, TrendingUp } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getProfitability } from '../../data/services/reportsService'

function ProfitBar({ value, max }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
        <div className="h-full bg-[var(--pos)] rounded-full" style={{width:`${pct}%`}} />
      </div>
      <span className="tabular text-xs text-[var(--muted)] w-10 text-right">{(pct).toFixed(0)}%</span>
    </div>
  )
}

export default function Profitability() {
  const [rows, setRows]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getProfitability().then(d => { setRows(d); setLoading(false) }) }, [])

  const totals = {
    revenue:     rows.reduce((s,r) => s+r.revenue,     0),
    cogs:        rows.reduce((s,r) => s+r.cogs,        0),
    grossProfit: rows.reduce((s,r) => s+r.grossProfit, 0),
    opex:        rows.reduce((s,r) => s+r.opex,        0),
    netProfit:   rows.reduce((s,r) => s+r.netProfit,   0),
  }
  const maxNetProfit = Math.max(...rows.map(r => r.netProfit), 1)
  const overallGM = totals.revenue > 0 ? ((totals.grossProfit / totals.revenue) * 100).toFixed(1) : 0
  const overallNM = totals.revenue > 0 ? ((totals.netProfit / totals.revenue) * 100).toFixed(1) : 0

  return (
    <div>
      <PageHeader title="Profitability" subtitle="Cost center & segment profit analysis" breadcrumb={['Reports & Analytics', 'Profitability']}
        action={<Button variant="secondary" icon={Download} size="sm">Export</Button>}
      />
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label:'Total Revenue',      value:formatCompact(totals.revenue),     color:'var(--text)'    },
          { label:'Gross Profit',        value:formatCompact(totals.grossProfit), color:'var(--pos)'     },
          { label:'Gross Margin',        value:`${overallGM}%`,                  color:'var(--pos)'     },
          { label:'Net Margin',          value:`${overallNM}%`,                  color:Number(overallNM)>=15?'var(--pos)':'var(--warn)' },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Cost Center</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Revenue</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">COGS</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Gross Profit</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">GM%</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">OpEx</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Net Profit</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] w-36">Contribution</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-[var(--faint)] text-sm">Loading…</td></tr>
            ) : rows.map((r,i) => {
              const gm = r.revenue > 0 ? ((r.grossProfit/r.revenue)*100).toFixed(1) : '0.0'
              return (
                <tr key={r.id} className={`border-b border-[var(--border)] ${i%2===1?'bg-[var(--surface-2)]':''}`}>
                  <td className="px-4 py-3 font-medium text-[var(--text)]">{r.costCenter}</td>
                  <td className="px-4 py-3 tabular text-right text-[var(--text)]">{formatCurrency(r.revenue)}</td>
                  <td className="px-4 py-3 tabular text-right text-[var(--muted)]">{formatCurrency(r.cogs)}</td>
                  <td className="px-4 py-3 tabular text-right text-[var(--pos)] font-medium">{formatCurrency(r.grossProfit)}</td>
                  <td className="px-4 py-3 tabular text-right text-[var(--pos)]">{gm}%</td>
                  <td className="px-4 py-3 tabular text-right text-[var(--neg)]">{formatCurrency(r.opex)}</td>
                  <td className="px-4 py-3 tabular text-right font-semibold" style={{color:r.netProfit>=0?'var(--pos)':'var(--neg)'}}>{formatCurrency(r.netProfit)}</td>
                  <td className="px-4 py-3"><ProfitBar value={r.netProfit} max={maxNetProfit} /></td>
                </tr>
              )
            })}
            <tr className="bg-[var(--surface-2)] border-t-2 border-[var(--primary)]">
              <td className="px-4 py-3 text-sm font-bold text-[var(--text)]">TOTAL</td>
              <td className="px-4 py-3 tabular text-right font-bold text-[var(--text)]">{formatCurrency(totals.revenue)}</td>
              <td className="px-4 py-3 tabular text-right font-bold text-[var(--muted)]">{formatCurrency(totals.cogs)}</td>
              <td className="px-4 py-3 tabular text-right font-bold text-[var(--pos)]">{formatCurrency(totals.grossProfit)}</td>
              <td className="px-4 py-3 tabular text-right font-bold text-[var(--pos)]">{overallGM}%</td>
              <td className="px-4 py-3 tabular text-right font-bold text-[var(--neg)]">{formatCurrency(totals.opex)}</td>
              <td className="px-4 py-3 tabular text-right font-bold text-[var(--pos)]">{formatCurrency(totals.netProfit)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
