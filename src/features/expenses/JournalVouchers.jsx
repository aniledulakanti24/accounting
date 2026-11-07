import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getJournalVouchers } from '../../data/services/expensesService'

function StatusChip({ status }) {
  const styles = status === 'posted'
    ? 'bg-[var(--pos-tint)] text-[var(--pos)]'
    : 'bg-[var(--primary-tint)] text-[var(--primary)]'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>{status}</span>
}

export default function JournalVouchers() {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => { getJournalVouchers().then(d => { setVouchers(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => vouchers.filter(i => {
    const matchSearch = !search || i.narration.toLowerCase().includes(search.toLowerCase()) || i.ref.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || i.status === statusFilter
    return matchSearch && matchStatus
  }), [vouchers, search, statusFilter])

  const postedCount = vouchers.filter(i => i.status === 'posted').length
  const draftCount = vouchers.filter(i => i.status === 'draft').length
  const totalDr = vouchers.reduce((s, i) => s + (i.entries[0]?.dr ?? 0), 0)

  const kpis = [
    { label: 'Posted', value: postedCount, color: 'var(--pos)' },
    { label: 'Draft', value: draftCount, color: 'var(--primary)' },
    { label: 'Total Dr Amount', value: formatCompact(totalDr), color: 'var(--text)' },
  ]

  const columns = [
    { key: 'ref', label: 'Ref #', render: v => <span className="font-mono text-xs text-[var(--primary)]">{v}</span> },
    { key: 'date', label: 'Date', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'narration', label: 'Narration', render: v => <span className="text-sm text-[var(--text)]">{v}</span> },
    { key: 'entries', label: 'Entries', align: 'center', render: v => <span className="tabular text-sm text-[var(--muted)]">{v.length}</span> },
    { key: 'entries', label: 'Total Dr', align: 'right', render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v[0]?.dr ?? 0)}</span> },
    { key: 'status', label: 'Status', render: v => <StatusChip status={v} /> },
    { key: 'postedBy', label: 'Posted By', render: v => <span className="text-sm text-[var(--muted)]">{v ?? '—'}</span> },
  ]

  return (
    <div>
      <PageHeader title="Journal Vouchers" subtitle="Manual accounting entries" breadcrumb={['Expenses & Journals', 'Journal Vouchers']}
        action={<Button variant="primary" icon={Plus} size="sm">New Journal Voucher</Button>}
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
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search voucher or narration…">
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
