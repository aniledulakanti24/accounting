import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Banknote, Building2, CheckCircle2, Clock, CreditCard, Download, Pencil, Plus, Smartphone } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getReceipts } from '../../data/services/receivablesService'
import { exportCsv } from '../../lib/csvExport'
import { toast } from '../../lib/toast'

const MODE_CFG = {
  NEFT:   { icon: Building2,  bg: 'bg-blue-50',   text: 'text-blue-700'   },
  RTGS:   { icon: Building2,  bg: 'bg-indigo-50',  text: 'text-indigo-700' },
  Cheque: { icon: CreditCard, bg: 'bg-amber-50',   text: 'text-amber-700'  },
  UPI:    { icon: Smartphone, bg: 'bg-purple-50',  text: 'text-purple-700' },
  Cash:   { icon: Banknote,   bg: 'bg-green-50',   text: 'text-green-700'  },
}

const STATUS_CFG = {
  cleared: { icon: CheckCircle2, bg: 'bg-[var(--pos-tint)]',     text: 'text-[var(--pos)]',     label: 'Cleared' },
  pending: { icon: Clock,        bg: 'bg-[var(--primary-tint)]', text: 'text-[var(--primary)]', label: 'Pending' },
  bounced: { icon: AlertCircle,  bg: 'bg-[var(--neg-tint)]',     text: 'text-[var(--neg)]',     label: 'Bounced' },
}

const ALLOCATION_CFG = {
  Matched:       { bg: 'bg-[var(--pos-tint)]',     text: 'text-[var(--pos)]' },
  'Pending Match': { bg: 'bg-[var(--primary-tint)]', text: 'text-[var(--primary)]' },
  Unmatched:     { bg: 'bg-[var(--neg-tint)]',     text: 'text-[var(--neg)]' },
  Advance:       { bg: 'bg-[var(--warn-tint)]',    text: 'text-[var(--warn)]' },
  Excess:        { bg: 'bg-[var(--warn-tint)]',    text: 'text-[var(--warn)]' },
}

function ModeChip({ mode }) {
  const cfg = MODE_CFG[mode] ?? { icon: Banknote, bg: 'bg-gray-100', text: 'text-gray-500' }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <Icon size={10} />{mode}
    </span>
  )
}

function StatusChip({ status }) {
  const cfg = STATUS_CFG[status] ?? { icon: Clock, bg: 'bg-gray-100', text: 'text-gray-500', label: status }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <Icon size={10} />{cfg.label}
    </span>
  )
}

function AllocationChip({ value }) {
  const cfg = ALLOCATION_CFG[value] ?? ALLOCATION_CFG.Matched
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-black ${cfg.bg} ${cfg.text}`}>{value}</span>
}

export default function Receipts() {
  const navigate = useNavigate()
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    getReceipts().then(data => {
      setReceipts(data)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => receipts.filter(receipt => {
    const term = search.toLowerCase()
    const matchSearch = !search
      || receipt.customer.toLowerCase().includes(term)
      || receipt.ref.toLowerCase().includes(term)
      || receipt.invoice.toLowerCase().includes(term)
    const matchStatus = statusFilter === 'All' || receipt.status === statusFilter
    return matchSearch && matchStatus
  }), [receipts, search, statusFilter])

  const clearedReceipts = receipts.filter(receipt => receipt.status === 'cleared')
  const totalCollected = clearedReceipts.reduce((sum, receipt) => sum + receipt.amount, 0)
  const pending = receipts.filter(receipt => receipt.status === 'pending').reduce((sum, receipt) => sum + receipt.amount, 0)
  const bounced = receipts.filter(receipt => receipt.status === 'bounced').length
  const matched = receipts.filter(receipt => receipt.allocationStatus === 'Matched').length
  const needsMatch = receipts.filter(receipt => ['Pending Match', 'Unmatched', 'Advance', 'Excess'].includes(receipt.allocationStatus)).length

  function handleExport() {
    exportCsv(filtered, 'receipts', ['ref', 'date', 'customer', 'invoice', 'amount', 'mode', 'status'])
    toast.success(`Exported ${filtered.length} receipts to CSV`)
  }

  const columns = [
    {
      key: 'ref',
      label: 'Receipt #',
      sortable: true,
      render: (val) => <span className="font-mono text-xs text-[var(--primary)]">{val}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (val) => <span className="font-medium text-[var(--text)]">{val}</span>,
    },
    {
      key: 'invoice',
      label: 'Against Invoice',
      render: (val) => <span className="font-mono text-xs text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      sortable: true,
      render: (val) => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(val)}</span>,
    },
    {
      key: 'mode',
      label: 'Mode',
      render: (val) => <ModeChip mode={val} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusChip status={val} />,
    },
    {
      key: 'allocationStatus',
      label: 'Allocation',
      render: (val, row) => (
        <div className="space-y-1">
          <AllocationChip value={val} />
          <p className="text-[10px] text-[var(--faint)]">{row.bankMatch}</p>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Payments Received"
        subtitle="Customer receipt register with bank clearance status"
        breadcrumb={['Money In', 'Payments Received']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm" onClick={handleExport}>Export</Button>
            <Button variant="primary" icon={Plus} size="sm" onClick={() => navigate('/receivables/payments-received/new')}>Record Payment</Button>
          </div>
        }
      />

      <div className="mb-5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--text)]">Receipt Register</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">Review customer payments, edit receipt details, and track bank clearance status.</p>
          </div>
          <span className="rounded-full bg-[var(--primary-tint)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
            {filtered.length} visible
          </span>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Total Collected', value: formatCompact(totalCollected), color: 'var(--pos)' },
          { label: 'Pending', value: formatCompact(pending), color: 'var(--primary)' },
          { label: 'Bounced', value: bounced, color: 'var(--neg)' },
          { label: 'Matched', value: matched, color: 'var(--pos)' },
          { label: 'Needs Match', value: needsMatch, color: 'var(--warn)' },
          { label: 'Visible Receipts', value: filtered.length, color: 'var(--text)' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{kpi.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        actions={(row) => (
          <Button
            variant="ghost"
            size="sm"
            icon={Pencil}
            onClick={(event) => {
              event.stopPropagation()
              navigate(`/receivables/payments-received/${row.id}/edit`)
            }}
          >
            Edit
          </Button>
        )}
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder="Search receipt, invoice, or customer">
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
            >
              <option value="All">All Status</option>
              <option value="cleared">Cleared</option>
              <option value="pending">Pending</option>
              <option value="bounced">Bounced</option>
            </select>
          </Filters>
        }
      />
    </div>
  )
}
