import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Download, FileMinus, Plus, RefreshCcw, ShieldCheck, WalletCards } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getCreditNotes } from '../../data/services/receivablesService'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

const QUEUES = ['All', 'Apply', 'Refund', 'Review', 'Closed']

const STATUS_CFG = {
  open:     { bg: 'bg-[var(--primary-tint)]', text: 'text-[var(--primary)]', label: 'Open Credit' },
  adjusted: { bg: 'bg-[var(--pos-tint)]',     text: 'text-[var(--pos)]',     label: 'Applied' },
  refunded: { bg: 'bg-gray-100',              text: 'text-gray-500',         label: 'Refunded' },
}

function StatusChip({ status }) {
  const cfg = STATUS_CFG[status] ?? { bg: 'bg-gray-100', text: 'text-gray-500', label: status }
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
}

function queueFor(note) {
  if (note.available <= 0) return 'Closed'
  if (note.gstStatus !== 'posted' || note.approval !== 'approved') return 'Review'
  if (note.refunded > 0) return 'Refund'
  if (note.available > 0) return 'Apply'
  return 'Closed'
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

export default function CreditNotes() {
  const navigate = useNavigate()
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [queue, setQueue] = useState('All')

  useEffect(() => {
    getCreditNotes().then(data => {
      setNotes(data)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => notes.filter(note => {
    const term = search.toLowerCase()
    const matchSearch = !search
      || note.customer.toLowerCase().includes(term)
      || note.ref.toLowerCase().includes(term)
      || note.invoice.toLowerCase().includes(term)
    const matchStatus = statusFilter === 'All' || note.status === statusFilter
    const matchQueue = queue === 'All' || queueFor(note) === queue
    return matchSearch && matchStatus && matchQueue
  }), [notes, queue, search, statusFilter])

  const openCredit = notes.reduce((sum, note) => sum + note.available, 0)
  const refunded = notes.reduce((sum, note) => sum + note.refunded, 0)
  const applied = notes.reduce((sum, note) => sum + note.applied, 0)
  const gstPending = notes.filter(note => note.gstStatus !== 'posted').length
  const approvalPending = notes.filter(note => note.approval !== 'approved').length

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
      className: 'min-w-[150px]',
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'amount',
      label: 'Credit',
      align: 'right',
      sortable: true,
      render: (val) => <span className="tabular text-sm font-black text-[var(--text)]">{formatCurrency(val)}</span>,
    },
    {
      key: 'available',
      label: 'Available',
      align: 'right',
      sortable: true,
      render: (val) => <span className={`tabular text-sm font-black ${val > 0 ? 'text-[var(--primary)]' : 'text-[var(--faint)]'}`}>{val > 0 ? formatCurrency(val) : '-'}</span>,
    },
    {
      key: 'nextAction',
      label: 'Next Action',
      className: 'min-w-[170px]',
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
        title="Credit Notes & Refunds"
        subtitle={`Issue, apply, refund, and close customer credits with statutory ${countryConfig.taxSystem} reconciliation`}
        breadcrumb={['Money In', 'Credit Notes & Refunds']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">Export</Button>
            <Button variant="primary" icon={Plus} size="sm" onClick={() => navigate('/receivables/credit-notes/new')}>New Credit Note</Button>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Kpi label="Open Credit" value={formatCompact(openCredit)} icon={WalletCards} tone="var(--primary)" />
        <Kpi label="Refunded" value={formatCompact(refunded)} icon={RefreshCcw} tone="var(--neg)" />
        <Kpi label="Applied" value={formatCompact(applied)} icon={ShieldCheck} tone="var(--pos)" />
        <Kpi label={`${countryConfig.taxSystem} Pending`} value={gstPending} icon={FileMinus} tone="var(--warn)" />
        <Kpi label="Approval" value={approvalPending} icon={ArrowRight} tone="var(--neg)" />
      </div>

      <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--text)]">Credit Queue</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">Apply open credits, issue refunds, or review notes that need approval.</p>
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
          onRowClick={(note) => navigate(`/receivables/credit-notes/${note.id}`)}
          actions={(note) => (
            <Button variant="secondary" size="sm" iconRight={ArrowRight} onClick={(event) => { event.stopPropagation(); navigate(`/receivables/credit-notes/${note.id}`) }}>
              Open
            </Button>
          )}
          toolbar={
            <Filters search={search} onSearchChange={setSearch} placeholder="Search credit note, invoice, or customer">
              <select
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value)}
                className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              >
                <option value="All">All Status</option>
                <option value="open">Open Credit</option>
                <option value="adjusted">Applied</option>
                <option value="refunded">Refunded</option>
              </select>
            </Filters>
          }
          emptyState={
            <div className="flex flex-col items-center py-14">
              <FileMinus size={28} className="mb-3 text-[var(--faint)]" />
              <p className="text-sm font-semibold text-[var(--text)]">No credit notes found</p>
            </div>
          }
        />
      </section>
    </div>
  )
}
