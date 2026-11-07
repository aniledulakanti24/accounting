import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getDisposals } from '../../data/services/assetsService'

function StatusChip({ status }) {
  const styles = status === 'completed' ? 'bg-[var(--pos-tint)] text-[var(--pos)]' : 'bg-[var(--primary-tint)] text-[var(--primary)]'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>{status}</span>
}

export default function DisposalRevaluation() {
  const [disposals, setDisposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { getDisposals().then(d => { setDisposals(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => disposals.filter(i =>
    !search || i.assetName.toLowerCase().includes(search.toLowerCase())
  ), [disposals, search])

  const totalDisposed = disposals.length
  const totalGainLoss = disposals.reduce((s, i) => s + i.gainLoss, 0)

  const kpis = [
    { label: 'Total Disposed', value: totalDisposed, color: 'var(--text)' },
    { label: 'Total Gain / Loss', value: formatCompact(Math.abs(totalGainLoss)), color: totalGainLoss >= 0 ? 'var(--pos)' : 'var(--neg)' },
  ]

  const columns = [
    { key: 'date', label: 'Date', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'assetName', label: 'Asset', render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'saleValue', label: 'Sale Value', align: 'right', render: v => <span className="tabular text-sm text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'netBookValue', label: 'Net Book Value', align: 'right', render: v => <span className="tabular text-sm text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'gainLoss', label: 'Gain / Loss', align: 'right', sortable: true, render: v => <span className={`tabular text-sm font-semibold ${v >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'}`}>{v >= 0 ? '+' : ''}{formatCurrency(v)}</span> },
    { key: 'method', label: 'Method', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'status', label: 'Status', render: v => <StatusChip status={v} /> },
  ]

  return (
    <div>
      <PageHeader title="Disposal & Revaluation" subtitle="Asset disposals and revaluation records" breadcrumb={['Fixed Assets', 'Disposal & Revaluation']}
        action={<Button variant="primary" icon={Plus} size="sm">Record Disposal</Button>}
      />
      <div className="grid grid-cols-2 gap-3 mb-5">
        {kpis.map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} rowKey="id"
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search asset…" />}
      />
    </div>
  )
}
