import { useState } from 'react'
import { Download, AlertTriangle, CheckCircle2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'

const BUDGET_DATA = [
  { id:'B01', category:'Sales Revenue',    budget:12000000, actual:11330000, type:'income'  },
  { id:'B02', category:'Other Income',     budget:100000,   actual:130000,   type:'income'  },
  { id:'B03', category:'COGS',             budget:5800000,  actual:6200000,  type:'expense' },
  { id:'B04', category:'Salaries',         budget:2600000,  actual:2800000,  type:'expense' },
  { id:'B05', category:'Marketing',        budget:500000,   actual:420000,   type:'expense' },
  { id:'B06', category:'Professional Fees',budget:150000,   actual:180000,   type:'expense' },
  { id:'B07', category:'Travel',           budget:120000,   actual:145000,   type:'expense' },
  { id:'B08', category:'Utilities',        budget:90000,    actual:88000,    type:'expense' },
  { id:'B09', category:'Office Expenses',  budget:40000,    actual:38000,    type:'expense' },
  { id:'B10', category:'Repairs',          budget:35000,    actual:42000,    type:'expense' },
  { id:'B11', category:'Depreciation',     budget:125000,   actual:125000,   type:'expense' },
]

function VarianceBar({ budget, actual, type }) {
  // For income: actual > budget = good (green). For expense: actual < budget = good (green).
  const pct = budget > 0 ? Math.min((actual / budget) * 100, 150) : 0
  const isGood = type === 'income' ? actual >= budget : actual <= budget
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 bg-[var(--surface-2)] rounded-full overflow-hidden relative">
        {/* budget marker at 100% */}
        <div className="absolute right-0 top-0 h-full w-px bg-[var(--border)] z-10" />
        <div className={`h-full rounded-full transition-all ${isGood ? 'bg-[var(--pos)]' : 'bg-[var(--neg)]'}`} style={{width:`${Math.min(pct,100)}%`}} />
      </div>
      <span className="tabular text-[10px] w-8 text-right" style={{color: isGood ? 'var(--pos)' : 'var(--neg)'}}>
        {pct.toFixed(0)}%
      </span>
    </div>
  )
}

export default function BudgetVsActuals() {
  const [filter, setFilter] = useState('All')

  const rows = filter === 'All' ? BUDGET_DATA : BUDGET_DATA.filter(r => r.type === filter.toLowerCase())

  const totalBudget = BUDGET_DATA.filter(r=>r.type==='income').reduce((s,r)=>s+r.budget,0)
    - BUDGET_DATA.filter(r=>r.type==='expense').reduce((s,r)=>s+r.budget,0)
  const totalActual = BUDGET_DATA.filter(r=>r.type==='income').reduce((s,r)=>s+r.actual,0)
    - BUDGET_DATA.filter(r=>r.type==='expense').reduce((s,r)=>s+r.actual,0)
  const variance = totalActual - totalBudget

  const overBudgetExpenses = BUDGET_DATA.filter(r => r.type==='expense' && r.actual > r.budget)

  return (
    <div>
      <PageHeader title="Budget vs Actuals" subtitle="FY 2025-26 budget tracking" breadcrumb={['Reports & Analytics', 'Budget vs Actuals']}
        action={<Button variant="secondary" icon={Download} size="sm">Export</Button>}
      />

      {overBudgetExpenses.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] bg-amber-50 border border-amber-200 text-xs text-amber-700 mb-4">
          <AlertTriangle size={13} />
          <span>{overBudgetExpenses.length} expense categor{overBudgetExpenses.length>1?'ies':'y'} over budget: {overBudgetExpenses.map(r=>r.category).join(', ')}.</span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label:'Budgeted Net Profit', value:formatCompact(totalBudget), color:'var(--text)'    },
          { label:'Actual Net Profit',   value:formatCompact(totalActual), color:totalActual>=0?'var(--pos)':'var(--neg)' },
          { label:'Variance',            value:formatCompact(Math.abs(variance)), color:variance>=0?'var(--pos)':'var(--neg)' },
          { label:'Over Budget',         value:overBudgetExpenses.length,  color:overBudgetExpenses.length>0?'var(--neg)':'var(--pos)' },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-4">
        {['All','Income','Expense'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-colors ${filter===f?'bg-[var(--primary)] text-white':'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Category</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Type</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Budget</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Actual</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Variance</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] w-36">Utilisation</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i) => {
              const variance = r.type==='income' ? r.actual - r.budget : r.budget - r.actual
              const isGood   = variance >= 0
              return (
                <tr key={r.id} className={`border-b border-[var(--border)] ${i%2===1?'bg-[var(--surface-2)]':''}`}>
                  <td className="px-4 py-2.5 font-medium text-[var(--text)]">{r.category}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${r.type==='income'?'bg-[var(--pos-tint)] text-[var(--pos)]':'bg-[var(--primary-tint)] text-[var(--primary)]'}`}>
                      {r.type==='income'?'Income':'Expense'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 tabular text-right text-[var(--muted)]">{formatCurrency(r.budget)}</td>
                  <td className="px-4 py-2.5 tabular text-right text-[var(--text)] font-medium">{formatCurrency(r.actual)}</td>
                  <td className="px-4 py-2.5 tabular text-right font-semibold" style={{color:isGood?'var(--pos)':'var(--neg)'}}>
                    {isGood ? '+' : '-'}{formatCurrency(Math.abs(variance))}
                  </td>
                  <td className="px-4 py-2.5"><VarianceBar budget={r.budget} actual={r.actual} type={r.type} /></td>
                  <td className="px-4 py-2.5">
                    {isGood
                      ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--pos)]"><CheckCircle2 size={11}/>On Track</span>
                      : <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--neg)]"><AlertTriangle size={11}/>Over</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
