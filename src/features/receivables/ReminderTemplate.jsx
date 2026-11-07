import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, CalendarClock, CheckCircle2, ClipboardCopy, Mail,
  MessageSquare, Phone, Send, ShieldAlert, WalletCards,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { getCollectionById } from '../../data/services/receivablesService'

const FORMATS = [
  { id: 'whatsapp', label: 'WhatsApp', hint: 'Fast reply', icon: MessageSquare },
  { id: 'email', label: 'Email', hint: 'Formal follow-up', icon: Mail },
  { id: 'sms', label: 'SMS', hint: 'Short nudge', icon: Phone },
  { id: 'final', label: 'Final Notice', hint: 'Escalation', icon: ShieldAlert },
]

function buildTemplates(record) {
  if (!record) return {}
  return {
    whatsapp: `Hello ${record.customer}, this is a reminder for invoice ${record.invoice} with outstanding amount ${formatCurrency(record.amount)}. Please confirm payment status or expected payment date. Thank you.`,
    email: `Subject: Payment reminder for ${record.invoice}\n\nDear ${record.customer},\n\nOur records show an outstanding balance of ${formatCurrency(record.amount)} against invoice ${record.invoice}, due on ${record.dueDate}.\n\nCurrent status: ${record.daysOverdue > 0 ? `${record.daysOverdue} days overdue` : 'due soon'}.\n\nPlease arrange payment or share the expected payment date.\n\nRegards,\nAccounts Team`,
    sms: `${record.customer}: ${formatCurrency(record.amount)} pending for ${record.invoice}. Please confirm payment date. - UnifiedTree Accounts`,
    final: `Subject: Final payment follow-up for ${record.invoice}\n\nDear ${record.customer},\n\nThis is a final reminder that ${formatCurrency(record.amount)} remains outstanding for invoice ${record.invoice}. The invoice is ${record.daysOverdue} days overdue.\n\nPlease clear the payment immediately or contact us if there is a dispute.\n\nRegards,\nAccounts Team`,
  }
}

function MiniMetric({ label, value, tone }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-black text-[var(--text)]" style={tone ? { color: tone } : undefined}>{value}</p>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-2 last:border-0">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-right text-sm font-semibold text-[var(--text)]">{value}</span>
    </div>
  )
}

function TimelineItem({ title, meta, tone = 'var(--muted)' }) {
  return (
    <div className="flex gap-3">
      <span className="mt-1 h-2.5 w-2.5 flex-none rounded-full" style={{ background: tone }} />
      <div>
        <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
        <p className="mt-0.5 text-xs text-[var(--muted)]">{meta}</p>
      </div>
    </div>
  )
}

export default function ReminderTemplate() {
  const navigate = useNavigate()
  const { collectionId } = useParams()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [format, setFormat] = useState('whatsapp')

  useEffect(() => {
    getCollectionById(collectionId).then(collection => {
      setRecord(collection)
      setLoading(false)
    })
  }, [collectionId])

  const templates = useMemo(() => buildTemplates(record), [record])
  const activeText = templates[format] ?? ''
  const activeFormat = FORMATS.find(item => item.id === format) ?? FORMATS[0]
  const ActiveIcon = activeFormat.icon

  function copyTemplate() {
    toast.success(`${activeFormat.label} template copied`)
  }

  function sendTemplate() {
    toast.success(`${activeFormat.label} reminder queued for ${record.customer}`)
  }

  function scheduleFollowUp() {
    toast.info(`Follow-up scheduled for ${record.customer}`)
  }

  if (!loading && !record) {
    return (
      <div>
        <PageHeader
          title="Reminder Template"
          subtitle="No collection record found for this reminder"
          breadcrumb={['Money In', 'Collections & Reminders', 'Template']}
          action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/receivables/overdue-collections')}>Back</Button>}
        />
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-[var(--text)]">Collection record not found</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Return to the reminder queue and select a customer record.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={record ? `${record.customer} Collection` : 'Collection Reminder'}
        subtitle={record ? `Prepare and send a reminder for ${record.invoice}` : 'Loading reminder workspace'}
        breadcrumb={['Money In', 'Collections & Reminders', 'Template']}
        action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/receivables/overdue-collections')}>Back</Button>}
      />

      {record && (
        <section className="mb-5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--neg-tint)] px-2.5 py-1 text-xs font-black text-[var(--neg)]">{record.risk}</span>
                <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-bold text-[var(--muted)]">{record.status}</span>
                <span className="font-mono text-xs font-bold text-[var(--primary)]">{record.invoice}</span>
              </div>
              <p className="text-lg font-black leading-snug text-[var(--text)]">{record.customer}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{record.note}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[560px]">
              <MiniMetric label="Outstanding" value={formatCurrency(record.amount)} tone="var(--neg)" />
              <MiniMetric label="Age" value={record.daysOverdue > 0 ? `${record.daysOverdue} days` : 'Due soon'} tone={record.daysOverdue > 0 ? 'var(--neg)' : 'var(--pos)'} />
              <MiniMetric label="Owner" value={record.assignee} />
              <MiniMetric label="Reminders" value={`${record.reminderCount} sent`} />
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--primary-tint)] text-[var(--primary)]">
                  <ActiveIcon size={19} />
                </span>
                <div>
                  <p className="text-sm font-bold text-[var(--text)]">Choose Reminder Format</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">Pick the channel, review the message, then send or copy.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" icon={ClipboardCopy} size="sm" onClick={copyTemplate}>Copy</Button>
                <Button variant="primary" icon={Send} size="sm" onClick={sendTemplate}>Send</Button>
              </div>
            </div>

            <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {FORMATS.map(item => {
                const Icon = item.icon
                const active = item.id === format
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormat(item.id)}
                    className={`min-h-16 rounded-[var(--radius-sm)] border p-3 text-left transition-colors ${active ? 'border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--primary)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={16} />
                      <span className="text-sm font-black">{item.label}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">{item.hint}</p>
                  </button>
                )
              })}
            </div>

            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-[var(--text)]">{activeText}</pre>
            </div>
          </section>

          {record && (
            <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[var(--pos)]" />
                <p className="text-sm font-bold text-[var(--text)]">Before Sending</p>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {[
                  `Confirm invoice ${record.invoice} is attached`,
                  `Use ${record.channel} first, then email if no response`,
                  record.promiseDate ? 'Mention existing promise politely' : 'Ask for expected payment date',
                  record.risk === 'critical' ? 'Keep escalation note ready' : 'Keep tone polite and concise',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-3 text-sm text-[var(--text)]">
                    <CheckCircle2 size={14} className="mt-0.5 flex-none text-[var(--pos)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className="space-y-4">
          {record && (
            <>
              <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <WalletCards size={16} className="text-[var(--primary)]" />
                  <p className="text-sm font-bold text-[var(--text)]">Collection Detail</p>
                </div>
                <div className="space-y-0">
                  <DetailRow label="Due date" value={record.dueDate} />
                  <DetailRow label="Next action" value={record.nextAction} />
                  <DetailRow label="Preferred channel" value={record.channel} />
                  <DetailRow label="Statement" value={record.statementStatus} />
                  <DetailRow label="Promise date" value={record.promiseDate ?? '-'} />
                  <DetailRow label="Promise amount" value={record.promiseAmount ? formatCurrency(record.promiseAmount) : '-'} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="secondary" icon={Phone} size="sm" onClick={() => toast.info(`Call queued for ${record.customer}`)}>Call</Button>
                  <Button variant="secondary" icon={CalendarClock} size="sm" onClick={scheduleFollowUp}>Follow-up</Button>
                </div>
              </section>

              <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <p className="mb-3 text-sm font-bold text-[var(--text)]">Reminder History</p>
                <div className="space-y-4">
                  <TimelineItem title={`${record.channel} reminder sent`} meta={`${record.lastReminder} - ${record.reminderCount} total reminders`} tone="var(--primary)" />
                  <TimelineItem title={`Statement ${record.statementStatus}`} meta={`Last customer touch ${record.lastContact}`} tone="var(--warn)" />
                  {record.promiseDate && (
                    <TimelineItem title="Promise to pay recorded" meta={`${formatCurrency(record.promiseAmount)} by ${record.promiseDate}`} tone="var(--pos)" />
                  )}
                </div>
              </section>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
