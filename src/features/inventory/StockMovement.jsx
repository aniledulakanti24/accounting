import { useState, useEffect, useMemo } from 'react'
import { Download, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, SlidersHorizontal } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatNumber, formatCurrencyWhole } from '../../lib/currency'
import { getStockMovements } from '../../data/services/inventoryService'

const TYPE_CFG = {
  Inward:   { icon: ArrowDownCircle, bg: 'bg-[var(--pos-tint)]',     text: 'text-[var(--pos)]',     label: 'Inward'   },
  Outward:  { icon: ArrowUpCircle,   bg: 'bg-[var(--neg-tint)]',      text: 'text-[var(--neg)]',     label: 'Outward'  },
  Transfer: { icon: ArrowRightLeft,  bg: 'bg-[var(--primary-tint)]',  text: 'text-[var(--primary)]', label: 'Transfer' },
  Adjust:   { icon: SlidersHorizontal, bg: 'bg-[var(--warn-tint)]',  text: 'text-[var(--warn)]',    label: 'Adjust'   },
}

export default function StockMovement() {
  const [movements, setMovements] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [typeFilter, setTypeFilter] = useState('All')

  useEffect(() => {
    getStockMovements().then(d => { setMovements(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => movements.filter(m => {
    const matchSearch = !search || m.item.toLowerCase().includes(search.toLowerCase()) || m.ref.toLowerCase().includes(search.toLowerCase())
    const matchType   = typeFilter === 'All' || m.type === typeFilter
    return matchSearch && matchType
  }), [movements, search, typeFilter])

  const totalIn  = movements.filter(m => m.type === 'Inward').reduce((s, m) => s + m.value, 0)
  const totalOut = movements.filter(m => m.type === 'Outward').reduce((s, m) => s + m.value, 0)

  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'ref',
      label: 'Reference',
      render: (val) => <span className="font-mono text-xs text-[var(--primary)]">{val}</span>,
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (val) => {
        const c = TYPE_CFG[val] ?? TYPE_CFG.Adjust
        const Icon = c.icon
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
            <Icon size={11} />
            {c.label}
          </span>
        )
      },
    },
    {
      key: 'item',
      label: 'Item',
      sortable: true,
      render: (val) => <span className="font-medium text-[var(--text)]">{val}</span>,
    },
    {
      key: 'godown',
      label: 'Location',
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'qty',
      label: 'Qty',
      align: 'right',
      sortable: true,
      render: (val, row) => (
        <span className={`tabular text-sm font-semibold ${val < 0 ? 'text-[var(--neg)]' : 'text-[var(--pos)]'}`}>
          {val > 0 ? '+' : ''}{formatNumber(val)} {row.unit}
        </span>
      ),
    },
    {
      key: 'rate',
      label: 'Rate',
      align: 'right',
      render: (val, row) => (
        <span className="tabular text-sm text-[var(--muted)]">{formatCurrencyWhole(val)}/{row.unit}</span>
      ),
    },
    {
      key: 'value',
      label: 'Value',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className={`tabular text-sm font-semibold ${val < 0 ? 'text-[var(--neg)]' : 'text-[var(--text)]'}`}>
          {formatCurrency(Math.abs(val))}
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Stock Movement"
        subtitle="Inward, outward, transfers and adjustments"
        breadcrumb={['Items & Inventory', 'Stock Movement']}
        action={
          <Button variant="secondary" icon={Download} size="sm">Export</Button>
        }
      />

      {/* Type filter chips + totals */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex gap-1.5 flex-1 flex-wrap">
          {['All', 'Inward', 'Outward', 'Transfer', 'Adjust'].map(t => {
            const c = t !== 'All' ? TYPE_CFG[t] : null
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors
                  ${typeFilter === t
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
              >
                {t} <span className="opacity-70 ml-1">
                  {t === 'All' ? movements.length : movements.filter(m => m.type === t).length}
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex gap-4 text-xs text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] px-4 py-2">
          <span>Inward: <strong className="tabular text-[var(--pos)]">{formatCurrency(totalIn)}</strong></span>
          <span>Outward: <strong className="tabular text-[var(--neg)]">{formatCurrency(totalOut)}</strong></span>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder="Search item or reference…" />
        }
      />
    </div>
  )
}
