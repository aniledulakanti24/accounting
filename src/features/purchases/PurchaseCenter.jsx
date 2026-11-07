import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, CircleDollarSign, Clock3, FileSearch, IndianRupee, PackageCheck, ReceiptText, ShieldCheck, Truck, WalletCards } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Button from '../../components/ui/Button'
import DistributionChart from '../../components/charts/DistributionChart'
import { formatCompact, formatCurrency } from '../../lib/currency'
import { toast } from '../../lib/toast'
import {
  getPayablesAgeing,
  getPurchaseAlerts,
  getPurchaseInvoices,
  getPurchaseOrders,
  getSupplierBills,
} from '../../data/services/purchaseService'

const ALERT_TONE = {
  warn: 'border-[var(--warn)]/25 bg-[var(--warn-tint)] text-[var(--warn)]',
  risk: 'border-[var(--neg)]/25 bg-[var(--neg-tint)] text-[var(--neg)]',
}

const AGEING = [
  { key: 'current', label: 'Not due', color: 'var(--pos)' },
  { key: 'b30',     label: '1–30 days', color: 'var(--primary)' },
  { key: 'b60',     label: '31–60 days', color: 'var(--warn)' },
  { key: 'b90',     label: '61–90 days', color: 'var(--neg)' },
  { key: 'older',   label: '90+ days', color: '#B91C1C' },
]

const PURCHASE_TREND = [
  { label: 'Apr', ordered: 34_00_000, received: 28_00_000, paid: 22_00_000 },
  { label: 'May', ordered: 42_00_000, received: 38_00_000, paid: 31_00_000 },
  { label: 'Jun', ordered: 31_00_000, received: 29_00_000, paid: 25_00_000 },
  { label: 'Jul', ordered: 48_00_000, received: 41_00_000, paid: 33_00_000 },
  { label: 'Aug', ordered: 53_00_000, received: 47_00_000, paid: 39_00_000 },
  { label: 'Sep', ordered: 39_00_000, received: 36_00_000, paid: 34_00_000 },
  { label: 'Oct', ordered: 61_00_000, received: 52_00_000, paid: 44_00_000 },
  { label: 'Nov', ordered: 56_00_000, received: 49_00_000, paid: 40_00_000 },
  { label: 'Dec', ordered: 72_00_000, received: 58_00_000, paid: 46_00_000 },
]

function Gauge({ label, value, detail, color, icon: Icon }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div
        className="grid h-16 w-16 shrink-0 place-items-center rounded-full"
        style={{ background: `conic-gradient(${color} ${safeValue * 3.6}deg, var(--surface-2) 0deg)` }}
      >
        <div className="grid h-11 w-11 place-items-center rounded-full bg-[var(--surface)]">
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
        <p className="tabular mt-1 text-xl font-black text-[var(--text)]">{safeValue}%</p>
        <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{detail}</p>
      </div>
    </div>
  )
}

function ExposureBar({ label, value, total, color, onClick }) {
  const percent = total > 0 ? Math.max(4, Math.round((value / total) * 100)) : 0
  return (
    <button type="button" onClick={onClick} className="w-full rounded-[var(--radius-sm)] px-3 py-2 text-left transition-colors hover:bg-[var(--surface-2)]">
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[var(--muted)]">{label}</span>
        <span className="tabular text-sm font-bold text-[var(--text)]">{formatCompact(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div className="h-full rounded-full" style={{ width: `${percent}%`, background: color }} />
      </div>
    </button>
  )
}

function PurchaseConversionWidget({ data }) {
  const totals = data.reduce((sum, row) => ({
    ordered: sum.ordered + row.ordered,
    received: sum.received + row.received,
    paid: sum.paid + row.paid,
  }), { ordered: 0, received: 0, paid: 0 })
  const receivedRate = totals.ordered ? Math.round((totals.received / totals.ordered) * 100) : 0
  const paidRate = totals.ordered ? Math.round((totals.paid / totals.ordered) * 100) : 0
  const grnPending = Math.max(0, totals.ordered - totals.received)
  const paymentPending = Math.max(0, totals.received - totals.paid)
  const stages = [
    { label: 'Ordered', value: totals.ordered, pct: 100, color: 'var(--primary)', bg: 'bg-[var(--primary-tint)]', note: 'Purchase commitments raised' },
    { label: 'Received', value: totals.received, pct: receivedRate, color: 'var(--pos)', bg: 'bg-[var(--pos-tint)]', note: `${receivedRate}% converted to stock` },
    { label: 'Paid', value: totals.paid, pct: paidRate, color: 'var(--warn)', bg: 'bg-[var(--warn-tint)]', note: `${paidRate}% settled with suppliers` },
  ]
  const recent = data.slice(-4)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-3">
        {stages.map((stage, index) => (
          <div key={stage.label} className={`relative overflow-hidden rounded-[var(--radius-sm)] ${stage.bg} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{stage.label}</p>
                <p className="tabular mt-1 text-2xl font-black text-[var(--text)]">{formatCompact(stage.value)}</p>
              </div>
              <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-xs font-black" style={{ color: stage.color }}>
                {stage.pct}%
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
              <div className="h-full rounded-full" style={{ width: `${stage.pct}%`, background: stage.color }} />
            </div>
            <p className="mt-2 text-xs font-medium text-[var(--muted)]">{stage.note}</p>
            {index < stages.length - 1 && (
              <ArrowRight size={18} className="absolute right-3 top-1/2 hidden -translate-y-1/2 text-[var(--faint)] xl:block" />
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1.2fr]">
        <div className="rounded-[var(--radius-sm)] border border-[var(--warn)]/25 bg-[var(--warn-tint)] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--warn)]">Pending GRN</p>
          <p className="tabular mt-1 text-xl font-black text-[var(--text)]">{formatCompact(grnPending)}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Ordered value not yet received</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--neg)]/25 bg-[var(--neg-tint)] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--neg)]">Payment Pending</p>
          <p className="tabular mt-1 text-xl font-black text-[var(--text)]">{formatCompact(paymentPending)}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Received value awaiting settlement</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Last 4 months</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {recent.map(row => {
              const monthRate = row.ordered ? Math.round((row.received / row.ordered) * 100) : 0
              return (
                <div key={row.label} className="rounded-lg bg-[var(--surface)] p-2 text-center">
                  <p className="text-[11px] font-bold text-[var(--muted)]">{row.label}</p>
                  <p className="tabular mt-1 text-sm font-black text-[var(--pos)]">{monthRate}%</p>
                  <p className="mt-0.5 text-[10px] text-[var(--faint)]">received</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PurchaseCenter() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [invoices, setInvoices] = useState([])
  const [bills, setBills] = useState([])
  const [alerts, setAlerts] = useState([])
  const [ageing, setAgeing] = useState(null)

  useEffect(() => {
    Promise.all([
      getPurchaseOrders(),
      getPurchaseInvoices(),
      getSupplierBills(),
      getPurchaseAlerts(),
      getPayablesAgeing(),
    ]).then(([po, pi, sb, pa, ag]) => {
      setOrders(po)
      setInvoices(pi)
      setBills(sb)
      setAlerts(pa)
      setAgeing(ag)
    })
  }, [])

  const metrics = useMemo(() => {
    const openPo = orders.filter(o => ['open', 'partial'].includes(o.status)).reduce((sum, o) => sum + o.amount, 0)
    const payables = invoices.reduce((sum, i) => sum + i.total - i.paid, 0) + bills.filter(b => b.status !== 'paid').reduce((sum, b) => sum + b.amount, 0)
    const pendingApproval = invoices.filter(i => i.approval === 'pending').length + bills.filter(b => b.approval === 'pending').length
    const itcRisk = invoices.filter(i => i.itc !== 'matched').length
    return { openPo, payables, pendingApproval, itcRisk }
  }, [orders, invoices, bills])

  const ageingTotal = ageing ? Object.values(ageing).reduce((s, v) => s + v, 0) : 0
  const ageingMax = ageing ? Math.max(...Object.values(ageing), 1) : 1

  const visuals = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'cancelled')
    const orderedQty = activeOrders.reduce((sum, o) => sum + (o.orderedQty ?? 0), 0)
    const receivedQty = activeOrders.reduce((sum, o) => sum + (o.receivedQty ?? 0), 0)
    const invoiceCount = Math.max(invoices.length, 1)
    const invoiceTotal = invoices.reduce((sum, i) => sum + i.total, 0)
    const paidTotal = invoices.reduce((sum, i) => sum + i.paid, 0)
    const openBills = bills.filter(b => b.status !== 'paid').reduce((sum, b) => sum + b.amount, 0)
    const grnHold = orders.filter(o => ['open', 'partial'].includes(o.status)).reduce((sum, o) => sum + o.amount, 0)
    const itcBlocked = invoices.filter(i => i.itc !== 'matched').reduce((sum, i) => sum + Math.max(0, i.total - i.paid), 0)
    const paymentDue = invoices.reduce((sum, i) => sum + Math.max(0, i.total - i.paid), 0) + openBills
    const exposureTotal = Math.max(grnHold + itcBlocked + paymentDue, 1)

    return {
      received: orderedQty ? (receivedQty / orderedQty) * 100 : 0,
      itcMatched: (invoices.filter(i => i.itc === 'matched').length / invoiceCount) * 100,
      paid: invoiceTotal ? (paidTotal / invoiceTotal) * 100 : 0,
      grnHold,
      itcBlocked,
      paymentDue,
      exposureTotal,
    }
  }, [orders, invoices, bills])

  const exposureMap = useMemo(() => ([
    { name: 'Open PO', value: metrics.openPo },
    { name: 'Payables', value: metrics.payables },
    { name: 'ITC Risk', value: visuals.itcBlocked },
    { name: 'Supplier Bills', value: bills.filter(b => b.status !== 'paid').reduce((sum, b) => sum + b.amount, 0) },
  ].filter(item => item.value > 0)), [metrics.openPo, metrics.payables, visuals.itcBlocked, bills])

  const documentMix = useMemo(() => {
    const openOrders = orders.filter(o => ['open', 'partial'].includes(o.status)).length
    const unpaidInvoices = invoices.filter(i => i.status !== 'paid').length
    const openBills = bills.filter(b => b.status !== 'paid').length
    const alertsCount = alerts.length
    return [
      { label: 'Open PO', value: openOrders, color: 'var(--primary)', route: '/procurement/purchase-orders' },
      { label: 'Unpaid invoices', value: unpaidInvoices, color: 'var(--warn)', route: '/procurement/purchase-invoices' },
      { label: 'Supplier bills', value: openBills, color: 'var(--pos)', route: '/payables/payments' },
      { label: 'Alerts', value: alertsCount, color: 'var(--neg)', route: '/procurement/purchase-center' },
    ]
  }, [orders, invoices, bills, alerts])

  const priorityQueue = [
    ...invoices
      .filter(i => i.nextAction !== 'Archive')
      .map(i => ({ id: i.id, ref: i.ref, party: i.supplier, action: i.nextAction, amount: i.total - i.paid, tag: i.itc, tone: i.itc === 'matched' ? 'warn' : 'neg' })),
    ...orders
      .filter(o => o.status !== 'received' && o.status !== 'cancelled')
      .map(o => ({ id: o.id, ref: o.ref, party: o.supplier, action: o.nextAction, amount: o.amount, tag: o.approval, tone: 'primary' })),
  ].slice(0, 6)

  return (
    <div>
      <PageHeader
        title="Purchase Center"
        subtitle="Approval, receiving, ITC matching, and vendor payment control"
        breadcrumb={['Purchase Operations', 'Purchase Center']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Truck} size="sm" onClick={() => navigate('/procurement/goods-receipt')}>Record GRN</Button>
            <Button variant="secondary" icon={FileSearch} size="sm" onClick={() => navigate('/procurement/purchase-invoices')}>Enter Bill</Button>
            <Button variant="primary" icon={WalletCards} size="sm" onClick={() => navigate('/procurement/payment-out/new')}>New Payment</Button>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Open PO Value" value={formatCompact(metrics.openPo)} icon={ReceiptText} tone="primary" delta={{ value: '6.4%', dir: 'up' }} onClick={() => navigate('/procurement/purchase-orders')} />
        <StatCard label="Payables" value={formatCompact(metrics.payables)} icon={WalletCards} tone="text" hint="Invoices + supplier bills" />
        <StatCard label="Needs Approval" value={metrics.pendingApproval} icon={ShieldCheck} tone="warn" hint="Bills & POs pending" onClick={() => navigate('/procurement/purchase-invoices')} />
        <StatCard label="ITC Issues" value={metrics.itcRisk} icon={AlertTriangle} tone="neg" hint="Block payment till matched" onClick={() => navigate('/procurement/purchase-invoices')} />
      </div>

      {/* AP ageing — competitor-grade payables ageing strip */}
      <div className="mb-5 grid gap-4 2xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.8fr)]">
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-[var(--primary)]" />
                <p className="text-sm font-semibold text-[var(--text)]">Purchase Conversion</p>
              </div>
              <p className="mt-0.5 text-xs text-[var(--muted)]">See how orders convert into received stock and paid bills</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ['Ordered', 'var(--primary)'],
                ['Received', 'var(--pos)'],
                ['Paid', 'var(--warn)'],
              ].map(([label, color]) => (
                <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)]">
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <PurchaseConversionWidget data={PURCHASE_TREND} />
        </div>

        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CircleDollarSign size={16} className="text-[var(--primary)]" />
                <p className="text-sm font-semibold text-[var(--text)]">Purchase Exposure Map</p>
              </div>
              <p className="mt-0.5 text-xs text-[var(--muted)]">Where purchase money is waiting</p>
            </div>
            <span className="rounded-full bg-[var(--primary-tint)] px-2.5 py-1 text-[11px] font-bold text-[var(--primary)]">Live</span>
          </div>
          <DistributionChart data={exposureMap} height={210} innerRadius={52} outerRadius={84} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {exposureMap.map(item => (
              <button
                key={item.name}
                type="button"
                onClick={() => navigate(item.name === 'Open PO' ? '/procurement/purchase-orders' : item.name === 'Payables' ? '/payables/payments' : item.name === 'ITC Risk' ? '/procurement/purchase-invoices' : '/payables/payments')}
                className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-3 py-2 text-left transition-colors hover:bg-[var(--primary-tint)]"
              >
                <p className="truncate text-[11px] font-semibold text-[var(--muted)]">{item.name}</p>
                <p className="tabular mt-1 text-sm font-bold text-[var(--text)]">{formatCompact(item.value)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {documentMix.map(item => (
          <button
            key={item.label}
            type="button"
            onClick={() => navigate(item.route)}
            className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{item.label}</span>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
            </div>
            <p className="tabular text-2xl font-black text-[var(--text)]">{item.value}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div className="h-full rounded-full" style={{ width: `${Math.max(10, Math.min(100, item.value * 18))}%`, background: item.color }} />
            </div>
          </button>
        ))}
      </div>

      <div className="mb-5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Payables ageing</p>
          <p className="tabular text-xs font-semibold text-[var(--text)]">Total {formatCurrency(ageingTotal)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {AGEING.map(b => {
            const amount = ageing?.[b.key] ?? 0
            return (
              <div key={b.key} className="rounded-lg bg-[var(--surface-2)] p-3">
                <p className="text-[11px] font-medium text-[var(--muted)]">{b.label}</p>
                <p className="tabular mt-1 text-base font-bold" style={{ color: amount > 0 ? b.color : 'var(--faint)' }}>{formatCompact(amount)}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
                  <div className="h-full rounded-full" style={{ width: `${(amount / ageingMax) * 100}%`, background: b.color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[var(--primary)]" />
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Control health</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Gauge label="Stock received" value={visuals.received} detail="Against active purchase orders" color="var(--primary)" icon={Truck} />
            <Gauge label="ITC matched" value={visuals.itcMatched} detail="Invoices ready for payment" color="var(--pos)" icon={ShieldCheck} />
            <Gauge label="Paid down" value={visuals.paid} detail="Invoice value already settled" color="var(--warn)" icon={WalletCards} />
          </div>
        </div>

        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee size={16} className="text-[var(--primary)]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Money waiting on action</p>
            </div>
            <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-bold text-[var(--muted)]">Live queue</span>
          </div>
          <div className="space-y-1">
            <ExposureBar label="GRN pending" value={visuals.grnHold} total={visuals.exposureTotal} color="var(--primary)" onClick={() => navigate('/procurement/goods-receipt')} />
            <ExposureBar label="ITC / match blocked" value={visuals.itcBlocked} total={visuals.exposureTotal} color="var(--neg)" onClick={() => navigate('/procurement/purchase-invoices')} />
            <ExposureBar label="Payment due" value={visuals.paymentDue} total={visuals.exposureTotal} color="var(--warn)" onClick={() => navigate('/payables/payments')} />
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-3 py-2">
            <Clock3 size={15} className="text-[var(--muted)]" />
            <p className="text-xs font-medium text-[var(--muted)]">Click a bar to open the related purchase workspace.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Priority queue */}
        <div className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--text)]">What to act on first</p>
            <span className="rounded-full bg-[var(--warn-tint)] px-2 py-0.5 text-[11px] font-bold text-[var(--warn)]">{priorityQueue.length} pending</span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {priorityQueue.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-2)]">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: `var(--${item.tone === 'neg' ? 'neg' : item.tone === 'warn' ? 'warn' : 'primary'})` }} />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">{item.action}</p>
                    <p className="text-xs text-[var(--muted)]">{item.ref} · {item.party} · <span className="capitalize">{item.tag}</span></p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" iconRight={ArrowRight} onClick={() => toast.info(`${item.action} opened`)}>
                  {formatCurrency(item.amount)}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className={`rounded-[var(--radius-sm)] border p-4 ${ALERT_TONE[alert.severity] ?? ALERT_TONE.warn}`}>
              <p className="text-sm font-bold">{alert.title}</p>
              <p className="mt-1 text-xs opacity-80">{alert.detail}</p>
            </div>
          ))}

          <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Inventory impact</p>
            <div className="flex items-center gap-3">
              <PackageCheck size={20} className="text-[var(--primary)]" />
              <p className="text-sm text-[var(--text)]">Receipt notes update stock and block payment when GRN is missing.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
