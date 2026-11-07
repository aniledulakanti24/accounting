import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Clock, Download, ListChecks, Plus, ShieldCheck, Wallet, WalletCards } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import SegmentedFilter from '../../components/ui/SegmentedFilter'
import StatCard from '../../components/ui/StatCard'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getPaymentOut } from '../../data/services/purchaseService'
import { exportCsv } from '../../lib/csvExport'
import { toast } from '../../lib/toast'

const MODE_CFG = {
  NEFT:   { bg:'bg-[var(--primary-tint)]', text:'text-[var(--primary)]' },
  RTGS:   { bg:'bg-[var(--primary-tint)]', text:'text-[var(--primary)]' },
  Cheque: { bg:'bg-[var(--warn-tint)]',    text:'text-[var(--warn)]'  },
  UPI:    { bg:'bg-[var(--pos-tint)]',     text:'text-[var(--pos)]'   },
}
const STATUS_CFG = {
  cleared: { icon:CheckCircle2, bg:'bg-[var(--pos-tint)]',     text:'text-[var(--pos)]',     label:'Cleared' },
  pending: { icon:Clock,        bg:'bg-[var(--primary-tint)]', text:'text-[var(--primary)]', label:'Pending' },
  bounced: { icon:AlertCircle,  bg:'bg-[var(--neg-tint)]',     text:'text-[var(--neg)]',     label:'Bounced' },
}

export default function PaymentOut() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [view, setView]         = useState('All')

  useEffect(() => { getPaymentOut().then(d => { setPayments(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => payments.filter(p => {
    const matchSearch = !search || p.supplier.toLowerCase().includes(search.toLowerCase()) || p.ref.toLowerCase().includes(search.toLowerCase())
    const matchView =
      view === 'All' ? true :
      view === 'blocked' ? p.approval === 'blocked' :
      p.status === view
    return matchSearch && matchView
  }), [payments, search, view])

  const totalCleared = payments.filter(p => p.status === 'cleared').reduce((s, p) => s + p.amount, 0)
  const bouncedCount = payments.filter(p => p.status === 'bounced').length
  const blockedCount = payments.filter(p => p.approval === 'blocked').length

  const viewOptions = [
    { value:'All',     label:'All',     count:payments.length },
    { value:'cleared', label:'Cleared', count:payments.filter(p=>p.status==='cleared').length },
    { value:'pending', label:'Pending', count:payments.filter(p=>p.status==='pending').length },
    { value:'bounced', label:'Bounced', count:bouncedCount },
    { value:'blocked', label:'Blocked', count:blockedCount },
  ]

  function handleExport(rows = filtered) {
    exportCsv(rows, 'payments-made', ['ref','date','supplier','invoice','amount','mode','status','approval','bankStatus','maker'])
    toast.success(`Exported ${rows.length} payments to CSV`)
  }

  const bulkActions = [
    { label:'Release', icon:WalletCards, onClick:rows => toast.success(`${rows.length} payments released to bank`) },
    { label:'Export', icon:Download, onClick:rows => handleExport(rows) },
  ]

  const columns = [
    { key:'ref',      label:'Payment #', sortable:true, render: v => <span className="font-mono text-xs text-[var(--primary)]">{v}</span> },
    { key:'date',     label:'Date',      sortable:true, render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'supplier', label:'Supplier',  sortable:true, render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key:'invoice',  label:'Against Invoice', render: v => <span className="font-mono text-xs text-[var(--muted)]">{v}</span> },
    { key:'amount',   label:'Amount',    align:'right', sortable:true, sum:true, render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key:'mode',     label:'Mode', render: v => { const c = MODE_CFG[v] ?? {bg:'bg-[var(--surface-2)]',text:'text-[var(--muted)]'}; return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{v}</span> } },
    { key:'status',   label:'Status', render: v => { const c = STATUS_CFG[v] ?? {icon:Clock,bg:'bg-[var(--surface-2)]',text:'text-[var(--muted)]',label:v}; const Icon = c.icon; return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}><Icon size={10}/>{c.label}</span> } },
    { key:'approval', label:'Approval', render: v => <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${v === 'released' ? 'bg-[var(--pos-tint)] text-[var(--pos)]' : 'bg-[var(--neg-tint)] text-[var(--neg)]'}`}><ShieldCheck size={10}/>{v}</span> },
    { key:'bankStatus', label:'Bank', render: (v,row) => <div><p className="text-sm font-medium text-[var(--text)]">{v}</p><p className="text-[10px] text-[var(--faint)]">Maker {row.maker}</p></div> },
    { key:'_action', label:'Action', render: (_v,row) => <Button variant={row.approval === 'blocked' ? 'danger' : 'secondary'} size="sm" icon={WalletCards} onClick={event => { event.stopPropagation(); toast.info(`${row.approval === 'blocked' ? 'Retry approval' : 'Bank release'} opened for ${row.ref}`) }}>{row.approval === 'blocked' ? 'Retry' : 'Release'}</Button> },
  ]

  return (
    <div>
      <PageHeader title="Payments Made" subtitle="Maker-checker vendor payments with bank release status" breadcrumb={['Purchase Operations', 'Payments Made']}
        action={<div className="flex gap-2"><Button variant="secondary" icon={Download} size="sm" onClick={() => handleExport()}>Export</Button><Button variant="primary" icon={Plus} size="sm" onClick={() => navigate('/procurement/payment-out/new')}>New Payment</Button></div>}
      />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Paid" value={formatCompact(totalCleared)} icon={Wallet} tone="pos" />
        <StatCard label="Payments" value={payments.length} icon={ListChecks} tone="text" />
        <StatCard label="Bounced" value={bouncedCount} icon={AlertCircle} tone="neg" />
        <StatCard label="Blocked" value={blockedCount} icon={ShieldCheck} tone="warn" hint="awaiting re-approval" />
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} rowKey="id" selectable bulkActions={bulkActions} showTotals onRowClick={row => navigate(`/procurement/payment-out/${row.id}`)}
        toolbar={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedFilter options={viewOptions} value={view} onChange={setView} />
            <Filters search={search} onSearchChange={setSearch} placeholder="Search supplier or payment…" />
          </div>
        }
      />
    </div>
  )
}
