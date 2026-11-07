import { useState, useEffect } from 'react'
import { Plus, Download, ArrowRight } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getContraEntries } from '../../data/services/cashBankService'

export default function Contra() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getContraEntries().then(d => { setEntries(d); setLoading(false) }) }, [])

  const totalTransferred = entries.reduce((s, e) => s + e.amount, 0)

  const columns = [
    { key:'ref',    label:'Ref #',       render: v => <span className="font-mono text-xs text-[var(--primary)]">{v}</span> },
    { key:'date',   label:'Date',        sortable:true, render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'from',   label:'From Account',render: v => <span className="font-medium text-sm text-[var(--text)]">{v}</span> },
    { key:'to',     label:'To Account',  render: v => <span className="font-medium text-sm text-[var(--text)]">{v}</span> },
    { key:'amount', label:'Amount',      align:'right', sortable:true, render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key:'purpose',label:'Purpose',     render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'status', label:'Status',      render: v => <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--pos-tint)] text-[var(--pos)]">{v}</span> },
  ]

  return (
    <div>
      <PageHeader title="Contra Entries" subtitle="Inter-account transfers (cash ↔ bank ↔ FD)" breadcrumb={['Cash & Bank', 'Contra']}
        action={<div className="flex gap-2"><Button variant="secondary" icon={Download} size="sm">Export</Button><Button variant="primary" icon={Plus} size="sm">New Transfer</Button></div>}
      />
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[{label:'Total Transferred',value:formatCompact(totalTransferred),color:'var(--text)'},{label:'Entries',value:entries.length,color:'var(--muted)'},{label:'This Month',value:entries.filter(e=>e.date.startsWith('2026-01')).length,color:'var(--primary)'}].map(k=>(
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
