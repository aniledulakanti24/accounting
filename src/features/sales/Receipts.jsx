import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle, Banknote, Building2, CheckCircle2, CreditCard, Download,
  Eye, FileText, Link2, Plus, Printer, QrCode, Share2, Smartphone,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { exportCsv } from '../../lib/csvExport'
import { toast } from '../../lib/toast'
import { getSalesReceipts } from '../../data/services/salesService'

const MODE_CFG = {
  NEFT:   { icon: Building2,  tone: 'bg-blue-50 text-blue-700' },
  RTGS:   { icon: Building2,  tone: 'bg-indigo-50 text-indigo-700' },
  Cheque: { icon: CreditCard, tone: 'bg-amber-50 text-amber-700' },
  UPI:    { icon: Smartphone, tone: 'bg-purple-50 text-purple-700' },
  Cash:   { icon: Banknote,   tone: 'bg-green-50 text-green-700' },
}

const STATUS_CFG = {
  cleared: { icon: CheckCircle2, label: 'Cleared', tone: 'bg-[var(--pos-tint)] text-[var(--pos)]' },
  pending: { icon: AlertCircle,  label: 'Pending', tone: 'bg-[var(--warn-tint)] text-[var(--warn)]' },
  bounced: { icon: AlertCircle,  label: 'Bounced', tone: 'bg-[var(--neg-tint)] text-[var(--neg)]' },
}

const ALLOCATION_CFG = {
  full:    { label: 'Full',    tone: 'bg-[var(--pos-tint)] text-[var(--pos)]' },
  partial: { label: 'Partial', tone: 'bg-[var(--primary-tint)] text-[var(--primary)]' },
  advance: { label: 'Advance', tone: 'bg-purple-50 text-purple-700' },
  failed:  { label: 'Failed',  tone: 'bg-[var(--neg-tint)] text-[var(--neg)]' },
}

function Pill({ children, tone }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${tone}`}>{children}</span>
}

function ModeChip({ mode }) {
  const cfg = MODE_CFG[mode] ?? { icon: Banknote, tone: 'bg-gray-100 text-gray-500' }
  const Icon = cfg.icon
  return <Pill tone={cfg.tone}><Icon size={10} />{mode}</Pill>
}

function StatusChip({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending
  const Icon = cfg.icon
  return <Pill tone={cfg.tone}><Icon size={10} />{cfg.label}</Pill>
}

export default function SalesReceipts() {
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modeFilter, setModeFilter] = useState('All')

  useEffect(() => {
    getSalesReceipts().then(data => { setReceipts(data); setLoading(false) })
  }, [])

  const filtered = useMemo(() => receipts.filter(receipt => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || receipt.customer.toLowerCase().includes(q)
      || receipt.ref.toLowerCase().includes(q)
      || receipt.invoice.toLowerCase().includes(q)
      || receipt.txnRef.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'All' || receipt.status === statusFilter
    const matchMode = modeFilter === 'All' || receipt.mode === modeFilter
    return matchSearch && matchStatus && matchMode
  }), [receipts, search, statusFilter, modeFilter])

  const clearedReceipts = receipts.filter(receipt => receipt.status === 'cleared')
  const totalCollected = clearedReceipts.reduce((sum, receipt) => sum + receipt.amount, 0)
  const pendingAmount = receipts.filter(receipt => receipt.status === 'pending').reduce((sum, receipt) => sum + receipt.amount, 0)
  const matchedCount = receipts.filter(receipt => receipt.matched).length
  const bouncedCount = receipts.filter(receipt => receipt.status === 'bounced').length

  function handleExport() {
    exportCsv(filtered, 'sales-receipts', ['ref', 'date', 'customer', 'invoice', 'amount', 'mode', 'bank', 'txnRef', 'status', 'allocation'])
    toast.success(`Exported ${filtered.length} sales receipts`)
  }

  function handleReceiptAction(action, receipt) {
    toast.success(`${action} for ${receipt.ref}`)
  }

  const columns = [
    {
      key: 'ref',
      label: 'Receipt #',
      sortable: true,
      render: (value, row) => (
        <div>
          <span className="font-mono text-xs text-[var(--primary)]">{value}</span>
          <p className="mt-0.5 text-[10px] text-[var(--faint)]">By {row.collectedBy}</p>
        </div>
      ),
    },
    { key: 'date', label: 'Date', sortable: true, render: value => <span className="text-sm text-[var(--muted)]">{value}</span> },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: value => <span className="font-medium text-[var(--text)]">{value}</span>,
    },
    {
      key: 'invoice',
      label: 'Invoice',
      render: value => <span className="font-mono text-xs text-[var(--muted)]">{value}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      sortable: true,
      sum: true,
      render: (value, row) => row?._isTotal
        ? <span className="tabular text-sm font-bold text-[var(--text)]">{formatCurrency(value)}</span>
        : <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(value)}</span>,
    },
    { key: 'mode', label: 'Mode', render: value => <ModeChip mode={value} /> },
    {
      key: 'txnRef',
      label: 'Reference',
      render: (value, row) => (
        <div>
          <p className="font-mono text-xs text-[var(--muted)]">{value}</p>
          <p className="text-[10px] text-[var(--faint)]">{row.bank}</p>
        </div>
      ),
    },
    {
      key: 'allocation',
      label: 'Allocation',
      render: value => {
        const cfg = ALLOCATION_CFG[value] ?? ALLOCATION_CFG.partial
        return <Pill tone={cfg.tone}>{cfg.label}</Pill>
      },
    },
    { key: 'status', label: 'Status', render: value => <StatusChip status={value} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={e => { e.stopPropagation(); handleReceiptAction('Receipt preview opened', row) }}
            className="inline-flex items-center gap-1 rounded bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--primary)]"
          >
            <Eye size={10} /> View
          </button>
          <button
            onClick={e => { e.stopPropagation(); handleReceiptAction(row.receiptPdf ? 'Receipt PDF downloaded' : 'Receipt PDF generated', row) }}
            className="inline-flex items-center gap-1 rounded bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--primary)]"
          >
            <FileText size={10} /> PDF
          </button>
          <button
            onClick={e => { e.stopPropagation(); handleReceiptAction('Receipt shared', row) }}
            className="inline-flex items-center gap-1 rounded bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--primary)]"
          >
            <Share2 size={10} /> Share
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Receipts"
        subtitle="Record customer payments after invoice, match bank entries, and issue receipt PDFs"
        breadcrumb={['Sales', 'Receipts']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm" onClick={handleExport}>Export</Button>
            <Button variant="secondary" icon={Printer} size="sm" onClick={() => toast.info('Select a receipt to print')}>Print</Button>
            <Button variant="primary" icon={Plus} size="sm" onClick={() => toast.info('New receipt form opened')}>New Receipt</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Collected', value: formatCompact(totalCollected), color: 'var(--pos)' },
          { label: 'Pending', value: formatCompact(pendingAmount), color: 'var(--warn)' },
          { label: 'Matched', value: `${matchedCount}/${receipts.length}`, color: 'var(--primary)' },
          { label: 'Bounced', value: bouncedCount, color: 'var(--neg)' },
        ].map(item => (
          <div key={item.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{item.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-[var(--primary-tint)] p-2 text-[var(--primary)]">
              <Link2 size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Invoice to receipt flow</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Receipts stay linked to invoices, payment references, bank matching, and receipt PDF status.</p>
            </div>
          </div>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-[var(--pos-tint)] p-2 text-[var(--pos)]">
              <QrCode size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Payment capture</p>
              <p className="mt-1 text-xs text-[var(--muted)]">UPI, NEFT, RTGS, cheque, and cash receipts can be tracked from one sales page.</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        showTotals
        rowClassName={row => row.status === 'bounced' ? 'bg-[var(--neg-tint)]/40' : ''}
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder="Search receipt, invoice, customer or payment reference...">
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Status</option>
              <option value="cleared">Cleared</option>
              <option value="pending">Pending</option>
              <option value="bounced">Bounced</option>
            </select>
            <select
              value={modeFilter}
              onChange={event => setModeFilter(event.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Modes</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
              <option value="UPI">UPI</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
            </select>
          </Filters>
        }
      />
    </div>
  )
}
