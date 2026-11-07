import {
  AlertCircle,
  Building2,
  FileCheck2,
  Landmark,
  MailCheck,
  Plus,
  Smartphone,
  WalletCards,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'

const CONFIG = {
  'bank-batch': {
    title: 'Bank Batch',
    subtitle: 'NEFT and RTGS release file prepared from approved supplier payments',
    icon: Landmark,
    primary: 'Export Bank File',
    summary: [
      ['Ready Transfers', 3, 'var(--pos)'],
      ['Batch Value', 1999500, 'var(--primary)'],
      ['Needs Checker', 1, 'var(--warn)'],
    ],
    rows: [
      { id: 'BB-001', party: 'Adani Enterprises Ltd', mode: 'NEFT', amount: 499500, status: 'Ready', next: 'Export in bank format' },
      { id: 'BB-002', party: 'Reliance Industries Ltd', mode: 'RTGS', amount: 1500000, status: 'Released', next: 'Matched with UTR' },
      { id: 'BB-003', party: 'Tata Steel Ltd', mode: 'RTGS', amount: 654250, status: 'Hold', next: 'Resolve ITC approval hold' },
    ],
  },
  'cheque-register': {
    title: 'Cheque Register',
    subtitle: 'Printed, post-dated, and bounced cheque controls for supplier payouts',
    icon: Building2,
    primary: 'Print Cheque',
    summary: [
      ['Post-dated', 1, 'var(--warn)'],
      ['Bounced', 1, 'var(--neg)'],
      ['Print Ready', 1, 'var(--pos)'],
    ],
    rows: [
      { id: 'CHQ-884512', party: 'Asian Paints Ltd', mode: 'Cheque', amount: 200000, status: 'PDC - 07 Jun', next: 'Present on due date' },
      { id: 'CHQ-884488', party: 'L&T Ltd', mode: 'Cheque', amount: 300000, status: 'Bounced', next: 'Retry after signature fix' },
      { id: 'CHQ-DRAFT', party: 'L&T Ltd', mode: 'Cheque', amount: 594000, status: 'Draft', next: 'Verify bank before print' },
    ],
  },
  'upi-queue': {
    title: 'UPI Queue',
    subtitle: 'Small supplier payouts that can be released quickly through UPI',
    icon: Smartphone,
    primary: 'Release UPI',
    summary: [
      ['Ready UPI', 2, 'var(--pos)'],
      ['Queue Value', 312400, 'var(--primary)'],
      ['Advice Pending', 1, 'var(--warn)'],
    ],
    rows: [
      { id: 'UPI-001', party: 'Maruti Suzuki India Ltd', mode: 'UPI', amount: 300000, status: 'GST hold', next: 'Confirm supplier GSTIN' },
      { id: 'UPI-002', party: 'Dispatch Packing Group', mode: 'UPI', amount: 2400, status: 'Ready', next: 'Release and send advice' },
      { id: 'UPI-003', party: 'Warehouse Loading', mode: 'UPI', amount: 10000, status: 'Ready', next: 'Release after attendance check' },
    ],
  },
  'payment-advice': {
    title: 'Payment Advice',
    subtitle: 'WhatsApp, email, and SMS advice with UTR, deductions, and balance',
    icon: MailCheck,
    primary: 'Send Advice',
    summary: [
      ['Draft Advice', 2, 'var(--primary)'],
      ['Sent', 2, 'var(--pos)'],
      ['Blocked', 2, 'var(--neg)'],
    ],
    rows: [
      { id: 'ADV-001', party: 'Adani Enterprises Ltd', mode: 'Email', amount: 499500, status: 'Draft', next: 'Attach deduction breakup' },
      { id: 'ADV-002', party: 'Reliance Industries Ltd', mode: 'WhatsApp', amount: 1500000, status: 'Sent', next: 'No action' },
      { id: 'ADV-003', party: 'Tata Steel Ltd', mode: 'Email', amount: 654250, status: 'Blocked', next: 'Send after hold release' },
    ],
  },
  'review-holds': {
    title: 'Review Holds',
    subtitle: 'Payment holds caused by ITC mismatch, GSTIN issue, bank verification, or approval gaps',
    icon: AlertCircle,
    primary: 'Resolve Hold',
    summary: [
      ['Active Holds', 3, 'var(--neg)'],
      ['Value Held', 1548250, 'var(--warn)'],
      ['Can Release Today', 1, 'var(--pos)'],
    ],
    rows: [
      { id: 'HOLD-001', party: 'Tata Steel Ltd', mode: 'ITC', amount: 654250, status: 'High Risk', next: 'Resolve ITC mismatch' },
      { id: 'HOLD-002', party: 'L&T Ltd', mode: 'Bank', amount: 594000, status: 'KYC Needed', next: 'Verify beneficiary account' },
      { id: 'HOLD-003', party: 'Maruti Suzuki India Ltd', mode: 'GST', amount: 300000, status: 'GSTIN inactive', next: 'Review supplier master' },
    ],
  },
  'new-supplier-payment': {
    title: 'New Supplier Payment',
    subtitle: 'Create a supplier payment with bill allocation, TDS, adjustments, and bank release checks',
    icon: Plus,
    primary: 'Create Payment',
    summary: [
      ['Open Bills', 4, 'var(--warn)'],
      ['Adjustments Found', 1032000, 'var(--primary)'],
      ['Ready Net Pay', 499500, 'var(--pos)'],
    ],
    rows: [
      { id: 'STEP-1', party: 'Select supplier', mode: 'Input', amount: 0, status: 'Ready', next: 'Choose supplier and bill' },
      { id: 'STEP-2', party: 'Apply credits', mode: 'Auto', amount: 1032000, status: 'Suggested', next: 'Review advances, returns, debit notes' },
      { id: 'STEP-3', party: 'Release payment', mode: 'Bank', amount: 499500, status: 'Ready', next: 'Send to checker' },
    ],
  },
  'vendor-portal': {
    title: 'Vendor Portal',
    subtitle: 'Supplier-facing upload, payment status, hold reason, and advice download tracker',
    icon: FileCheck2,
    primary: 'Invite Vendor',
    summary: [
      ['Uploads', 1, 'var(--primary)'],
      ['Status Requests', 1, 'var(--warn)'],
      ['Advice Downloads', 2, 'var(--pos)'],
    ],
    rows: [
      { id: 'VP-001', party: 'Tata Steel Ltd', mode: 'Upload', amount: 750000, status: 'Bill uploaded', next: 'Review ITC mismatch' },
      { id: 'VP-002', party: 'L&T Ltd', mode: 'Status', amount: 594000, status: 'Asked for status', next: 'Share bank verification hold' },
      { id: 'VP-003', party: 'Reliance Industries Ltd', mode: 'Advice', amount: 1500000, status: 'Downloaded', next: 'Closed' },
    ],
  },
}

export default function MoneyOutActionPage({ type = 'bank-batch' }) {
  const config = CONFIG[type] ?? CONFIG['bank-batch']
  const Icon = config.icon
  const total = config.rows.reduce((sum, row) => sum + row.amount, 0)
  const columns = [
    { key: 'id', label: 'Ref', render: v => <span className="font-mono text-xs font-semibold text-[var(--primary)]">{v}</span> },
    { key: 'party', label: 'Party / Step', render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'mode', label: 'Mode', render: v => <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-semibold text-[var(--muted)]">{v}</span> },
    { key: 'amount', label: 'Amount', align: 'right', render: v => <span className="tabular font-semibold">{v ? formatCurrency(v) : '-'}</span> },
    { key: 'status', label: 'Status', render: v => <span className="rounded-full bg-[var(--primary-tint)] px-2 py-0.5 text-xs font-semibold text-[var(--primary)]">{v}</span> },
    { key: 'next', label: 'Next Action', render: v => <span className="text-sm font-medium text-[var(--text)]">{v}</span> },
  ]

  return (
    <div>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        breadcrumb={['Money Out', config.title]}
        action={<Button variant="primary" icon={Icon} size="sm">{config.primary}</Button>}
      />

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        {config.summary.map(([label, value, color]) => (
          <div key={label} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</p>
            <p className="tabular mt-2 text-2xl font-bold" style={{ color }}>{typeof value === 'number' && value > 1000 ? formatCompact(value) : value}</p>
          </div>
        ))}
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Page Total</p>
          <p className="tabular mt-2 text-2xl font-bold text-[var(--text)]">{formatCompact(total)}</p>
        </div>
      </div>

      <div className="mb-5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <WalletCards size={16} className="text-[var(--primary)]" />
          <p className="text-sm font-bold text-[var(--text)]">Action Workbench</p>
        </div>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          This page gives the button a real destination: users can inspect the queue, confirm blockers,
          and understand the next accounting or bank step before posting anything.
        </p>
      </div>

      <DataTable columns={columns} data={config.rows} rowKey="id" />
    </div>
  )
}
