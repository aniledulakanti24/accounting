import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import { getComplianceCalendar } from '../../data/services/taxService'

const TODAY = '2026-01-27'

function TypeChip({ type }) {
  const map = {
    'GST': 'bg-[var(--primary-tint)] text-[var(--primary)]',
    'TDS': 'bg-[#fef3c7] text-[#92400e]',
    'Tax': 'bg-[#ede9fe] text-[#6d28d9]',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[type] ?? 'bg-[var(--faint)] text-[var(--muted)]'}`}>{type}</span>
}

function StatusChip({ status }) {
  const map = {
    filed:    'bg-[var(--pos-tint)] text-[var(--pos)]',
    paid:     'bg-[var(--pos-tint)] text-[var(--pos)]',
    pending:  'bg-[var(--neg-tint)] text-[var(--neg)]',
    upcoming: 'bg-[var(--faint)] text-[var(--muted)]',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-[var(--faint)] text-[var(--muted)]'}`}>{status}</span>
}

export default function QuarterlyCompliance() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => { getComplianceCalendar().then(d => { setItems(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => items.filter(i => {
    const matchSearch = !search || i.task.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || i.status === statusFilter
    return matchSearch && matchStatus
  }), [items, search, statusFilter])

  const filedPaidCount = items.filter(i => i.status === 'filed' || i.status === 'paid').length
  const pendingCount = items.filter(i => i.status === 'pending').length
  const upcomingCount = items.filter(i => i.status === 'upcoming').length

  const kpis = [
    { label: 'Filed / Paid', value: filedPaidCount, color: 'var(--pos)' },
    { label: 'Pending', value: pendingCount, color: 'var(--neg)' },
    { label: 'Upcoming', value: upcomingCount, color: 'var(--muted)' },
  ]

  const columns = [
    {
      key: 'dueDate', label: 'Due Date', sortable: true, render: (v, row) => {
        const overdue = row.status === 'pending' && v < TODAY
        return <span className={`text-sm font-medium ${overdue ? 'text-[var(--neg)]' : 'text-[var(--text)]'}`}>{v}</span>
      }
    },
    { key: 'task', label: 'Task', render: v => <span className="text-sm font-medium text-[var(--text)]">{v}</span> },
    { key: 'type', label: 'Type', render: v => <TypeChip type={v} /> },
    { key: 'status', label: 'Status', render: v => <StatusChip status={v} /> },
    { key: 'filedOn', label: 'Filed On', render: v => <span className="text-sm text-[var(--muted)]">{v ?? '—'}</span> },
  ]

  return (
    <div>
      <PageHeader title="Quarterly Compliance" subtitle="Tax filing calendar & status" breadcrumb={['Tax Center', 'Quarterly Compliance']} />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        {kpis.map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} rowKey="id"
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search task…">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]">
            <option value="All">All Status</option>
            <option value="filed">Filed</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </Filters>}
      />
    </div>
  )
}
