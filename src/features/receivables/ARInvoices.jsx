import { useState, useEffect, useMemo } from 'react'
import { Link2, Download, Receipt, FileText, ArrowRight, CheckCircle2, BellOff, BellRing, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getARInvoices } from '../../data/services/receivablesService'

const AGE_CFG = {
  paid:    { label: 'Closed',      tone: 'var(--pos)',     bg: 'bg-[var(--pos-tint)]' },
  partial: { label: 'Part paid',   tone: 'var(--warn)',    bg: 'bg-[var(--warn-tint)]' },
  unpaid:  { label: 'Due',         tone: 'var(--primary)', bg: 'bg-[var(--primary-tint)]' },
  overdue: { label: 'Overdue',     tone: 'var(--neg)',     bg: 'bg-[var(--neg-tint)]' },
}

function AgeChip({ status }) {
  const cfg = AGE_CFG[status] ?? AGE_CFG.unpaid
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-black ${cfg.bg}`} style={{ color: cfg.tone }}>
      {cfg.label}
    </span>
  )
}

export default function ARInvoices() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    getARInvoices().then(d => { setInvoices(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => invoices.filter(inv => {
    const matchSearch = !search
      || inv.customer.toLowerCase().includes(search.toLowerCase())
      || inv.ref.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || inv.status === statusFilter
    return matchSearch && matchStatus
  }), [invoices, search, statusFilter])

  const totalBilled      = invoices.reduce((s, i) => s + i.total, 0)
  const totalCollected   = invoices.reduce((s, i) => s + i.paid, 0)
  const totalOutstanding = invoices.reduce((s, i) => s + i.balance, 0)
  const overdueCount     = invoices.filter(i => i.status === 'overdue').length

  const columns = [
    {
      key: 'ref',
      label: 'Invoice #',
      sortable: true,
      render: (val) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[var(--primary)]">{val}</span>
          <span className="inline-flex items-center gap-1 text-xs text-[var(--faint)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">
            <Link2 size={9} /> Synced
          </span>
        </div>
      ),
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
      key: 'total',
      label: 'Invoice Amt',
      align: 'right',
      sortable: true,
      render: (val) => <span className="tabular text-sm text-[var(--muted)]">{formatCurrency(val)}</span>,
    },
    {
      key: 'paid',
      label: 'Collected',
      align: 'right',
      render: (val) => (
        <span className={`tabular text-sm font-medium ${val > 0 ? 'text-[var(--pos)]' : 'text-[var(--faint)]'}`}>
          {val > 0 ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      key: 'balance',
      label: 'Balance',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className={`tabular text-sm font-semibold ${val > 0 ? 'text-[var(--neg)]' : 'text-[var(--faint)]'}`}>
          {val > 0 ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due / Age',
      sortable: true,
      render: (val, row) => (
        <div className="space-y-1">
          <span className={`block text-sm ${row.status === 'overdue' ? 'text-[var(--neg)] font-medium' : 'text-[var(--muted)]'}`}>
            {val}
          </span>
          <AgeChip status={row.status} />
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Receivables"
        subtitle="Read-only — synced from Sales module"
        breadcrumb={['Money In', 'Receivables']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">Export</Button>
          </div>
        }
      />

      <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] bg-[var(--primary-tint)] border border-[var(--primary)]/20 text-xs text-[var(--primary)] mb-5">
        <Link2 size={13} />
        <span>Invoices are created in Sales. Money In tracks collection, reminders, payment links, and outstanding balance.</span>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {[
          { label: 'Enter payment in', value: 'Payments Received', icon: Receipt, color: 'var(--primary)' },
          { label: 'This page updates', value: 'Paid, Balance, Status', icon: CheckCircle2, color: 'var(--pos)' },
          { label: 'Follow-up changes', value: 'Reminder pauses or closes', icon: BellOff, color: 'var(--warn)' },
        ].map((step, index) => {
          const Icon = step.icon
          return (
            <div key={step.label} className="contents">
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Icon size={16} style={{ color: step.color }} />
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{step.label}</p>
                </div>
                <p className="text-sm font-black text-[var(--text)]">{step.value}</p>
              </div>
              {index < 2 && (
                <div className="hidden items-center justify-center lg:flex">
                  <ArrowRight size={18} className="text-[var(--faint)]" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Billed',  value: formatCompact(totalBilled),       color: 'var(--text)'    },
          { label: 'Collected',     value: formatCompact(totalCollected),     color: 'var(--pos)'     },
          { label: 'Outstanding',   value: formatCompact(totalOutstanding),   color: 'var(--primary)' },
          { label: 'Overdue',       value: `${overdueCount} invoices`,        color: 'var(--neg)'     },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        onRowClick={(invoice) => navigate(`/receivables/receivables/${invoice.id}`)}
        actions={(invoice) => (
          <div className="flex items-center justify-end gap-1">
            {invoice.balance > 0 && (
              <Button
                variant="ghost"
                size="sm"
                icon={Receipt}
                onClick={(event) => {
                  event.stopPropagation()
                  navigate('/receivables/payments-received/new')
                }}
              >
                Pay
              </Button>
            )}
            {invoice.balance > 0 && (
              <Button
                variant="ghost"
                size="sm"
                icon={BellRing}
                onClick={(event) => {
                  event.stopPropagation()
                  navigate('/receivables/overdue-collections')
                }}
              >
                Remind
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon={MessageSquare}
              onClick={(event) => {
                event.stopPropagation()
                navigate('/parties/statements')
              }}
            >
              Statement
            </Button>
          </div>
        )}
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder="Search invoice or customer…">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
            </select>
          </Filters>
        }
        emptyState={
          <div className="flex flex-col items-center py-14">
            <FileText size={28} className="text-[var(--faint)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text)]">No invoices found</p>
          </div>
        }
      />
    </div>
  )
}
