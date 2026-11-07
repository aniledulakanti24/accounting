import { useState, useMemo } from 'react'
import { Plus, RefreshCw, Globe } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { currencySymbol } from '../../lib/currency'

export default function Currencies() {
  const { data, loading, refetch } = useApi('/currencies')
  const currencies = useMemo(() => data?.currencies ?? [], [data])
  const base = data?.base ?? 'INR'
  const baseName = currencies.find(c => c.isBase)?.name ?? base
  const sym = currencySymbol(base)
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = useMemo(() => currencies.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || c.status === statusFilter
    return matchSearch && matchStatus
  }), [currencies, search, statusFilter])

  const columns = [
    {
      key: 'code',
      label: 'Code',
      className: 'w-20',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{row.symbol}</span>
          <span className="font-mono font-semibold text-sm text-[var(--text)]">{val}</span>
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Currency',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium text-[var(--text)]">{val}</p>
          {row.isBase && (
            <span className="text-xs text-[var(--primary)] font-medium">Base currency</span>
          )}
        </div>
      ),
    },
    {
      key: 'exchangeRate',
      label: `1 Unit = ${sym}`,
      align: 'right',
      sortable: true,
      render: (val, row) => row.isBase
        ? <span className="text-sm text-[var(--faint)]">—</span>
        : <span className="tabular font-semibold text-[var(--text)]">{sym}{val.toFixed(4)}</span>,
    },
    {
      key: 'exchangeRate',
      label: `${sym}1 = X`,
      align: 'right',
      render: (val, row) => row.isBase
        ? <span className="text-sm text-[var(--faint)]">—</span>
        : <span className="tabular text-sm text-[var(--muted)]">{(1 / val).toFixed(5)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => row.isBase
        ? <StatusBadge status="active" label="Base" />
        : <StatusBadge status={val} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Currencies"
        subtitle={`${currencies.filter(c => c.status === 'active').length} active · Base: ${baseName} (${sym} ${base})${data?.asOf ? ` · Indicative rates as of ${data.asOf}` : ''}`}
        breadcrumb={['Masters', 'Currencies']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={RefreshCw} size="sm" onClick={refetch}>Refresh Rates</Button>
            <Button variant="primary" icon={Plus} size="sm">Add Currency</Button>
          </div>
        }
      />

      {/* Active currencies grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 mb-5">
        {currencies.filter(c => c.status === 'active').map(c => (
          <div
            key={c.id}
            className={`bg-[var(--surface)] border rounded-[var(--radius-sm)] p-3 shadow-sm
              ${c.isBase ? 'border-[var(--primary)]' : 'border-[var(--border)]'}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg">{c.symbol}</span>
              <span className="text-xs font-mono font-bold text-[var(--muted)]">{c.code}</span>
            </div>
            {c.isBase
              ? <p className="text-xs text-[var(--primary)] font-medium">Base</p>
              : <p className="tabular text-xs text-[var(--text)] font-semibold">{sym}{c.exchangeRate.toFixed(2)}</p>
            }
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder="Search currency…">
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
            <Globe size={28} className="text-[var(--faint)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text)]">No currencies found</p>
          </div>
        }
      />
    </div>
  )
}
