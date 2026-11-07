import { useEffect, useMemo, useState } from 'react'
import { Mail, RefreshCw, Send, ShieldCheck } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { toast } from '../../lib/toast'
import { getPartyPortalAccess } from '../../data/services/partiesService'

const TONE = {
  Enabled: 'bg-[var(--pos-tint)] text-[var(--pos)]',
  Invited: 'bg-[var(--primary-tint)] text-[var(--primary)]',
  'Not invited': 'bg-[var(--surface-2)] text-[var(--muted)]',
}

export default function PartyPortal() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getPartyPortalAccess().then(data => { setRows(data); setLoading(false) })
  }, [])

  const filtered = useMemo(() => rows.filter(row => {
    const term = search.toLowerCase()
    return !search || row.party.toLowerCase().includes(term) || row.email.toLowerCase().includes(term)
  }), [rows, search])

  const columns = [
    { key:'party', label:'Party', sortable:true, render:(value, row) => <div><p className="font-medium text-[var(--text)]">{value}</p><p className="text-xs text-[var(--faint)]">{row.type}</p></div> },
    { key:'contact', label:'Contact' },
    { key:'email', label:'Email', render:value => <span className="text-sm text-[var(--muted)]">{value}</span> },
    { key:'status', label:'Portal', render:value => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TONE[value] ?? TONE['Not invited']}`}>{value}</span> },
    { key:'lastActivity', label:'Last Activity' },
    { key:'quotes', label:'Quotes' },
    { key:'invoices', label:'Invoices / Bills' },
    { key:'documents', label:'Documents' },
    {
      key:'actions',
      label:'Actions',
      render:(_, row) => (
        <div className="flex justify-end gap-1.5">
          <button title="Invite" onClick={e => { e.stopPropagation(); toast.success(`Portal invite sent to ${row.party}`) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)]"><Send size={13} /></button>
          <button title="Reinvite" onClick={e => { e.stopPropagation(); toast.info(`Portal invite resent to ${row.email}`) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)]"><RefreshCw size={13} /></button>
          <button title="Email" onClick={e => { e.stopPropagation(); toast.success(`Portal update emailed to ${row.party}`) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)]"><Mail size={13} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Party Portal"
        subtitle="Customer and vendor collaboration status for quotes, invoices, documents, and payments"
        breadcrumb={['Parties & Ledgers', 'Portal']}
        action={<Button variant="primary" icon={ShieldCheck} size="sm" onClick={() => toast.info('Portal preferences opened')}>Portal Settings</Button>}
      />
      <DataTable columns={columns} data={filtered} loading={loading} rowKey="id" toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search party or portal email..." />} />
    </div>
  )
}
