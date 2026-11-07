import { useState, useEffect } from 'react'
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'

const COMPARATIVE_DATA = [
  {
    section: 'Revenue',
    rows: [
      { label: 'Sales Revenue',   fy25: 9850000,  fy26: 11330000 },
      { label: 'Interest Income', fy25: 38000,    fy26: 45000    },
      { label: 'Other Income',    fy25: 62000,    fy26: 85000    },
    ],
  },
  {
    section: 'Cost of Goods Sold',
    rows: [
      { label: 'Opening Stock',        fy25: 2800000,  fy26: 3200000  },
      { label: 'Purchases',            fy25: 5920000,  fy26: 6820000  },
      { label: 'Less: Closing Stock',  fy25: -2800000, fy26: -3820000 },
    ],
  },
  {
    section: 'Operating Expenses',
    rows: [
      { label: 'Salaries & Wages',  fy25: 2400000, fy26: 2800000 },
      { label: 'Marketing',         fy25: 380000,  fy26: 420000  },
      { label: 'Professional Fees', fy25: 150000,  fy26: 180000  },
      { label: 'Travel',            fy25: 130000,  fy26: 145000  },
      { label: 'Utilities',         fy25: 76000,   fy26: 88000   },
      { label: 'Office Expenses',   fy25: 32000,   fy26: 38000   },
      { label: 'Repairs',           fy25: 36000,   fy26: 42000   },
      { label: 'Depreciation',      fy25: 110000,  fy26: 125000  },
    ],
  },
]

function DeltaCell({ fy25, fy26 }) {
  const delta = fy26 - fy25
  const pct   = fy25 !== 0 ? ((delta / Math.abs(fy25)) * 100).toFixed(1) : '—'
  const pos   = delta >= 0
  const Icon  = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus
  return (
    <td className="px-4 py-2.5 text-right">
      <div className="flex items-center justify-end gap-1">
        <Icon size={11} style={{color: pos ? 'var(--pos)' : 'var(--neg)'}} />
        <span className="tabular text-xs font-medium" style={{color: pos ? 'var(--pos)' : 'var(--neg)'}}>
          {pct !== '—' ? `${pos?'+':''}${pct}%` : '—'}
        </span>
      </div>
    </td>
  )
}

export default function PeriodComparatives() {
  const [view, setView] = useState('P&L')

  const totalRevFY25 = COMPARATIVE_DATA[0].rows.reduce((s,r) => s+r.fy25, 0)
  const totalRevFY26 = COMPARATIVE_DATA[0].rows.reduce((s,r) => s+r.fy26, 0)
  const cogsFY25     = COMPARATIVE_DATA[1].rows.reduce((s,r) => s+r.fy25, 0)
  const cogsFY26     = COMPARATIVE_DATA[1].rows.reduce((s,r) => s+r.fy26, 0)
  const gpFY25       = totalRevFY25 - cogsFY25
  const gpFY26       = totalRevFY26 - cogsFY26
  const opexFY25     = COMPARATIVE_DATA[2].rows.reduce((s,r) => s+r.fy25, 0)
  const opexFY26     = COMPARATIVE_DATA[2].rows.reduce((s,r) => s+r.fy26, 0)
  const npFY25       = gpFY25 - opexFY25
  const npFY26       = gpFY26 - opexFY26

  return (
    <div>
      <PageHeader title="Period Comparatives" subtitle="FY 2024-25 vs FY 2025-26" breadcrumb={['Reports & Analytics', 'Period Comparatives']}
        action={<Button variant="secondary" icon={Download} size="sm">Export</Button>}
      />
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label:'Revenue Growth',  value:`${(((totalRevFY26-totalRevFY25)/totalRevFY25)*100).toFixed(1)}%`, color:'var(--pos)'  },
          { label:'GP FY 25-26',     value:formatCompact(gpFY26),  color:'var(--pos)'  },
          { label:'NP FY 25-26',     value:formatCompact(npFY26),  color:npFY26>=0?'var(--pos)':'var(--neg)' },
          { label:'NP Growth',       value:`${(((npFY26-npFY25)/Math.abs(npFY25))*100).toFixed(1)}%`, color:npFY26>=npFY25?'var(--pos)':'var(--neg)' },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden shadow-sm max-w-4xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Particulars</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">FY 2024-25</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">FY 2025-26</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Change</th>
            </tr>
          </thead>
          <tbody>
            {COMPARATIVE_DATA.map(section => (
              <>
                <tr key={section.section} className="bg-[var(--surface-2)]">
                  <td colSpan={4} className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{section.section}</td>
                </tr>
                {section.rows.map((r,i) => (
                  <tr key={r.label} className={`border-b border-[var(--border)] ${i%2===1?'bg-[var(--surface-2)]':''}`}>
                    <td className="px-4 py-2.5 pl-8 text-[var(--text)]">{r.label}</td>
                    <td className="px-4 py-2.5 tabular text-right text-[var(--muted)]">{formatCurrency(Math.abs(r.fy25))}</td>
                    <td className="px-4 py-2.5 tabular text-right text-[var(--text)] font-medium">{formatCurrency(Math.abs(r.fy26))}</td>
                    <DeltaCell fy25={r.fy25} fy26={r.fy26} />
                  </tr>
                ))}
              </>
            ))}
            {/* Summary rows */}
            <tr className="border-t border-[var(--border)] bg-[var(--surface-2)]">
              <td className="px-4 py-2.5 font-bold text-[var(--text)]">Gross Profit</td>
              <td className="px-4 py-2.5 tabular text-right font-bold text-[var(--pos)]">{formatCurrency(gpFY25)}</td>
              <td className="px-4 py-2.5 tabular text-right font-bold text-[var(--pos)]">{formatCurrency(gpFY26)}</td>
              <DeltaCell fy25={gpFY25} fy26={gpFY26} />
            </tr>
            <tr className="bg-[var(--primary-tint)] border-t-2 border-[var(--primary)]">
              <td className="px-4 py-3 font-bold text-[var(--primary)]">Net Profit / (Loss)</td>
              <td className="px-4 py-3 tabular text-right font-bold" style={{color:npFY25>=0?'var(--pos)':'var(--neg)'}}>{formatCurrency(npFY25)}</td>
              <td className="px-4 py-3 tabular text-right font-bold" style={{color:npFY26>=0?'var(--pos)':'var(--neg)'}}>{formatCurrency(npFY26)}</td>
              <DeltaCell fy25={npFY25} fy26={npFY26} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
