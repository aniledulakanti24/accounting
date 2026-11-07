import { useEffect, useState } from 'react'
import { Banknote, CheckCircle2, Clock, FileCheck2, Landmark, Send, ShieldCheck, UsersRound } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import KpiCard from '../../components/ui/KpiCard'
import Panel from '../../components/ui/Panel'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { formatDate } from '../../lib/date'
import {
  getPayrollFundingRequests,
  getPayrollFundingSummary,
} from '../../data/services/payrollAccountingService'

const EMPLOYEE_PAYOUTS = [
  { id: 'EMP-001', employee: 'Amit Sharma', bank: 'HDFC Bank', account: '****4821', ifsc: 'HDFC0000195', amount: 82500, status: 'ready' },
  { id: 'EMP-002', employee: 'Priya Nair', bank: 'ICICI Bank', account: '****7304', ifsc: 'ICIC0001120', amount: 91400, status: 'ready' },
  { id: 'EMP-003', employee: 'Rahul Mehta', bank: 'Axis Bank', account: '****2218', ifsc: 'UTIB0000451', amount: 76500, status: 'ready' },
  { id: 'EMP-004', employee: 'Sneha Rao', bank: 'SBI', account: '****9082', ifsc: 'SBIN0000412', amount: 68800, status: 'ready' },
]

export default function PayrollRequests() {
  const [requests, setRequests] = useState([])
  const [summary, setSummary] = useState({
    totalRequested: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    paidAmount: 0,
  })

  useEffect(() => {
    let mounted = true
    Promise.all([
      getPayrollFundingRequests(),
      getPayrollFundingSummary(),
    ]).then(([requestItems, summaryData]) => {
      if (!mounted) return
      setRequests(requestItems)
      setSummary(summaryData)
    })
    return () => { mounted = false }
  }, [])

  const columns = [
    { key: 'id', label: 'Request ID', sortable: true },
    { key: 'payrollPeriod', label: 'Payroll Period', sortable: true },
    { key: 'sourceModule', label: 'Source', sortable: true },
    { key: 'employees', label: 'Employees', align: 'right', sortable: true },
    {
      key: 'amount',
      label: 'Payroll Amount',
      align: 'right',
      sortable: true,
      render: (value) => <span className="tabular font-medium">{formatCurrency(value)}</span>,
    },
    {
      key: 'dueDate',
      label: 'Pay By',
      sortable: true,
      render: (value) => <span className="tabular">{formatDate(value)}</span>,
    },
    {
      key: 'status',
      label: 'Accounting Status',
      sortable: true,
      render: (value) => <StatusBadge status={value === 'approved' ? 'pending' : value} label={value} />,
    },
    { key: 'accountingImpact', label: 'Accounting Impact' },
    { key: 'suggestedEntry', label: 'Suggested Entry' },
  ]

  const payoutColumns = [
    { key: 'employee', label: 'Employee', render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'bank', label: 'Bank', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'account', label: 'Account', render: v => <span className="font-mono text-xs text-[var(--faint)]">{v}</span> },
    { key: 'ifsc', label: 'IFSC', render: v => <span className="font-mono text-xs text-[var(--muted)]">{v}</span> },
    { key: 'amount', label: 'Net Salary', align: 'right', render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'status', label: 'Bank Status', render: v => <StatusBadge status="pending" label={v === 'ready' ? 'Ready for bank' : v} /> },
  ]

  const payoutTotal = EMPLOYEE_PAYOUTS.reduce((sum, item) => sum + item.amount, 0)
  const statutoryHold = 186000
  const bankReady = EMPLOYEE_PAYOUTS.filter(item => item.status === 'ready').length
  const payrollFlow = [
    { label: 'Employee payout', value: payoutTotal, color: 'var(--pos)' },
    { label: 'Statutory hold', value: statutoryHold, color: 'var(--warn)' },
    { label: 'Pending approval', value: summary.pendingAmount, color: 'var(--primary)' },
  ]
  const maxPayrollFlow = Math.max(...payrollFlow.map(item => item.value), 1)

  return (
    <div>
      <PageHeader
        title="Payroll"
        subtitle="Approved payroll from HR with bank release, statutory hold, and accounting entries"
        breadcrumb={['Money Out', 'Payroll']}
        action={<Button variant="primary" icon={Send} size="sm">Release Payroll Payment</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 stagger">
        <KpiCard
          label="Approved Payroll Amount"
          value={formatCompact(summary.totalRequested)}
          subline="Amount approved by HR/payroll"
          icon={UsersRound}
          iconColor="#5b5bef"
        />
        <KpiCard
          label="Pending Approval"
          value={formatCompact(summary.pendingAmount)}
          subline="Salary payable not yet approved"
          icon={Clock}
          iconColor="#d97706"
          sentiment="warn"
        />
        <KpiCard
          label="Ready to Pay"
          value={formatCompact(summary.approvedAmount)}
          subline="Can be released by accountant"
          icon={CheckCircle2}
          iconColor="#16a34a"
          sentiment="pos"
        />
        <KpiCard
          label="Paid Payroll"
          value={formatCompact(summary.paidAmount)}
          subline="Posted and reconciled"
          icon={Banknote}
          iconColor="#16a34a"
          sentiment="pos"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <Panel>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-tint)] text-[var(--primary)]"><Landmark size={16} /></span>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">Bank-ready Salary File</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{bankReady} employee payouts can be released through the connected bank or payout provider.</p>
            </div>
          </div>
        </Panel>
        <Panel>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--warn-tint)] text-[var(--warn)]"><ShieldCheck size={16} /></span>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">Statutory Hold</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{formatCurrency(statutoryHold)} reserved for PF, ESI, PT, and TDS payment tracking.</p>
            </div>
          </div>
        </Panel>
        <Panel>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-tint)] text-[var(--pos)]"><FileCheck2 size={16} /></span>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">Accounting Entries</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Salary expense, salary payable, bank payment, and statutory payable entries are kept visible.</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="mb-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-1">Payroll Release Mix</h3>
          <p className="text-sm text-[var(--muted)]">Employee payout, statutory hold, and pending approval shown before release.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {payrollFlow.map(item => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--muted)]">{item.label}</span>
                <span className="tabular text-xs font-bold text-[var(--text)]">{formatCompact(item.value)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <div className="h-full rounded-full" style={{ width: `${Math.max(8, (item.value / maxPayrollFlow) * 100)}%`, background: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-1">Accountant Payroll Flow</h3>
        <p className="text-sm text-[var(--muted)]">
          HR owns employee-level salary calculation. Accounting receives the approved payroll amount here,
          verifies the payable, then releases the bank payment and posts salary expense, salary payable,
          and bank payment entries.
        </p>
      </Panel>

      <Panel className="mb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">Employee Payout Batch</h3>
            <p className="text-sm text-[var(--muted)] mt-1">
              After release, the connected bank or payout provider sends each employee's net salary to their saved bank account.
            </p>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Batch Total</p>
            <p className="tabular text-sm font-bold text-[var(--primary)]">{formatCurrency(payoutTotal)}</p>
          </div>
        </div>
        <DataTable
          columns={payoutColumns}
          data={EMPLOYEE_PAYOUTS}
          rowKey="id"
          pageSize={4}
        />
      </Panel>

      <DataTable
        columns={columns}
        data={requests}
        pageSize={8}
      />
    </div>
  )
}
