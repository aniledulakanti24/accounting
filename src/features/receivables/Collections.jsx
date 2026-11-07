import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, BellRing, CalendarClock,
  Download, MessageSquare, Phone, ShieldAlert,
  UserRoundCheck, WalletCards,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getCollections } from '../../data/services/receivablesService'

const QUEUES = [
  { id: 'All', label: 'All' },
  { id: 'Due Today', label: 'Due Today' },
  { id: 'Overdue', label: 'Overdue' },
  { id: 'Promised', label: 'Promised' },
  { id: 'Escalation', label: 'Escalation' },
]

const RISK_CFG = {
  watch:    { label: 'Watch',    color: 'var(--primary)', bg: 'bg-[var(--primary-tint)]' },
  medium:   { label: 'Medium',   color: 'var(--warn)',    bg: 'bg-[var(--warn-tint)]' },
  high:     { label: 'High',     color: 'var(--neg)',     bg: 'bg-[var(--neg-tint)]' },
  critical: { label: 'Critical', color: 'var(--neg)',     bg: 'bg-[var(--neg-tint)]' },
}

const DELIVERY_CFG = {
  Draft:   { label: 'Draft',   color: 'var(--muted)',   bg: 'bg-[var(--surface-2)]' },
  Sent:    { label: 'Sent',    color: 'var(--primary)', bg: 'bg-[var(--primary-tint)]' },
  Viewed:  { label: 'Viewed',  color: 'var(--pos)',     bg: 'bg-[var(--pos-tint)]' },
  Replied: { label: 'Replied', color: 'var(--pos)',     bg: 'bg-[var(--pos-tint)]' },
  Failed:  { label: 'Failed',  color: 'var(--neg)',     bg: 'bg-[var(--neg-tint)]' },
}

function RiskChip({ risk }) {
  const cfg = RISK_CFG[risk] ?? RISK_CFG.watch
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-black ${cfg.bg}`} style={{ color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

function DeliveryChip({ status }) {
  const cfg = DELIVERY_CFG[status] ?? DELIVERY_CFG.Draft
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-black ${cfg.bg}`} style={{ color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

function KpiCard({ label, value, hint, icon: Icon, tone }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--surface-2)]">
          <Icon size={16} style={{ color: tone }} />
        </span>
      </div>
      <p className="tabular text-2xl font-black text-[var(--text)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>
    </div>
  )
}

function queueFor(row) {
  if (row.risk === 'critical' || row.daysOverdue >= 8 || row.statementStatus === 'Disputed') return 'Escalation'
  if (row.status === 'promised') return 'Promised'
  if (row.daysOverdue > 0) return 'Overdue'
  return 'Due Today'
}

function needsReminder(row) {
  return row.status === 'open'
    || row.nextAction.toLowerCase().includes('reminder')
    || row.nextAction.toLowerCase().includes('demand')
    || row.nextAction.toLowerCase().includes('legal')
    || row.statementStatus === 'No response'
    || row.statementStatus === 'Not viewed'
}

function matchesQueue(row, activeQueue) {
  if (activeQueue === 'All') return true
  return queueFor(row) === activeQueue
}

export default function Collections() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [queue, setQueue] = useState('All')

  useEffect(() => {
    getCollections().then(data => {
      setItems(data)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => items.filter(item => {
    const term = search.toLowerCase()
    const matchSearch = !search
      || item.customer.toLowerCase().includes(term)
      || item.invoice.toLowerCase().includes(term)
      || item.assignee.toLowerCase().includes(term)
    const matchStatus = statusFilter === 'All' || item.status === statusFilter
    const matchQueue = matchesQueue(item, queue)
    return matchSearch && matchStatus && matchQueue
  }), [items, queue, search, statusFilter])

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const riskRank = { critical: 4, high: 3, medium: 2, watch: 1 }
    return (riskRank[b.risk] ?? 0) - (riskRank[a.risk] ?? 0)
      || b.daysOverdue - a.daysOverdue
      || b.amount - a.amount
  }), [filtered])

  const totalPending = items.reduce((sum, item) => sum + item.amount, 0)
  const overdueAmount = items.filter(item => item.daysOverdue > 0).reduce((sum, item) => sum + item.amount, 0)
  const promisedAmount = items.filter(item => item.status === 'promised').reduce((sum, item) => sum + item.amount, 0)
  const criticalCount = items.filter(item => item.risk === 'critical').length
  const dueSoonAmount = items.filter(item => item.daysOverdue === 0).reduce((sum, item) => sum + item.amount, 0)
  const remindersDue = items.filter(needsReminder).length

  function openReminderTemplate(row) {
    navigate(`/receivables/overdue-collections/${row.id}/reminder`)
  }

  const columns = [
    {
      key: 'customer',
      label: 'Customer',
      className: 'min-w-[220px]',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-semibold leading-snug text-[var(--text)]">{val}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[11px] text-[var(--primary)]">{row.invoice}</span>
            <span className="text-[11px] text-[var(--faint)]">{row.statementStatus}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      className: 'min-w-[130px]',
      sortable: true,
      render: (val) => <span className="tabular text-sm font-black text-[var(--neg)]">{formatCurrency(val)}</span>,
    },
    {
      key: 'daysOverdue',
      label: 'Age',
      className: 'min-w-[110px]',
      sortable: true,
      render: (val) => (
        <span className={`tabular text-sm font-bold ${val > 0 ? 'text-[var(--neg)]' : 'text-[var(--pos)]'}`}>
          {val > 0 ? `${val}d overdue` : 'Due soon'}
        </span>
      ),
    },
    {
      key: 'risk',
      label: 'Risk',
      render: (val) => <RiskChip risk={val} />,
    },
    {
      key: 'deliveryStatus',
      label: 'Delivery',
      className: 'min-w-[125px]',
      render: (val, row) => (
        <div>
          <DeliveryChip status={val} />
          <p className="mt-1 text-[10px] text-[var(--faint)]">{row.channel} - {row.reminderCount} reminders</p>
        </div>
      ),
    },
    {
      key: 'nextFollowUp',
      label: 'Follow-up',
      className: 'min-w-[120px]',
      render: (val) => <span className="text-sm font-semibold text-[var(--text)]">{val}</span>,
    },
    {
      key: 'nextAction',
      label: 'Next Action',
      className: 'min-w-[160px]',
      render: (val, row) => (
        <div>
          <span className="inline-flex max-w-[140px] items-center gap-1 rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-xs font-semibold leading-snug text-[var(--text)]">
            {val}
          </span>
          {row.promiseDate && <p className="mt-1 text-[10px] text-[var(--warn)]">Promise {row.promiseDate}</p>}
        </div>
      ),
    },
    {
      key: 'assignee',
      label: 'Owner',
      className: 'min-w-[90px]',
      render: (val) => (
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary-tint)] text-[10px] font-bold text-[var(--primary)]">
            {val.split(' ').map(part => part[0]).join('')}
          </span>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Collections Command Center"
        subtitle="Prioritized receivables, promise tracking, reminders, and escalation work"
        breadcrumb={['Money In', 'Collections & Reminders']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">Export</Button>
            <Button variant="primary" icon={MessageSquare} size="sm" onClick={() => navigate('/receivables/overdue-collections/reminders/send')}>Send Reminders</Button>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-6">
        <KpiCard label="Total Pending" value={formatCompact(totalPending)} hint="Across collection queue" icon={WalletCards} tone="var(--text)" />
        <KpiCard label="Overdue" value={formatCompact(overdueAmount)} hint="Past due date" icon={AlertTriangle} tone="var(--neg)" />
        <KpiCard label="Due Today" value={formatCompact(dueSoonAmount)} hint="Act before overdue" icon={CalendarClock} tone="var(--primary)" />
        <KpiCard label="Reminders" value={remindersDue} hint="Ready to send" icon={BellRing} tone="var(--warn)" />
        <KpiCard label="Promised" value={formatCompact(promisedAmount)} hint="Needs ETA tracking" icon={UserRoundCheck} tone="var(--warn)" />
        <KpiCard label="Critical" value={criticalCount} hint="Escalation candidates" icon={ShieldAlert} tone="var(--neg)" />
      </div>

      <div className="mb-5">
        <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--text)]">Collections & Reminder Queue</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">Work by due today, overdue, promised, and escalation queues.</p>
            </div>
            <div className="flex max-w-full flex-wrap gap-1 rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-1">
              {QUEUES.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setQueue(tab.id)}
                  className={`h-8 rounded-[var(--radius-sm)] px-3 text-xs font-bold transition-colors ${queue === tab.id ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <DataTable
            columns={columns}
            data={sorted}
            loading={loading}
            rowKey="id"
            onRowClick={openReminderTemplate}
            actions={(row) => (
              <Button
                variant="secondary"
                size="sm"
                icon={BellRing}
                className="whitespace-nowrap"
                onClick={(event) => {
                  event.stopPropagation()
                  openReminderTemplate(row)
                }}
              >
                Remind
              </Button>
            )}
            toolbar={
              <Filters search={search} onSearchChange={setSearch} placeholder="Search customer, invoice, or owner">
                <select
                  value={statusFilter}
                  onChange={event => setStatusFilter(event.target.value)}
                  className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                >
                  <option value="All">All Status</option>
                  <option value="open">Open</option>
                  <option value="contacted">Contacted</option>
                  <option value="promised">Promised</option>
                  <option value="closed">Closed</option>
                </select>
              </Filters>
            }
            emptyState={
              <div className="flex flex-col items-center py-14">
                <Phone size={28} className="mb-3 text-[var(--faint)]" />
                <p className="text-sm font-semibold text-[var(--text)]">No collection tasks</p>
              </div>
            }
          />
        </section>
      </div>
    </div>
  )
}
