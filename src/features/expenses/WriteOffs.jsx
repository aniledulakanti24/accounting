import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getWriteOffs } from '../../data/services/expensesService'

function StatusChip({ status }) {
  const styles = status === 'approved'
    ? 'bg-[var(--pos-tint)] text-[var(--pos)]'
    : 'bg-[var(--faint)] text-[var(--muted)]'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>{status}</span>
}

export default function WriteOffs() {
  const [writeOffs, setWriteOffs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { getWriteOffs().then(d => { setWriteOffs(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => writeOffs.filter(i =>
    !search || i.desc.toLowerCase().includes(search.toLowerCase()) || i.ref.toLowerCase().includes(search.toLowerCase())
  ), [writeOffs, search])

  const totalWrittenOff = writeOffs.reduce((s, i) => s + i.amount, 0)

  const kpis = [
    { label: 'Total Written Off', value: formatCompact(totalWrittenOff), color: 'var(--neg)' },
    { label: 'Count', value: writeOffs.length, color: 'var(--text)' },
  ]

  const columns = [
    { key: 'ref', label: 'Ref #', render: v => <span className="font-mono text-xs text-[var(--primary)]">{v}</span> },
    { key: 'date', label: 'Date', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'desc', label: 'Description', render: v => <span className="text-sm text-[var(--text)]">{v}</span> },
    { key: 'account', label: 'Account', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: v => <span className="tabular text-sm font-semibold" style={{ color: 'var(--neg)' }}>{formatCurrency(v)}</span> },
    { key: 'approvedBy', label: 'Approved By', render: v => <span className="text-sm text-[var(--muted)]">{v ?? '—'}</span> },
    { key: 'status', label: 'Status', render: v => <StatusChip status={v} /> },
  ]

  return (
    <div>
      <PageHeader title="Write-offs" subtitle="Asset & debt write-offs (requires approval)" breadcrumb={['Expenses & Journals', 'Write-offs']}
        action={<Button variant="primary" icon={Plus} size="sm">New Write-off</Button>}
      />
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-5">
        {kpis.map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} rowKey="id"
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search write-off or description…" />}
      />
    </div>
  )
}
