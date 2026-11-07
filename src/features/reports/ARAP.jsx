import { useState, useEffect } from 'react'
import { Download, TrendingUp, TrendingDown } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getAPAgeing } from '../../data/services/payablesService'

// Inline AR ageing data (mirrors receivables ageing but from report perspective)
const AR_AGEING = [
  { id:'AR001', party:'Infosys BPO Ltd',       total:1800000, current:1800000, d31_60:0,       d61_90:0,      d90plus:0       },
  { id:'AR002', party:'Tech Mahindra Limited', total:1200000, current:720000,  d31_60:480000,  d61_90:0,      d90plus:0       },
  { id:'AR003', party:'Wipro Digital Ltd',     total:950000,  current:0,       d31_60:950000,  d61_90:0,      d90plus:0       },
  { id:'AR004', party:'HCL Technologies',      total:680000,  current:0,       d31_60:0,       d61_90:680000, d90plus:0       },
  { id:'AR005', party:'L&T Infotech Ltd',      total:420000,  current:0,       d31_60:0,       d61_90:0,      d90plus:420000  },
]

function MiniBar({ row, type }) {
  const total = row.total || 1
  const segs = type === 'ar'
    ? [
        { val:row.current, color:'bg-[var(--pos)]'    },
        { val:row.d31_60,  color:'bg-amber-400'        },
        { val:row.d61_90,  color:'bg-orange-500'       },
        { val:row.d90plus, color:'bg-[var(--neg)]'     },
      ]
    : [
        { val:row.current, color:'bg-blue-400'         },
        { val:row.d31_60,  color:'bg-amber-400'        },
        { val:row.d61_90,  color:'bg-orange-500'       },
        { val:row.d90plus, color:'bg-[var(--neg)]'     },
      ]
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden bg-[var(--surface-2)] w-24">
      {segs.map((s,i) => s.val > 0 && <div key={i} className={`${s.color} h-full`} style={{width:`${(s.val/total)*100}%`}} />)}
    </div>
  )
}

export default function ARAP() {
  const [apRows, setApRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getAPAgeing().then(d => { setApRows(d); setLoading(false) }) }, [])

  const arTotal = AR_AGEING.reduce((s,r) => s+r.total, 0)
  const apTotal = apRows.reduce((s,r) => s+r.total, 0)
  const netPosition = arTotal - apTotal

  const arOverdue = AR_AGEING.reduce((s,r) => s+r.d31_60+r.d61_90+r.d90plus, 0)
  const apOverdue = apRows.reduce((s,r) => s+r.d31_60+r.d61_90+r.d90plus, 0)

  return (
    <div>
      <PageHeader title="AR & AP" subtitle="Receivables vs Payables snapshot" breadcrumb={['Reports & Analytics', 'AR & AP']}
        action={<Button variant="secondary" icon={Download} size="sm">Export</Button>}
      />
      {/* Net position banner */}
      <div className={`flex items-center justify-between px-5 py-4 rounded-[var(--radius-sm)] border mb-5 ${netPosition >= 0 ? 'bg-[var(--pos-tint)] border-[var(--pos)]' : 'bg-[var(--neg-tint)] border-[var(--neg)]'}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Net AR − AP Position</p>
          <p className="tabular text-2xl font-bold mt-0.5" style={{color: netPosition>=0?'var(--pos)':'var(--neg)'}}>{netPosition>=0?'+':''}{formatCurrency(netPosition)}</p>
        </div>
        {netPosition >= 0 ? <TrendingUp size={28} className="text-[var(--pos)] opacity-60" /> : <TrendingDown size={28} className="text-[var(--neg)] opacity-60" />}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label:'Total AR',      value:formatCompact(arTotal),  color:'var(--pos)'  },
          { label:'AR Overdue',    value:formatCompact(arOverdue),color:'var(--warn)' },
          { label:'Total AP',      value:formatCompact(apTotal),  color:'var(--neg)'  },
          { label:'AP Overdue',    value:formatCompact(apOverdue),color:'var(--neg)'  },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* AR side */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden shadow-sm">
          <div className="bg-[var(--pos-tint)] px-4 py-2.5 border-b border-[var(--border)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--pos)]">Accounts Receivable (AR)</p>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
              <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Customer</th>
              <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Amount</th>
              <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Age</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center py-8 text-[var(--faint)] text-sm">Loading…</td></tr>
              ) : AR_AGEING.map((r,i) => (
                <tr key={r.id} className={`border-b border-[var(--border)] ${i%2===1?'bg-[var(--surface-2)]':''}`}>
                  <td className="px-4 py-2.5 font-medium text-[var(--text)] text-xs">{r.party}</td>
                  <td className="px-4 py-2.5 tabular text-right text-[var(--pos)] font-semibold text-xs">{formatCurrency(r.total)}</td>
                  <td className="px-4 py-2.5"><MiniBar row={r} type="ar" /></td>
                </tr>
              ))}
              <tr className="bg-[var(--pos-tint)] border-t-2 border-[var(--pos)]">
                <td className="px-4 py-3 text-xs font-bold text-[var(--pos)]">TOTAL AR</td>
                <td className="px-4 py-3 tabular text-right font-bold text-[var(--pos)] text-xs">{formatCurrency(arTotal)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>

        {/* AP side */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden shadow-sm">
          <div className="bg-[var(--neg-tint)] px-4 py-2.5 border-b border-[var(--border)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--neg)]">Accounts Payable (AP)</p>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
              <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Supplier</th>
              <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Amount</th>
              <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Age</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center py-8 text-[var(--faint)] text-sm">Loading…</td></tr>
              ) : apRows.map((r,i) => (
                <tr key={r.id} className={`border-b border-[var(--border)] ${i%2===1?'bg-[var(--surface-2)]':''}`}>
                  <td className="px-4 py-2.5 font-medium text-[var(--text)] text-xs">{r.supplier}</td>
                  <td className="px-4 py-2.5 tabular text-right text-[var(--neg)] font-semibold text-xs">{formatCurrency(r.total)}</td>
                  <td className="px-4 py-2.5"><MiniBar row={r} type="ap" /></td>
                </tr>
              ))}
              <tr className="bg-[var(--neg-tint)] border-t-2 border-[var(--neg)]">
                <td className="px-4 py-3 text-xs font-bold text-[var(--neg)]">TOTAL AP</td>
                <td className="px-4 py-3 tabular text-right font-bold text-[var(--neg)] text-xs">{formatCurrency(apTotal)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
