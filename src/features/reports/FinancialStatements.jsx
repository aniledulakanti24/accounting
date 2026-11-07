import { useState, useEffect } from 'react'
import { Download, TrendingUp, TrendingDown } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getTrialBalance, getPLData, getBalanceSheet } from '../../data/services/reportsService'

const TABS = ['Trial Balance', 'Profit & Loss', 'Balance Sheet']

function SectionHeader({ label }) {
  return <tr className="bg-[var(--surface-2)]"><td colSpan={3} className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{label}</td></tr>
}

function AmountRow({ label, amount, bold, indent, color }) {
  return (
    <tr className="border-b border-[var(--border)]">
      <td className={`px-4 py-2 text-sm ${bold ? 'font-bold' : 'font-medium'} text-[var(--text)] ${indent ? 'pl-8' : ''}`}>{label}</td>
      <td className="px-4 py-2 text-right tabular text-sm" style={{color: color ?? (amount >= 0 ? 'var(--text)' : 'var(--neg)'), fontWeight: bold ? 700 : 400}}>
        {formatCurrency(Math.abs(amount))}
      </td>
    </tr>
  )
}

export default function FinancialStatements() {
  const [tab, setTab]   = useState('Trial Balance')
  const [tb, setTb]     = useState([])
  const [pl, setPl]     = useState(null)
  const [bs, setBs]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getTrialBalance(), getPLData(), getBalanceSheet()]).then(([t, p, b]) => {
      setTb(t); setPl(p); setBs(b); setLoading(false)
    })
  }, [])

  const groups = ['Assets', 'Liabilities', 'Equity', 'Income', 'Expenses']
  const totalDr = tb.reduce((s, r) => s + r.dr, 0)
  const totalCr = tb.reduce((s, r) => s + r.cr, 0)

  const plRevenue  = pl?.revenue.reduce((s, r) => s + r.amount, 0) ?? 0
  const plCogs     = pl?.cogs.reduce((s, r) => s + r.amount, 0) ?? 0
  const grossProfit = plRevenue - plCogs
  const plOpex     = pl?.opex.reduce((s, r) => s + r.amount, 0) ?? 0
  const netProfit  = grossProfit - plOpex

  const bsCurrentAssets  = bs?.assets.current.reduce((s,r)=>s+r.amount,0) ?? 0
  const bsNcAssets       = bs?.assets.noncurrent.reduce((s,r)=>s+r.amount,0) ?? 0
  const bsCurrentLiab    = bs?.liabilities.current.reduce((s,r)=>s+r.amount,0) ?? 0
  const bsNcLiab         = bs?.liabilities.noncurrent.reduce((s,r)=>s+r.amount,0) ?? 0
  const bsEquity         = bs?.liabilities.equity.reduce((s,r)=>s+r.amount,0) ?? 0

  return (
    <div>
      <PageHeader title="Financial Statements" subtitle="Trial Balance · P&L · Balance Sheet" breadcrumb={['Reports & Analytics', 'Financial Statements']}
        action={<Button variant="secondary" icon={Download} size="sm">Export PDF</Button>}
      />

      {/* Tab switcher */}
      <div className="flex gap-1 mb-5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-[var(--radius-sm)] transition-colors ${tab===t?'bg-[var(--primary)] text-white':'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <p className="text-center text-sm text-[var(--faint)] py-12">Loading…</p> : (
        <>
          {/* ── TRIAL BALANCE ── */}
          {tab === 'Trial Balance' && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[{label:'Total Dr',value:formatCompact(totalDr),color:'var(--pos)'},{label:'Total Cr',value:formatCompact(totalCr),color:'var(--neg)'},{label:'Difference',value:formatCompact(Math.abs(totalDr-totalCr)),color:totalDr===totalCr?'var(--pos)':'var(--neg)'}].map(k=>(
                  <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
                    <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead><tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Account</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Debit</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Credit</th>
                  </tr></thead>
                  <tbody>
                    {groups.map(grp => {
                      const rows = tb.filter(r => r.group === grp)
                      if (!rows.length) return null
                      return [
                        <tr key={grp} className="bg-[var(--surface-2)]"><td colSpan={3} className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{grp}</td></tr>,
                        ...rows.map((r,i) => (
                          <tr key={r.id} className={`border-b border-[var(--border)] ${i%2===1?'bg-[var(--surface-2)]':''}`}>
                            <td className="px-4 pl-8 py-2 text-sm text-[var(--text)]">{r.account} <span className="text-[10px] text-[var(--faint)] font-mono ml-2">{r.code}</span></td>
                            <td className="px-4 py-2 tabular text-sm text-right text-[var(--pos)] font-medium">{r.dr > 0 ? formatCurrency(r.dr) : '—'}</td>
                            <td className="px-4 py-2 tabular text-sm text-right text-[var(--neg)] font-medium">{r.cr > 0 ? formatCurrency(r.cr) : '—'}</td>
                          </tr>
                        )),
                      ]
                    })}
                    <tr className="bg-[var(--surface-2)] border-t-2 border-[var(--primary)]">
                      <td className="px-4 py-3 text-sm font-bold text-[var(--text)]">TOTAL</td>
                      <td className="px-4 py-3 tabular text-sm font-bold text-right text-[var(--pos)]">{formatCurrency(totalDr)}</td>
                      <td className="px-4 py-3 tabular text-sm font-bold text-right text-[var(--neg)]">{formatCurrency(totalCr)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── P&L ── */}
          {tab === 'Profit & Loss' && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[{label:'Revenue',value:formatCompact(plRevenue),color:'var(--pos)'},{label:'Gross Profit',value:formatCompact(grossProfit),color:'var(--pos)'},{label:'Net Profit',value:formatCompact(netProfit),color:netProfit>=0?'var(--pos)':'var(--neg)'}].map(k=>(
                  <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
                    <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden shadow-sm max-w-2xl">
                <table className="w-full">
                  <thead><tr className="bg-[var(--surface-2)] border-b border-[var(--border)]"><th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Particulars</th><th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Amount</th></tr></thead>
                  <tbody>
                    <SectionHeader label="I. Revenue" />
                    {pl.revenue.map(r=><AmountRow key={r.label} label={r.label} amount={r.amount} indent />)}
                    <AmountRow label="Total Revenue" amount={plRevenue} bold color="var(--pos)" />
                    <SectionHeader label="II. Cost of Goods Sold" />
                    {pl.cogs.map(r=><AmountRow key={r.label} label={r.label} amount={r.amount} indent />)}
                    <AmountRow label="Gross Profit" amount={grossProfit} bold color="var(--pos)" />
                    <SectionHeader label="III. Operating Expenses" />
                    {pl.opex.map(r=><AmountRow key={r.label} label={r.label} amount={r.amount} indent />)}
                    <AmountRow label="Total OpEx" amount={plOpex} bold color="var(--neg)" />
                    <tr className="bg-[var(--primary-tint)] border-t-2 border-[var(--primary)]">
                      <td className="px-4 py-3 text-sm font-bold text-[var(--primary)]">NET PROFIT / (LOSS)</td>
                      <td className="px-4 py-3 tabular text-sm font-bold text-right" style={{color:netProfit>=0?'var(--pos)':'var(--neg)'}}>{formatCurrency(netProfit)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── BALANCE SHEET ── */}
          {tab === 'Balance Sheet' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Assets */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden shadow-sm">
                <div className="bg-[var(--surface-2)] px-4 py-2.5 border-b border-[var(--border)]"><p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Assets</p></div>
                <table className="w-full">
                  <tbody>
                    <SectionHeader label="Current Assets" />
                    {bs.assets.current.map(r=><AmountRow key={r.label} label={r.label} amount={r.amount} indent />)}
                    <AmountRow label="Total Current Assets" amount={bsCurrentAssets} bold />
                    <SectionHeader label="Non-Current Assets" />
                    {bs.assets.noncurrent.map(r=><AmountRow key={r.label} label={r.label} amount={r.amount} indent />)}
                    <AmountRow label="Total Non-Current Assets" amount={bsNcAssets} bold />
                    <tr className="bg-[var(--primary-tint)] border-t-2 border-[var(--primary)]"><td className="px-4 py-3 text-sm font-bold text-[var(--primary)]">TOTAL ASSETS</td><td className="px-4 py-3 tabular text-sm font-bold text-right text-[var(--primary)]">{formatCurrency(bsCurrentAssets+bsNcAssets)}</td></tr>
                  </tbody>
                </table>
              </div>
              {/* Liabilities + Equity */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden shadow-sm">
                <div className="bg-[var(--surface-2)] px-4 py-2.5 border-b border-[var(--border)]"><p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Liabilities & Equity</p></div>
                <table className="w-full">
                  <tbody>
                    <SectionHeader label="Current Liabilities" />
                    {bs.liabilities.current.map(r=><AmountRow key={r.label} label={r.label} amount={r.amount} indent />)}
                    <AmountRow label="Total Current Liabilities" amount={bsCurrentLiab} bold />
                    <SectionHeader label="Non-Current Liabilities" />
                    {bs.liabilities.noncurrent.map(r=><AmountRow key={r.label} label={r.label} amount={r.amount} indent />)}
                    <AmountRow label="Total Non-Current Liabilities" amount={bsNcLiab} bold />
                    <SectionHeader label="Equity" />
                    {bs.liabilities.equity.map(r=><AmountRow key={r.label} label={r.label} amount={r.amount} indent color="var(--primary)" />)}
                    <AmountRow label="Total Equity" amount={bsEquity} bold color="var(--primary)" />
                    <tr className="bg-[var(--primary-tint)] border-t-2 border-[var(--primary)]"><td className="px-4 py-3 text-sm font-bold text-[var(--primary)]">TOTAL L + E</td><td className="px-4 py-3 tabular text-sm font-bold text-right text-[var(--primary)]">{formatCurrency(bsCurrentLiab+bsNcLiab+bsEquity)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
