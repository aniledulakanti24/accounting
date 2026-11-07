import { useState, useEffect } from 'react'
import { Plus, Download } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getPettyCash } from '../../data/services/cashBankService'

export default function CashPettyCash() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getPettyCash().then(d => { setEntries(d); setLoading(false) }) }, [])

  const totalExpenses = entries.reduce((s, e) => s + e.debit, 0)
  const currentBalance = entries.length > 0 ? entries[0].balance : 0

  const columns = [
    { key:'date',     label:'Date',     render: v => <span className="font-mono text-xs text-[var(--muted)]">{v}</span> },
    { key:'desc',     label:'Description', render: v => <span className="text-sm font-medium text-[var(--text)]">{v}</span> },
    { key:'category', label:'Category', render: v => v !== '—' ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)]">{v}</span> : <span className="text-[var(--faint)]">—</span> },
    { key:'by',       label:'By',       render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'credit',   label:'In',   align:'right', render: v => v > 0 ? <span className="tabular text-sm font-medium text-[var(--pos)]">{formatCurrency(v)}</span> : <span className="text-[var(--faint)]">—</span> },
    { key:'debit',    label:'Out',  align:'right', render: v => v > 0 ? <span className="tabular text-sm font-medium text-[var(--neg)]">{formatCurrency(v)}</span> : <span className="text-[var(--faint)]">—</span> },
    { key:'balance',  label:'Balance',  align:'right', render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
  ]

  return (
    <div>
      <PageHeader title="Cash & Petty Cash" subtitle="Office petty cash register" breadcrumb={['Cash & Bank', 'Cash & Petty Cash']}
        action={<div className="flex gap-2"><Button variant="secondary" icon={Download} size="sm">Export</Button><Button variant="primary" icon={Plus} size="sm">New Entry</Button></div>}
      />
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[{label:'Current Balance',value:formatCompact(currentBalance),color:'var(--text)'},{label:'Total Expenses (Period)',value:formatCompact(totalExpenses),color:'var(--neg)'},{label:'Entries',value:entries.length,color:'var(--muted)'}].map(k=>(
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={entries} loading={loading} rowKey="id" />
    </div>
  )
}
