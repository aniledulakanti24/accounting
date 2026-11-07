import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, ClipboardList, Download, FileText, PackageCheck, Plus, ReceiptText, ScanBarcode, ShieldCheck, Truck } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import SegmentedFilter from '../../components/ui/SegmentedFilter'
import StatCard from '../../components/ui/StatCard'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getPurchaseOrders } from '../../data/services/purchaseService'
import { exportCsv } from '../../lib/csvExport'
import { toast } from '../../lib/toast'

const STATUS_CFG = {
  open:      { bg:'bg-[var(--primary-tint)]', text:'text-[var(--primary)]', label:'Open'      },
  partial:   { bg:'bg-[var(--warn-tint)]',    text:'text-[var(--warn)]',     label:'Partial'   },
  received:  { bg:'bg-[var(--pos-tint)]',     text:'text-[var(--pos)]',     label:'Received'  },
  cancelled: { bg:'bg-[var(--surface-2)]',    text:'text-[var(--muted)]',    label:'Cancelled' },
}

export default function PurchaseOrders() {
  const navigate = useNavigate()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [view, setView]       = useState('All')

  useEffect(() => { getPurchaseOrders().then(d => { setOrders(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => orders.filter(o => {
    const matchSearch = !search || o.supplier.toLowerCase().includes(search.toLowerCase()) || o.ref.toLowerCase().includes(search.toLowerCase())
    const matchView =
      view === 'All' ? true :
      view === 'approval' ? (o.approval !== 'approved' && o.status !== 'cancelled') :
      view === 'stock' ? !!o.stockAlert :
      o.status === view
    return matchSearch && matchView
  }), [orders, search, view])

  const openValue = orders.filter(o=>o.status==='open'||o.status==='partial').reduce((s,o)=>s+o.amount,0)
  const approvalPending = orders.filter(o=>o.approval !== 'approved' && o.status !== 'cancelled').length
  const stockRisk = orders.filter(o=>o.stockAlert).length

  const viewOptions = [
    { value:'All',      label:'All',          count:orders.length },
    { value:'open',     label:'Open',         count:orders.filter(o=>o.status==='open').length },
    { value:'partial',  label:'Partial',      count:orders.filter(o=>o.status==='partial').length },
    { value:'received', label:'Received',     count:orders.filter(o=>o.status==='received').length },
    { value:'approval', label:'Approval',     count:approvalPending },
    { value:'stock',    label:'Stock risk',   count:stockRisk },
  ]

  function handleExport(rows = filtered) {
    exportCsv(rows, 'purchase-orders', ['ref','date','supplier','items','amount','deliveryDate','receivedQty','orderedQty','status','approval','stockAlert','nextAction'])
    toast.success(`Exported ${rows.length} purchase orders to CSV`)
  }

  const bulkActions = [
    { label:'Approve', icon:ShieldCheck, onClick:rows => toast.success(`${rows.length} POs approved`) },
    { label:'Create GRN', icon:Truck, onClick:rows => toast.success(`GRN drafted for ${rows.length} POs`) },
    { label:'Export', icon:Download, onClick:rows => handleExport(rows) },
  ]

  const columns = [
    { key:'ref',          label:'PO #',          sortable:true, render: v => <span className="font-mono text-xs text-[var(--primary)]">{v}</span> },
    { key:'date',         label:'Date',           sortable:true, render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'supplier',     label:'Supplier',       sortable:true, render: (v,row) => <div><p className="font-medium text-[var(--text)]">{v}</p><p className="text-[10px] text-[var(--faint)]">{row.approval}</p></div> },
    { key:'items',        label:'Items',          align:'center',render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'amount',       label:'PO Value',       align:'right', sortable:true, sum:true, render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key:'deliveryDate', label:'Expected Delivery', sortable:true, render: (v,row) => <div><p className="text-sm text-[var(--muted)]">{v}</p><p className="text-[10px] text-[var(--faint)]">{row.receivedQty}/{row.orderedQty} received</p></div> },
    { key:'stockAlert', label:'Stock', render: v => v ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--warn-tint)] text-[var(--warn)]">{v}</span> : <span className="text-xs text-[var(--faint)]">OK</span> },
    { key:'status',       label:'Status', render: v => { const c = STATUS_CFG[v] ?? {bg:'bg-[var(--surface-2)]',text:'text-[var(--muted)]',label:v}; return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span> } },
    { key:'nextAction',   label:'Next', render: (v,row) => (
      <div>
        <Button variant={row.status === 'cancelled' ? 'ghost' : 'secondary'} size="sm" iconRight={ArrowRight} onClick={() => toast.info(`${v} for ${row.ref}`)}>{v}</Button>
        <div className="mt-2 flex flex-wrap gap-1">
          <button onClick={event => { event.stopPropagation(); toast.success(`GRN created for ${row.ref}`) }} className="inline-flex items-center gap-1 rounded bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--primary)]"><Truck size={10}/> GRN</button>
          <button onClick={event => { event.stopPropagation(); toast.success(`Bill draft created for ${row.ref}`) }} className="inline-flex items-center gap-1 rounded bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--primary)]"><FileText size={10}/> Bill</button>
        </div>
      </div>
    ) },
  ]

  return (
    <div>
      <PageHeader title="Purchase Orders" subtitle="PO approval, GRN receiving, and bill conversion" breadcrumb={['Purchase Operations', 'Purchase Orders']}
        action={<div className="flex gap-2"><Button variant="secondary" icon={Download} size="sm" onClick={() => handleExport()}>Export</Button><Button variant="secondary" icon={ScanBarcode} size="sm" onClick={() => toast.info('Barcode receiving opened')}>Receive</Button><Button variant="primary" icon={Plus} size="sm">New PO</Button></div>}
      />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Open PO Value" value={formatCompact(openValue)} icon={ReceiptText} tone="primary" delta={{ value:'6.4%', dir:'up' }} />
        <StatCard label="Open Orders" value={orders.filter(o=>o.status==='open').length} icon={ClipboardList} tone="text" />
        <StatCard label="Received" value={orders.filter(o=>o.status==='received').length} icon={PackageCheck} tone="pos" />
        <StatCard label="Approval Queue" value={approvalPending} icon={ShieldCheck} tone="warn" />
        <StatCard label="Stock Risks" value={stockRisk} icon={AlertTriangle} tone="neg" />
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm text-xs font-semibold text-[var(--muted)]">
        {['Purchase Request', 'PO Approval', 'GRN / Receipt Note', 'Supplier Bill', 'Payment'].map((step, i, arr) => <span key={step} className="inline-flex items-center gap-2"><span className="rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-[var(--text)]">{step}</span>{i < arr.length - 1 && <ArrowRight size={13} />}</span>)}
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} rowKey="id" selectable bulkActions={bulkActions} showTotals onRowClick={row => navigate(`/procurement/purchase-orders/${row.id}`)}
        toolbar={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedFilter options={viewOptions} value={view} onChange={setView} />
            <Filters search={search} onSearchChange={setSearch} placeholder="Search supplier or PO…" />
          </div>
        }
      />
    </div>
  )
}
