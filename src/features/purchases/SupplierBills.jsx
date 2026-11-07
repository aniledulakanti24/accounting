import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, CalendarClock, Download, FileSearch, FileText, Plus, Repeat2, Send, ShieldCheck, Wallet } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import SegmentedFilter from '../../components/ui/SegmentedFilter'
import StatCard from '../../components/ui/StatCard'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getSupplierBills } from '../../data/services/purchaseService'
import { exportCsv } from '../../lib/csvExport'
import { toast } from '../../lib/toast'

export default function SupplierBills() {
  const [bills, setBills]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [view, setView]       = useState('All')

  useEffect(() => { getSupplierBills().then(d => { setBills(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => bills.filter(b => {
    const matchSearch = !search || b.supplier.toLowerCase().includes(search.toLowerCase()) || b.ref.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase())
    const matchView =
      view === 'All' ? true :
      view === 'recurring' ? b.recurring !== 'No' :
      view === 'approval' ? b.approval === 'pending' :
      b.status === view
    return matchSearch && matchView
  }), [bills, search, view])

  const unpaidAmt  = bills.filter(b=>b.status!=='paid').reduce((s,b)=>s+b.amount,0)
  const overdueAmt = bills.filter(b=>b.status==='overdue').reduce((s,b)=>s+b.amount,0)
  const recurringCount = bills.filter(b=>b.recurring !== 'No').length
  const approvalQueue = bills.filter(b=>b.approval === 'pending').length

  const viewOptions = [
    { value:'All',       label:'All',        count:bills.length },
    { value:'unpaid',    label:'Unpaid',     count:bills.filter(b=>b.status==='unpaid').length },
    { value:'overdue',   label:'Overdue',    count:bills.filter(b=>b.status==='overdue').length },
    { value:'recurring', label:'Recurring',  count:recurringCount },
    { value:'approval',  label:'Approval',   count:approvalQueue },
  ]

  function handleExport(rows = filtered) {
    exportCsv(rows, 'supplier-bills', ['ref','date','supplier','category','amount','dueDate','status','recurring','approval','upload'])
    toast.success(`Exported ${rows.length} supplier bills to CSV`)
  }

  const bulkActions = [
    { label:'Approve', icon:ShieldCheck, onClick:rows => toast.success(`${rows.length} bills approved`) },
    { label:'Pay', icon:Send, onClick:rows => toast.success(`Payment scheduled for ${rows.length} bills`) },
    { label:'Export', icon:Download, onClick:rows => handleExport(rows) },
  ]

  const columns = [
    { key:'ref',      label:'Bill #',    sortable:true, render: v => <span className="font-mono text-xs text-[var(--primary)]">{v}</span> },
    { key:'date',     label:'Date',      sortable:true, render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'supplier', label:'Vendor',    sortable:true, render: (v,row) => <div><p className="font-medium text-[var(--text)]">{v}</p><p className="text-[10px] text-[var(--faint)]">{row.upload}</p></div> },
    { key:'category', label:'Category',  render: v => <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)]">{v}</span> },
    { key:'amount',   label:'Amount',    align:'right', sortable:true, sum:true, render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key:'dueDate',  label:'Due Date',  sortable:true, render: (v,row) => <span className={`text-sm ${row.status==='overdue'?'text-[var(--neg)] font-medium':'text-[var(--muted)]'}`}>{v}</span> },
    { key:'status',   label:'Status',    render: v => <StatusBadge status={v} /> },
    { key:'recurring', label:'Recurring', render: v => v !== 'No' ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--primary-tint)] text-[var(--primary)]"><Repeat2 size={10}/>{v}</span> : <span className="text-xs text-[var(--faint)]">One-time</span> },
    { key:'approval', label:'Approval', render: v => <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${v === 'approved' ? 'bg-[var(--pos-tint)] text-[var(--pos)]' : v === 'blocked' ? 'bg-[var(--neg-tint)] text-[var(--neg)]' : 'bg-[var(--warn-tint)] text-[var(--warn)]'}`}>{v}</span> },
    { key:'_action', label:'Action', render: (_v,row) => <Button variant={row.approval === 'blocked' ? 'danger' : 'secondary'} size="sm" icon={Send} onClick={() => toast.info(`${row.approval === 'approved' ? 'Payment' : 'Approval'} opened for ${row.ref}`)}>{row.approval === 'approved' ? 'Pay' : 'Approve'}</Button> },
  ]

  return (
    <div>
      <PageHeader title="Supplier Bills" subtitle="OCR/imported vendor bills, recurring expenses, and approvals" breadcrumb={['Purchase Operations', 'Supplier Bills']}
        action={<div className="flex gap-2"><Button variant="secondary" icon={Download} size="sm" onClick={() => handleExport()}>Export</Button><Button variant="secondary" icon={FileSearch} size="sm" onClick={() => toast.info('Email/OCR bill inbox opened')}>Import Bills</Button><Button variant="primary" icon={Plus} size="sm">New Bill</Button></div>}
      />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Unpaid Bills" value={formatCompact(unpaidAmt)} icon={Wallet} tone="primary" />
        <StatCard label="Overdue" value={formatCompact(overdueAmt)} icon={AlertTriangle} tone="neg" />
        <StatCard label="Total Bills" value={bills.length} icon={FileText} tone="text" />
        <StatCard label="Recurring" value={recurringCount} icon={CalendarClock} tone="pos" hint="auto-created monthly" />
        <StatCard label="Approvals" value={approvalQueue} icon={ShieldCheck} tone="warn" />
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} rowKey="id" selectable bulkActions={bulkActions} showTotals
        toolbar={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedFilter options={viewOptions} value={view} onChange={setView} />
            <Filters search={search} onSearchChange={setSearch} placeholder="Search vendor, category or bill…" />
          </div>
        }
      />
    </div>
  )
}
