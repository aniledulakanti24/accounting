import { useState, useEffect, useMemo } from 'react'
import { Plus, Warehouse } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact, formatNumber } from '../../lib/currency'
import { getGodowns } from '../../data/services/inventoryService'

const TYPE_CFG = {
  Main:    { bg: 'bg-[var(--primary-tint)]', text: 'text-[var(--primary)]' },
  Sub:     { bg: 'bg-[var(--pos-tint)]',     text: 'text-[var(--pos)]' },
  Virtual: { bg: 'bg-gray-100',               text: 'text-gray-500' },
}

export default function Godowns() {
  const [godowns, setGodowns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    getGodowns().then(d => { setGodowns(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => godowns.filter(g => {
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.location.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || (statusFilter === 'active' ? g.active : !g.active)
    return matchSearch && matchStatus
  }), [godowns, search, statusFilter])

  const totalValue    = godowns.filter(g => g.active).reduce((s, g) => s + g.stockValue, 0)
  const totalCapacity = godowns.filter(g => g.capacitySqFt > 0).reduce((s, g) => s + g.capacitySqFt, 0)

  const columns = [
    {
      key: 'code',
      label: 'Code',
      className: 'w-28',
      render: (val) => <span className="font-mono text-xs text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'name',
      label: 'Godown / Warehouse',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium text-[var(--text)]">{val}</p>
          <p className="text-xs text-[var(--faint)]">{row.location}</p>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (val) => {
        const c = TYPE_CFG[val] ?? { bg: 'bg-gray-100', text: 'text-gray-500' }
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
            {val}
          </span>
        )
      },
    },
    {
      key: 'capacitySqFt',
      label: 'Capacity (Sq.Ft)',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className="tabular text-sm text-[var(--muted)]">
          {val > 0 ? formatNumber(val) : '—'}
        </span>
      ),
    },
    {
      key: 'stockValue',
      label: 'Stock Value',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className={`tabular text-sm font-semibold ${val > 0 ? 'text-[var(--text)]' : 'text-[var(--faint)]'}`}>
          {val > 0 ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      key: 'active',
      label: 'Status',
      render: (val) => <StatusBadge status={val ? 'active' : 'inactive'} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Godowns & Warehouses"
        subtitle={`${godowns.filter(g => g.active).length} active · Total stock value ${formatCompact(totalValue)}`}
        breadcrumb={['Items & Inventory', 'Godowns & Warehouses']}
        action={
          <Button variant="primary" icon={Plus} size="sm">New Godown</Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Locations',    value: godowns.filter(g => g.active).length, fmt: 'num', color: 'var(--primary)' },
          { label: 'Total Capacity', value: `${formatNumber(totalCapacity)} Sq.Ft`, fmt: 'str', color: 'var(--text)' },
          { label: 'Total Stock Value', value: formatCompact(totalValue), fmt: 'str', color: 'var(--pos)' },
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
          <Filters search={search} onSearchChange={setSearch} placeholder="Search godown or location…">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Filters>
        }
        emptyState={
          <div className="flex flex-col items-center py-14 text-center">
            <Warehouse size={28} className="text-[var(--faint)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text)]">No godowns found</p>
          </div>
        }
      />
    </div>
  )
}
