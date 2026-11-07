import { useState, useEffect, useMemo } from 'react'
import { Tag, TrendingUp, Download } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { ITEM_GROUPS } from '../../data/services/inventoryService'
import { getItemPricing } from '../../data/services/inventoryService'
import { formatCurrencyWhole, formatAmount } from '../../lib/currency'

export default function ItemPricing() {
  const [pricing, setPricing] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [group, setGroup]     = useState('All')
  const [marginFilter, setMarginFilter] = useState('All')

  useEffect(() => {
    getItemPricing().then(d => { setPricing(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => pricing.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())
    const matchGroup  = group === 'All' || p.group === group
    const matchMargin = marginFilter === 'All'
      || (marginFilter === '<10%' && p.margin !== null && p.margin < 10)
      || (marginFilter === '10–20%' && p.margin !== null && p.margin >= 10 && p.margin < 20)
      || (marginFilter === '>20%' && p.margin !== null && p.margin >= 20)
    return matchSearch && matchGroup && matchMargin
  }), [pricing, search, group, marginFilter])

  const avgMargin = pricing.filter(p => p.margin !== null).reduce((s, p) => s + p.margin, 0) /
    (pricing.filter(p => p.margin !== null).length || 1)

  const columns = [
    {
      key: 'code',
      label: 'Code',
      className: 'w-24',
      render: (val) => <span className="font-mono text-xs text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'name',
      label: 'Item',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium text-[var(--text)]">{val}</p>
          <p className="text-xs text-[var(--faint)]">{row.group} · {row.uom}</p>
        </div>
      ),
    },
    {
      key: 'purchasePrice',
      label: 'Purchase Price',
      align: 'right',
      sortable: true,
      render: (val, row) => (
        <span className="tabular text-sm text-[var(--muted)]">
          {val > 0 ? `${formatCurrencyWhole(val)}` : '—'}
        </span>
      ),
    },
    {
      key: 'lastPurchase',
      label: 'Last Purchase',
      align: 'right',
      sortable: true,
      render: (val, row) => {
        const diff = val - row.purchasePrice
        return (
          <div className="text-right">
            <span className="tabular text-sm text-[var(--text)]">
              {val > 0 ? `${formatCurrencyWhole(val)}` : '—'}
            </span>
            {diff !== 0 && val > 0 && (
              <p className={`text-xs ${diff > 0 ? 'text-[var(--neg)]' : 'text-[var(--pos)]'}`}>
                {diff > 0 ? '+' : ''}{formatAmount(diff)}
              </p>
            )}
          </div>
        )
      },
    },
    {
      key: 'salePrice',
      label: 'Sale Price',
      align: 'right',
      sortable: true,
      render: (val, row) => (
        <span className="tabular text-sm font-semibold text-[var(--text)]">
          {formatCurrencyWhole(val)}/{row.uom}
        </span>
      ),
    },
    {
      key: 'gstRate',
      label: 'GST',
      align: 'center',
      render: (val) => (
        <span className="text-xs font-medium text-[var(--primary)] bg-[var(--primary-tint)] px-2 py-0.5 rounded-full">
          {val}%
        </span>
      ),
    },
    {
      key: 'margin',
      label: 'Margin',
      align: 'right',
      sortable: true,
      render: (val) => {
        if (val === null) return <span className="text-[var(--faint)]">—</span>
        const color = val < 10 ? 'var(--neg)' : val < 20 ? 'var(--warn)' : 'var(--pos)'
        return (
          <div className="text-right">
            <span className="tabular text-sm font-bold" style={{ color }}>{val}%</span>
            <div className="w-full bg-[var(--surface-2)] rounded-full h-1 mt-1">
              <div className="h-1 rounded-full" style={{ width: `${Math.min(100, val * 2)}%`, background: color }} />
            </div>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Item Pricing"
        subtitle={`Avg margin: ${avgMargin.toFixed(1)}% · ${pricing.length} items`}
        breadcrumb={['Items & Inventory', 'Item Pricing']}
        action={
          <Button variant="secondary" icon={Download} size="sm">Export Price List</Button>
        }
      />

      {/* Group pills */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {['All', ...ITEM_GROUPS.filter(g => g !== 'Service')].map(g => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors
              ${group === g
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
          >
            {g}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder="Search item name or code…">
            <select
              value={marginFilter}
              onChange={e => setMarginFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Margins</option>
              <option value="<10%">{'< 10%'}</option>
              <option value="10–20%">10–20%</option>
              <option value=">20%">{'> 20%'}</option>
            </select>
          </Filters>
        }
        emptyState={
          <div className="flex flex-col items-center py-14 text-center">
            <Tag size={28} className="text-[var(--faint)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text)]">No pricing records found</p>
          </div>
        }
      />
    </div>
  )
}
