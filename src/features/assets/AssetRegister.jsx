import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getAssets } from '../../data/services/assetsService'

function StatusChip({ status }) {
  const styles = status === 'active' ? 'bg-[var(--pos-tint)] text-[var(--pos)]' : 'bg-[var(--faint)] text-[var(--muted)]'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>{status}</span>
}

export default function AssetRegister() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  useEffect(() => { getAssets().then(d => { setAssets(d); setLoading(false) }) }, [])

  const categories = useMemo(() => ['All', ...new Set(assets.map(a => a.category))], [assets])

  const filtered = useMemo(() => assets.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.location.toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'All' || i.category === categoryFilter
    return matchSearch && matchCat
  }), [assets, search, categoryFilter])

  const activeAssets = assets.filter(i => i.status === 'active')
  const grossBlock = assets.reduce((s, i) => s + i.purchaseValue, 0)
  const netBlock = assets.reduce((s, i) => s + i.netValue, 0)

  const kpis = [
    { label: 'Total Assets', value: activeAssets.length, color: 'var(--text)' },
    { label: 'Gross Block', value: formatCompact(grossBlock), color: 'var(--primary)' },
    { label: 'Net Block', value: formatCompact(netBlock), color: 'var(--pos)' },
  ]

  const columns = [
    { key: 'name', label: 'Asset Name', render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'category', label: 'Category', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'purchaseDate', label: 'Purchase Date', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'purchaseValue', label: 'Cost', align: 'right', sortable: true, render: v => <span className="tabular text-sm text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'method', label: 'Method', render: (v, row) => <span className="text-sm text-[var(--muted)]">{v} @ {row.rate}%</span> },
    { key: 'accDep', label: 'Acc. Dep', align: 'right', render: v => <span className="tabular text-sm" style={{ color: 'var(--neg)' }}>{formatCurrency(v)}</span> },
    { key: 'netValue', label: 'Net Value', align: 'right', sortable: true, render: v => <span className="tabular text-sm font-bold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'location', label: 'Location', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'status', label: 'Status', render: v => <StatusChip status={v} /> },
  ]

  return (
    <div>
      <PageHeader title="Asset Register" subtitle="Fixed assets & depreciation tracking" breadcrumb={['Fixed Assets', 'Asset Register']}
        action={<Button variant="primary" icon={Plus} size="sm">Add Asset</Button>}
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
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search asset or location…">
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Filters>}
      />
    </div>
  )
}
