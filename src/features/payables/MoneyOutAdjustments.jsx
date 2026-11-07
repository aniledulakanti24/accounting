import { useEffect, useState } from 'react'
import { Link2, PackageCheck, ReceiptIndianRupee, ShieldCheck } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getAPDebitNotes, getAPPurchaseReturns, getSupplierAdvances } from '../../data/services/payablesService'

function typeStyle(type) {
  if (type === 'Advance') return 'bg-[var(--primary-tint)] text-[var(--primary)]'
  if (type === 'Correction') return 'bg-[var(--warn-tint)] text-[var(--warn)]'
  return 'bg-[var(--pos-tint)] text-[var(--pos)]'
}

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

export default function MoneyOutAdjustments() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getSupplierAdvances(), getAPDebitNotes(), getAPPurchaseReturns()]).then(([advances, notes, returns]) => {
      setRows([
        ...advances.map(row => ({
          id: row.id,
          ref: row.ref,
          type: 'Advance',
          date: row.date,
          supplier: row.supplier,
          source: row.purpose,
          amount: row.status === 'open' ? row.amount : 0,
          originalAmount: row.amount,
          status: row.status,
          action: row.status === 'open' ? 'Adjust before payment' : 'Closed',
        })),
        ...notes.map(row => ({
          id: row.id,
          ref: row.ref,
          type: 'Correction',
          date: row.date,
          supplier: row.supplier,
          source: row.reason,
          amount: row.status === 'open' ? row.amount : 0,
          originalAmount: row.amount,
          status: row.status,
          action: row.status === 'open' ? 'Reduce supplier payout' : 'Already adjusted',
        })),
        ...returns.map(row => ({
          id: row.id,
          ref: row.ref,
          type: 'Return',
          date: row.date,
          supplier: row.supplier,
          source: row.reason,
          amount: row.status === 'approved' ? row.amount : 0,
          originalAmount: row.amount,
          status: row.status,
          action: row.status === 'approved' ? 'Convert to deduction' : 'Wait for approval',
        })),
      ])
      setLoading(false)
    })
  }, [])

  const openValue = rows.reduce((sum, row) => sum + row.amount, 0)
  const advanceValue = rows.filter(row => row.type === 'Advance').reduce((sum, row) => sum + row.amount, 0)
  const correctionValue = rows.filter(row => row.type === 'Correction').reduce((sum, row) => sum + row.amount, 0)
  const returnValue = rows.filter(row => row.type === 'Return').reduce((sum, row) => sum + row.amount, 0)
  const max = Math.max(advanceValue, correctionValue, returnValue, 1)

  const columns = [
    { key: 'ref', label: 'Ref', render: v => <span className="font-mono text-xs font-semibold text-[var(--primary)]">{v}</span> },
    { key: 'type', label: 'Type', render: v => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${typeStyle(v)}`}>{v}</span> },
    { key: 'supplier', label: 'Supplier', sortable: true, render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'source', label: 'Reason / Source', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'originalAmount', label: 'Original', align: 'right', render: v => <span className="tabular text-sm">{formatCurrency(v)}</span> },
    { key: 'amount', label: 'Available', align: 'right', sortable: true, render: v => <span className="tabular font-semibold text-[var(--primary)]">{formatCurrency(v)}</span> },
    { key: 'action', label: 'Pay Center Action', render: v => <span className="text-sm font-medium text-[var(--text)]">{v}</span> },
    { key: 'status', label: 'Status', render: v => <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-semibold text-[var(--muted)]">{v}</span> },
  ]

  return (
    <div>
      <PageHeader
        title="Adjustments"
        subtitle="Advances, debit notes, and returns merged into one payment-reduction page"
        breadcrumb={['Money Out', 'Adjustments']}
        action={<Button variant="primary" icon={ReceiptIndianRupee} size="sm">Apply Adjustments</Button>}
      />

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Available To Reduce Pay</p>
          <p className="tabular mt-2 text-2xl font-bold text-[var(--primary)]">{formatCompact(openValue)}</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Advances</p>
          <p className="tabular mt-2 text-2xl font-bold text-[var(--primary)]">{formatCompact(advanceValue)}</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Corrections</p>
          <p className="tabular mt-2 text-2xl font-bold text-[var(--warn)]">{formatCompact(correctionValue)}</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Returns</p>
          <p className="tabular mt-2 text-2xl font-bold text-[var(--pos)]">{formatCompact(returnValue)}</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Reduction Mix</p>
          <div className="space-y-3">
            <MiniBar label="Advances" value={advanceValue} max={max} color="var(--primary)" />
            <MiniBar label="Corrections" value={correctionValue} max={max} color="var(--warn)" />
            <MiniBar label="Returns" value={returnValue} max={max} color="var(--pos)" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { icon: Link2, title: 'One allocation queue', text: 'Users no longer switch tabs to find deductions.' },
            { icon: PackageCheck, title: 'Return to deduction', text: 'Approved returns flow into payment reduction.' },
            { icon: ShieldCheck, title: 'Before-bank safety', text: 'Open credits are visible before any payout leaves bank.' },
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

      <DataTable columns={columns} data={rows} loading={loading} rowKey="id" />
    </div>
  )
}
