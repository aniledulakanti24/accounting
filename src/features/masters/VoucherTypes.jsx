import { useState, useEffect, useMemo } from 'react'
import { Plus, FileText, Link2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import { getVoucherTypes } from '../../data/services/mastersService'

const NATURE_COLORS = {
  Receipt:  { bg: 'bg-[var(--pos-tint)]',     text: 'text-[var(--pos)]' },
  Payment:  { bg: 'bg-[var(--neg-tint)]',      text: 'text-[var(--neg)]' },
  Journal:  { bg: 'bg-[var(--primary-tint)]',  text: 'text-[var(--primary)]' },
  Contra:   { bg: 'bg-gray-100',               text: 'text-gray-600' },
  Credit:   { bg: 'bg-[var(--pos-tint)]',      text: 'text-[var(--pos)]' },
  Debit:    { bg: 'bg-[var(--neg-tint)]',      text: 'text-[var(--neg)]' },
  Sales:    { bg: 'bg-[var(--primary-tint)]',  text: 'text-[var(--primary)]' },
  Purchase: { bg: 'bg-[var(--warn-tint)]',     text: 'text-[var(--warn)]' },
  Expense:  { bg: 'bg-[var(--warn-tint)]',     text: 'text-[var(--warn)]' },
}

export default function VoucherTypes() {
  const [types, setTypes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    getVoucherTypes().then(d => { setTypes(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => types.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || t.status === statusFilter
    return matchSearch && matchStatus
  }), [types, search, statusFilter])

  const columns = [
    {
      key: 'abbr',
      label: 'Abbr',
      className: 'w-16',
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-[var(--primary)] bg-[var(--primary-tint)] px-2 py-0.5 rounded">
          {val}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Voucher Type',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--text)]">{val}</span>
          {row.synced && (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--faint)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">
              <Link2 size={10} /> Synced
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'nature',
      label: 'Nature',
      sortable: true,
      render: (val) => {
        const c = NATURE_COLORS[val] ?? { bg: 'bg-gray-100', text: 'text-gray-600' }
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
            {val}
          </span>
        )
      },
    },
    {
      key: 'numberSeries',
      label: 'Number Series',
      render: (val) => <span className="font-mono text-xs text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'autoNumber',
      label: 'Auto Number',
      align: 'center',
      render: (val) => (
        <span className={`text-xs font-medium ${val ? 'text-[var(--pos)]' : 'text-[var(--muted)]'}`}>
          {val ? 'Yes' : 'No'}
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
        title="Voucher Types"
        subtitle={`${types.length} types · ${types.filter(t => t.status === 'active').length} active`}
        breadcrumb={['Masters', 'Voucher Types']}
        action={
          <Button variant="primary" icon={Plus} size="sm">New Type</Button>
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder="Search voucher type…">
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
        emptyState={
          <div className="flex flex-col items-center py-14 text-center">
            <FileText size={28} className="text-[var(--faint)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text)]">No voucher types found</p>
          </div>
        }
      />
    </div>
  )
}
