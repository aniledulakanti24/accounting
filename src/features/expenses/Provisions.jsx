import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getProvisions } from '../../data/services/expensesService'

function StatusChip({ status }) {
  const styles = status === 'posted'
    ? 'bg-[var(--pos-tint)] text-[var(--pos)]'
    : 'bg-[var(--primary-tint)] text-[var(--primary)]'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>{status}</span>
}

export default function Provisions() {
  const [provisions, setProvisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => { getProvisions().then(d => { setProvisions(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => provisions.filter(i => {
    const matchSearch = !search || i.desc.toLowerCase().includes(search.toLowerCase()) || i.ref.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || i.status === statusFilter
    return matchSearch && matchStatus
  }), [provisions, search, statusFilter])

  const totalAmount = provisions.reduce((s, i) => s + i.amount, 0)
  const postedCount = provisions.filter(i => i.status === 'posted').length
  const draftCount = provisions.filter(i => i.status === 'draft').length

  const kpis = [
    { label: 'Total Provisions', value: formatCompact(totalAmount), color: 'var(--neg)' },
    { label: 'Posted', value: postedCount, color: 'var(--pos)' },
    { label: 'Draft', value: draftCount, color: 'var(--primary)' },
  ]

  const columns = [
    { key: 'ref', label: 'Ref #', render: v => <span className="font-mono text-xs text-[var(--primary)]">{v}</span> },
    { key: 'date', label: 'Date', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'desc', label: 'Description', render: v => <span className="text-sm text-[var(--text)]">{v}</span> },
    { key: 'account', label: 'Account', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: v => <span className="tabular text-sm font-semibold" style={{ color: 'var(--neg)' }}>{formatCurrency(v)}</span> },
    { key: 'status', label: 'Status', render: v => <StatusChip status={v} /> },
  ]

  return (
    <div>
      <PageHeader title="Provisions" subtitle="Accruals & expense provisions" breadcrumb={['Expenses & Journals', 'Provisions']}
        action={<Button variant="primary" icon={Plus} size="sm">New Provision</Button>}
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
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search provision or ref…">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]">
            <option value="All">All Status</option>
            <option value="posted">Posted</option>
            <option value="draft">Draft</option>
          </select>
        </Filters>}
      />
    </div>
  )
}
