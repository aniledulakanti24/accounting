import { useMemo, useState } from 'react'
import { AlertTriangle, Download, FileCheck2, Plus, ShieldCheck, UsersRound } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'

const LABOUR_PAYMENTS = [
  { id: 'LAB-001', date: '2026-05-29', site: 'Warehouse Loading', worker: 'Ramesh Yadav', workers: 6, days: 1, rate: 850, amount: 5100, mode: 'UPI', status: 'pending', compliance: 'Attendance pending', tds: 'No', cashRisk: 'Low' },
  { id: 'LAB-002', date: '2026-05-28', site: 'Store Renovation', worker: 'Sanjay Contractor', workers: 9, days: 1, rate: 900, amount: 8100, mode: 'Cash', status: 'paid', compliance: 'Approved', tds: '194C review', cashRisk: 'Medium' },
  { id: 'LAB-003', date: '2026-05-27', site: 'Inventory Count', worker: 'Meena Labour Group', workers: 4, days: 2, rate: 750, amount: 6000, mode: 'Bank', status: 'approved', compliance: 'Muster attached', tds: 'No', cashRisk: 'Low' },
  { id: 'LAB-004', date: '2026-05-26', site: 'Dispatch Packing', worker: 'Iqbal Khan', workers: 3, days: 1, rate: 800, amount: 2400, mode: 'UPI', status: 'paid', compliance: 'Approved', tds: 'No', cashRisk: 'Low' },
]

const STATUS_STYLE = {
  pending: 'bg-[var(--warn-tint)] text-[var(--warn)]',
  approved: 'bg-[var(--primary-tint)] text-[var(--primary)]',
  paid: 'bg-[var(--pos-tint)] text-[var(--pos)]',
}

export default function LabourPayments() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = useMemo(() => LABOUR_PAYMENTS.filter(item => {
    const text = `${item.site} ${item.worker} ${item.id}`.toLowerCase()
    const matchSearch = !search || text.includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || item.status === statusFilter
    return matchSearch && matchStatus
  }), [search, statusFilter])

  const pendingAmount = LABOUR_PAYMENTS.filter(item => item.status !== 'paid').reduce((sum, item) => sum + item.amount, 0)
  const paidAmount = LABOUR_PAYMENTS.filter(item => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0)
  const totalWorkers = LABOUR_PAYMENTS.reduce((sum, item) => sum + item.workers, 0)
  const complianceIssues = LABOUR_PAYMENTS.filter(item => item.compliance !== 'Approved' && item.compliance !== 'Muster attached').length
  const statusMix = [
    { label: 'Pending', value: LABOUR_PAYMENTS.filter(item => item.status === 'pending').reduce((sum, item) => sum + item.amount, 0), color: 'var(--warn)' },
    { label: 'Approved', value: LABOUR_PAYMENTS.filter(item => item.status === 'approved').reduce((sum, item) => sum + item.amount, 0), color: 'var(--primary)' },
    { label: 'Paid', value: paidAmount, color: 'var(--pos)' },
  ]
  const maxStatus = Math.max(...statusMix.map(item => item.value), 1)

  const columns = [
    { key: 'id', label: 'Payment #', render: v => <span className="font-mono text-xs text-[var(--primary)]">{v}</span> },
    { key: 'date', label: 'Date', sortable: true, render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'worker', label: 'Worker / Group', sortable: true, render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'site', label: 'Work', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'workers', label: 'People', align: 'right', render: v => <span className="tabular text-sm">{v}</span> },
    { key: 'rate', label: 'Rate / Day', align: 'right', render: v => <span className="tabular text-sm">{formatCurrency(v)}</span> },
    { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'mode', label: 'Mode', render: v => <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--muted)]">{v}</span> },
    { key: 'tds', label: 'TDS', render: v => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${v === 'No' ? 'bg-[var(--pos-tint)] text-[var(--pos)]' : 'bg-[var(--warn-tint)] text-[var(--warn)]'}`}>{v}</span> },
    { key: 'compliance', label: 'Compliance', render: v => <span className={`text-xs font-semibold ${v.includes('pending') ? 'text-[var(--warn)]' : 'text-[var(--pos)]'}`}>{v}</span> },
    { key: 'status', label: 'Status', render: v => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[v] ?? STATUS_STYLE.pending}`}>{v}</span> },
  ]

  return (
    <div>
      <PageHeader
        title="Labour Payments"
        subtitle="Daily wage and temporary worker payments, separate from employee payroll"
        breadcrumb={['Money Out', 'Labour Payments']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">Export</Button>
            <Button variant="primary" icon={Plus} size="sm">New Labour Payment</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Pending Labour Pay', value: formatCompact(pendingAmount), color: 'var(--warn)' },
          { label: 'Paid This Week', value: formatCompact(paidAmount), color: 'var(--pos)' },
          { label: 'Workers Covered', value: totalWorkers, color: 'var(--text)' },
          { label: 'Compliance Checks', value: complianceIssues, color: complianceIssues ? 'var(--warn)' : 'var(--pos)' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{kpi.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--primary)]/20 bg-[var(--primary-tint)] px-4 py-3 text-sm text-[var(--primary)]">
          <UsersRound size={16} className="mt-0.5 shrink-0" />
          <p>Use this for daily wage, contract, loading, packing, site, or temporary labour payments. Use Payroll only for regular employees.</p>
        </div>
        <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
          <FileCheck2 size={16} className="mt-0.5 shrink-0 text-[var(--pos)]" />
          <p>Attach muster, attendance, or contractor bill before final approval.</p>
        </div>
        <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
          {complianceIssues ? <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--warn)]" /> : <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[var(--pos)]" />}
          <p>Cash-limit and contractor TDS checks are visible before release.</p>
        </div>
      </div>

      <div className="mb-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Labour Payout Status</p>
            <p className="mt-1 text-xs text-[var(--faint)]">Pending, approved, and paid labour amounts by value</p>
          </div>
          <span className="text-xs font-semibold text-[var(--muted)]">{totalWorkers} workers covered</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {statusMix.map(item => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--muted)]">{item.label}</span>
                <span className="tabular text-xs font-bold text-[var(--text)]">{formatCompact(item.value)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <div className="h-full rounded-full" style={{ width: `${Math.max(8, (item.value / maxStatus) * 100)}%`, background: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey="id"
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder="Search worker, site or payment...">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]">
              <option value="All">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
            </select>
          </Filters>
        }
      />
    </div>
  )
}
