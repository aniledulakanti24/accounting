import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  BadgeIndianRupee,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  FileText,
  Landmark,
  MailCheck,
  PackageCheck,
  ReceiptIndianRupee,
  ShieldCheck,
  Smartphone,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import TrendChart from '../../components/charts/TrendChart'
import DistributionChart from '../../components/charts/DistributionChart'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getAPBills, getAPDebitNotes, getAPPurchaseReturns, getSupplierAdvances } from '../../data/services/payablesService'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

const TODAY = new Date('2026-06-02')
const BANK_BALANCE = 7280000
const UPCOMING_RECEIPTS = 1240000
const UPCOMING_TAX_PAYROLL = 2310000
const PAY_RUN_TREND = [
  { label: 'W1', payable: 820000, release: 610000, holds: 210000 },
  { label: 'W2', payable: 1220000, release: 760000, holds: 460000 },
  { label: 'W3', payable: 940000, release: 720000, holds: 220000 },
  { label: 'W4', payable: 2150000, release: 499500, holds: 1650500 },
]

const STATUS_CFG = {
  paid:    { bg: 'bg-[var(--pos-tint)]',     text: 'text-[var(--pos)]',     label: 'Paid' },
  partial: { bg: 'bg-[var(--primary-tint)]', text: 'text-[var(--primary)]', label: 'Part Paid' },
  unpaid:  { bg: 'bg-[var(--warn-tint)]',    text: 'text-[var(--warn)]',    label: 'To Pay' },
  overdue: { bg: 'bg-[var(--neg-tint)]',     text: 'text-[var(--neg)]',     label: 'Overdue' },
}

const RISK_CFG = {
  high:   { bg: 'bg-[var(--neg-tint)]',  text: 'text-[var(--neg)]',  label: 'High' },
  medium: { bg: 'bg-[var(--warn-tint)]', text: 'text-[var(--warn)]', label: 'Medium' },
  low:    { bg: 'bg-[var(--pos-tint)]',  text: 'text-[var(--pos)]',  label: 'Low' },
}

function daysFromNow(dateText) {
  const due = new Date(dateText)
  return Math.ceil((due.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24))
}

function DueLabel({ dueDate }) {
  const days = daysFromNow(dueDate)
  if (days < 0) return <span className="font-semibold text-[var(--neg)]">{Math.abs(days)}d overdue</span>
  if (days === 0) return <span className="font-semibold text-[var(--warn)]">Due today</span>
  if (days <= 7) return <span className="font-semibold text-[var(--warn)]">Due in {days}d</span>
  return <span className="text-[var(--muted)]">Due in {days}d</span>
}

function Chip({ cfg, fallback }) {
  const c = cfg ?? { bg: 'bg-[var(--surface-2)]', text: 'text-[var(--muted)]', label: fallback }
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${c.bg} ${c.text}`}>{c.label}</span>
}

function SummaryTile({ label, value, hint, icon: Icon, tone = 'text' }) {
  const colors = { primary: 'var(--primary)', pos: 'var(--pos)', warn: 'var(--warn)', neg: 'var(--neg)', text: 'var(--text)' }
  const color = colors[tone] ?? colors.text
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</p>
        <Icon size={15} style={{ color }} />
      </div>
      <p className="tabular text-2xl font-bold leading-none" style={{ color }}>{value}</p>
      {hint && <p className="mt-2 truncate text-[11px] text-[var(--faint)]">{hint}</p>}
    </div>
  )
}

function ActionCard({ title, text, amount, icon: Icon, tone, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[116px] items-start justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-sm transition-all hover:-translate-y-px hover:border-[var(--primary)] hover:shadow-md"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)]" style={{ color: tone }}>
          <Icon size={19} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--text)]">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{text}</p>
          <p className="mt-2 tabular text-sm font-bold" style={{ color: tone }}>{amount}</p>
        </div>
      </div>
      <ArrowRight size={15} className="mt-1 shrink-0 text-[var(--faint)] transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

function SignalRow({ label, value, status = 'ok' }) {
  const color = status === 'bad' ? 'var(--neg)' : status === 'warn' ? 'var(--warn)' : 'var(--pos)'
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-3 py-2">
      <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
      <span className="text-right text-xs font-bold" style={{ color }}>{value}</span>
    </div>
  )
}

function BillDrawer({ bill, onClose, onOpenAction, countryConfig, countryCode }) {
  if (!bill) return null
  const adjustment = bill.advanceAvailable + bill.debitAvailable + bill.returnAvailable
  const taxIdLabel = countryConfig?.taxIdLabel || 'Tax ID'
  const taxSystem = countryConfig?.taxSystem || 'Tax'
  return (
    <div className="fixed inset-0 z-[900] flex justify-end bg-black/20" onClick={onClose}>
      <aside
        className="h-full w-full max-w-xl overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-semibold text-[var(--primary)]">{bill.ref}</p>
            <h2 className="mt-1 text-xl font-bold text-[var(--text)]">{bill.supplier}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Bill-wise payment allocation and release checks</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-[var(--radius-sm)] p-2 text-[var(--muted)] hover:bg-[var(--surface-2)]">
            <X size={16} />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <SummaryTile label="Bill Balance" value={formatCompact(bill.balance)} icon={BadgeIndianRupee} tone="neg" />
          <SummaryTile label="Net Payable" value={formatCompact(bill.netPayable)} icon={CreditCard} tone={bill.holdReason ? 'warn' : 'pos'} />
        </div>

        <div className="mb-4 rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Auto Adjustment</p>
          <div className="space-y-2">
            <SignalRow label="Supplier advance available" value={formatCurrency(bill.advanceAvailable)} />
            <SignalRow label="Debit note available" value={formatCurrency(bill.debitAvailable)} />
            <SignalRow label="Purchase return credit" value={formatCurrency(bill.returnAvailable)} />
            <SignalRow label="Statutory deduction" value={`${bill.tdsSection} - ${formatCurrency(bill.tdsAmount)}`} status={bill.tdsAmount ? 'warn' : 'ok'} />
            <SignalRow label="Total reduction before pay" value={formatCurrency(adjustment + bill.tdsAmount)} status="warn" />
          </div>
        </div>

        <div className="mb-4 rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Payment Safety Checks</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <SignalRow label={`${taxIdLabel} status`} value={bill.gstStatus} status={bill.gstStatus === 'Active' ? 'ok' : 'bad'} />
            <SignalRow label={`${countryCode === 'IN' ? 'ITC' : taxSystem} compliance`} value={bill.itcRisk} status={bill.itcRisk === 'high' ? 'bad' : bill.itcRisk === 'medium' ? 'warn' : 'ok'} />
            <SignalRow label="Approval" value={bill.approval} status={bill.approval === 'approved' ? 'ok' : 'warn'} />
            <SignalRow label="Bank account" value={bill.bankVerified ? 'Verified' : 'Needs verification'} status={bill.bankVerified ? 'ok' : 'bad'} />
            <SignalRow label="Duplicate payment" value="No duplicate found" />
            <SignalRow label="Safe to pay score" value={`${bill.safeToPay}/100`} status={bill.safeToPay < 60 ? 'bad' : bill.safeToPay < 80 ? 'warn' : 'ok'} />
          </div>
          {bill.holdReason && <p className="mt-3 rounded-[var(--radius-sm)] bg-[var(--neg-tint)] px-3 py-2 text-xs font-semibold text-[var(--neg)]">{bill.holdReason}</p>}
        </div>

        <div className="mb-4 rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Vendor Portal and Advice</p>
          <div className="space-y-2">
            <SignalRow label="Portal status" value={bill.portalStatus} status={bill.portalStatus.includes('asked') ? 'warn' : 'ok'} />
            <SignalRow label="Payment advice" value={bill.paymentAdvice} status={bill.paymentAdvice === 'blocked' ? 'bad' : bill.paymentAdvice === 'draft' ? 'warn' : 'ok'} />
            <SignalRow label="Bank release" value={bill.bankStatus} status={bill.bankStatus === 'Blocked' || bill.bankStatus === 'Hold' ? 'bad' : bill.bankStatus.includes('needed') ? 'warn' : 'ok'} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={WalletCards} size="sm" onClick={() => onOpenAction('/payables/bank-batch')}>Add to Pay Run</Button>
          <Button variant="secondary" icon={MailCheck} size="sm" onClick={() => onOpenAction('/payables/payment-advice')}>Send Advice</Button>
          <Button variant="secondary" icon={FileCheck2} size="sm" onClick={() => onOpenAction('/payables/vendor-portal')}>Portal</Button>
        </div>
      </aside>
    </div>
  )
}

export default function Bills() {
  const navigate = useNavigate()
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  const [bills, setBills] = useState([])
  const [advances, setAdvances] = useState([])
  const [debitNotes, setDebitNotes] = useState([])
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [queueFilter, setQueueFilter] = useState('needs-action')
  const [selectedBill, setSelectedBill] = useState(null)

  useEffect(() => {
    Promise.all([getAPBills(), getSupplierAdvances(), getAPDebitNotes(), getAPPurchaseReturns()])
      .then(([billRows, advanceRows, noteRows, returnRows]) => {
        setBills(billRows)
        setAdvances(advanceRows)
        setDebitNotes(noteRows)
        setReturns(returnRows)
        setLoading(false)
      })
  }, [])

  const openBills = bills.filter(bill => bill.status !== 'paid')
  const overdueBills = openBills.filter(bill => bill.status === 'overdue' || daysFromNow(bill.dueDate) < 0)
  const dueSoonBills = openBills.filter(bill => daysFromNow(bill.dueDate) >= 0 && daysFromNow(bill.dueDate) <= 7)
  const totalOutstanding = openBills.reduce((sum, bill) => sum + bill.balance, 0)
  const overdueAmount = overdueBills.reduce((sum, bill) => sum + bill.balance, 0)
  const openAdvanceAmount = advances.filter(advance => advance.status === 'open').reduce((sum, advance) => sum + advance.amount, 0)
  const openDebitAmount = debitNotes.filter(note => note.status === 'open').reduce((sum, note) => sum + note.amount, 0)
  const pendingReturnAmount = returns.filter(item => item.status === 'pending' || item.status === 'approved').reduce((sum, item) => sum + item.amount, 0)
  const adjustmentAmount = openAdvanceAmount + openDebitAmount + pendingReturnAmount

  const readyBills = openBills.filter(bill => !bill.holdReason && bill.approval === 'approved' && bill.safeToPay >= 80)
  const heldBills = openBills.filter(bill => bill.holdReason || bill.approval !== 'approved' || bill.safeToPay < 80)
  const smartPayTotal = readyBills.reduce((sum, bill) => sum + bill.netPayable, 0)
  const cashAfterRun = BANK_BALANCE + UPCOMING_RECEIPTS - UPCOMING_TAX_PAYROLL - smartPayTotal

  const filtered = openBills.filter(bill => {
    const haystack = `${bill.ref} ${bill.supplier} ${bill.nextAction} ${bill.paymentMode} ${bill.portalStatus}`.toLowerCase()
    const matchSearch = !search || haystack.includes(search.toLowerCase())
    const matchQueue =
      queueFilter === 'all'
      || (queueFilter === 'needs-action' && bill.status !== 'paid')
      || (queueFilter === 'ready' && readyBills.some(item => item.id === bill.id))
      || (queueFilter === 'overdue' && (bill.status === 'overdue' || daysFromNow(bill.dueDate) < 0))
      || (queueFilter === 'due-soon' && daysFromNow(bill.dueDate) >= 0 && daysFromNow(bill.dueDate) <= 7)
      || (queueFilter === 'hold' && heldBills.some(item => item.id === bill.id))
      || (queueFilter === 'itc-risk' && bill.itcRisk === 'high')
      || (queueFilter === 'portal' && bill.portalStatus)
    return matchSearch && matchQueue
  })

  const columns = [
    { key: 'ref', label: 'Bill', render: (_, row) => (
      <div>
        <span className="font-mono text-xs font-semibold text-[var(--primary)]">{row.ref}</span>
        <p className="mt-0.5 text-[11px] text-[var(--faint)]">{row.date}</p>
      </div>
    ) },
    { key: 'supplier', label: 'Supplier', sortable: true, render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'dueDate', label: 'Due', render: v => <DueLabel dueDate={v} /> },
    { key: 'balance', label: 'Balance', align: 'right', sortable: true, sum: true, render: v => <span className="tabular text-sm font-bold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'netPayable', label: 'Net Pay', align: 'right', sortable: true, sum: true, render: v => <span className="tabular text-sm font-bold text-[var(--primary)]">{formatCurrency(v)}</span> },
    { key: 'status', label: 'Status', render: v => <Chip cfg={STATUS_CFG[v]} fallback={v} /> },
    { key: 'itcRisk', label: 'ITC Risk', render: v => <Chip cfg={RISK_CFG[v]} fallback={v} /> },
    { key: 'safeToPay', label: 'Safety', render: v => <Chip cfg={v >= 80 ? RISK_CFG.low : v >= 60 ? RISK_CFG.medium : RISK_CFG.high} fallback={`${v}/100`} /> },
    { key: 'nextAction', label: 'Next Action', render: (_, row) => (
      <div className="max-w-[240px]">
        <p className="text-sm font-medium text-[var(--text)]">{row.nextAction}</p>
        {row.holdReason && <p className="mt-0.5 text-[11px] text-[var(--neg)]">{row.holdReason}</p>}
      </div>
    ) },
    { key: '_action', label: 'Action', render: (_, row) => (
      <Button variant={row.holdReason ? 'secondary' : 'primary'} size="sm" icon={WalletCards} onClick={event => { event.stopPropagation(); setSelectedBill(row) }}>
        Review
      </Button>
    ) },
  ]

  const bulkActions = [
    { label: 'Smart Pay Run', icon: WalletCards, onClick: () => navigate('/payables/bank-batch') },
    { label: 'Send Advice', icon: MailCheck, onClick: () => navigate('/payables/payment-advice') },
  ]

  return (
    <div>
      <PageHeader
        title="Money Out"
        subtitle="One quiet command center for supplier bills, adjustments, compliance, bank release, labour, payroll, and vendor status"
        breadcrumb={['Money Out', 'Pay Center']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={FileText} size="sm" onClick={() => navigate('/payables/ageing')}>Ageing</Button>
            <Button variant="primary" icon={CreditCard} size="sm" onClick={() => navigate('/payables/payments')}>Pay Supplier</Button>
          </div>
        }
      />

      <div className="mb-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-tint)] text-[var(--primary)]">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--text)]">Smart pay run: release {formatCompact(smartPayTotal)}, hold {heldBills.length} bill(s) for checks.</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {overdueBills.length} overdue and {dueSoonBills.length} due soon. Auto-adjust {formatCompact(adjustmentAmount)} through advances, debit notes, returns, and TDS before any bank release.
              </p>
            </div>
          </div>
          <div className="grid min-w-full grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[560px]">
            <SignalRow label="Bank balance" value={formatCompact(BANK_BALANCE)} />
            <SignalRow label="After pay run" value={formatCompact(cashAfterRun)} status={cashAfterRun < 2500000 ? 'warn' : 'ok'} />
            <SignalRow label="Tax/payroll due" value={formatCompact(UPCOMING_TAX_PAYROLL)} status="warn" />
            <SignalRow label="Bank file" value="NEFT/RTGS ready" />
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="Outstanding" value={formatCompact(totalOutstanding)} hint={`${openBills.length} unpaid supplier bills`} icon={BadgeIndianRupee} tone="neg" />
        <SummaryTile label="Overdue" value={formatCompact(overdueAmount)} hint={`${overdueBills.length} bills past due`} icon={Clock3} tone="warn" />
        <SummaryTile label="Adjust Before Pay" value={formatCompact(adjustmentAmount)} hint="Advances, debit notes, returns" icon={ReceiptIndianRupee} tone="primary" />
        <SummaryTile label="Ready To Release" value={formatCompact(smartPayTotal)} hint={`${readyBills.length} clean payments`} icon={CheckCircle2} tone="pos" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Pay Run Trend</p>
              <p className="mt-1 text-xs text-[var(--faint)]">What can be released versus what should stay on hold</p>
            </div>
            <span className="rounded-full bg-[var(--primary-tint)] px-2 py-1 text-xs font-semibold text-[var(--primary)]">4 weeks</span>
          </div>
          <TrendChart
            type="bar"
            height={210}
            data={PAY_RUN_TREND}
            series={[
              { key: 'release', label: 'Release', color: '#16a34a' },
              { key: 'holds', label: 'Hold', color: '#e11d48' },
            ]}
          />
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Money Out Mix</p>
            <p className="mt-1 text-xs text-[var(--faint)]">Supplier, labour, payroll, and adjustments in one view</p>
          </div>
          <DistributionChart
            height={210}
            innerRadius={46}
            outerRadius={78}
            data={[
              { name: 'Supplier Pay', value: Math.max(smartPayTotal, 1) },
              { name: 'Payroll', value: 1840000 },
              { name: 'Labour', value: 13200 },
              { name: 'Adjustments', value: adjustmentAmount },
            ]}
          />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <ActionCard
            title="Supplier Bills"
            text="Bill-wise pay run with TDS, adjustments, and payment advice."
            amount={formatCurrency(smartPayTotal)}
            icon={CreditCard}
            tone="var(--primary)"
            onClick={() => navigate('/payables/payments')}
          />
          <ActionCard
            title="Labour Payments"
            text="Daily wage, contractor, site, cash-limit, and approval tracking."
            amount={formatCurrency(13200)}
            icon={UsersRound}
            tone="var(--warn)"
            onClick={() => navigate('/payables/labour-payments')}
          />
          <ActionCard
            title="Payroll"
            text="Salary batches separated from vendors with bank release control."
            amount={formatCurrency(1840000)}
            icon={Banknote}
            tone="var(--pos)"
            onClick={() => navigate('/payables/payroll-requests')}
          />
        </div>

        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Release Readiness</p>
            <span className="text-xs font-semibold text-[var(--pos)]">Actionable</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <SignalRow label="Allocation" value="Bill-wise" />
            <SignalRow label="Vendor status" value="Portal-lite" />
            <SignalRow label="Advice" value="Ready to send" />
            <SignalRow label="Compliance" value={`Withholding + ${countryConfig.taxSystem}`} />
            <SignalRow label="Banking" value="NEFT, cheque, UPI" />
            <SignalRow label="Cash planning" value="Safe-to-pay" />
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Bank Release</p>
          <div className="space-y-2">
            <SignalRow label="NEFT/RTGS batch" value={`${readyBills.length} ready`} />
            <SignalRow label="Cheque printing" value="1 needs bank check" status="warn" />
            <SignalRow label="Post-dated cheques" value="Register available" />
            <SignalRow label="Bounced retry" value="1 exception" status="bad" />
          </div>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Vendor Portal-Lite</p>
          <div className="space-y-2">
            <SignalRow label="Supplier uploads" value="1 bill uploaded" />
            <SignalRow label="Status requests" value="1 supplier waiting" status="warn" />
            <SignalRow label="Advice downloads" value="2 sent" />
            <SignalRow label="Rejected/hold reasons" value={`${heldBills.length} visible`} status="warn" />
          </div>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Release Channels</p>
          <div className="grid grid-cols-2 gap-2">
            <SignalRow label="RTGS" value="High value" />
            <SignalRow label="NEFT" value="Batch file" />
            <SignalRow label="Cheque" value="Print/PDC" status="warn" />
            <SignalRow label="UPI" value="Quick pay" />
            <SignalRow label="WhatsApp" value="Advice" />
            <SignalRow label="Email/SMS" value="Advice" />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        selectable
        bulkActions={bulkActions}
        showTotals
        onRowClick={row => setSelectedBill(row)}
        rowClassName={row => row.holdReason ? 'bg-[var(--neg-tint)]/20' : ''}
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder="Search supplier, bill, portal status or action...">
            <select value={queueFilter} onChange={e => setQueueFilter(e.target.value)} className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none">
              <option value="needs-action">Needs Action</option>
              <option value="ready">Ready To Pay</option>
              <option value="overdue">Overdue</option>
              <option value="due-soon">Due Soon</option>
              <option value="hold">On Hold</option>
              <option value="itc-risk">ITC Risk</option>
              <option value="portal">Vendor Portal</option>
              <option value="all">All Open Bills</option>
            </select>
          </Filters>
        }
      />

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" icon={Landmark} size="sm" onClick={() => navigate('/payables/bank-batch')}>Bank Batch</Button>
        <Button variant="secondary" icon={FileCheck2} size="sm" onClick={() => navigate('/payables/cheque-register')}>Cheque Register</Button>
        <Button variant="secondary" icon={Smartphone} size="sm" onClick={() => navigate('/payables/upi-queue')}>UPI Queue</Button>
        <Button variant="secondary" icon={MailCheck} size="sm" onClick={() => navigate('/payables/payment-advice')}>Bulk Advice</Button>
        <Button variant="secondary" icon={PackageCheck} size="sm" onClick={() => navigate('/payables/adjustments')}>Adjustments</Button>
        <Button variant="secondary" icon={AlertCircle} size="sm" onClick={() => navigate('/payables/review-holds')}>Review Holds</Button>
      </div>

      <BillDrawer
        bill={selectedBill}
        onClose={() => setSelectedBill(null)}
        onOpenAction={path => navigate(path)}
        countryConfig={countryConfig}
        countryCode={countryCode}
      />
    </div>
  )
}
