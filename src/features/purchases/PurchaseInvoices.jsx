import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Coins, Download, FileCheck2, FileSearch, Plus, ReceiptText, ShieldCheck, Wallet, WalletCards } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import SegmentedFilter from '../../components/ui/SegmentedFilter'
import StatCard from '../../components/ui/StatCard'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getPurchaseInvoices } from '../../data/services/purchaseService'
import { exportCsv } from '../../lib/csvExport'
import { toast } from '../../lib/toast'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

const CHIP_TONE = {
  approved: 'bg-[var(--pos-tint)] text-[var(--pos)]',
  pending: 'bg-[var(--warn-tint)] text-[var(--warn)]',
  matched: 'bg-[var(--pos-tint)] text-[var(--pos)]',
  mismatch: 'bg-[var(--neg-tint)] text-[var(--neg)]',
  'missing 2B': 'bg-[var(--warn-tint)] text-[var(--warn)]',
}

function Chip({ value }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${CHIP_TONE[value] ?? 'bg-[var(--surface-2)] text-[var(--muted)]'}`}>
      {value}
    </span>
  )
}

export default function PurchaseInvoices() {
  const navigate = useNavigate()
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState('all')

  useEffect(() => {
    getPurchaseInvoices().then(d => { setInvoices(d); setLoading(false) })
  }, [])

  const matchesView = (i, v) =>
    v === 'all' ? true :
    v === 'unpaid' ? i.status === 'unpaid' || i.status === 'partial' :
    v === 'overdue' ? i.status === 'overdue' :
    v === 'itc' ? i.itc !== 'matched' :
    v === 'approval' ? i.approval === 'pending' : true

  const filtered = useMemo(() => invoices.filter(i => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || i.supplier.toLowerCase().includes(q)
      || i.ref.toLowerCase().includes(q)
      || (i.po ?? '').toLowerCase().includes(q)
      || (i.grn ?? '').toLowerCase().includes(q)
    return matchSearch && matchesView(i, view)
  }), [invoices, search, view])

  const totalBilled = invoices.reduce((s, i) => s + i.total, 0)
  const totalPaid = invoices.reduce((s, i) => s + i.paid, 0)
  const totalOutstanding = totalBilled - totalPaid
  const overdueCount = invoices.filter(i => i.status === 'overdue').length
  const itcIssues = invoices.filter(i => i.itc !== 'matched').length
  const pendingApproval = invoices.filter(i => i.approval === 'pending').length

  const viewOptions = [
    { value: 'all',      label: 'All',           count: invoices.length },
    { value: 'unpaid',   label: 'Unpaid',        count: invoices.filter(i => i.status === 'unpaid' || i.status === 'partial').length },
    { value: 'overdue',  label: 'Overdue',       count: overdueCount },
    { value: 'itc',      label: 'ITC issues',    count: itcIssues },
    { value: 'approval', label: 'Needs approval', count: pendingApproval },
  ]

  function handleExport(rows = filtered) {
    exportCsv(rows, 'purchase-invoices', ['ref', 'date', 'supplier', 'po', 'grn', 'items', 'subtotal', 'gst', 'total', 'paid', 'dueDate', 'status', 'approval', 'itc', 'tds', 'nextAction'])
    toast.success(`Exported ${rows.length} purchase invoices to CSV`)
  }

  const bulkActions = [
    { label: 'Approve', icon: ShieldCheck, onClick: rows => toast.success(`${rows.length} invoices sent for approval`) },
    { label: 'Release payment', icon: WalletCards, onClick: rows => toast.success(`Payment released for ${rows.length} invoices`) },
    { label: 'Export', icon: Download, onClick: rows => handleExport(rows) },
  ]

  const columns = [
    {
      key: 'ref',
      label: 'Invoice #',
      sortable: true,
      render: (v, row) => (
        <div>
          <span className="font-mono text-xs text-[var(--primary)]">{v}</span>
          <p className="text-[10px] text-[var(--faint)]">{row.po ?? 'No PO'} · {row.grn ?? 'No GRN'}</p>
        </div>
      ),
    },
    { key: 'date', label: 'Date', sortable: true, render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'supplier', label: 'Supplier', sortable: true, render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'items', label: 'Items', align: 'center', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'subtotal', label: 'Subtotal', align: 'right', sum: true, render: v => <span className="tabular text-sm text-[var(--muted)]">{formatCurrency(v)}</span> },
    { key: 'gst', label: countryConfig.taxSystem, align: 'right', sum: true, render: v => <span className="tabular text-sm text-[var(--muted)]">{formatCurrency(v)}</span> },
    { key: 'total', label: 'Total', align: 'right', sortable: true, sum: true, render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'paid', label: 'Paid', align: 'right', sum: true, render: v => <span className={`tabular text-sm font-medium ${v > 0 ? 'text-[var(--pos)]' : 'text-[var(--faint)]'}`}>{v > 0 ? formatCurrency(v) : '-'}</span> },
    { key: 'dueDate', label: 'Due Date', sortable: true, render: (v, row) => <span className={`text-sm ${row.status === 'overdue' ? 'text-[var(--neg)] font-medium' : 'text-[var(--muted)]'}`}>{v}</span> },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'approval', label: 'Approval', render: v => <Chip value={v} /> },
    {
      key: 'itc',
      label: countryCode === 'IN' ? 'ITC / 2B' : `${countryConfig.taxSystem} Input`,
      render: (v, row) => (
        <div className="space-y-1">
          <Chip value={v} />
          <p className="text-[10px] text-[var(--faint)]">TDS: {row.tds}</p>
        </div>
      ),
    },
    {
      key: 'nextAction',
      label: 'Next',
      render: (v, row) => (
        <div>
          <button onClick={event => { event.stopPropagation(); toast.info(`${v} for ${row.ref}`) }} className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:text-[var(--primary)]">
            {v}<ArrowRight size={12} />
          </button>
          <div className="mt-2 flex flex-wrap gap-1">
            <button onClick={event => { event.stopPropagation(); toast.success(`ITC match opened for ${row.ref}`) }} className="inline-flex items-center gap-1 rounded bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--primary)]"><ShieldCheck size={10} /> ITC</button>
            <button onClick={event => { event.stopPropagation(); toast.success(`Payment release opened for ${row.ref}`) }} className="inline-flex items-center gap-1 rounded bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--primary)]"><WalletCards size={10} /> Pay</button>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Purchase Invoices"
        subtitle="Supplier bills with approval, GRN, ITC, and payment readiness"
        breadcrumb={['Purchase Operations', 'Purchase Invoices']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm" onClick={() => handleExport()}>Export</Button>
            <Button variant="secondary" icon={FileSearch} size="sm" onClick={() => toast.info('Bill OCR inbox opened')}>Scan Bill</Button>
            <Button variant="primary" icon={Plus} size="sm" onClick={() => toast.info('New Purchase Invoice form opened')}>New Purchase Invoice</Button>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-6">
        <StatCard label="Total Billed" value={formatCompact(totalBilled)} icon={ReceiptText} tone="text" />
        <StatCard label="Paid" value={formatCompact(totalPaid)} icon={Wallet} tone="pos" />
        <StatCard label="Outstanding" value={formatCompact(totalOutstanding)} icon={Coins} tone="primary" />
        <StatCard label="Overdue" value={overdueCount} icon={AlertTriangle} tone="neg" hint="invoices past due" />
        <StatCard label="ITC Issues" value={itcIssues} icon={ShieldCheck} tone="warn" />
        <StatCard label="Approvals" value={pendingApproval} icon={FileCheck2} tone="primary" />
      </div>

      <div className="mb-5 flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--primary)]/20 bg-[var(--primary-tint)] px-4 py-2.5 text-xs text-[var(--primary)]">
        <FileCheck2 size={14} />
        Match every bill against PO, GRN, {countryCode === 'IN' ? 'GSTR-2B/ITC' : `${countryConfig.taxSystem} input recovery`}, and payment approval before release.
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        selectable
        bulkActions={bulkActions}
        showTotals
        onRowClick={row => navigate(`/procurement/purchase-invoices/${row.id}`)}
        rowClassName={(row) => row.itc !== 'matched' || row.approval === 'pending' ? 'bg-[var(--warn-tint)]/30' : ''}
        toolbar={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedFilter options={viewOptions} value={view} onChange={setView} />
            <Filters search={search} onSearchChange={setSearch} placeholder="Search supplier, invoice, PO, GRN..." />
          </div>
        }
      />
    </div>
  )
}
