import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Mail, MessageSquare, Send, ShieldAlert } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { getReminderCandidates } from '../../data/services/receivablesService'

function channelFor(row) {
  if (row.risk === 'critical' || row.statementStatus === 'Disputed') return 'Email'
  return row.channel || 'WhatsApp'
}

function SummaryCard({ label, value, hint, icon: Icon, tone }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</span>
        <Icon size={16} style={{ color: tone }} />
      </div>
      <p className="tabular text-2xl font-black text-[var(--text)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>
    </div>
  )
}

export default function BulkReminderPreview() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReminderCandidates().then(data => {
      setRows(data)
      setLoading(false)
    })
  }, [])

  const totals = useMemo(() => {
    const amount = rows.reduce((sum, row) => sum + row.amount, 0)
    const whatsapp = rows.filter(row => channelFor(row) === 'WhatsApp').length
    const email = rows.filter(row => channelFor(row) === 'Email').length
    const critical = rows.filter(row => row.risk === 'critical').length
    return { amount, whatsapp, email, critical }
  }, [rows])

  function sendAll() {
    toast.success(`${rows.length} reminders queued for review and delivery`)
    navigate('/receivables/overdue-collections')
  }

  const columns = [
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-semibold text-[var(--text)]">{val}</p>
          <p className="mt-0.5 font-mono text-xs text-[var(--primary)]">{row.invoice}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Outstanding',
      align: 'right',
      sortable: true,
      render: (val) => <span className="tabular text-sm font-black text-[var(--neg)]">{formatCurrency(val)}</span>,
    },
    {
      key: 'daysOverdue',
      label: 'Age',
      sortable: true,
      render: (val) => <span className="tabular text-sm font-bold text-[var(--neg)]">{val > 0 ? `${val}d overdue` : 'Due soon'}</span>,
    },
    {
      key: 'channel',
      label: 'Send Via',
      render: (_, row) => (
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-tint)] px-2 py-0.5 text-xs font-bold text-[var(--primary)]">
          {channelFor(row) === 'Email' ? <Mail size={11} /> : <MessageSquare size={11} />}
          {channelFor(row)}
        </span>
      ),
    },
    {
      key: 'nextAction',
      label: 'Template',
      render: (val, row) => <span className="text-sm text-[var(--muted)]">{row.risk === 'critical' ? 'Final notice' : val}</span>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Send Reminders"
        subtitle="Preview customer reminders before sending them from the collection queue"
        breadcrumb={['Money In', 'Collections & Reminders', 'Send Reminders']}
        action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/receivables/overdue-collections')}>Back</Button>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard label="Customers" value={rows.length} hint="Ready for reminder" icon={CheckCircle2} tone="var(--pos)" />
        <SummaryCard label="Outstanding" value={formatCompact(totals.amount)} hint="Covered by this send" icon={Send} tone="var(--primary)" />
        <SummaryCard label="WhatsApp" value={totals.whatsapp} hint="Quick follow-ups" icon={MessageSquare} tone="var(--primary)" />
        <SummaryCard label="Critical" value={totals.critical} hint={`${totals.email} email notices`} icon={ShieldAlert} tone="var(--neg)" />
      </div>

      <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--text)]">Reminder Preview</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">Review recipients, channels, and template type before confirming.</p>
          </div>
          <Button variant="primary" icon={Send} size="sm" onClick={sendAll} disabled={!rows.length}>Confirm Send</Button>
        </div>
        <DataTable columns={columns} data={rows} loading={loading} rowKey="id" />
      </section>
    </div>
  )
}
