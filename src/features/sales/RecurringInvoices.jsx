import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Download, FilePlus, PauseCircle, PlayCircle, Send } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { exportCsv } from '../../lib/csvExport'
import { toast } from '../../lib/toast'
import { getRecurringInvoices } from '../../data/services/salesService'

export default function RecurringInvoices() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    getRecurringInvoices().then(d => { setProfiles(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => profiles.filter(profile => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || profile.customer.toLowerCase().includes(q)
      || profile.profile.toLowerCase().includes(q)
      || profile.lastInvoice.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'All' || profile.status === statusFilter
    return matchSearch && matchStatus
  }), [profiles, search, statusFilter])

  const active = profiles.filter(p => p.status === 'active')
  const monthlyRunRate = active
    .filter(p => p.frequency === 'Monthly')
    .reduce((sum, p) => sum + p.amount, 0)
  const yearlyValue = profiles.reduce((sum, p) => sum + (p.frequency === 'Monthly' ? p.amount * 12 : p.amount), 0)
  const nextSevenDays = profiles.filter(p => new Date(p.nextRun) <= new Date('2026-02-07')).length

  function handleExport() {
    exportCsv(filtered, 'recurring-invoices', ['profile', 'customer', 'amount', 'frequency', 'nextRun', 'autoSend', 'payment', 'status', 'lastInvoice'])
    toast.success(`Exported ${filtered.length} recurring profiles`)
  }

  const columns = [
    {
      key: 'profile',
      label: 'Profile',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium text-[var(--text)]">{val}</p>
          <p className="text-[10px] text-[var(--faint)]">Last invoice {row.lastInvoice}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (val) => <span className="font-medium text-[var(--text)]">{val}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      sortable: true,
      sum: true,
      render: (val, row) => row?._isTotal
        ? <span className="tabular text-sm font-bold text-[var(--text)]">{formatCurrency(val)}</span>
        : <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(val)}</span>,
    },
    {
      key: 'frequency',
      label: 'Frequency',
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'nextRun',
      label: 'Next Run',
      sortable: true,
      render: (val) => (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)]">
          <CalendarClock size={13} />
          {val}
        </span>
      ),
    },
    {
      key: 'autoSend',
      label: 'Auto Send',
      render: (val, row) => (
        <div>
          <p className="text-sm text-[var(--text)]">{val}</p>
          <p className="text-[10px] text-[var(--faint)]">{row.payment}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val === 'active' ? 'active' : 'pending'} label={val} />,
    },
    {
      key: 'status',
      label: 'Action',
      render: (val, row) => (
        <div className="flex gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            icon={Send}
            onClick={() => toast.success(`Next invoice queued for ${row.customer}`)}
          >
            Run Now
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={val === 'active' ? PauseCircle : PlayCircle}
            onClick={() => toast.info(`${row.profile} ${val === 'active' ? 'paused' : 'resumed'}`)}
          >
            {val === 'active' ? 'Pause' : 'Resume'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Recurring Invoices"
        subtitle="Automate rent, retainers, AMCs, and subscription billing"
        breadcrumb={['Sales Operations', 'Recurring Invoices']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm" onClick={handleExport}>Export</Button>
            <Button variant="primary" icon={FilePlus} size="sm" onClick={() => toast.success('Recurring invoice profile opened')}>New Profile</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Active Profiles', value: active.length, color: 'var(--pos)' },
          { label: 'Monthly Run Rate', value: formatCompact(monthlyRunRate), color: 'var(--primary)' },
          { label: 'Annualized Value', value: formatCompact(yearlyValue), color: 'var(--text)' },
          { label: 'Due This Week', value: nextSevenDays, color: 'var(--warn)' },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        showTotals
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder="Search profile, customer, invoice...">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </Filters>
        }
      />
    </div>
  )
}
