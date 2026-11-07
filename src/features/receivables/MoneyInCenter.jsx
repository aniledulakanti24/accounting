import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, Banknote, BellRing, CheckCircle2,
  Clock3, FileText, MessageSquare, ReceiptText, Send,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import DistributionChart from '../../components/charts/DistributionChart'
import { formatCompact, formatCurrency } from '../../lib/currency'
import {
  getARAgeing,
  getARInvoices,
  getCollections,
  getReceipts,
} from '../../data/services/receivablesService'

const COLLECTION_TREND = [
  { label: 'Aug', billed: 8100000, collected: 7200000 },
  { label: 'Sep', billed: 6300000, collected: 5500000 },
  { label: 'Oct', billed: 9200000, collected: 8100000 },
  { label: 'Nov', billed: 7100000, collected: 6300000 },
  { label: 'Dec', billed: 10800000, collected: 9400000 },
  { label: 'Jan', billed: 7600000, collected: 5200000 },
]

function SignalCard({ label, value, hint, icon: Icon, color, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--surface-2)]">
          <Icon size={16} style={{ color }} />
        </span>
      </div>
      <p className="tabular text-2xl font-black text-[var(--text)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>
    </button>
  )
}

function ProgressRow({ label, value, total, color, route }) {
  const navigate = useNavigate()
  const pct = total > 0 ? Math.max(4, Math.round((value / total) * 100)) : 0
  return (
    <button type="button" onClick={() => navigate(route)} className="w-full rounded-[var(--radius-sm)] px-3 py-2 text-left transition-colors hover:bg-[var(--surface-2)]">
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[var(--muted)]">{label}</span>
        <span className="tabular text-sm font-bold text-[var(--text)]">{formatCompact(value)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </button>
  )
}

function CollectionConversion({ data }) {
  const max = Math.max(...data.map(row => row.billed), 1)
  return (
    <div className="space-y-3">
      {data.map(row => {
        const pct = row.billed ? Math.round((row.collected / row.billed) * 100) : 0
        return (
          <div key={row.label} className="grid grid-cols-[42px_minmax(0,1fr)_48px] items-center gap-3">
            <span className="text-xs font-bold text-[var(--faint)]">{row.label}</span>
            <div className="space-y-1.5">
              <div className="h-2.5 overflow-hidden rounded-full bg-[var(--primary-tint)]">
                <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${Math.max(4, Math.round((row.billed / max) * 100))}%` }} />
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[var(--pos-tint)]">
                <div className="h-full rounded-full bg-[var(--pos)]" style={{ width: `${Math.max(4, Math.round((row.collected / max) * 100))}%` }} />
              </div>
            </div>
            <span className="tabular text-right text-xs font-black text-[var(--pos)]">{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

function ActionTile({ title, value, hint, icon: Icon, tone, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[104px] items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-sm transition-colors hover:bg-[var(--surface-2)]"
    >
      <span className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-[var(--surface-2)]">
        <Icon size={18} style={{ color: tone }} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black text-[var(--text)]">{title}</span>
        <span className="mt-1 block tabular text-lg font-black" style={{ color: tone }}>{value}</span>
        <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{hint}</span>
      </span>
    </button>
  )
}

export default function MoneyInCenter() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [receipts, setReceipts] = useState([])
  const [ageing, setAgeing] = useState([])
  const [collections, setCollections] = useState([])

  useEffect(() => {
    Promise.all([getARInvoices(), getReceipts(), getARAgeing(), getCollections()])
      .then(([inv, rec, age, col]) => {
        setInvoices(inv)
        setReceipts(rec)
        setAgeing(age)
        setCollections(col)
      })
  }, [])

  const metrics = useMemo(() => {
    const billed = invoices.reduce((sum, row) => sum + row.total, 0)
    const collected = invoices.reduce((sum, row) => sum + row.paid, 0)
    const outstanding = invoices.reduce((sum, row) => sum + row.balance, 0)
    const overdue = invoices.filter(row => row.status === 'overdue').reduce((sum, row) => sum + row.balance, 0)
    const pendingReceipts = receipts.filter(row => row.status !== 'cleared').reduce((sum, row) => sum + row.amount, 0)
    const collectionRate = billed ? Math.round((collected / billed) * 100) : 0
    const dso = 34
    return { billed, collected, outstanding, overdue, pendingReceipts, collectionRate, dso }
  }, [invoices, receipts])

  const ageingTotal = ageing.reduce((sum, row) => sum + row.total, 0)
  const ageingMap = [
    { name: '0-30 Days', value: ageing.reduce((sum, row) => sum + row.current, 0) },
    { name: '31-60 Days', value: ageing.reduce((sum, row) => sum + row.d31_60, 0) },
    { name: '61-90 Days', value: ageing.reduce((sum, row) => sum + row.d61_90, 0) },
    { name: '90+ Days', value: ageing.reduce((sum, row) => sum + row.d90plus, 0) },
  ].filter(row => row.value > 0)

  const priority = collections
    .filter(row => row.status !== 'closed')
    .sort((a, b) => b.daysOverdue - a.daysOverdue || b.amount - a.amount)
    .slice(0, 5)

  return (
    <div>
      <PageHeader
        title="Money In Center"
        subtitle="Receivables, reminders, and customer collection health"
        breadcrumb={['Money In', 'Money In Center']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Send} size="sm" onClick={() => navigate('/receivables/overdue-collections')}>Send Reminders</Button>
            <Button variant="primary" icon={Banknote} size="sm" onClick={() => navigate('/receivables/payments-received')}>Record Payment</Button>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SignalCard label="Outstanding" value={formatCompact(metrics.outstanding)} hint="Unpaid and part-paid invoices" icon={FileText} color="var(--primary)" onClick={() => navigate('/receivables/receivables')} />
        <SignalCard label="Overdue" value={formatCompact(metrics.overdue)} hint="Needs collection action" icon={AlertTriangle} color="var(--neg)" onClick={() => navigate('/receivables/overdue-collections')} />
        <SignalCard label="Collected" value={`${metrics.collectionRate}%`} hint={`${formatCompact(metrics.collected)} collected`} icon={CheckCircle2} color="var(--pos)" onClick={() => navigate('/receivables/payments-received')} />
        <SignalCard label="DSO" value={`${metrics.dso} days`} hint="Average collection speed" icon={Clock3} color="var(--warn)" onClick={() => navigate('/reports/ar-ap')} />
      </div>

      <section className="mb-5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-[var(--text)]">Collect Today</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">Start with the fastest money-in actions instead of reading reports first.</p>
          </div>
          <Button variant="secondary" size="sm" iconRight={ArrowRight} onClick={() => navigate('/receivables/receivables')}>Open Invoice List</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ActionTile title="Record payment" value={formatCompact(metrics.pendingReceipts)} hint="Clear pending receipts and update balances." icon={Banknote} tone="var(--primary)" onClick={() => navigate('/receivables/payments-received/new')} />
          <ActionTile title="Send reminders" value={`${priority.length} ready`} hint="Use WhatsApp or email follow-ups for priority customers." icon={BellRing} tone="var(--warn)" onClick={() => navigate('/receivables/overdue-collections')} />
          <ActionTile title="Review overdue" value={formatCompact(metrics.overdue)} hint="Focus on invoices past due date first." icon={AlertTriangle} tone="var(--neg)" onClick={() => navigate('/receivables/overdue-collections')} />
          <ActionTile title="Share statements" value="5 due" hint="Send customer-wise statements for open balances." icon={MessageSquare} tone="var(--pos)" onClick={() => navigate('/parties/statements')} />
        </div>
      </section>

      <div className="mb-5 grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Collection Conversion</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">Billed versus collected for recent months</p>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-tint)] px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)]">Billed</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--pos-tint)] px-2.5 py-1 text-[11px] font-semibold text-[var(--pos)]">Collected</span>
            </div>
          </div>
          <CollectionConversion data={COLLECTION_TREND} />
        </section>

        <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Ageing Map</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">Where customer money is stuck</p>
            </div>
            <span className="tabular rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-bold text-[var(--muted)]">{formatCompact(ageingTotal)}</span>
          </div>
          <DistributionChart data={ageingMap} height={205} innerRadius={52} outerRadius={84} />
          <div className="mt-3 space-y-1">
            <ProgressRow label="Current / 0-30" value={ageingMap.find(row => row.name === '0-30 Days')?.value ?? 0} total={ageingTotal} color="var(--pos)" route="/receivables/overdue-collections" />
            <ProgressRow label="31-90 Days" value={(ageingMap.find(row => row.name === '31-60 Days')?.value ?? 0) + (ageingMap.find(row => row.name === '61-90 Days')?.value ?? 0)} total={ageingTotal} color="var(--warn)" route="/receivables/overdue-collections" />
            <ProgressRow label="90+ Days" value={ageingMap.find(row => row.name === '90+ Days')?.value ?? 0} total={ageingTotal} color="var(--neg)" route="/receivables/overdue-collections" />
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Collection Priority</p>
              <p className="text-xs text-[var(--muted)]">Customers to act on first</p>
            </div>
            <Button variant="secondary" size="sm" iconRight={ArrowRight} onClick={() => navigate('/receivables/overdue-collections')}>Open Queue</Button>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {priority.map(row => (
              <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--text)]">{row.customer}</p>
                  <p className="text-xs text-[var(--muted)]">{row.invoice} · {row.nextAction} · {row.assignee}</p>
                </div>
                <div className="text-right">
                  <p className="tabular text-sm font-bold text-[var(--neg)]">{formatCurrency(row.amount)}</p>
                  <p className="text-[11px] font-semibold text-[var(--muted)]">{row.daysOverdue > 0 ? `${row.daysOverdue}d overdue` : 'Due soon'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          {[
            { label: 'Reminder queue', value: `${priority.length} ready`, icon: BellRing, route: '/receivables/overdue-collections', tone: 'var(--warn)' },
            { label: 'Pending receipts', value: formatCompact(metrics.pendingReceipts), icon: ReceiptText, route: '/receivables/payments-received', tone: 'var(--primary)' },
            { label: 'Statements due', value: '5 customers', icon: MessageSquare, route: '/parties/statements', tone: 'var(--pos)' },
          ].map(item => {
            const Icon = item.icon
            return (
              <button key={item.label} type="button" onClick={() => navigate(item.route)} className="flex w-full items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-sm transition-colors hover:bg-[var(--surface-2)]">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--surface-2)]">
                    <Icon size={17} style={{ color: item.tone }} />
                  </span>
                  <span>
                    <p className="text-sm font-semibold text-[var(--text)]">{item.label}</p>
                    <p className="text-xs text-[var(--muted)]">Open workspace</p>
                  </span>
                </div>
                <span className="text-sm font-black text-[var(--text)]">{item.value}</span>
              </button>
            )
          })}
        </section>
      </div>
    </div>
  )
}
