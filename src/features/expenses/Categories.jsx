import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getExpenseCategories } from '../../data/services/expensesService'

function UtilizationBar({ used, budget }) {
  const pct = budget > 0 ? Math.min((used / budget) * 100, 100) : 0
  const color = pct > 90 ? 'var(--neg)' : pct > 70 ? 'var(--warn)' : 'var(--pos)'
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--faint)]">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs tabular text-[var(--muted)]" style={{ color }}>{pct.toFixed(0)}%</span>
    </div>
  )
}

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { getExpenseCategories().then(d => { setCategories(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => categories.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.ledger.toLowerCase().includes(search.toLowerCase())
  ), [categories, search])

  const totalBudget = categories.reduce((s, i) => s + i.budget, 0)
  const totalUsed = categories.reduce((s, i) => s + i.used, 0)

  const kpis = [
    { label: 'Total Categories', value: categories.length, color: 'var(--text)' },
    { label: 'Total Budget', value: formatCompact(totalBudget), color: 'var(--primary)' },
    { label: 'Total Used', value: formatCompact(totalUsed), color: 'var(--warn)' },
  ]

  const columns = [
    { key: 'name', label: 'Category', render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'parent', label: 'Parent', render: v => <span className="text-sm text-[var(--muted)]">{v ?? '—'}</span> },
    { key: 'ledger', label: 'Ledger', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'budget', label: 'Budget', align: 'right', render: v => <span className="tabular text-sm text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'used', label: 'Used', align: 'right', render: v => <span className="tabular text-sm text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'id', label: 'Utilization', render: (_, row) => <UtilizationBar used={row.used} budget={row.budget} /> },
    { key: 'txns', label: 'Txns', align: 'center', render: v => <span className="tabular text-sm text-[var(--muted)]">{v}</span> },
  ]

  return (
    <div>
      <PageHeader title="Expense Categories" subtitle="Budget allocation & utilization" breadcrumb={['Expenses & Journals', 'Categories']}
        action={<Button variant="primary" icon={Plus} size="sm">New Category</Button>}
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
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search category or ledger…" />}
      />
    </div>
  )
}
