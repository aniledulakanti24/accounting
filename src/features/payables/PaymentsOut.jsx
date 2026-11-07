import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Download,
  FileCheck2,
  Landmark,
  MailCheck,
  Plus,
  Printer,
  RotateCcw,
  Send,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import TrendChart from '../../components/charts/TrendChart'
import DistributionChart from '../../components/charts/DistributionChart'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getAPPayments } from '../../data/services/payablesService'

const MODE_COLORS = {
  RTGS:   'bg-[var(--primary-tint)] text-[var(--primary)]',
  NEFT:   'bg-[var(--primary-tint)] text-[var(--primary)]',
  Cheque: 'bg-[var(--warn-tint)] text-[var(--warn)]',
  UPI:    'bg-[var(--pos-tint)] text-[var(--pos)]',
  Cash:   'bg-[var(--surface-2)] text-[var(--muted)]',
}

const STATUS_CFG = {
  cleared: { icon: CheckCircle2, bg:'bg-[var(--pos-tint)]', text:'text-[var(--pos)]', label:'Cleared' },
  pending: { icon: Send,         bg:'bg-[var(--primary-tint)]', text:'text-[var(--primary)]', label:'Pending' },
  bounced: { icon: AlertCircle,  bg:'bg-[var(--neg-tint)]', text:'text-[var(--neg)]', label:'Bounced' },
}

const ADVICE_CFG = {
  sent:      { bg:'bg-[var(--pos-tint)]', text:'text-[var(--pos)]', label:'Sent' },
  scheduled: { bg:'bg-[var(--primary-tint)]', text:'text-[var(--primary)]', label:'Scheduled' },
  blocked:   { bg:'bg-[var(--neg-tint)]', text:'text-[var(--neg)]', label:'Blocked' },
}

const PAYMENT_CLEARING_TREND = [
  { label: 'Mon', cleared: 420000, pending: 180000, bounced: 0 },
  { label: 'Tue', cleared: 680000, pending: 120000, bounced: 0 },
  { label: 'Wed', cleared: 530000, pending: 260000, bounced: 300000 },
  { label: 'Thu', cleared: 940000, pending: 200000, bounced: 0 },
  { label: 'Fri', cleared: 425000, pending: 240000, bounced: 0 },
]

function Metric({ label, value, icon: Icon, tone = 'text', hint }) {
  const color = tone === 'pos' ? 'var(--pos)' : tone === 'neg' ? 'var(--neg)' : tone === 'warn' ? 'var(--warn)' : tone === 'primary' ? 'var(--primary)' : 'var(--text)'
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</p>
        <Icon size={15} style={{ color }} />
      </div>
      <p className="tabular text-xl font-bold" style={{ color }}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-[var(--faint)]">{hint}</p>}
    </div>
  )
}

function Badge({ children, className }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>{children}</span>
}

function ReleaseCard({ title, value, icon: Icon, text, tone, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[104px] items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-sm transition-all hover:-translate-y-px hover:border-[var(--primary)] hover:shadow-md"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)]" style={{ color: tone }}>
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-[var(--text)]">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">{text}</span>
        <span className="mt-2 block tabular text-sm font-bold" style={{ color: tone }}>{value}</span>
      </span>
    </button>
  )
}

export default function PaymentsOut() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modeFilter, setMode] = useState('All')
  const [statusFilter, setStatus] = useState('All')

  useEffect(() => { getAPPayments().then(d => { setPayments(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => payments.filter(p => {
    const text = `${p.supplier} ${p.ref} ${p.invoice} ${p.utr} ${p.bankStatus}`.toLowerCase()
    const matchSearch = !search || text.includes(search.toLowerCase())
    const matchMode = modeFilter === 'All' || p.mode === modeFilter
    const matchStatus =
      statusFilter === 'All'
      || p.status === statusFilter
      || (statusFilter === 'unmatched' && p.reconciliation !== 'matched')
      || (statusFilter === 'advice' && p.advice !== 'sent')
      || (statusFilter === 'blocked' && p.approval === 'blocked')
    return matchSearch && matchMode && matchStatus
  }), [payments, search, modeFilter, statusFilter])

  const totalPaid = payments.filter(p => p.status === 'cleared').reduce((sum, item) => sum + item.amount, 0)
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, item) => sum + item.amount, 0)
  const bounced = payments.filter(p => p.status === 'bounced').length
  const tdsTotal = payments.reduce((sum, item) => sum + item.tdsAmount, 0)
  const unmatched = payments.filter(p => p.reconciliation !== 'matched').length
  const advicePending = payments.filter(p => p.advice !== 'sent').length

  const columns = [
    { key:'ref', label:'Payment', sortable:true, render: (_, row) => (
      <div>
        <span className="font-mono text-xs font-semibold text-[var(--primary)]">{row.ref}</span>
        <p className="mt-0.5 text-[11px] text-[var(--faint)]">{row.date}</p>
      </div>
    ) },
    { key:'supplier', label:'Supplier', sortable:true, render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key:'invoice', label:'Against', render: v => <span className="font-mono text-xs text-[var(--faint)]">{v}</span> },
    { key:'amount', label:'Amount', align:'right', sortable:true, sum:true, render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key:'tdsAmount', label:'TDS', align:'right', sortable:true, sum:true, render: v => <span className="tabular text-sm font-semibold text-[var(--warn)]">{v ? formatCurrency(v) : '-'}</span> },
    { key:'mode', label:'Mode', render: v => <Badge className={MODE_COLORS[v] ?? 'bg-[var(--surface-2)] text-[var(--muted)]'}>{v}</Badge> },
    { key:'status', label:'Bank Status', render: (_, row) => {
      const c = STATUS_CFG[row.status] ?? STATUS_CFG.pending
      const Icon = c.icon
      return (
        <div>
          <Badge className={`${c.bg} ${c.text}`}><Icon size={10} className="mr-1" />{c.label}</Badge>
          <p className="mt-1 text-[11px] text-[var(--faint)]">{row.bankStatus}</p>
        </div>
      )
    } },
    { key:'approval', label:'Maker Checker', render: (_, row) => (
      <div>
        <Badge className={row.approval === 'released' ? 'bg-[var(--pos-tint)] text-[var(--pos)]' : 'bg-[var(--neg-tint)] text-[var(--neg)]'}>
          <ShieldCheck size={10} className="mr-1" />{row.approval}
        </Badge>
        <p className="mt-1 text-[11px] text-[var(--faint)]">{row.maker} to {row.checker}</p>
      </div>
    ) },
    { key:'advice', label:'Advice', render: v => {
      const c = ADVICE_CFG[v] ?? ADVICE_CFG.scheduled
      return <Badge className={`${c.bg} ${c.text}`}>{c.label}</Badge>
    } },
    { key:'_action', label:'Action', render: (_, row) => (
      <div className="flex justify-end gap-2">
        <Button
          variant={row.status === 'bounced' || row.approval === 'blocked' ? 'danger' : 'secondary'}
          size="sm"
          icon={row.status === 'bounced' ? RotateCcw : Send}
          onClick={event => {
            event.stopPropagation()
            navigate(row.status === 'bounced' ? '/payables/review-holds' : '/payables/bank-batch')
          }}
        >
          {row.status === 'bounced' ? 'Retry' : 'Track'}
        </Button>
      </div>
    ) },
  ]

  const bulkActions = [
    { label: 'Export Bank File', icon: Landmark, onClick: () => navigate('/payables/bank-batch') },
    { label: 'Send Advice', icon: MailCheck, onClick: () => navigate('/payables/payment-advice') },
    { label: 'Reconcile', icon: FileCheck2, onClick: () => navigate('/payables/bank-release') },
  ]

  return (
    <div>
      <PageHeader
        title="Pay Supplier"
        subtitle="Supplier payment release, bank matching, TDS, cheque/PDC, bounced retry, and payment advice"
        breadcrumb={['Money Out', 'Pay Supplier']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">Export</Button>
            <Button variant="primary" icon={Plus} size="sm" onClick={() => navigate('/payables/new-supplier-payment')}>New Supplier Payment</Button>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Cleared Paid" value={formatCompact(totalPaid)} icon={CheckCircle2} tone="pos" />
        <Metric label="Pending Bank" value={formatCompact(pendingAmount)} icon={Send} tone="primary" />
        <Metric label="Bounced" value={bounced} icon={AlertCircle} tone="neg" />
        <Metric label="TDS Deducted" value={formatCompact(tdsTotal)} icon={ShieldCheck} tone="warn" />
        <Metric label="Unmatched" value={unmatched} icon={FileCheck2} tone={unmatched ? 'warn' : 'pos'} hint="Bank reconciliation" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Bank Clearing Trend</p>
            <p className="mt-1 text-xs text-[var(--faint)]">Cleared, pending, and bounced outflows by day</p>
          </div>
          <TrendChart
            type="bar"
            height={210}
            data={PAYMENT_CLEARING_TREND}
            series={[
              { key: 'cleared', label: 'Cleared', color: '#16a34a' },
              { key: 'pending', label: 'Pending', color: '#5b5bef' },
              { key: 'bounced', label: 'Bounced', color: '#e11d48' },
            ]}
          />
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Payment Mode Mix</p>
            <p className="mt-1 text-xs text-[var(--faint)]">How supplier payments are leaving the bank</p>
          </div>
          <DistributionChart
            height={210}
            innerRadius={46}
            outerRadius={78}
            data={['RTGS', 'NEFT', 'Cheque', 'UPI', 'Cash'].map(mode => ({
              name: mode,
              value: payments.filter(item => item.mode === mode).reduce((sum, item) => sum + item.amount, 0),
            })).filter(item => item.value > 0)}
          />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ReleaseCard
          title="NEFT/RTGS Batch"
          text="Export bank-ready file with maker-checker approval and UTR tracking."
          value="3 bank transfers"
          icon={Landmark}
          tone="var(--primary)"
          onClick={() => navigate('/payables/bank-batch')}
        />
        <ReleaseCard
          title="Cheque and PDC"
          text="Print cheques, maintain post-dated cheque register, and retry bounced cheques."
          value="1 PDC, 1 bounced"
          icon={Printer}
          tone="var(--warn)"
          onClick={() => navigate('/payables/cheque-register')}
        />
        <ReleaseCard
          title="UPI Payouts"
          text="Fast supplier payout queue for small payments with advice sharing."
          value="UPI ready"
          icon={Smartphone}
          tone="var(--pos)"
          onClick={() => navigate('/payables/upi-queue')}
        />
        <ReleaseCard
          title="Payment Advice"
          text="Share invoice list, deductions, UTR, and balance by WhatsApp, email, or SMS."
          value={`${advicePending} pending`}
          icon={MailCheck}
          tone="var(--primary)"
          onClick={() => navigate('/payables/payment-advice')}
        />
      </div>

      <div className="mb-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-tint)] text-[var(--primary)]">
              <WalletCards size={17} />
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--text)]">Bank release control</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Every payment shows maker, checker, UTR, bank status, and reconciliation state.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--warn-tint)] text-[var(--warn)]">
              <ShieldCheck size={17} />
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--text)]">TDS-safe vendor payment</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Deductions are visible beside the payment, ready for challan and certificate tracking.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-tint)] text-[var(--pos)]">
              <Banknote size={17} />
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--text)]">Outgoing reconciliation</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Matched, unmatched, exception, and bounced statuses are searchable and actionable.</p>
            </div>
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
        toolbar={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Filters search={search} onSearchChange={setSearch} placeholder="Search supplier, ref, invoice, UTR or bank status...">
              <select value={modeFilter} onChange={e => setMode(e.target.value)} className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none">
                <option value="All">All Modes</option>
                <option value="RTGS">RTGS</option>
                <option value="NEFT">NEFT</option>
                <option value="Cheque">Cheque</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
              </select>
              <select value={statusFilter} onChange={e => setStatus(e.target.value)} className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none">
                <option value="All">All Status</option>
                <option value="cleared">Cleared</option>
                <option value="pending">Pending Bank</option>
                <option value="bounced">Bounced</option>
                <option value="blocked">Blocked</option>
                <option value="unmatched">Unmatched</option>
                <option value="advice">Advice Pending</option>
              </select>
            </Filters>
          </div>
        }
      />
    </div>
  )
}
