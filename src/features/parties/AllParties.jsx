import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellRing, Eye, FileText, MessageCircle, Plus, Download, Users } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import { getParties, PARTY_TYPES } from '../../data/services/partiesService'
import { toast } from '../../lib/toast'
import PartyDetailModal from './PartyDetailModal'
import NewPartyModal from './NewPartyModal'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

const TYPE_CFG = {
  Customer: { bg: 'bg-[var(--primary-tint)]', text: 'text-[var(--primary)]' },
  Supplier: { bg: 'bg-[var(--warn-tint)]',    text: 'text-[var(--warn)]' },
  Both:     { bg: 'bg-[var(--pos-tint)]',      text: 'text-[var(--pos)]' },
}

export default function AllParties() {
  const navigate = useNavigate()
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedParty, setSelectedParty] = useState(null)
  const [newPartyOpen, setNewPartyOpen] = useState(false)

  useEffect(() => {
    getParties().then(d => { setParties(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => parties.filter(p => {
    const term = search.toLowerCase()
    const matchSearch = !search
      || p.name.toLowerCase().includes(term)
      || (p.gstin && p.gstin.toLowerCase().includes(term))
      || (p.taxId && p.taxId.toLowerCase().includes(term))
    const matchType   = typeFilter === 'All' || p.type === typeFilter
    const matchStatus = statusFilter === 'All' || p.status === statusFilter
    return matchSearch && matchType && matchStatus
  }), [parties, search, typeFilter, statusFilter])

  const summary = [
    { label: 'Customers', count: parties.filter(p => p.type === 'Customer' || p.type === 'Both').length, color: 'var(--primary)' },
    { label: 'Suppliers', count: parties.filter(p => p.type === 'Supplier' || p.type === 'Both').length, color: 'var(--warn)' },
    { label: 'Credit Blocks', count: parties.filter(p => p.creditPolicy?.includes('block')).length, color: 'var(--neg)' },
    { label: 'Auto Statements', count: parties.filter(p => p.statementAutoSend && p.statementAutoSend !== '-').length, color: 'var(--pos)' },
  ]

  function openReminderQueue(row, channel = 'Email + SMS') {
    const params = new URLSearchParams({
      partyId: row.id,
      party: row.name,
      type: row.type,
      amount: String(row.overdue || row.outstanding || 0),
      channel,
      source: 'all-parties',
    })
    navigate(`/parties/reminders?${params.toString()}`)
  }

  function openStatement(row) {
    const params = new URLSearchParams({ partyId: row.id, party: row.name })
    navigate(`/parties/statements?${params.toString()}`)
  }

  const columns = [
    {
      key: 'name',
      label: 'Party Name',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium text-[var(--text)]">{val}</p>
          <p className="text-xs text-[var(--faint)] font-mono">{row.taxId || row.gstin}</p>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (val) => {
        const c = TYPE_CFG[val] ?? { bg: 'bg-gray-100', text: 'text-gray-600' }
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
            {val}
          </span>
        )
      },
    },
    {
      key: 'city',
      label: 'Branch / Owner',
      render: (_, row) => (
        <div>
          <p className="text-sm text-[var(--text)]">{row.branch || row.city}</p>
          <p className="text-xs text-[var(--faint)]">{row.owner}</p>
        </div>
      ),
    },
    {
      key: 'outstanding',
      label: 'Outstanding',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className={`tabular text-sm font-medium ${val > 0 ? 'text-[var(--text)]' : 'text-[var(--faint)]'}`}>
          {val > 0 ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      key: 'overdue',
      label: 'Overdue',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className={`tabular text-sm font-semibold ${val > 0 ? 'text-[var(--neg)]' : 'text-[var(--faint)]'}`}>
          {val > 0 ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      key: 'lastTxn',
      label: 'Last Txn',
      sortable: true,
      render: (val) => <span className="text-sm text-[var(--muted)]">{val ?? '—'}</span>,
    },
    {
      key: 'creditPolicy',
      label: 'Credit Control',
      sortable: true,
      render: (val, row) => {
        const blocked = val?.includes('block')
        const warned = row.overdue > 0 || (row.creditLimit > 0 && row.outstanding > row.creditLimit)
        return (
          <div>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
              blocked ? 'bg-[var(--neg-tint)] text-[var(--neg)]'
                : warned ? 'bg-[var(--warn-tint)] text-[var(--warn)]'
                  : 'bg-[var(--pos-tint)] text-[var(--pos)]'
            }`}>
              {val || 'Standard'}
            </span>
            <p className="mt-1 text-xs text-[var(--faint)]">{row.statementAutoSend} statements</p>
          </div>
        )
      },
    },
    {
      key: 'tags',
      label: 'Tags',
      render: (val = []) => (
        <div className="flex max-w-40 flex-wrap gap-1">
          {val.slice(0, 2).map(tag => (
            <span key={tag} className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--muted)]">{tag}</span>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex justify-end gap-1.5">
          <button title="View party" onClick={e => { e.stopPropagation(); setSelectedParty(row) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-2)]">
            <Eye size={13} />
          </button>
          <button title="Send reminder" onClick={e => { e.stopPropagation(); openReminderQueue(row) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-2)]">
            <BellRing size={13} />
          </button>
          <button title="Share statement" onClick={e => { e.stopPropagation(); openStatement(row) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-2)]">
            <FileText size={13} />
          </button>
          <button title="WhatsApp" onClick={e => { e.stopPropagation(); openReminderQueue(row, 'WhatsApp') }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-2)]">
            <MessageCircle size={13} />
          </button>
        </div>
      ),
    },
  ]

  function handleCreateParty(party) {
    setParties(current => [party, ...current])
    setSelectedParty(party)
    toast.success(`${party.name} created`)
  }

  return (
    <div>
      <PageHeader
        title="All Parties"
        subtitle={`${parties.length} parties · ${parties.filter(p => p.status === 'active').length} active`}
        breadcrumb={['Parties & Ledgers', 'All Parties']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">Export</Button>
            <Button variant="primary" icon={Plus} size="sm" onClick={() => setNewPartyOpen(true)}>New Party</Button>
          </div>
        }
      />

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {summary.map(s => (
          <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{s.label}</p>
            <p className="text-2xl font-bold tabular" style={{ color: s.color }}>{s.count}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        onRowClick={(row) => setSelectedParty(row)}
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder={`Search party name or ${countryConfig.taxIdLabel}…`}>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Types</option>
              {PARTY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Filters>
        }
        emptyState={
          <div className="flex flex-col items-center py-14 text-center">
            <Users size={28} className="text-[var(--faint)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text)]">No parties found</p>
            <p className="text-xs text-[var(--muted)] mt-1">Adjust filters or create a new party.</p>
          </div>
        }
      />

      <PartyDetailModal
        open={!!selectedParty}
        onClose={() => setSelectedParty(null)}
        party={selectedParty}
      />

      <NewPartyModal
        open={newPartyOpen}
        onClose={() => setNewPartyOpen(false)}
        onCreate={handleCreateParty}
        existingParties={parties}
      />
    </div>
  )
}
