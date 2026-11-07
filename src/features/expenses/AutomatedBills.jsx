import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getAutomatedBills } from '../../data/services/expensesService'

function StatusChip({ status }) {
  const styles = status === 'active'
    ? 'bg-[var(--pos-tint)] text-[var(--pos)]'
    : 'bg-[var(--faint)] text-[var(--muted)]'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>{status}</span>
}

export default function AutomatedBills() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { getAutomatedBills().then(d => { setBills(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => bills.filter(i =>
    !search || i.desc.toLowerCase().includes(search.toLowerCase()) || i.vendor.toLowerCase().includes(search.toLowerCase())
  ), [bills, search])

  const activeCount = bills.filter(i => i.status === 'active').length
  const monthlyTotal = bills.filter(i => i.frequency === 'Monthly' && i.status === 'active').reduce((s, i) => s + i.amount, 0)
  const nextDue = bills.filter(i => i.nextDue).map(i => i.nextDue).sort()[0] ?? '—'

  const kpis = [
    { label: 'Active Bills', value: activeCount, color: 'var(--pos)' },
    { label: 'Monthly Total', value: formatCompact(monthlyTotal), color: 'var(--primary)' },
    { label: 'Next Due', value: nextDue, color: 'var(--warn)' },
  ]

  const columns = [
    { key: 'desc', label: 'Description', render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'vendor', label: 'Vendor', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'frequency', label: 'Frequency', render: v => <span className="text-sm text-[var(--text)]">{v}</span> },
    { key: 'nextDue', label: 'Next Due', sortable: true, render: v => <span className="text-sm text-[var(--text)]">{v}</span> },
    { key: 'lastPosted', label: 'Last Posted', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'status', label: 'Status', render: v => <StatusChip status={v} /> },
  ]

  return (
    <div>
      <PageHeader title="Automated Bills" subtitle="Recurring bills & subscriptions" breadcrumb={['Expenses & Journals', 'Automated Bills']}
        action={<Button variant="primary" icon={Plus} size="sm">New Recurring Bill</Button>}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        {kpis.map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} rowKey="id"
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search bill or vendor…" />}
      />
    </div>
  )
}
