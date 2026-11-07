import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Download, PackageCheck, Plus, RefreshCcw, Undo2, WalletCards } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getSalesReturns } from '../../data/services/receivablesService'

const QUEUES = ['All', 'Pending', 'Received', 'Credit Note', 'Refund', 'Closed']

const STATUS_CFG = {
  received: { bg: 'bg-[var(--pos-tint)]',     text: 'text-[var(--pos)]',     label: 'Received' },
  pending:  { bg: 'bg-[var(--primary-tint)]', text: 'text-[var(--primary)]', label: 'Pending' },
  rejected: { bg: 'bg-[var(--neg-tint)]',     text: 'text-[var(--neg)]',     label: 'Rejected' },
}

function StatusChip({ status }) {
  const cfg = STATUS_CFG[status] ?? { bg: 'bg-gray-100', text: 'text-gray-500', label: status }
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
}

function queueFor(row) {
  if (row.status === 'rejected') return 'Closed'
  if (row.status === 'pending' || row.goodsStatus === 'Awaiting receipt') return 'Pending'
  if (row.outcome === 'Credit Note') return 'Credit Note'
  if (row.outcome === 'Refund') return 'Refund'
  if (row.status === 'received') return 'Received'
  return 'All'
}

function Kpi({ label, value, icon: Icon, tone }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</span>
        <Icon size={16} style={{ color: tone }} />
      </div>
      <p className="tabular text-2xl font-black text-[var(--text)]">{value}</p>
    </div>
  )
}

export default function SalesReturns() {
  const navigate = useNavigate()
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [queue, setQueue] = useState('All')

  useEffect(() => {
    getSalesReturns().then(data => {
      setReturns(data)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => returns.filter(row => {
    const term = search.toLowerCase()
    const matchSearch = !search
      || row.customer.toLowerCase().includes(term)
      || row.ref.toLowerCase().includes(term)
      || row.invoice.toLowerCase().includes(term)
    const matchStatus = statusFilter === 'All' || row.status === statusFilter
    const matchQueue = queue === 'All' || queueFor(row) === queue
    return matchSearch && matchStatus && matchQueue
  }), [queue, returns, search, statusFilter])

  const totalValue = returns.reduce((sum, row) => sum + row.amount, 0)
  const pendingReceipt = returns.filter(row => row.goodsStatus === 'Awaiting receipt').length
  const creditDue = returns.filter(row => row.outcome === 'Credit Note').reduce((sum, row) => sum + row.amount, 0)
  const refundDue = returns.filter(row => row.outcome === 'Refund').reduce((sum, row) => sum + row.amount, 0)
  const closed = returns.filter(row => row.status === 'rejected' || row.goodsStatus === 'Restocked').length

  const columns = [
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      className: 'min-w-[220px]',
      render: (val, row) => (
        <div>
          <p className="font-semibold text-[var(--text)]">{val}</p>
          <p className="mt-1 font-mono text-[11px] text-[var(--primary)]">{row.ref} against {row.invoice}</p>
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
      className: 'min-w-[160px]',
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'amount',
      label: 'Return Value',
      align: 'right',
      sortable: true,
      render: (val) => <span className="tabular text-sm font-black text-[var(--neg)]">{formatCurrency(val)}</span>,
    },
    {
      key: 'goodsStatus',
      label: 'Return Stage',
      render: (val) => <span className="text-sm font-semibold text-[var(--text)]">{val}</span>,
    },
    {
      key: 'outcome',
      label: 'Settlement',
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'nextAction',
      label: 'Next Action',
      className: 'min-w-[160px]',
      render: (val) => <span className="inline-flex rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-xs font-semibold text-[var(--text)]">{val}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusChip status={val} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Sales Returns"
        subtitle="Track returned goods and settle them with credit note, refund, replacement, or rejection"
        breadcrumb={['Money In', 'Sales Returns']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">Export</Button>
            <Button variant="primary" icon={Plus} size="sm" onClick={() => navigate('/receivables/sales-returns/new')}>New Return</Button>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Kpi label="Return Value" value={formatCompact(totalValue)} icon={Undo2} tone="var(--neg)" />
        <Kpi label="Pending Receipt" value={pendingReceipt} icon={PackageCheck} tone="var(--primary)" />
        <Kpi label="Credit Note Due" value={formatCompact(creditDue)} icon={WalletCards} tone="var(--warn)" />
        <Kpi label="Refund Due" value={formatCompact(refundDue)} icon={RefreshCcw} tone="var(--neg)" />
        <Kpi label="Closed" value={closed} icon={PackageCheck} tone="var(--pos)" />
      </div>

      <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--text)]">Return Workflow Queue</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">Open a return to update goods status or choose settlement.</p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-1">
            {QUEUES.map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setQueue(tab)}
                className={`h-8 rounded-[var(--radius-sm)] px-3 text-xs font-bold transition-colors ${queue === tab ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          rowKey="id"
          onRowClick={(row) => navigate(`/receivables/sales-returns/${row.id}`)}
          actions={(row) => (
            <Button variant="secondary" size="sm" iconRight={ArrowRight} onClick={(event) => { event.stopPropagation(); navigate(`/receivables/sales-returns/${row.id}`) }}>
              Open
            </Button>
          )}
          toolbar={
            <Filters search={search} onSearchChange={setSearch} placeholder="Search return, invoice, or customer">
              <select
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value)}
                className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              >
                <option value="All">All Status</option>
                <option value="received">Received</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </Filters>
          }
        />
      </section>
    </div>
  )
}
