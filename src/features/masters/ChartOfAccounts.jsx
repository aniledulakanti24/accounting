import { useState, useEffect, useMemo } from 'react'
import { Plus, Download, ChevronRight, Layers } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import { getAccounts, ACCOUNT_GROUPS, ACCOUNT_TYPES } from '../../data/services/mastersService'

const GROUP_COLORS = {
  Assets:      { bg: 'bg-[var(--primary-tint)]', text: 'text-[var(--primary)]' },
  Liabilities: { bg: 'bg-[var(--neg-tint)]',     text: 'text-[var(--neg)]' },
  Income:      { bg: 'bg-[var(--pos-tint)]',      text: 'text-[var(--pos)]' },
  Expenses:    { bg: 'bg-[var(--warn-tint)]',     text: 'text-[var(--warn)]' },
  Equity:      { bg: 'bg-gray-100',               text: 'text-gray-600' },
}

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [group, setGroup]       = useState('All')
  const [type, setType]         = useState('All')

  useEffect(() => {
    getAccounts().then(d => { setAccounts(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => accounts.filter(a => {
    const matchSearch = !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.includes(search)
    const matchGroup  = group === 'All' || a.group === group
    const matchType   = type  === 'All' || a.type  === type
    return matchSearch && matchGroup && matchType
  }), [accounts, search, group, type])

  // Summary counts
  const totDr = accounts.reduce((s, a) => s + a.openingDr, 0)
  const totCr = accounts.reduce((s, a) => s + a.openingCr, 0)

  const columns = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      className: 'w-20 font-mono text-xs text-[var(--muted)]',
    },
    {
      key: 'name',
      label: 'Account Name',
      sortable: true,
      render: (val) => (
        <span className="font-medium text-[var(--text)]">{val}</span>
      ),
    },
    {
      key: 'group',
      label: 'Group',
      sortable: true,
      render: (val) => {
        const c = GROUP_COLORS[val] ?? { bg: 'bg-gray-100', text: 'text-gray-600' }
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
            {val}
          </span>
        )
      },
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (val) => (
        <span className="text-sm text-[var(--muted)]">{val}</span>
      ),
    },
    {
      key: 'openingDr',
      label: 'Opening Dr',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className={`tabular text-sm ${val > 0 ? 'text-[var(--pos)] font-medium' : 'text-[var(--faint)]'}`}>
          {val > 0 ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      key: 'openingCr',
      label: 'Opening Cr',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className={`tabular text-sm ${val > 0 ? 'text-[var(--neg)] font-medium' : 'text-[var(--faint)]'}`}>
          {val > 0 ? formatCurrency(val) : '—'}
        </span>
      ),
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
        title="Chart of Accounts"
        subtitle={`${accounts.length} accounts · Dr ${formatCurrency(totDr)} / Cr ${formatCurrency(totCr)}`}
        breadcrumb={['Masters', 'Chart of Accounts']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">Export</Button>
            <Button variant="primary" icon={Plus} size="sm">New Account</Button>
          </div>
        }
      />

      {/* Group summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {ACCOUNT_GROUPS.map(g => {
          const count = accounts.filter(a => a.group === g).length
          const c = GROUP_COLORS[g]
          return (
            <button
              key={g}
              onClick={() => setGroup(prev => prev === g ? 'All' : g)}
              className={`flex flex-col items-start p-3 rounded-[var(--radius-sm)] border transition-all duration-150 text-left
                ${group === g
                  ? `border-[var(--primary)] ${c.bg}`
                  : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)]'
                }`}
            >
              <span className={`text-xs font-semibold ${group === g ? c.text : 'text-[var(--muted)]'}`}>{g}</span>
              <span className="text-xl font-bold text-[var(--text)] mt-0.5 tabular">{count}</span>
              <span className="text-xs text-[var(--faint)]">accounts</span>
            </button>
          )
        })}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder="Search account name or code…">
            <select
              value={group}
              onChange={e => setGroup(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Groups</option>
              {ACCOUNT_GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Types</option>
              {ACCOUNT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Filters>
        }
        emptyState={
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Layers size={28} className="text-[var(--faint)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text)]">No accounts found</p>
            <p className="text-xs text-[var(--muted)] mt-1">Try a different filter or create a new account.</p>
          </div>
        }
      />
    </div>
  )
}
