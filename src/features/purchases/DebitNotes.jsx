import { useState, useEffect, useMemo } from 'react'
import { Plus, Download } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getDebitNotes } from '../../data/services/purchaseService'

const STATUS_CFG = {
  open:     { bg:'bg-[var(--primary-tint)]', text:'text-[var(--primary)]', label:'Open'     },
  adjusted: { bg:'bg-[var(--pos-tint)]',     text:'text-[var(--pos)]',     label:'Adjusted' },
}

export default function DebitNotes() {
  const [notes, setNotes]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => { getDebitNotes().then(d => { setNotes(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => notes.filter(n => {
    const matchSearch = !search || n.supplier.toLowerCase().includes(search.toLowerCase()) || n.ref.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (statusFilter === 'All' || n.status === statusFilter)
  }), [notes, search, statusFilter])

  const columns = [
    { key:'ref',      label:'Debit Note #', sortable:true, render: v => <span className="font-mono text-xs text-[var(--primary)]">{v}</span> },
    { key:'date',     label:'Date',         sortable:true, render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'supplier', label:'Supplier',     sortable:true, render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key:'invoice',  label:'Against Invoice', render: v => <span className="font-mono text-xs text-[var(--muted)]">{v}</span> },
    { key:'reason',   label:'Reason',       render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'amount',   label:'Amount',       align:'right', sortable:true, render: v => <span className="tabular text-sm font-semibold text-[var(--neg)]">{formatCurrency(v)}</span> },
    { key:'status',   label:'Status', render: v => { const c = STATUS_CFG[v] ?? {bg:'bg-gray-100',text:'text-gray-500',label:v}; return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span> } },
  ]

  return (
    <div>
      <PageHeader title="Debit Notes" subtitle="Notes raised against suppliers" breadcrumb={['Purchase Operations', 'Debit Notes']}
        action={<div className="flex gap-2"><Button variant="secondary" icon={Download} size="sm">Export</Button><Button variant="primary" icon={Plus} size="sm">New Debit Note</Button></div>}
      />
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[{label:'Total Issued',value:formatCompact(notes.reduce((s,n)=>s+n.amount,0)),color:'var(--text)'},{label:'Open',value:notes.filter(n=>n.status==='open').length,color:'var(--primary)'},{label:'Adjusted',value:notes.filter(n=>n.status==='adjusted').length,color:'var(--pos)'}].map(k=>(
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} rowKey="id"
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search supplier or debit note…"><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"><option value="All">All Status</option><option value="open">Open</option><option value="adjusted">Adjusted</option></select></Filters>}
      />
    </div>
  )
}
