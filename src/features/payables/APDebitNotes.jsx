import { useState, useEffect } from 'react'
import { Download, FileCheck2, Link2, Plus, ShieldCheck } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getAPDebitNotes } from '../../data/services/payablesService'

const STATUS_CFG = {
  open:     { bg:'bg-[var(--primary-tint)]', text:'text-[var(--primary)]', label:'Open'     },
  adjusted: { bg:'bg-[var(--pos-tint)]',     text:'text-[var(--pos)]',     label:'Adjusted' },
  rejected: { bg:'bg-[var(--neg-tint)]',     text:'text-[var(--neg)]',     label:'Rejected' },
}

export default function APDebitNotes() {
  const [notes, setNotes]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getAPDebitNotes().then(d => { setNotes(d); setLoading(false) }) }, [])

  const openTotal = notes.filter(n => n.status === 'open').reduce((s,n) => s + n.amount, 0)
  const adjustedTotal = notes.filter(n => n.status === 'adjusted').reduce((s,n) => s + n.amount, 0)
  const maxNote = Math.max(openTotal, adjustedTotal, 1)

  const columns = [
    { key:'ref',      label:'Ref #',    render: v => <span className="font-mono text-xs text-[var(--primary)]">{v}</span> },
    { key:'date',     label:'Date',     sortable:true, render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'supplier', label:'Supplier', sortable:true, render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key:'invoice',  label:'Against Invoice', render: v => <span className="font-mono text-xs text-[var(--faint)]">{v}</span> },
    { key:'reason',   label:'Reason',   render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'amount',   label:'Amount',   align:'right', sortable:true, render: v => <span className="tabular text-sm font-semibold text-[var(--neg)]">{formatCurrency(v)}</span> },
    { key:'_payImpact', label:'Pay Impact', render: (_, row) => (
      <div>
        <p className="text-sm font-medium text-[var(--text)]">{row.status === 'open' ? 'Reduce next payment' : 'Already adjusted'}</p>
        <p className="text-[11px] text-[var(--faint)]">Visible in smart pay run</p>
      </div>
    ) },
    { key:'status',   label:'Status',   render: v => { const c=STATUS_CFG[v]??{bg:'bg-gray-100',text:'text-gray-500',label:v}; return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span> } },
  ]

  return (
    <div>
      <PageHeader title="Corrections" subtitle="Debit notes and supplier corrections that reduce outgoing payments" breadcrumb={['Money Out', 'Corrections']}
        action={<div className="flex gap-2"><Button variant="secondary" icon={Download} size="sm">Export</Button><Button variant="primary" icon={Plus} size="sm">New Debit Note</Button></div>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {[
          { label:'Open Value',    value:formatCompact(openTotal),                              color:'var(--neg)'  },
          { label:'Open Notes',   value:notes.filter(n=>n.status==='open').length,              color:'var(--text)' },
          { label:'Total Notes',  value:notes.length,                                           color:'var(--muted)'},
          { label:'Pay Run Savings', value:formatCompact(openTotal),                            color:'var(--primary)' },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text)]"><Link2 size={15} className="text-[var(--primary)]" /> Invoice-linked</div>
          <p className="text-xs leading-relaxed text-[var(--muted)]">Every correction stays attached to the supplier bill, so payment allocation remains clear.</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text)]"><FileCheck2 size={15} className="text-[var(--warn)]" /> Approval Check</div>
          <p className="text-xs leading-relaxed text-[var(--muted)]">Open corrections are flagged before bank release to avoid overpayment.</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text)]"><ShieldCheck size={15} className="text-[var(--pos)]" /> GST / ITC Control</div>
          <p className="text-xs leading-relaxed text-[var(--muted)]">Defective material and price corrections can be reviewed before ITC-sensitive payments.</p>
        </div>
      </div>
      <div className="mb-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Correction Value Flow</p>
          <p className="mt-1 text-xs text-[var(--faint)]">Open debit notes are the immediate payment-saving opportunity</p>
        </div>
        {[
          { label: 'Open corrections', value: openTotal, color: 'var(--primary)' },
          { label: 'Already adjusted', value: adjustedTotal, color: 'var(--pos)' },
        ].map(item => (
          <div key={item.label} className="mb-3 last:mb-0">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--muted)]">{item.label}</span>
              <span className="tabular text-xs font-bold text-[var(--text)]">{formatCompact(item.value)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div className="h-full rounded-full" style={{ width: `${Math.max(8, (item.value / maxNote) * 100)}%`, background: item.color }} />
            </div>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={notes} loading={loading} rowKey="id" />
    </div>
  )
}
