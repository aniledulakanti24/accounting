import { useState, useEffect, useMemo } from 'react'
import { Plus, Download, Undo2, CheckCircle2, Clock } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getPurchaseReturns } from '../../data/services/purchaseService'

const STATUS_CFG = {
  approved: { bg:'bg-[var(--pos-tint)]',     text:'text-[var(--pos)]',     label:'Approved' },
  pending:  { bg:'bg-[var(--primary-tint)]', text:'text-[var(--primary)]', label:'Pending'  },
  rejected: { bg:'bg-[var(--neg-tint)]',     text:'text-[var(--neg)]',     label:'Rejected' },
}

export default function PurchaseReturns() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => { getPurchaseReturns().then(d => { setReturns(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => returns.filter(r => {
    const matchSearch = !search || r.supplier.toLowerCase().includes(search.toLowerCase()) || r.ref.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (statusFilter === 'All' || r.status === statusFilter)
  }), [returns, search, statusFilter])

  const totalValue = returns.reduce((s, r) => s + r.amount, 0)

  const columns = [
    { key:'ref',      label:'Return #',       sortable:true, render: v => <span className="font-mono text-xs text-[var(--primary)]">{v}</span> },
    { key:'date',     label:'Date',           sortable:true, render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'supplier', label:'Supplier',       sortable:true, render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key:'invoice',  label:'Orig. Invoice',  render: v => <span className="font-mono text-xs text-[var(--muted)]">{v}</span> },
    { key:'items',    label:'Items',          align:'center',render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'reason',   label:'Reason',         render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'amount',   label:'Return Value',   align:'right', sortable:true, render: v => <span className="tabular text-sm font-semibold text-[var(--neg)]">{formatCurrency(v)}</span> },
    { key:'status',   label:'Status', render: v => { const c = STATUS_CFG[v] ?? {bg:'bg-gray-100',text:'text-gray-500',label:v}; return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span> } },
  ]

  return (
    <div>
      <PageHeader title="Purchase Returns" subtitle="Returns to suppliers" breadcrumb={['Purchase Operations', 'Purchase Returns']}
        action={<div className="flex gap-2"><Button variant="secondary" icon={Download} size="sm">Export</Button><Button variant="primary" icon={Plus} size="sm">New Return</Button></div>}
      />
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[{label:'Total Returns',value:formatCompact(totalValue),color:'var(--neg)'},{label:'Approved',value:returns.filter(r=>r.status==='approved').length,color:'var(--pos)'},{label:'Pending',value:returns.filter(r=>r.status==='pending').length,color:'var(--primary)'}].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} rowKey="id"
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search supplier or return…"><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"><option value="All">All Status</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option></select></Filters>}
      />
    </div>
  )
}
