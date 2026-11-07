import { useState, useEffect, useMemo } from 'react'
import { Plus, Layers, TrendingUp } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getCostCenters } from '../../data/services/mastersService'

export default function CostCenters() {
  const [centers, setCenters] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    getCostCenters().then(d => { setCenters(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => centers.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || c.status === statusFilter
    return matchSearch && matchStatus
  }), [centers, search, statusFilter])

  const totalBudget    = centers.reduce((s, c) => s + (c.parent === null ? c.budget : 0), 0)
  const totalUtilized  = centers.reduce((s, c) => s + (c.parent === null ? c.utilized : 0), 0)
  const utilizationPct = totalBudget > 0 ? ((totalUtilized / totalBudget) * 100).toFixed(1) : '0'

  const columns = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      className: 'w-24',
      render: (val) => <span className="font-mono text-xs text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'name',
      label: 'Cost Center',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium text-[var(--text)]">{val}</p>
          {row.parent && (
            <p className="text-xs text-[var(--faint)]">Under: {row.parent}</p>
          )}
        </div>
      ),
    },
    {
      key: 'budget',
      label: 'Budget',
      align: 'right',
      sortable: true,
      render: (val) => <span className="tabular text-sm text-[var(--text)]">{formatCurrency(val)}</span>,
    },
    {
      key: 'utilized',
      label: 'Utilized',
      align: 'right',
      sortable: true,
      render: (val, row) => {
        const pct = row.budget > 0 ? (val / row.budget) * 100 : 0
        const color = pct > 90 ? 'var(--neg)' : pct > 70 ? 'var(--warn)' : 'var(--pos)'
        return (
          <div className="text-right">
            <p className="tabular text-sm font-medium" style={{ color }}>
              {formatCurrency(val)}
            </p>
            <div className="w-full bg-[var(--surface-2)] rounded-full h-1 mt-1">
              <div
                className="h-1 rounded-full transition-all"
                style={{ width: `${Math.min(100, pct)}%`, background: color }}
              />
            </div>
          </div>
        )
      },
    },
    {
      key: 'budget',
      label: 'Remaining',
      align: 'right',
      render: (val, row) => {
        const rem = val - row.utilized
        return (
          <span className={`tabular text-sm font-medium ${rem < 0 ? 'text-[var(--neg)]' : 'text-[var(--muted)]'}`}>
            {rem < 0 ? `-${formatCurrency(Math.abs(rem))}` : formatCurrency(rem)}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Cost Centers"
        subtitle={`Budget: ${formatCompact(totalBudget)} · Utilized: ${utilizationPct}%`}
        breadcrumb={['Masters', 'Cost Centers']}
        action={
          <Button variant="primary" icon={Plus} size="sm">New Cost Center</Button>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Budget',   value: formatCompact(totalBudget),   color: 'var(--primary)' },
          { label: 'Utilized',       value: formatCompact(totalUtilized),  color: 'var(--warn)' },
          { label: 'Remaining',      value: formatCompact(totalBudget - totalUtilized), color: 'var(--pos)' },
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
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder="Search cost center…">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Filters>
        }
      />
    </div>
  )
}
