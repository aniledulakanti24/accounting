import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BellRing, CalendarClock, Mail, MessageCircle, Save, Smartphone } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { getParties } from '../../data/services/partiesService'

const CHANNELS = [
  { id: 'WhatsApp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'Email', label: 'Email', icon: Mail },
  { id: 'SMS', label: 'SMS', icon: Smartphone },
]

const TEMPLATES = [
  'Payment reminder',
  'Overdue 31-60 days',
  'Final demand',
  'Part payment follow-up',
  'Vendor payment update',
]

const INITIAL_FORM = {
  partyId: '',
  channel: 'WhatsApp',
  dueDate: new Date().toISOString().slice(0, 10),
  amount: '',
  template: 'Payment reminder',
  owner: 'Current user',
  promiseDate: '',
  note: '',
}

function Field({ label, children, required }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
        {label}{required && <span className="text-[var(--neg)]"> *</span>}
      </span>
      {children}
    </label>
  )
}

function inputClass(extra = '') {
  return `h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--primary)] ${extra}`
}

export default function NewReminder() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [parties, setParties] = useState([])
  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    partyId: searchParams.get('partyId') || '',
    channel: searchParams.get('channel') || INITIAL_FORM.channel,
    amount: searchParams.get('amount') || '',
  }))

  useEffect(() => {
    getParties().then(setParties)
  }, [])

  const selectedParty = useMemo(() => parties.find(p => p.id === form.partyId), [form.partyId, parties])
  const selectedChannels = form.channel.split(' + ')

  function setValue(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleChannel(channel) {
    setForm(prev => {
      const current = prev.channel.split(' + ').filter(Boolean)
      const next = current.includes(channel)
        ? current.filter(item => item !== channel)
        : [...current, channel]
      return { ...prev, channel: next.length ? next.join(' + ') : channel }
    })
  }

  function submit(event) {
    event.preventDefault()
    if (!selectedParty) {
      toast.error('Select a party before creating the reminder')
      return
    }

    const params = new URLSearchParams({
      partyId: selectedParty.id,
      party: selectedParty.name,
      type: selectedParty.type,
      amount: String(Number(form.amount || selectedParty.overdue || selectedParty.outstanding || 0)),
      channel: form.channel,
      source: 'new-reminder',
    })

    toast.success(`Reminder queued for ${selectedParty.name}`)
    navigate(`/parties/reminders?${params.toString()}`)
  }

  return (
    <div>
      <PageHeader
        title="New Reminder"
        subtitle="Create a follow-up queue item for WhatsApp, SMS, or email"
        breadcrumb={['Parties & Ledgers', 'Reminders', 'New Reminder']}
        action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/receivables/overdue-collections')}>Back</Button>}
      />

      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BellRing size={18} className="text-[var(--primary)]" />
              <h2 className="text-sm font-bold text-[var(--text)]">Reminder Details</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Party" required>
                <select value={form.partyId} onChange={e => setValue('partyId', e.target.value)} className={inputClass()}>
                  <option value="">Select a party</option>
                  {parties.map(party => (
                    <option key={party.id} value={party.id}>{party.name} ({party.type})</option>
                  ))}
                </select>
              </Field>
              <Field label="Amount">
                <input
                  value={form.amount}
                  onChange={e => setValue('amount', e.target.value)}
                  type="number"
                  min="0"
                  className={inputClass()}
                  placeholder={selectedParty ? String(selectedParty.overdue || selectedParty.outstanding || 0) : '0'}
                />
              </Field>
              <Field label="Due Date" required>
                <input value={form.dueDate} onChange={e => setValue('dueDate', e.target.value)} type="date" className={inputClass()} />
              </Field>
              <Field label="Promise Date">
                <input value={form.promiseDate} onChange={e => setValue('promiseDate', e.target.value)} type="date" className={inputClass()} />
              </Field>
              <Field label="Template">
                <select value={form.template} onChange={e => setValue('template', e.target.value)} className={inputClass()}>
                  {TEMPLATES.map(template => <option key={template}>{template}</option>)}
                </select>
              </Field>
              <Field label="Owner">
                <input value={form.owner} onChange={e => setValue('owner', e.target.value)} className={inputClass()} />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Internal Note">
                <textarea
                  value={form.note}
                  onChange={e => setValue('note', e.target.value)}
                  className={inputClass('h-24 resize-none py-2')}
                  placeholder="Add context for the follow-up owner"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock size={18} className="text-[var(--primary)]" />
              <h2 className="text-sm font-bold text-[var(--text)]">Delivery Channel</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {CHANNELS.map(({ id, label, icon: Icon }) => {
                const active = selectedChannels.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleChannel(id)}
                    className={`flex h-20 flex-col items-center justify-center gap-2 rounded-[var(--radius-sm)] border text-sm font-semibold transition-colors ${
                      active
                        ? 'border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--primary)]'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-[var(--text)]">Queue Preview</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Party</p>
                <p className="mt-1 font-semibold text-[var(--text)]">{selectedParty?.name || 'Not selected'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Channel</p>
                <p className="mt-1 text-[var(--text)]">{form.channel}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Amount</p>
                <p className="mt-1 tabular font-semibold text-[var(--text)]">
                  {formatCurrency(Number(form.amount || selectedParty?.overdue || selectedParty?.outstanding || 0))}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Template</p>
                <p className="mt-1 text-[var(--text)]">{form.template}</p>
              </div>
            </div>
          </section>

          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={() => navigate('/receivables/overdue-collections')}>Cancel</Button>
            <Button type="submit" variant="primary" icon={Save} className="flex-1 justify-center" disabled={!form.partyId}>Queue</Button>
          </div>
        </aside>
      </form>
    </div>
  )
}
