import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, CalendarClock, CheckCircle2, Mail, MessageCircle,
  Phone, Send, UserRound,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { getParties, getPartyReminders } from '../../data/services/partiesService'

const STATUS_TONE = {
  scheduled: 'bg-[var(--primary-tint)] text-[var(--primary)]',
  sent: 'bg-[var(--surface-2)] text-[var(--muted)]',
  promised: 'bg-[var(--pos-tint)] text-[var(--pos)]',
}

function statusClass(status) {
  return STATUS_TONE[status] ?? STATUS_TONE.scheduled
}

function queuedFromParams(searchParams, reminderId) {
  const party = searchParams.get('party')
  if (!party) return null
  return {
    id: reminderId,
    party,
    type: searchParams.get('type') || 'Customer',
    channel: searchParams.get('channel') || 'Email + SMS',
    dueDate: searchParams.get('dueDate') || new Date().toISOString().slice(0, 10),
    amount: Number(searchParams.get('amount') || 0),
    template: searchParams.get('template') || 'Payment reminder',
    owner: searchParams.get('owner') || 'Current user',
    promiseDate: searchParams.get('promiseDate') || '-',
    status: searchParams.get('status') || 'scheduled',
  }
}

function DetailCard({ title, icon: Icon, children }) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon size={17} className="text-[var(--primary)]" />
        <h2 className="text-sm font-bold text-[var(--text)]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Field({ label, value, strong }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p className={`mt-1 text-sm ${strong ? 'font-bold text-[var(--text)]' : 'font-medium text-[var(--muted)]'}`}>{value || '-'}</p>
    </div>
  )
}

export default function ReminderDetail() {
  const navigate = useNavigate()
  const { reminderId } = useParams()
  const [searchParams] = useSearchParams()
  const [reminder, setReminder] = useState(null)
  const [party, setParty] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getPartyReminders(), getParties()]).then(([reminders, parties]) => {
      const queued = queuedFromParams(searchParams, reminderId)
      const found = reminders.find(item => item.id === reminderId) ?? queued
      setReminder(found ?? null)
      setParty(found ? parties.find(item => item.name === found.party) ?? null : null)
      setLoading(false)
    })
  }, [reminderId, searchParams])

  const channels = useMemo(() => reminder?.channel?.split(' + ') ?? [], [reminder])

  if (loading) {
    return <div className="py-16 text-center text-sm text-[var(--faint)]">Loading reminder...</div>
  }

  if (!reminder) {
    return (
      <div>
        <PageHeader
          title="Reminder Not Found"
          subtitle="The selected follow-up is no longer available in the reminder queue"
          breadcrumb={['Parties & Ledgers', 'Reminders', reminderId]}
          action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/receivables/overdue-collections')}>Back</Button>}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={reminder.party}
        subtitle={`${reminder.template} · ${formatCurrency(reminder.amount)}`}
        breadcrumb={['Parties & Ledgers', 'Reminders', reminder.id]}
        action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/receivables/overdue-collections')}>Back</Button>}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass(reminder.status)}`}>{reminder.status}</span>
          <span className="text-sm text-[var(--muted)]">Due on <strong className="text-[var(--text)]">{reminder.dueDate}</strong></span>
          <span className="text-sm text-[var(--muted)]">Owner <strong className="text-[var(--text)]">{reminder.owner}</strong></span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={Send} size="sm" onClick={() => toast.success(`Reminder sent to ${reminder.party}`)}>Send Now</Button>
          <Button variant="secondary" icon={MessageCircle} size="sm" onClick={() => toast.success(`WhatsApp queued for ${reminder.party}`)}>WhatsApp</Button>
          <Button variant="primary" icon={CheckCircle2} size="sm" onClick={() => toast.info(`${reminder.party} marked as promised`)}>Mark Promised</Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <DetailCard title="Reminder Details" icon={CalendarClock}>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Reminder ID" value={reminder.id} strong />
              <Field label="Due Date" value={reminder.dueDate} strong />
              <Field label="Promise Date" value={reminder.promiseDate} strong />
              <Field label="Amount" value={formatCurrency(reminder.amount)} strong />
              <Field label="Template" value={reminder.template} />
              <Field label="Party Type" value={reminder.type} />
            </div>
          </DetailCard>

          <DetailCard title="Delivery Channels" icon={MessageCircle}>
            <div className="grid gap-3 sm:grid-cols-3">
              {['WhatsApp', 'Email', 'SMS'].map(channel => {
                const active = channels.includes(channel)
                const Icon = channel === 'WhatsApp' ? MessageCircle : channel === 'Email' ? Mail : Phone
                return (
                  <div
                    key={channel}
                    className={`rounded-[var(--radius-sm)] border p-4 ${
                      active
                        ? 'border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--primary)]'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]'
                    }`}
                  >
                    <Icon size={18} />
                    <p className="mt-2 text-sm font-bold">{channel}</p>
                    <p className="mt-1 text-xs">{active ? 'Enabled' : 'Not selected'}</p>
                  </div>
                )
              })}
            </div>
          </DetailCard>

          <DetailCard title="Message Preview" icon={Mail}>
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-6 text-[var(--text)]">
              Dear {party?.contactPerson || 'Accounts Team'}, this is a reminder for {formatCurrency(reminder.amount)} pending against {reminder.party}. Please share payment status or promise date for closure.
            </div>
          </DetailCard>
        </div>

        <aside className="space-y-5">
          <DetailCard title="Party Snapshot" icon={UserRound}>
            <div className="space-y-4">
              <Field label="Party" value={reminder.party} strong />
              <Field label="GSTIN" value={party?.gstin} />
              <Field label="Phone" value={party?.phone} />
              <Field label="City" value={party?.city} />
              <Field label="Outstanding" value={party ? formatCurrency(party.outstanding) : '-'} strong />
              <Field label="Overdue" value={party ? formatCurrency(party.overdue) : '-'} strong />
            </div>
          </DetailCard>
        </aside>
      </div>
    </div>
  )
}
