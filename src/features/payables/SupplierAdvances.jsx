import { useState, useEffect } from 'react'
import { Download, Link2, Plus, RotateCcw, ShieldCheck } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getSupplierAdvances } from '../../data/services/payablesService'

const STATUS_CFG = {
  open:     { bg:'bg-[var(--primary-tint)]', text:'text-[var(--primary)]', label:'Open'     },
  adjusted: { bg:'bg-[var(--pos-tint)]',     text:'text-[var(--pos)]',     label:'Adjusted' },
  refunded: { bg:'bg-[var(--surface-2)]',    text:'text-[var(--muted)]',   label:'Refunded' },
}

export default function SupplierAdvances() {
  const [advances, setAdvances] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => { getSupplierAdvances().then(d => { setAdvances(d); setLoading(false) }) }, [])

  const openTotal = advances.filter(a => a.status === 'open').reduce((s,a) => s + a.amount, 0)
  const suggestedAdjustments = advances.filter(a => a.status === 'open').length
  const adjustedTotal = advances.filter(a => a.status === 'adjusted').reduce((s,a) => s + a.amount, 0)
  const maxAdvance = Math.max(openTotal, adjustedTotal, 1)

  const columns = [
    { key:'ref',      label:'Ref #',    render: v => <span className="font-mono text-xs text-[var(--primary)]">{v}</span> },
    { key:'date',     label:'Date',     sortable:true, render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'supplier', label:'Supplier', sortable:true, render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key:'purpose',  label:'Purpose',  render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'amount',   label:'Amount',   align:'right', sortable:true, render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key:'_match', label:'Suggested Use', render: (_, row) => (
      <div>
        <p className="text-sm font-medium text-[var(--text)]">{row.status === 'open' ? 'Adjust before pay run' : 'Already settled'}</p>
        <p className="text-[11px] text-[var(--faint)]">{row.status === 'open' ? 'Available in Pay Center' : 'No action needed'}</p>
      </div>
    ) },
    { key:'status',   label:'Status',   render: v => { const c=STATUS_CFG[v]??{bg:'bg-gray-100',text:'text-gray-500',label:v}; return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span> } },
  ]

  return (
    <div>
      <PageHeader title="Supplier Advances" subtitle="Pre-payments that can be auto-adjusted before supplier payout" breadcrumb={['Money Out', 'Advances']}
        action={<div className="flex gap-2"><Button variant="secondary" icon={Download} size="sm">Export</Button><Button variant="primary" icon={Plus} size="sm">New Advance</Button></div>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {[
          { label:'Open Advances',    value:formatCompact(openTotal), color:'var(--primary)' },
          { label:'Open Count',       value:advances.filter(a=>a.status==='open').length, color:'var(--text)' },
          { label:'Adjusted / Closed',value:advances.filter(a=>a.status==='adjusted').length, color:'var(--pos)' },
          { label:'Suggested Matches',value:suggestedAdjustments, color:'var(--warn)' },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text)]"><Link2 size={15} className="text-[var(--primary)]" /> Bill-wise Linking</div>
          <p className="text-xs leading-relaxed text-[var(--muted)]">Open advances are surfaced in Pay Center before release, closing the Tally-style bill allocation gap.</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text)]"><ShieldCheck size={15} className="text-[var(--pos)]" /> Approval Trail</div>
          <p className="text-xs leading-relaxed text-[var(--muted)]">Advance purpose, source PO, and settlement state stay visible before supplier payment.</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text)]"><RotateCcw size={15} className="text-[var(--warn)]" /> Refund / Adjust</div>
          <p className="text-xs leading-relaxed text-[var(--muted)]">Users can choose adjustment, refund, or hold without leaving Money Out.</p>
        </div>
      </div>
      <div className="mb-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Advance Utilization</p>
          <p className="mt-1 text-xs text-[var(--faint)]">Open advances versus advances already consumed by supplier bills</p>
        </div>
        {[
          { label: 'Open to adjust', value: openTotal, color: 'var(--primary)' },
          { label: 'Already adjusted', value: adjustedTotal, color: 'var(--pos)' },
        ].map(item => (
          <div key={item.label} className="mb-3 last:mb-0">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--muted)]">{item.label}</span>
              <span className="tabular text-xs font-bold text-[var(--text)]">{formatCompact(item.value)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div className="h-full rounded-full" style={{ width: `${Math.max(8, (item.value / maxAdvance) * 100)}%`, background: item.color }} />
            </div>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={advances} loading={loading} rowKey="id" />
    </div>
  )
}
