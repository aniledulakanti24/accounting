import { Banknote, FileCheck2, ShieldCheck, UsersRound } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'

const LABOUR_ROWS = [
  { id: 'LAB-001', type: 'Labour', name: 'Ramesh Yadav', work: 'Warehouse Loading', people: 6, amount: 5100, status: 'pending', compliance: 'Attendance pending' },
  { id: 'LAB-002', type: 'Labour', name: 'Sanjay Contractor', work: 'Store Renovation', people: 9, amount: 8100, status: 'paid', compliance: '194C review' },
  { id: 'LAB-003', type: 'Labour', name: 'Meena Labour Group', work: 'Inventory Count', people: 4, amount: 6000, status: 'approved', compliance: 'Muster attached' },
]

const PAYROLL_ROWS = [
  { id: 'PAYROLL-JUN', type: 'Payroll', name: 'June salary batch', work: 'Regular employees', people: 42, amount: 1840000, status: 'ready', compliance: 'PF/ESI/TDS hold ready' },
  { id: 'STAT-JUN', type: 'Statutory', name: 'Payroll statutory dues', work: 'PF, ESI, PT, TDS', people: 42, amount: 186000, status: 'hold', compliance: 'Due after salary release' },
]

function MiniBar({ label, value, max, color }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--muted)]">{label}</span>
        <span className="tabular text-xs font-bold text-[var(--text)]">{formatCompact(value)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div className="h-full rounded-full" style={{ width: `${Math.max(8, (value / max) * 100)}%`, background: color }} />
      </div>
    </div>
  )
}

export default function MoneyOutWorkforce() {
  const rows = [...LABOUR_ROWS, ...PAYROLL_ROWS]
  const labourTotal = LABOUR_ROWS.reduce((sum, row) => sum + row.amount, 0)
  const payrollTotal = PAYROLL_ROWS.reduce((sum, row) => sum + row.amount, 0)
  const readyTotal = rows.filter(row => ['ready', 'approved'].includes(row.status)).reduce((sum, row) => sum + row.amount, 0)
  const max = Math.max(labourTotal, payrollTotal, readyTotal, 1)

  const columns = [
    { key: 'id', label: 'Ref', render: v => <span className="font-mono text-xs font-semibold text-[var(--primary)]">{v}</span> },
    { key: 'type', label: 'Type', render: v => <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-semibold text-[var(--muted)]">{v}</span> },
    { key: 'name', label: 'Payee / Batch', render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'work', label: 'Purpose', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'people', label: 'People', align: 'right' },
    { key: 'amount', label: 'Amount', align: 'right', render: v => <span className="tabular font-semibold">{formatCurrency(v)}</span> },
    { key: 'compliance', label: 'Compliance', render: v => <span className="text-xs font-semibold text-[var(--warn)]">{v}</span> },
    { key: 'status', label: 'Status', render: v => <span className="rounded-full bg-[var(--primary-tint)] px-2 py-0.5 text-xs font-semibold text-[var(--primary)]">{v}</span> },
  ]

  return (
    <div>
      <PageHeader
        title="Workforce Payments"
        subtitle="Labour and payroll merged into one release view with compliance checks"
        breadcrumb={['Money Out', 'Workforce']}
        action={<Button variant="primary" icon={Banknote} size="sm">Release Workforce Batch</Button>}
      />

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Labour Pay</p>
          <p className="tabular mt-2 text-2xl font-bold text-[var(--warn)]">{formatCompact(labourTotal)}</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Payroll + Statutory</p>
          <p className="tabular mt-2 text-2xl font-bold text-[var(--pos)]">{formatCompact(payrollTotal)}</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Ready / Approved</p>
          <p className="tabular mt-2 text-2xl font-bold text-[var(--primary)]">{formatCompact(readyTotal)}</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Workforce Money Mix</p>
          <div className="space-y-3">
            <MiniBar label="Labour" value={labourTotal} max={max} color="var(--warn)" />
            <MiniBar label="Payroll and statutory" value={payrollTotal} max={max} color="var(--pos)" />
            <MiniBar label="Ready to release" value={readyTotal} max={max} color="var(--primary)" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { icon: UsersRound, title: 'One workforce view', text: 'No separate labour and payroll tabs for daily users.' },
            { icon: ShieldCheck, title: 'Compliance first', text: 'Muster, contractor TDS, and statutory holds stay visible.' },
            { icon: FileCheck2, title: 'Accounting ready', text: 'Salary, labour, payable, and bank entries are grouped.' },
          ].map(item => {
            const Icon = item.icon
            return (
              <div key={item.title} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <Icon size={17} className="mb-3 text-[var(--primary)]" />
                <p className="text-sm font-bold text-[var(--text)]">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{item.text}</p>
              </div>
            )
          })}
        </div>
      </div>

      <DataTable columns={columns} data={rows} rowKey="id" />
    </div>
  )
}
