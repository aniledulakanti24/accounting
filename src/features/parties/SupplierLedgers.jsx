import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Download, ArrowUpCircle, Clock, BellRing, CreditCard, Eye, FileText } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getSuppliers } from '../../data/services/partiesService'
import { toast } from '../../lib/toast'
import PartyDetailModal from './PartyDetailModal'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

export default function SupplierLedgers() {
  const navigate = useNavigate()
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [overdueFilter, setOverdueFilter] = useState('All')
  const [selectedParty, setSelectedParty] = useState(null)

  useEffect(() => {
    getSuppliers().then(d => { setSuppliers(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => suppliers.filter(s => {
    const term = search.toLowerCase()
    const matchSearch  = !search || s.name.toLowerCase().includes(term) || (s.gstin && s.gstin.toLowerCase().includes(term)) || (s.taxId && s.taxId.toLowerCase().includes(term))
    const matchOverdue = overdueFilter === 'All'
      || (overdueFilter === 'Overdue'  && s.overdue > 0)
      || (overdueFilter === 'Advance'  && s.advance > 0)
      || (overdueFilter === 'Clear'    && s.overdue === 0 && s.advance === 0)
    return matchSearch && matchOverdue
  }), [suppliers, search, overdueFilter])

  const totalPayable  = suppliers.reduce((s, p) => s + p.outstanding, 0)
  const totalOverdue  = suppliers.reduce((s, p) => s + p.overdue, 0)
  const totalAdvance  = suppliers.reduce((s, p) => s + p.advance, 0)

  const kpis = [
    { label: 'Total Payable',  value: formatCompact(totalPayable),  color: 'var(--neg)',     sub: `${suppliers.length} suppliers` },
    { label: 'Overdue Bills',  value: formatCompact(totalOverdue),  color: 'var(--warn)',    sub: `${suppliers.filter(s => s.overdue > 0).length} suppliers` },
    { label: 'Advance Paid',   value: formatCompact(totalAdvance),  color: 'var(--primary)', sub: 'pending adjustment' },
  ]

  function openReminderQueue(row) {
    const params = new URLSearchParams({
      partyId: row.id,
      party: row.name,
      type: row.type,
      amount: String(row.overdue || row.outstanding || 0),
      channel: 'Email + SMS',
      source: 'supplier-ledgers',
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
      label: 'Supplier',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium text-[var(--text)]">{val}</p>
          <p className="text-xs text-[var(--faint)] font-mono">{row.taxId || row.gstin}</p>
        </div>
      ),
    },
    {
      key: 'city',
      label: 'City',
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'outstanding',
      label: 'Payable',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className={`tabular text-sm font-semibold ${val > 0 ? 'text-[var(--neg)]' : 'text-[var(--faint)]'}`}>
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
        <span className={`tabular text-sm font-semibold ${val > 0 ? 'text-[var(--warn)]' : 'text-[var(--faint)]'}`}>
          {val > 0 ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      key: 'advance',
      label: 'Advance Paid',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className={`tabular text-sm ${val > 0 ? 'text-[var(--primary)] font-medium' : 'text-[var(--faint)]'}`}>
          {val > 0 ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      key: 'lastTxn',
      label: 'Last Txn',
      sortable: true,
      render: (val) => (
        <span className="text-sm text-[var(--muted)] flex items-center gap-1">
          <Clock size={11} className="text-[var(--faint)]" />
          {val}
        </span>
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
          <button title="View party" onClick={e => { e.stopPropagation(); setSelectedParty(row) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-2)]"><Eye size={13} /></button>
          <button title="Record payment" onClick={e => { e.stopPropagation(); toast.success(`Payment opened for ${row.name}`) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-2)]"><CreditCard size={13} /></button>
          <button title="Payment reminder" onClick={e => { e.stopPropagation(); openReminderQueue(row) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-2)]"><BellRing size={13} /></button>
          <button title="Share statement" onClick={e => { e.stopPropagation(); openStatement(row) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-2)]"><FileText size={13} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Supplier Ledgers"
        subtitle="Accounts payable by party"
        breadcrumb={['Parties & Ledgers', 'Supplier Ledgers']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">Export</Button>
            <Button variant="primary" icon={Plus} size="sm">New Supplier</Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {kpis.map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs text-[var(--faint)] mt-0.5">{k.sub}</p>
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
          <Filters search={search} onSearchChange={setSearch} placeholder={`Search supplier or ${countryConfig.taxIdLabel}…`}>
            <select
              value={overdueFilter}
              onChange={e => setOverdueFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All</option>
              <option value="Overdue">Overdue only</option>
              <option value="Advance">With advance</option>
              <option value="Clear">Clear</option>
            </select>
          </Filters>
        }
        emptyState={
          <div className="flex flex-col items-center py-14 text-center">
            <ArrowUpCircle size={28} className="text-[var(--faint)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text)]">No suppliers found</p>
          </div>
        }
      />
      <PartyDetailModal open={!!selectedParty} onClose={() => setSelectedParty(null)} party={selectedParty} />
    </div>
  )
}
