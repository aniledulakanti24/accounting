import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Download, TrendingUp, Clock, BellRing, Eye, FileText, Receipt } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getCustomers } from '../../data/services/partiesService'
import { toast } from '../../lib/toast'
import PartyDetailModal from './PartyDetailModal'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

export default function CustomerLedgers() {
  const navigate = useNavigate()
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [overdueFilter, setOverdueFilter] = useState('All')
  const [selectedParty, setSelectedParty] = useState(null)

  useEffect(() => {
    getCustomers().then(d => { setCustomers(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => customers.filter(c => {
    const term = search.toLowerCase()
    const matchSearch  = !search || c.name.toLowerCase().includes(term) || (c.gstin && c.gstin.toLowerCase().includes(term)) || (c.taxId && c.taxId.toLowerCase().includes(term))
    const matchOverdue = overdueFilter === 'All'
      || (overdueFilter === 'Overdue' && c.overdue > 0)
      || (overdueFilter === 'Clear'   && c.overdue === 0)
    return matchSearch && matchOverdue
  }), [customers, search, overdueFilter])

  const totalReceivable = customers.reduce((s, c) => s + c.outstanding, 0)
  const totalOverdue    = customers.reduce((s, c) => s + c.overdue, 0)
  const overdueCount    = customers.filter(c => c.overdue > 0).length

  const kpis = [
    { label: 'Total Receivable', value: formatCompact(totalReceivable), color: 'var(--primary)', sub: `${customers.length} customers` },
    { label: 'Overdue',          value: formatCompact(totalOverdue),    color: 'var(--neg)',     sub: `${overdueCount} accounts` },
    { label: 'On-Time',          value: formatCompact(totalReceivable - totalOverdue), color: 'var(--pos)', sub: 'within credit period' },
  ]

  function openReminderQueue(row) {
    const params = new URLSearchParams({
      partyId: row.id,
      party: row.name,
      type: row.type,
      amount: String(row.overdue || row.outstanding || 0),
      channel: 'Email + SMS',
      source: 'customer-ledgers',
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
      label: 'Customer',
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
      key: 'creditLimit',
      label: 'Credit Limit',
      align: 'right',
      sortable: true,
      render: (val) => <span className="tabular text-sm text-[var(--muted)]">{formatCurrency(val)}</span>,
    },
    {
      key: 'outstanding',
      label: 'Outstanding',
      align: 'right',
      sortable: true,
      render: (val, row) => {
        const pct = row.creditLimit > 0 ? (val / row.creditLimit) * 100 : 0
        const warn = pct > 90
        return (
          <div className="text-right">
            <p className={`tabular text-sm font-semibold ${warn ? 'text-[var(--warn)]' : 'text-[var(--text)]'}`}>
              {val > 0 ? formatCurrency(val) : '—'}
            </p>
            {row.creditLimit > 0 && val > 0 && (
              <div className="w-full bg-[var(--surface-2)] rounded-full h-1 mt-1">
                <div
                  className="h-1 rounded-full"
                  style={{ width: `${Math.min(100, pct)}%`, background: warn ? 'var(--warn)' : 'var(--primary)' }}
                />
              </div>
            )}
          </div>
        )
      },
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
          <button title="Record receipt" onClick={e => { e.stopPropagation(); toast.success(`Receipt opened for ${row.name}`) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-2)]"><Receipt size={13} /></button>
          <button title="Send reminder" onClick={e => { e.stopPropagation(); openReminderQueue(row) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-2)]"><BellRing size={13} /></button>
          <button title="Share statement" onClick={e => { e.stopPropagation(); openStatement(row) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-2)]"><FileText size={13} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Customer Ledgers"
        subtitle="Accounts receivable by party"
        breadcrumb={['Parties & Ledgers', 'Customer Ledgers']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">Export</Button>
            <Button variant="primary" icon={Plus} size="sm">New Customer</Button>
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
          <Filters search={search} onSearchChange={setSearch} placeholder={`Search customer or ${countryConfig.taxIdLabel}…`}>
            <select
              value={overdueFilter}
              onChange={e => setOverdueFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All</option>
              <option value="Overdue">Overdue only</option>
              <option value="Clear">No overdue</option>
            </select>
          </Filters>
        }
        emptyState={
          <div className="flex flex-col items-center py-14 text-center">
            <TrendingUp size={28} className="text-[var(--faint)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text)]">No customers found</p>
          </div>
        }
      />
      <PartyDetailModal open={!!selectedParty} onClose={() => setSelectedParty(null)} party={selectedParty} />
    </div>
  )
}
