import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer, ComposedChart, BarChart, AreaChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Wallet, Landmark, Receipt, ArrowDownLeft, ArrowUpRight, ChevronRight, SlidersHorizontal,
  FileWarning, CalendarClock, RefreshCcw, ClipboardCheck, Boxes, Scale, Users, Package, Sparkles, Building2, Banknote,
  PiggyBank, Check, RotateCcw, Activity, BellRing,
} from 'lucide-react'
import TransactionExplain from '../../components/ai/TransactionExplain'
import { formatCompact, formatCurrency } from '../../lib/currency'
import { getCountryTaxConfig } from '../../lib/countryTax'
import { useAppStore } from '../../store/useAppStore'
import { useCan } from '../../hooks/useCan'
import { useApi } from '../../hooks/useApi'
import { currentFYYear, fyLabel } from '../../lib/fy'
import { getAccountantAlerts, getAiDashboardInsights } from '../../data/services/aiInsightService'

/* ───────────── Sample figures (monthly, financial year to date) ───────────── */
const MONTHS = [
  { label: 'Apr', income: 58_00_000, expense: 31_00_000, cashIn: 42_00_000, cashOut: 36_00_000, receivable: 61_00_000, payable: 28_00_000, cash: 98_00_000 },
  { label: 'May', income: 66_00_000, expense: 38_00_000, cashIn: 58_00_000, cashOut: 41_00_000, receivable: 64_50_000, payable: 30_20_000, cash: 1_05_00_000 },
  { label: 'Jun', income: 49_00_000, expense: 42_00_000, cashIn: 39_00_000, cashOut: 47_00_000, receivable: 70_10_000, payable: 33_80_000, cash: 97_00_000 },
  { label: 'Jul', income: 74_00_000, expense: 36_00_000, cashIn: 67_00_000, cashOut: 44_00_000, receivable: 72_40_000, payable: 31_00_000, cash: 1_08_00_000 },
  { label: 'Aug', income: 81_00_000, expense: 41_00_000, cashIn: 72_00_000, cashOut: 49_00_000, receivable: 75_00_000, payable: 29_60_000, cash: 1_14_00_000 },
  { label: 'Sep', income: 63_00_000, expense: 39_00_000, cashIn: 55_00_000, cashOut: 46_00_000, receivable: 73_20_000, payable: 34_10_000, cash: 1_11_00_000 },
  { label: 'Oct', income: 92_00_000, expense: 48_00_000, cashIn: 81_00_000, cashOut: 58_00_000, receivable: 76_80_000, payable: 35_40_000, cash: 1_19_00_000 },
  { label: 'Nov', income: 71_00_000, expense: 52_00_000, cashIn: 63_00_000, cashOut: 57_00_000, receivable: 74_30_000, payable: 33_00_000, cash: 1_21_00_000 },
  { label: 'Dec', income: 1_08_00_000, expense: 56_00_000, cashIn: 94_00_000, cashOut: 61_00_000, receivable: 78_90_000, payable: 32_40_000, cash: 1_26_50_000 },
]

const EXPENSE_SPLIT = [
  { name: 'Salaries', value: 1_42_00_000, color: '#0f766e' },
  { name: 'Rent & utilities', value: 52_00_000, color: '#2563eb' },
  { name: 'Software & cloud', value: 38_00_000, color: '#7c3aed' },
  { name: 'Travel', value: 21_00_000, color: '#d97706' },
  { name: 'Other', value: 30_00_000, color: '#94a3b8' },
]

const AGEING = {
  receivables: {
    buckets: [['Current', 34_00_000, 'var(--pos)'], ['1–30 days', 22_50_000, 'var(--primary)'], ['31–60 days', 13_10_000, 'var(--warn)'], ['60+ days', 9_30_000, 'var(--neg)']],
    top: [['Wipro Digital Ltd', 8_90_000, 42], ['Tata Consultancy Svcs', 6_20_000, 75], ['Tech Mahindra Ltd', 3_20_000, 18]],
    href: '/receivables/ageing', count: '23 unpaid invoices',
  },
  payables: {
    buckets: [['Current', 15_20_000, 'var(--pos)'], ['1–30 days', 9_80_000, 'var(--primary)'], ['31–60 days', 4_90_000, 'var(--warn)'], ['60+ days', 2_50_000, 'var(--neg)']],
    top: [['Reliance Industries', 4_20_000, 12], ['Amazon Web Services', 1_25_000, 3], ['Freshworks India', 45_000, 0]],
    href: '/payables/ageing', count: '11 bills coming due',
  },
}

const BANKS = [
  { name: 'HDFC Current A/c', number: '••4821', balance: 82_45_000, icon: Building2, synced: '5 min ago' },
  { name: 'SBI OD Account', number: '••2201', balance: 31_00_000, icon: Building2, synced: '1 hr ago' },
  { name: 'Kotak Savings', number: '••9934', balance: 12_00_000, icon: Building2, synced: 'Today' },
  { name: 'Petty Cash', number: null, balance: 1_50_000, icon: Banknote, synced: 'Manual' },
]

const TOP_CUSTOMERS = [['Infosys BPO Ltd', 1_32_00_000], ['Wipro Digital Ltd', 98_00_000], ['Tata Consultancy Svcs', 76_00_000], ['Tech Mahindra Ltd', 54_00_000], ['HCL Technologies', 41_00_000]]
const TOP_ITEMS = [['Cloud Consulting (hrs)', 1840, 92_00_000], ['Annual Support Plan', 64, 71_00_000], ['Implementation Pack', 22, 48_00_000], ['Laptop – Dell 5440', 38, 31_00_000], ['Training Workshop', 15, 12_00_000]]

const RECENT = [
  { id: 'RCV-0842', type: 'Payment received', party: 'Infosys BPO Ltd', amount: 8_50_000, status: 'paid', date: '18 Dec', dir: 'in' },
  { id: 'PAY-0631', type: 'Payment sent', party: 'Reliance Industries', amount: 4_20_000, status: 'paid', date: '17 Dec', dir: 'out' },
  { id: 'INV-1290', type: 'Sales invoice', party: 'Wipro Digital Ltd', amount: 3_90_000, status: 'sent', date: '16 Dec', dir: 'in' },
  { id: 'BIL-0412', type: 'Supplier bill', party: 'Amazon Web Services', amount: 78_500, status: 'due', date: '15 Dec', dir: 'out' },
  { id: 'JV-0204', type: 'Journal entry', party: 'Depreciation – Dec', amount: 1_25_000, status: 'draft', date: '14 Dec', dir: null },
]

const PERIODS = [['fy', 'This FY', 9], ['6m', '6 months', 6], ['3m', '3 months', 3]]

/* Every widget, the row it sits in, its width share, and the section it needs access to */
const WIDGETS = [
  { id: 'kpis', label: 'Key numbers', row: 0, weight: 1, section: null },
  { id: 'cashflow', label: 'Cash flow', row: 1, weight: 2, section: 'cashbank' },
  { id: 'attention', label: 'Needs attention', row: 1, weight: 1, section: null },
  { id: 'pnl', label: 'Income & expenses', row: 2, weight: 2, section: 'reports' },
  { id: 'expenses', label: 'Where money goes', row: 2, weight: 1, section: 'expenses' },
  { id: 'receivables', label: 'Money owed to you', row: 3, weight: 1, section: 'receivables' },
  { id: 'payables', label: 'Bills to pay', row: 3, weight: 1, section: 'payables' },
  { id: 'banks', label: 'Bank & cash', row: 4, weight: 1, section: 'cashbank' },
  { id: 'tax', label: 'Tax summary', row: 4, weight: 1, section: 'tax' },
  { id: 'ratios', label: 'Business health', row: 4, weight: 1, section: 'reports' },
  { id: 'customers', label: 'Top customers', row: 5, weight: 1, section: 'sales' },
  { id: 'items', label: 'Top selling items', row: 5, weight: 1, section: 'inventory' },
  { id: 'insights', label: 'AI suggestions', row: 5, weight: 1, section: null },
  { id: 'activity', label: 'Recent transactions', row: 6, weight: 1, section: null },
]

const prefKey = id => `ut-dashboard-hidden:${id ?? 'guest'}`
function loadHidden(id) { try { return new Set(JSON.parse(localStorage.getItem(prefKey(id)) || '[]')) } catch { return new Set() } }
function saveHidden(id, set) { try { localStorage.setItem(prefKey(id), JSON.stringify([...set])) } catch { /* storage blocked */ } }

const sum = (rows, key) => rows.reduce((s, r) => s + r[key], 0)
const pctChange = (now, before) => (before ? ((now - before) / Math.abs(before)) * 100 : 0)

/* ───────────── Building blocks ───────────── */
function Widget({ icon: Icon, title, subtitle, action, onAction, children, className = '' }) {
  return (
    <section className={`flex min-w-0 flex-col rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 shadow-[var(--shadow)] ${className}`}>
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-[14px] font-semibold text-[var(--text)]">
            {Icon && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[var(--primary-tint)] text-[var(--primary-ink)]"><Icon size={15} /></span>}{title}
          </h3>
          {subtitle && <p className="mt-1 text-[12.5px] text-[var(--muted)]">{subtitle}</p>}
        </div>
        {action && (
          <button type="button" onClick={onAction} className="flex shrink-0 items-center gap-0.5 rounded-[7px] border-0 bg-transparent px-2 py-1 text-[12.5px] font-[550] text-[var(--primary-ink)] hover:bg-[var(--primary-tint)] cursor-pointer">
            {action} <ChevronRight size={13} className="rtl-flip" />
          </button>
        )}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-[var(--muted)]">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="flex items-center justify-between gap-5">
          <span className="flex items-center gap-1.5 text-[var(--muted)]"><span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{p.name}</span>
          <span className="tabular font-semibold text-[var(--text)]">{formatCompact(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

const axis = { tick: { fontSize: 11, fill: 'var(--faint)' }, axisLine: false, tickLine: false }

function Delta({ value, goodWhenUp = true, suffix = 'vs last period' }) {
  const up = value >= 0
  const good = up === goodWhenUp
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px]">
      <span className="inline-flex items-center gap-1 rounded-full px-[7px] py-px font-semibold" style={{ color: good ? 'var(--pos)' : 'var(--neg)', background: good ? 'var(--pos-tint)' : 'var(--neg-tint)' }}>
        <Icon size={12} />{Math.abs(value).toFixed(1)}%
      </span>
      {suffix && <span className="text-[var(--muted)]">{suffix}</span>}
    </span>
  )
}

function KpiTile({ icon: Icon, label, value, delta, goodWhenUp, sub, data, dataKey, color, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="group flex min-w-0 flex-col overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)] pt-3.5 text-left shadow-[var(--shadow)] transition-colors hover:border-[var(--border-strong)] cursor-pointer">
      {/* CRM KPI card: icon tile + label, big figure with change chip, one-line context, edge-to-edge sparkline */}
      <span className="flex items-center gap-2.5 px-4">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[var(--primary-tint)] text-[var(--primary-ink)]"><Icon size={15} /></span>
        <span className="truncate text-[12.5px] font-medium text-[var(--muted)]">{label}</span>
      </span>
      <span className="mt-2 flex flex-wrap items-center gap-2 px-4">
        <span className="tabular text-[25px] font-bold leading-none tracking-[-0.02em] text-[var(--text)]">{value}</span>
        <Delta value={delta} goodWhenUp={goodWhenUp} suffix="" />
      </span>
      <span className="mt-1.5 truncate px-4 text-[12.5px] text-[var(--muted)]">{sub}</span>
      <span className="mt-2 block h-9 w-full">
        <ResponsiveContainer width="100%" height={36}>
          <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>{/* CRM sparklines share one blue */}
            <defs>
              <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#spark-${dataKey})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </span>
    </button>
  )
}

function AgeingWidget({ kind, icon, title, onOpen }) {
  const { buckets, top, count } = AGEING[kind]
  const total = buckets.reduce((s, b) => s + b[1], 0)
  const overdue = total - buckets[0][1]
  return (
    <Widget icon={icon} title={title} subtitle={count} action="Ageing" onAction={onOpen}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="tabular text-[25px] font-bold leading-tight tracking-[-0.02em] text-[var(--text)]">{formatCompact(total)}</p>
          <p className="text-xs text-[var(--muted)]"><span className="font-semibold text-[var(--neg)]">{formatCompact(overdue)}</span> overdue</p>
        </div>
        <p className="text-right text-xs text-[var(--muted)]">{Math.round((buckets[0][1] / total) * 100)}% not yet due</p>
      </div>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
        {buckets.map(([label, value, color]) => <span key={label} title={`${label}: ${formatCompact(value)}`} style={{ width: `${(value / total) * 100}%`, background: color }} />)}
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
        {buckets.map(([label, value, color]) => (
          <div key={label} className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]"><span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: color }} />{label}</p>
            <p className="tabular text-sm font-bold text-[var(--text)]">{formatCompact(value)}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-[var(--border)] pt-3">
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--faint)]">Largest balances</p>
        {top.map(([name, value, days]) => (
          <div key={name} className="flex items-center justify-between gap-3 py-1.5 text-sm">
            <span className="min-w-0 truncate text-[var(--text)]">{name}</span>
            <span className="flex shrink-0 items-center gap-2">
              {days > 0 && <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ color: days > 30 ? 'var(--neg)' : 'var(--warn)', background: days > 30 ? 'var(--neg-tint)' : 'var(--warn-tint)' }}>{days}d late</span>}
              <span className="tabular font-semibold text-[var(--text)]">{formatCompact(value)}</span>
            </span>
          </div>
        ))}
      </div>
    </Widget>
  )
}

function RankList({ rows, render }) {
  const max = Math.max(...rows.map(r => r.value))
  return (
    <ol className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.name}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2"><span className="w-4 shrink-0 text-xs font-bold text-[var(--faint)]">{i + 1}</span><span className="truncate text-[var(--text)]">{r.name}</span></span>
            <span className="tabular shrink-0 font-semibold text-[var(--text)]">{render(r)}</span>
          </div>
          <div className="ms-6 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${(r.value / max) * 100}%`, opacity: 1 - i * 0.13 }} /></div>
        </li>
      ))}
    </ol>
  )
}

function CustomizeMenu({ hidden, onToggle, onReset, allowed }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const close = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const shown = allowed.filter(w => !hidden.has(w.id)).length
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="flex h-9 items-center gap-1.5 rounded-[8px] border border-[var(--primary)] bg-[var(--primary)] px-3 text-[13.5px] font-[550] text-[var(--on-primary)] hover:bg-[var(--primary-600)] cursor-pointer">
        <SlidersHorizontal size={16} /> Customize
      </button>
      {open && (
        <div className="absolute end-0 top-full z-[900] mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-2xl">
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Widgets · {shown} of {allowed.length}</p>
            <button type="button" onClick={onReset} className="flex items-center gap-1 rounded-md border-0 bg-transparent px-1.5 py-1 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary-tint)] cursor-pointer"><RotateCcw size={12} /> Reset</button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {allowed.map(w => {
              const on = !hidden.has(w.id)
              return (
                <button key={w.id} type="button" role="menuitemcheckbox" aria-checked={on} onClick={() => onToggle(w.id)}
                  className="flex w-full items-center gap-2.5 rounded-lg border-0 bg-transparent px-2 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer">
                  <span className={`flex h-4 w-4 items-center justify-center rounded border ${on ? 'border-[var(--primary)] bg-[var(--primary)] text-white' : 'border-[var(--border)]'}`}>{on && <Check size={11} strokeWidth={3} />}</span>
                  {w.label}
                </button>
              )
            })}
          </div>
          <p className="border-t border-[var(--border)] px-2 pt-2 text-[11px] text-[var(--faint)]">Saved for you on this device. Widgets for sections you can't access are not listed.</p>
        </div>
      )}
    </div>
  )
}

/* ───────────── Dashboard ───────────── */
export default function DashboardOverview() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const can = useCan()
  const { financialYear, activeCompany, session } = useAppStore()
  const userId = session?.user?.id
  const firstName = session?.user?.name?.split(' ')[0]
  const fy = financialYear ?? currentFYYear()
  const tax = getCountryTaxConfig(activeCompany?.country || 'IN')
  const hour = new Date().getHours()
  const greeting = t(`shell.greeting.${hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}`)

  const [period, setPeriod] = useState('fy')
  const [hidden, setHidden] = useState(() => loadHidden(userId))
  // Live figures from the books (the trend history in the charts is still sample data)
  const live = useApi('/books/summary').data
  const bankLines = useApi(can('view', 'cashbank') ? '/bank/book-matches' : null).data
  const [insights, setInsights] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [explainTx, setExplainTx] = useState(null)

  useEffect(() => {
    let live = true
    Promise.all([getAiDashboardInsights(), getAccountantAlerts()]).then(([i, a]) => { if (live) { setInsights(i); setAlerts(a) } })
    return () => { live = false }
  }, [])

  const allowed = WIDGETS.filter(w => !w.section || can('view', w.section))
  const visible = allowed.filter(w => !hidden.has(w.id))
  function toggle(id) {
    setHidden(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); saveHidden(userId, next); return next })
  }
  function reset() { const next = new Set(); saveHidden(userId, next); setHidden(next) }

  /* Figures for the chosen period */
  const months = PERIODS.find(p => p[0] === period)[2]
  const m = useMemo(() => {
    const rows = MONTHS.slice(-months)
    const prev = MONTHS.slice(0, MONTHS.length - months).slice(-months)
    const last = rows[rows.length - 1]
    // Work back from today's bank balance so the cash flow always ends on it
    const opening = last.cash - rows.reduce((s, r) => s + r.cashIn - r.cashOut, 0)
    const income = sum(rows, 'income')
    const expense = sum(rows, 'expense')
    const prevProfit = prev.length ? sum(prev, 'income') - sum(prev, 'expense') : null
    const flow = rows.map((r, i) => ({
      ...r, net: r.cashIn - r.cashOut, profit: r.income - r.expense,
      balance: opening + rows.slice(0, i + 1).reduce((s, x) => s + x.cashIn - x.cashOut, 0),
    }))
    const running = flow[flow.length - 1].balance
    return {
      rows: flow, income, expense, profit: income - expense,
      profitDelta: prevProfit ? pctChange(income - expense, prevProfit) : 18.7,
      cashIn: sum(rows, 'cashIn'), cashOut: sum(rows, 'cashOut'), opening, closing: running,
      first: rows[0], last,
    }
  }, [months])
  const margin = (m.profit / m.income) * 100
  const totalCash = BANKS.reduce((s, b) => s + b.balance, 0)
  const expenseTotal = EXPENSE_SPLIT.reduce((s, e) => s + e.value, 0)
  const urgent = alerts.filter(a => ['critical', 'high'].includes(a.severity))

  const ATTENTION = [
    { icon: FileWarning, label: 'Overdue invoices', sub: `${formatCompact(live?.overdueReceivables ?? 44_90_000)} to collect`, count: live?.overdueInvoices ?? 6, tone: 'neg', to: '/reports/live-financials', section: 'receivables' },
    { icon: CalendarClock, label: 'Bills due this week', sub: live ? `of ${formatCompact(live.payables)} owed to suppliers` : `${formatCompact(1_41_400)} to pay`, count: live?.billsDueThisWeek ?? 4, tone: 'warn', to: '/procurement/bill-approvals', section: 'payables' },
    { icon: Receipt, label: `${tax.taxSystem} return due`, sub: 'Filing due in 5 days', count: 1, tone: 'warn', to: tax.taxSystem === 'GST' ? '/tax/gst-from-books' : '/tax', section: 'tax' },
    { icon: RefreshCcw, label: 'Bank lines to reconcile', sub: 'Statements and bank feeds', count: bankLines?.length ?? 18, tone: 'primary', to: '/cashbank/bank-rules', section: 'cashbank' },
    { icon: ClipboardCheck, label: 'Waiting for approval', sub: 'Bills over the approval limit', count: live?.pendingApprovals ?? 3, tone: 'primary', to: '/procurement/bill-approvals', section: 'procurement' },
    { icon: Boxes, label: 'Items low on stock', sub: 'At or below reorder level', count: live?.lowStock ?? 5, tone: 'warn', to: '/inventory/stock-valuation', section: 'inventory' },
  ].filter(a => can('view', a.section))

  const KPIS = [
    { icon: ArrowDownLeft, label: 'Money owed to you', value: formatCompact(live?.receivables ?? m.last.receivable), delta: pctChange(m.last.receivable, m.first.receivable), goodWhenUp: false, sub: live ? `${live.overdueInvoices} overdue · from your books` : '23 unpaid invoices', dataKey: 'receivable', color: '#3987e5', to: '/reports/live-financials', section: 'receivables' },
    { icon: ArrowUpRight, label: 'Bills to pay', value: formatCompact(live?.payables ?? m.last.payable), delta: pctChange(m.last.payable, m.first.payable), goodWhenUp: false, sub: live ? `${live.billsDueThisWeek} due this week · from your books` : '11 bills coming due', dataKey: 'payable', color: '#3987e5', to: '/procurement/bill-approvals', section: 'payables' },
    { icon: Landmark, label: 'Cash & bank', value: formatCompact(live?.cash ?? m.last.cash), delta: pctChange(m.last.cash, m.first.cash), goodWhenUp: true, sub: live ? 'Bank and cash in the ledger' : `${BANKS.length} accounts`, dataKey: 'cash', color: '#3987e5', to: '/cashbank/bank-rules', section: 'cashbank' },
    { icon: PiggyBank, label: 'Net profit', value: formatCompact(period === 'fy' && live ? live.netProfitFy : m.profit), delta: m.profitDelta, goodWhenUp: true, sub: period === 'fy' && live ? `${live.grossMargin}% gross margin · this FY, from your books` : `${margin.toFixed(1)}% margin · ${PERIODS.find(p => p[0] === period)[1]}`, dataKey: 'profit', color: '#3987e5', to: '/reports/live-financials', section: 'reports' },
  ].filter(k => can('view', k.section))

  const toneColor = tone => ({ neg: 'var(--neg)', warn: 'var(--warn)', primary: 'var(--primary)' }[tone])
  const toneBg = tone => ({ neg: 'var(--neg-tint)', warn: 'var(--warn-tint)', primary: 'var(--primary-tint)' }[tone])

  const render = {
    kpis: () => (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map(k => <KpiTile key={k.label} {...k} data={m.rows} onClick={() => navigate(k.to)} />)}
      </div>
    ),

    cashflow: () => (
      <Widget icon={Activity} title="Cash flow" subtitle="Money coming in and going out each month" action="Details" onAction={() => navigate('/dashboard/cash-flow')}>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[['Opening', m.opening, 'var(--text)'], ['Incoming', m.cashIn, 'var(--pos)'], ['Outgoing', m.cashOut, 'var(--neg)'], ['Closing', m.closing, 'var(--primary)']].map(([label, value, color], i) => (
            <div key={label} className="rounded-lg bg-[var(--surface-2)] px-3 py-2">
              <p className="text-[11px] font-semibold text-[var(--muted)]">{label}</p>
              <p className="tabular whitespace-nowrap text-[15px] font-bold" style={{ color }}>{i === 1 ? '+' : i === 2 ? '−' : ''}{formatCompact(value)}</p>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <ComposedChart data={m.rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" {...axis} />
            <YAxis tickFormatter={v => formatCompact(v)} width={58} {...axis} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
            <Bar dataKey="cashIn" name="Incoming" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="cashOut" name="Outgoing" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Line dataKey="net" name="Net cash" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }} type="monotone" isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </Widget>
    ),

    attention: () => (
      <Widget icon={BellRing} title="Needs attention" subtitle={ATTENTION.length ? `${ATTENTION.reduce((s, a) => s + a.count, 0)} things waiting on you` : 'Nothing waiting on you'}>
        <ul className="-mx-2 space-y-0.5">
          {ATTENTION.map(a => (
            <li key={a.label}>
              <button type="button" onClick={() => navigate(a.to)} className="flex w-full items-center gap-3 rounded-lg border-0 bg-transparent px-2 py-2.5 text-left hover:bg-[var(--surface-2)] cursor-pointer">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: toneBg(a.tone) }}><a.icon size={15} style={{ color: toneColor(a.tone) }} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--text)]">{a.label}</span>
                  <span className="block truncate text-xs text-[var(--muted)]">{a.sub}</span>
                </span>
                <span className="tabular min-w-[26px] rounded-full px-2 py-0.5 text-center text-xs font-bold" style={{ color: toneColor(a.tone), background: toneBg(a.tone) }}>{a.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </Widget>
    ),

    pnl: () => (
      <Widget icon={TrendingUp} title="Income & expenses" subtitle="Profit and loss by month" action="Profit & loss" onAction={() => navigate('/reports/financial-statements')}>
        <div className="mb-4 flex flex-wrap gap-x-8 gap-y-2">
          {[['Income', m.income, '#0f766e'], ['Expenses', m.expense, '#f59e0b'], ['Net profit', m.profit, '#7c3aed']].map(([label, value, color]) => (
            <div key={label}>
              <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]"><span className="h-2 w-2 rounded-full" style={{ background: color }} />{label}</p>
              <p className="tabular text-lg font-extrabold text-[var(--text)]">{formatCompact(value)}</p>
            </div>
          ))}
          <div>
            <p className="text-xs text-[var(--muted)]">Profit margin</p>
            <p className="tabular text-lg font-extrabold text-[var(--pos)]">{margin.toFixed(1)}%</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={m.rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" {...axis} />
            <YAxis tickFormatter={v => formatCompact(v)} width={58} {...axis} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
            <Bar dataKey="income" name="Income" fill="#0f766e" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="expense" name="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </Widget>
    ),

    expenses: () => (
      <Widget icon={Wallet} title="Where money goes" subtitle="Expenses by category, this FY" action="Expenses" onAction={() => navigate('/expenses')}>
        <div className="relative mx-auto h-[170px] w-[170px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={EXPENSE_SPLIT} dataKey="value" nameKey="name" innerRadius={56} outerRadius={80} paddingAngle={2} stroke="none">
                {EXPENSE_SPLIT.map(e => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={v => formatCompact(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] text-[var(--muted)]">Total</span>
            <span className="tabular text-base font-extrabold text-[var(--text)]">{formatCompact(expenseTotal)}</span>
          </div>
        </div>
        <ul className="mt-3 space-y-1.5">
          {EXPENSE_SPLIT.map(e => (
            <li key={e.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: e.color }} /><span className="truncate text-[var(--text)]">{e.name}</span></span>
              <span className="tabular shrink-0 text-[var(--muted)]"><span className="font-semibold text-[var(--text)]">{formatCompact(e.value)}</span> · {Math.round((e.value / expenseTotal) * 100)}%</span>
            </li>
          ))}
        </ul>
      </Widget>
    ),

    receivables: () => <AgeingWidget kind="receivables" icon={ArrowDownLeft} title="Money owed to you" onOpen={() => navigate(AGEING.receivables.href)} />,
    payables: () => <AgeingWidget kind="payables" icon={ArrowUpRight} title="Bills to pay" onOpen={() => navigate(AGEING.payables.href)} />,

    banks: () => (
      <Widget icon={Landmark} title="Bank & cash" subtitle="Balances from your bank feeds" action="Manage" onAction={() => navigate('/cashbank/bank-accounts')}>
        <ul className="space-y-1">
          {BANKS.map(b => (
            <li key={b.name} className="flex items-center gap-3 py-1.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-tint)]"><b.icon size={14} className="text-[var(--primary)]" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--text)]">{b.name}</span>
                <span className="block text-[11px] text-[var(--faint)]">{b.number ? `${b.number} · ` : ''}Synced {b.synced}</span>
              </span>
              <span className="tabular text-sm font-bold text-[var(--text)]">{formatCompact(b.balance)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-[var(--primary-tint)] px-3 py-2.5">
          <span className="text-xs font-bold text-[var(--primary)]">Total available</span>
          <span className="tabular text-sm font-extrabold text-[var(--primary)]">{formatCompact(totalCash)}</span>
        </div>
      </Widget>
    ),

    tax: () => {
      const output = 14_20_000, input = 9_80_000
      return (
        <Widget icon={Receipt} title={`${tax.taxSystem} summary`} subtitle="This month, ready to file" action="Returns" onAction={() => navigate('/tax')}>
          <div className="space-y-3">
            {[['Tax on sales', output, 'var(--text)'], ['Tax credit on purchases', -input, 'var(--pos)']].map(([label, v, color]) => (
              <div key={label} className="flex items-center justify-between text-sm"><span className="text-[var(--muted)]">{label}</span><span className="tabular font-semibold" style={{ color }}>{v < 0 ? '−' : ''}{formatCompact(Math.abs(v))}</span></div>
            ))}
            <div className="flex h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <span style={{ width: `${(input / output) * 100}%`, background: 'var(--pos)' }} />
              <span style={{ width: `${((output - input) / output) * 100}%`, background: 'var(--warn)' }} />
            </div>
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
              <span className="text-sm font-bold text-[var(--text)]">Net tax to pay</span>
              <span className="tabular text-lg font-extrabold text-[var(--warn)]">{formatCompact(output - input)}</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg bg-[var(--warn-tint)] px-3 py-2.5">
              <CalendarClock size={16} className="shrink-0 text-[var(--warn)]" />
              <span className="text-xs text-[var(--text)]"><span className="font-bold">Return due in 5 days.</span> {tax.name}</span>
            </div>
          </div>
        </Widget>
      )
    },

    ratios: () => {
      const RATIOS = [
        ['Current ratio', '2.1', 'Can pay short-term bills 2× over', 'pos', 74],
        ['Profit margin', `${margin.toFixed(0)}%`, 'Of every sale is profit', margin > 25 ? 'pos' : 'warn', Math.min(100, margin * 2)],
        ['Days to get paid', '42 days', 'Average customer payment time', 'warn', 58],
        ['Cash runway', '6.8 months', 'At the current spending rate', 'pos', 80],
      ]
      return (
        <Widget icon={Scale} title="Business health" subtitle="Key ratios at a glance" action="Reports" onAction={() => navigate('/reports')}>
          <ul className="space-y-3.5">
            {RATIOS.map(([label, value, hint, tone, pct]) => (
              <li key={label}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-[var(--text)]">{label}</span>
                  <span className="tabular text-sm font-extrabold" style={{ color: tone === 'pos' ? 'var(--pos)' : 'var(--warn)' }}>{value}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: tone === 'pos' ? 'var(--pos)' : 'var(--warn)' }} /></div>
                <p className="mt-0.5 text-[11px] text-[var(--faint)]">{hint}</p>
              </li>
            ))}
          </ul>
        </Widget>
      )
    },

    customers: () => (
      <Widget icon={Users} title="Top customers" subtitle="By sales this FY" action="Customers" onAction={() => navigate('/parties')}>
        <RankList rows={TOP_CUSTOMERS.map(([name, value]) => ({ name, value }))} render={r => formatCompact(r.value)} />
      </Widget>
    ),

    items: () => (
      <Widget icon={Package} title="Top selling items" subtitle="By sales value this FY" action="Items" onAction={() => navigate('/inventory')}>
        <RankList rows={TOP_ITEMS.map(([name, qty, value]) => ({ name, qty, value }))} render={r => <>{formatCompact(r.value)} <span className="text-xs font-normal text-[var(--faint)]">· {r.qty.toLocaleString()} sold</span></>} />
      </Widget>
    ),

    insights: () => (
      <Widget icon={Sparkles} title="AI suggestions" subtitle={insights ? `${urgent.length} urgent · ${alerts.length} open alerts` : 'Analysing your books…'} action="All alerts" onAction={() => navigate('/alerts')}>
        <ul className="space-y-2">
          {(insights?.suggestions ?? []).slice(0, 3).map(s => {
            const hot = ['critical', 'high'].includes(s.severity)
            return (
              <li key={s.id}>
                <button type="button" onClick={() => navigate('/alerts/accountant-alerts')} className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 text-left hover:border-[var(--primary)] cursor-pointer">
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold leading-snug text-[var(--text)]">{s.title}</span>
                    <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase" style={{ color: hot ? 'var(--neg)' : 'var(--warn)', background: hot ? 'var(--neg-tint)' : 'var(--warn-tint)' }}>{s.severity}</span>
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-[var(--primary)]">{s.action} →</span>
                </button>
              </li>
            )
          })}
        </ul>
      </Widget>
    ),

    activity: () => (
      <Widget icon={Activity} title="Recent transactions" subtitle="Click any row for an AI explanation" action="View all" onAction={() => navigate('/expenses/journal-vouchers')}>
        <ul className="-mx-2 divide-y divide-[var(--border)]">
          {RECENT.map(v => {
            const color = v.dir === 'in' ? 'var(--pos)' : v.dir === 'out' ? 'var(--neg)' : 'var(--muted)'
            const Icon = v.dir === 'in' ? ArrowDownLeft : v.dir === 'out' ? ArrowUpRight : Receipt
            return (
              <li key={v.id}>
                <button type="button" onClick={() => setExplainTx({ ...v, amount: v.amount })} className="flex w-full items-center gap-3 rounded-lg border-0 bg-transparent px-2 py-2.5 text-left hover:bg-[var(--surface-2)] cursor-pointer">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: v.dir === 'in' ? 'var(--pos-tint)' : v.dir === 'out' ? 'var(--neg-tint)' : 'var(--surface-2)' }}><Icon size={14} style={{ color }} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[var(--text)]">{v.party}</span>
                    <span className="block truncate text-xs text-[var(--muted)]">{v.type} · <span className="font-mono">{v.id}</span></span>
                  </span>
                  <span className="hidden text-xs capitalize text-[var(--muted)] sm:block">{v.status}</span>
                  <span className="w-16 text-right text-xs text-[var(--faint)]">{v.date}</span>
                  <span className="tabular w-28 text-right text-sm font-bold" style={{ color: v.dir ? color : 'var(--text)' }}>{v.dir === 'in' ? '+' : v.dir === 'out' ? '−' : ''}{formatCurrency(v.amount)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </Widget>
    ),
  }

  const rows = [...new Set(WIDGETS.map(w => w.row))].map(r => visible.filter(w => w.row === r)).filter(r => r.length)

  return (
    <div className="ut-dash mx-auto max-w-[1500px] space-y-4">
      {/* CRM page header: title + company and today's date, then the filter row */}
      <div>
        <h1 className="text-[21px] font-[680] leading-tight tracking-[-0.015em] text-[var(--text)]">Business overview</h1>
        <p className="mt-0.5 text-[13px] text-[var(--muted)]">
          {activeCompany?.name || 'UnifiedTree'} · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} · {greeting}{firstName ? `, ${firstName}` : ''}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex gap-0.5 rounded-[8px] bg-[var(--surface-2)] p-[3px]" role="group" aria-label="Period">
          {PERIODS.map(([id, label]) => (
            <button key={id} type="button" aria-pressed={period === id} onClick={() => setPeriod(id)}
              className={`rounded-[6px] border-0 px-2.5 py-1 text-[13px] font-[550] cursor-pointer ${period === id ? 'bg-[var(--surface)] text-[var(--text)] shadow-[0_1px_2px_rgba(0,0,0,0.12)]' : 'bg-transparent text-[var(--muted)] hover:text-[var(--text)]'}`}>
              {label}
            </button>
          ))}
        </div>
        <span className="flex h-9 items-center rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-[13.5px] text-[var(--text)]">{fyLabel(fy)} · {tax.flag} {tax.name}</span>
        <CustomizeMenu hidden={hidden} onToggle={toggle} onReset={reset} allowed={allowed} />
      </div>
      <p className="text-[12.5px] text-[var(--muted)]">Compared with the period before. Money owed, bills, cash and stock always show today's position.</p>

      {rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
          <p className="font-semibold text-[var(--text)]">Your dashboard is empty</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Use Customize to choose the widgets you want to see.</p>
        </div>
      )}

      {rows.map(row => (
        <div key={row[0].row} className="ut-dash-row" style={{ '--cols': row.map(w => `minmax(0,${w.weight}fr)`).join(' ') }}>
          {row.map(w => <div key={w.id} className={`flex min-w-0 flex-col [&>*]:flex-1 ${row.length === 1 ? 'ut-dash-full' : ''}`}>{render[w.id]()}</div>)}
        </div>
      ))}

      <TransactionExplain open={!!explainTx} onClose={() => setExplainTx(null)} transaction={explainTx} />
      <style>{DASH_CSS}</style>
    </div>
  )
}

/* Columns follow the dashboard's own width: 1 → 2 → the row's full layout */
const DASH_CSS = `
.ut-dash{container-type:inline-size}
.ut-dash-row{display:grid;gap:16px;grid-template-columns:minmax(0,1fr)}
@container (min-width:700px){
  .ut-dash-row{grid-template-columns:repeat(2,minmax(0,1fr))}
  .ut-dash-row>.ut-dash-full,.ut-dash-row>:last-child:nth-child(odd){grid-column:1/-1}
}
@container (min-width:1080px){
  .ut-dash-row{grid-template-columns:var(--cols)}
  .ut-dash-row>:last-child:nth-child(odd){grid-column:auto}
  .ut-dash-row>.ut-dash-full{grid-column:1/-1}
}`
