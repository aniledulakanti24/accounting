import { useState, useEffect, useMemo } from 'react'
import { Download, FileText } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getChequeRegister } from '../../data/services/cashBankService'

const STATUS_CFG = {
  cleared:     { bg:'bg-[var(--pos-tint)]',     text:'text-[var(--pos)]',     label:'Cleared'     },
  outstanding: { bg:'bg-[var(--primary-tint)]', text:'text-[var(--primary)]', label:'Outstanding' },
  bounced:     { bg:'bg-[var(--neg-tint)]',     text:'text-[var(--neg)]',     label:'Bounced'     },
}

export default function ChequeRegister() {
  const [cheques, setCheques] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => { getChequeRegister().then(d => { setCheques(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => cheques.filter(c => {
    const matchSearch = !search || c.payee.toLowerCase().includes(search.toLowerCase()) || c.chequeNo.includes(search)
    return matchSearch && (statusFilter === 'All' || c.status === statusFilter)
  }), [cheques, search, statusFilter])

  const outstanding = cheques.filter(c=>c.status==='outstanding').reduce((s,c)=>s+c.amount,0)

  const columns = [
    { key:'chequeNo', label:'Cheque No', render: v => <span className="font-mono text-sm font-semibold text-[var(--primary)]">{v}</span> },
    { key:'date',     label:'Date',      sortable:true, render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'payee',    label:'Payee',     sortable:true, render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key:'bank',     label:'Bank',      render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'type',     label:'Type',      render: v => <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${v==='Receipt'?'bg-[var(--pos-tint)] text-[var(--pos)]':'bg-[var(--primary-tint)] text-[var(--primary)]'}`}>{v}</span> },
    { key:'amount',   label:'Amount',    align:'right', sortable:true, render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key:'clearDate',label:'Clear Date',render: v => <span className="text-sm text-[var(--muted)]">{v ?? '—'}</span> },
    { key:'status',   label:'Status',    render: v => { const c=STATUS_CFG[v]??{bg:'bg-gray-100',text:'text-gray-500',label:v}; return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span> } },
  ]

  return (
    <div>
      <PageHeader title="Cheque Register" subtitle="Issued and received cheque tracking" breadcrumb={['Cash & Bank', 'Cheque Register']}
        action={<Button variant="secondary" icon={Download} size="sm">Export</Button>}
      />
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[{label:'Outstanding Value',value:formatCompact(outstanding),color:'var(--primary)'},{label:'Bounced',value:cheques.filter(c=>c.status==='bounced').length,color:'var(--neg)'},{label:'Total Cheques',value:cheques.length,color:'var(--text)'}].map(k=>(
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} rowKey="id"
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search payee or cheque no…"><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"><option value="All">All Status</option><option value="cleared">Cleared</option><option value="outstanding">Outstanding</option><option value="bounced">Bounced</option></select></Filters>}
      />
    </div>
  )
}
