import { useState, useEffect, useMemo } from 'react'
import { CheckCircle, AlertCircle, Scale } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getOpeningBalances } from '../../data/services/mastersService'
import { useAppStore } from '../../store/useAppStore'
import { currentFYYear, fyLabel } from '../../lib/fy'

const GROUP_COLORS = {
  Assets:      'text-[var(--primary)]',
  Liabilities: 'text-[var(--neg)]',
  Income:      'text-[var(--pos)]',
  Expenses:    'text-[var(--warn)]',
  Equity:      'text-gray-600',
}

export default function OpeningBalances() {
  const { financialYear } = useAppStore()
  const fy = financialYear ?? currentFYYear()

  const [entries, setEntries]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [groupFilter, setGroupFilter] = useState('All')

  useEffect(() => {
    getOpeningBalances().then(d => { setEntries(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => entries.filter(e => {
    const matchSearch = !search ||
      e.accountName.toLowerCase().includes(search.toLowerCase()) ||
      e.accountCode.includes(search)
    const matchGroup = groupFilter === 'All' || e.group === groupFilter
    return matchSearch && matchGroup
  }), [entries, search, groupFilter])

  const totalDr   = entries.reduce((s, e) => s + e.dr, 0)
  const totalCr   = entries.reduce((s, e) => s + e.cr, 0)
  const balanced  = Math.abs(totalDr - totalCr) < 1

  const columns = [
    {
      key: 'accountCode',
      label: 'Code',
      className: 'w-20',
      render: (val) => <span className="font-mono text-xs text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'accountName',
      label: 'Account',
      sortable: true,
      render: (val) => <span className="font-medium text-[var(--text)]">{val}</span>,
    },
    {
      key: 'group',
      label: 'Group',
      sortable: true,
      render: (val) => (
        <span className={`text-xs font-medium ${GROUP_COLORS[val] ?? 'text-[var(--muted)]'}`}>{val}</span>
      ),
    },
    {
      key: 'dr',
      label: 'Debit (Dr)',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className={`tabular text-sm ${val > 0 ? 'font-semibold text-[var(--pos)]' : 'text-[var(--faint)]'}`}>
          {val > 0 ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      key: 'cr',
      label: 'Credit (Cr)',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className={`tabular text-sm ${val > 0 ? 'font-semibold text-[var(--neg)]' : 'text-[var(--faint)]'}`}>
          {val > 0 ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      key: 'finalised',
      label: 'Finalised',
      align: 'center',
      render: (val) => val
        ? <CheckCircle size={15} className="text-[var(--pos)] mx-auto" />
        : <AlertCircle size={15} className="text-[var(--warn)] mx-auto" />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Opening Balances"
        subtitle={`${fyLabel(fy)} · ${entries.length} accounts`}
        breadcrumb={['Masters', 'Opening Balances']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">Import</Button>
            <Button variant="primary" size="sm">Save Balances</Button>
          </div>
        }
      />

      {/* Balance check banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-sm)] border mb-5 text-sm
        ${balanced
          ? 'bg-[var(--pos-tint)] border-[var(--pos)] text-[var(--pos)]'
          : 'bg-[var(--neg-tint)] border-[var(--neg)] text-[var(--neg)]'
        }`}
      >
        {balanced
          ? <CheckCircle size={16} />
          : <AlertCircle size={16} />
        }
        {balanced
          ? <span><strong>Trial balance is balanced.</strong> Dr = Cr = {formatCompact(totalDr)}</span>
          : <span><strong>Imbalance detected.</strong> Dr {formatCompact(totalDr)} ≠ Cr {formatCompact(totalCr)} · Diff: {formatCompact(Math.abs(totalDr - totalCr))}</span>
        }
        <div className="ml-auto flex gap-6 text-xs">
          <span>Dr Total: <strong className="tabular">{formatCurrency(totalDr)}</strong></span>
          <span>Cr Total: <strong className="tabular">{formatCurrency(totalCr)}</strong></span>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder="Search account name or code…">
            <select
              value={groupFilter}
              onChange={e => setGroupFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Groups</option>
              {['Assets','Liabilities','Income','Expenses','Equity'].map(g => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Filters>
        }
        emptyState={
          <div className="flex flex-col items-center py-14 text-center">
            <Scale size={28} className="text-[var(--faint)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text)]">No opening balances found</p>
          </div>
        }
      />
    </div>
  )
}
