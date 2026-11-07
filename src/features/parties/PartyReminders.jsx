import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, MessageCircle, Plus, Send } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { getPartyReminders } from '../../data/services/partiesService'

const STATUS_TONE = {
  scheduled: 'bg-[var(--primary-tint)] text-[var(--primary)]',
  sent: 'bg-[var(--surface-2)] text-[var(--muted)]',
  promised: 'bg-[var(--pos-tint)] text-[var(--pos)]',
}

function Chip({ value }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[value] ?? STATUS_TONE.sent}`}>{value}</span>
}

function getQueuedReminder(searchParams) {
  const party = searchParams.get('party')
  if (!party) return null

  const partyId = searchParams.get('partyId') || party
  const channel = searchParams.get('channel') || 'Email + SMS'
  return {
    id: `QUE-${partyId}-${channel}`.replace(/\W+/g, '-').toUpperCase(),
    party,
    type: searchParams.get('type') || 'Customer',
    channel,
    dueDate: new Date().toISOString().slice(0, 10),
    amount: Number(searchParams.get('amount') || 0),
    template: channel === 'WhatsApp' ? 'WhatsApp payment follow-up' : 'Payment reminder',
    owner: 'Current user',
    promiseDate: '-',
    status: 'scheduled',
  }
}

export default function PartyReminders() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(() => searchParams.get('party') || '')
  const [status, setStatus] = useState('All')

  useEffect(() => {
    getPartyReminders().then(data => {
      const queued = getQueuedReminder(searchParams)
      if (queued && !data.some(row => row.id === queued.id)) {
        toast.success(`${queued.channel} reminder queued for ${queued.party}`)
        setRows([queued, ...data])
      } else {
        setRows(data)
      }
      setLoading(false)
    })
  }, [searchParams])

  const filtered = useMemo(() => rows.filter(row => {
    const term = search.toLowerCase()
    return (!search || row.party.toLowerCase().includes(term) || row.template.toLowerCase().includes(term))
      && (status === 'All' || row.status === status)
  }), [rows, search, status])

  const dueAmount = rows.reduce((sum, row) => sum + row.amount, 0)
  const promised = rows.filter(row => row.status === 'promised').length

  const columns = [
    { key:'party', label:'Party', sortable:true, render: (value, row) => <div><p className="font-medium text-[var(--text)]">{value}</p><p className="text-xs text-[var(--faint)]">{row.type}</p></div> },
    { key:'channel', label:'Channel', render: value => <span className="text-sm text-[var(--muted)]">{value}</span> },
    { key:'dueDate', label:'Due Date', sortable:true },
    { key:'amount', label:'Amount', align:'right', sortable:true, render: value => <span className="tabular font-semibold text-[var(--text)]">{formatCurrency(value)}</span> },
    { key:'template', label:'Template' },
    { key:'promiseDate', label:'Promise Date' },
    { key:'owner', label:'Owner' },
    { key:'status', label:'Status', render: value => <Chip value={value} /> },
    {
      key:'actions',
      label:'Actions',
      render: (_, row) => (
        <div className="flex justify-end gap-1.5">
          <button title="Send now" onClick={e => { e.stopPropagation(); toast.success(`Reminder sent to ${row.party}`) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)]"><Send size={13} /></button>
          <button title="WhatsApp" onClick={e => { e.stopPropagation(); toast.success(`WhatsApp reminder queued for ${row.party}`) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)]"><MessageCircle size={13} /></button>
          <button title="Mark promised" onClick={e => { e.stopPropagation(); toast.info(`${row.party} marked as promised`) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)]"><CheckCircle2 size={13} /></button>
        </div>
      ),
    },
  ]

  function openReminder(row) {
    const params = new URLSearchParams({
      party: row.party,
      type: row.type,
      channel: row.channel,
      dueDate: row.dueDate,
      amount: String(row.amount),
      template: row.template,
      owner: row.owner,
      promiseDate: row.promiseDate,
      status: row.status,
    })
    navigate(`/parties/reminders/${row.id}?${params.toString()}`)
  }

  return (
    <div>
      <PageHeader
        title="Party Reminders"
        subtitle="WhatsApp, SMS, and email follow-ups for receivables and payables"
        breadcrumb={['Parties & Ledgers', 'Reminders']}
        action={<Button variant="primary" icon={Plus} size="sm" onClick={() => navigate('/parties/reminders/new')}>New Reminder</Button>}
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label:'Follow-up Amount', value:formatCompact(dueAmount), color:'var(--text)' },
          { label:'Scheduled', value:rows.filter(row => row.status === 'scheduled').length, color:'var(--primary)' },
          { label:'Promised', value:promised, color:'var(--pos)' },
        ].map(item => (
          <div key={item.label} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{item.label}</p>
            <p className="mt-1 text-xl font-bold tabular" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        onRowClick={openReminder}
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search party or template...">
          <select value={status} onChange={e => setStatus(e.target.value)} className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]">
            <option value="All">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="sent">Sent</option>
            <option value="promised">Promised</option>
          </select>
        </Filters>}
      />
    </div>
  )
}
