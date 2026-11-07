import { useState, useEffect, useMemo } from 'react'
import { Plus, Download } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getExpenses } from '../../data/services/expensesService'
import { exportCsv } from '../../lib/csvExport'
import { toast } from '../../lib/toast'

export default function ExpenseCenter() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => { getExpenses().then(d => { setExpenses(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => expenses.filter(i => {
    const matchSearch = !search || i.desc.toLowerCase().includes(search.toLowerCase()) || i.ref.toLowerCase().includes(search.toLowerCase()) || i.vendor.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || i.status === statusFilter
    return matchSearch && matchStatus
  }), [expenses, search, statusFilter])

  const totalExpenses = expenses.reduce((s, i) => s + i.total, 0)
  const totalApproved = expenses.filter(i => i.status === 'approved').reduce((s, i) => s + i.total, 0)
  const pendingCount = expenses.filter(i => i.status === 'pending').length

  function handleExport() {
    exportCsv(filtered, 'expenses', ['ref', 'date', 'category', 'desc', 'vendor', 'total', 'paidBy', 'mode', 'status'])
    toast.success(`Exported ${filtered.length} expenses to CSV`)
  }

  function handleNewExpense() {
    toast.info('New Expense form — coming soon')
  }

  const kpis = [
    { label: 'Total Expenses', value: formatCompact(totalExpenses), color: 'var(--text)' },
    { label: 'Approved', value: formatCompact(totalApproved), color: 'var(--pos)' },
    { label: 'Pending', value: `${pendingCount} items`, color: 'var(--warn)' },
  ]

  const columns = [
    { key: 'ref', label: 'Ref #', render: v => <span className="font-mono text-xs text-[var(--primary)]">{v}</span> },
    { key: 'date', label: 'Date', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'category', label: 'Category', render: v => <span className="text-sm font-medium text-[var(--text)]">{v}</span> },
    { key: 'desc', label: 'Description', render: v => <span className="text-sm text-[var(--text)]">{v}</span> },
    { key: 'vendor', label: 'Vendor', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'total', label: 'Total', align: 'right', sortable: true, render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'paidBy', label: 'Paid By', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'mode', label: 'Mode', render: v => <span className="text-sm text-[var(--text)]">{v}</span> },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
  ]

  return (
    <div>
      <PageHeader title="Expense Center" subtitle="Employee & operational expenses" breadcrumb={['Expenses & Journals', 'Expense Center']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm" onClick={handleExport}>Export</Button>
            <Button variant="primary" icon={Plus} size="sm" onClick={handleNewExpense}>New Expense</Button>
          </div>
        }
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
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search expense or vendor…">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]">
            <option value="All">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </Filters>}
      />
    </div>
  )
}
