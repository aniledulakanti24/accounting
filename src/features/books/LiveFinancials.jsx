import { useState } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { useApi } from '../../hooks/useApi'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { ErrorBox } from '../tax/global/shared'
import { Card, Money, Table, Stat, Segmented } from './ui'

const fyStart = () => { const d = new Date(); const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1; return `${y}-04-01` }
const today = () => new Date().toISOString().slice(0, 10)

function Lines({ title, rows, total, totalLabel }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{title}</p>
      {rows.map(r => (
        <div key={r.code} className="flex justify-between gap-3 border-b border-dashed border-[var(--border)] py-1.5 text-sm">
          <span className="text-[var(--text)]"><span className="me-2 font-mono text-[11px] text-[var(--faint)]">{r.code}</span>{r.name}</span>
          <Money value={r.amount} />
        </div>
      ))}
      {totalLabel && <div className="flex justify-between py-2 text-sm font-bold"><span>{totalLabel}</span><Money value={total} strong /></div>}
    </div>
  )
}

/** Statements produced from posted journals — nothing on this page is typed in. */
export default function LiveFinancials() {
  const [view, setView] = useState('pnl')
  const [from, setFrom] = useState(fyStart())
  const [to, setTo] = useState(today())
  const pnl = useApi(`/books/reports/pnl?from=${from}&to=${to}`)
  const bs = useApi(`/books/reports/balance-sheet?asOf=${to}`)
  const cf = useApi(`/books/reports/cash-flow?from=${from}&to=${to}`)
  const ar = useApi('/books/reports/ageing?type=receivable')
  const ap = useApi('/books/reports/ageing?type=payable')
  const error = pnl.error || bs.error || cf.error

  return (
    <div className="space-y-4">
      <PageHeader title="Live Financials" subtitle="Profit & loss, balance sheet, cash flow and ageing — built from every posted journal" />
      {error && <ErrorBox error={error} onRetry={() => { pnl.refetch(); bs.refetch(); cf.refetch() }} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenue" value={pnl.data ? formatCompact(pnl.data.revenue) : '—'} hint={`${from} → ${to}`} />
        <Stat label="Gross profit" value={pnl.data ? formatCompact(pnl.data.grossProfit) : '—'} hint={pnl.data ? `${pnl.data.grossMargin}% margin` : ''} tone="pos" />
        <Stat label="Net profit" value={pnl.data ? formatCompact(pnl.data.netProfit) : '—'} hint={pnl.data ? `${pnl.data.netMargin}% margin` : ''} tone={pnl.data?.netProfit < 0 ? 'neg' : 'pos'} />
        <Stat label="Cash at close" value={cf.data ? formatCompact(cf.data.closing) : '—'} hint={cf.data ? `${cf.data.net >= 0 ? '+' : ''}${formatCompact(cf.data.net)} in period` : ''} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={view} onChange={setView} options={[['pnl', 'Profit & loss'], ['bs', 'Balance sheet'], ['cf', 'Cash flow'], ['ageing', 'Ageing']]} />
        <label className="flex items-center gap-2 text-xs text-[var(--muted)]">From <input id="lf-from" type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-8 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 text-sm text-[var(--text)]" /></label>
        <label className="flex items-center gap-2 text-xs text-[var(--muted)]">To <input id="lf-to" type="date" value={to} onChange={e => setTo(e.target.value)} className="h-8 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 text-sm text-[var(--text)]" /></label>
      </div>

      {view === 'pnl' && pnl.data && (
        <Card title="Profit & loss" subtitle={`${from} to ${to}`}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <Lines title="Income" rows={pnl.data.income} total={pnl.data.revenue} totalLabel="Total income" />
              <Lines title="Cost of sales" rows={pnl.data.costOfSales} total={pnl.data.costOfSalesTotal} totalLabel="Total cost of sales" />
              <div className="flex justify-between rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm font-bold"><span>Gross profit</span><Money value={pnl.data.grossProfit} strong /></div>
            </div>
            <div className="space-y-4">
              <Lines title="Operating expenses" rows={pnl.data.expenses} total={pnl.data.opex} totalLabel="Total expenses" />
              <div className="flex justify-between rounded-lg bg-[var(--primary-tint)] px-3 py-2.5 text-base font-extrabold text-[var(--primary)]"><span>Net profit</span><span className="tabular">{formatCurrency(pnl.data.netProfit)}</span></div>
            </div>
          </div>
        </Card>
      )}

      {view === 'bs' && bs.data && (
        <Card title="Balance sheet" subtitle={`As of ${bs.data.asOf}`}
          action={bs.data.balanced
            ? <span className="flex items-center gap-1.5 rounded-full bg-[var(--pos-tint)] px-2.5 py-1 text-xs font-bold text-[var(--pos)]"><CheckCircle2 size={13} /> Balanced</span>
            : <span className="flex items-center gap-1.5 rounded-full bg-[var(--neg-tint)] px-2.5 py-1 text-xs font-bold text-[var(--neg)]"><AlertTriangle size={13} /> Out of balance</span>}>
          <div className="grid gap-6 lg:grid-cols-2">
            <Lines title="Assets" rows={bs.data.assets} total={bs.data.totalAssets} totalLabel="Total assets" />
            <div className="space-y-4">
              <Lines title="Liabilities" rows={bs.data.liabilities} total={bs.data.totalLiabilities} totalLabel="Total liabilities" />
              <Lines title="Equity" rows={bs.data.equity} total={bs.data.totalEquity} totalLabel="Total equity" />
              <div className="flex justify-between rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm font-bold"><span>Liabilities + equity</span><Money value={bs.data.totalLiabilities + bs.data.totalEquity} strong /></div>
            </div>
          </div>
        </Card>
      )}

      {view === 'cf' && cf.data && (
        <Card title="Cash flow" subtitle="Direct method — every bank and cash movement, grouped by what it was for">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-1.5 text-sm">
              {[['Opening cash', cf.data.opening], ['Operating activities', cf.data.operating], ['Investing activities', cf.data.investing], ['Financing activities', cf.data.financing]].map(([l, v]) => (
                <div key={l} className="flex justify-between border-b border-dashed border-[var(--border)] py-1.5"><span>{l}</span><Money value={v} tone={l === 'Opening cash' ? undefined : v < 0 ? 'neg' : 'pos'} /></div>
              ))}
              <div className="flex justify-between rounded-lg bg-[var(--primary-tint)] px-3 py-2.5 font-extrabold text-[var(--primary)]"><span>Closing cash</span><span className="tabular">{formatCurrency(cf.data.closing)}</span></div>
            </div>
            <Table columns={[{ key: 'label', label: 'Movement' }, { key: 'amount', label: 'Amount', align: 'right', render: r => <Money value={r.amount} tone={r.amount < 0 ? 'neg' : 'pos'} /> }]} rows={cf.data.detail} />
          </div>
        </Card>
      )}

      {view === 'ageing' && (
        <div className="grid gap-4 xl:grid-cols-2">
          {[[ar, 'Money owed to you'], [ap, 'Bills to pay']].map(([q, title]) => q.data && (
            <Card key={title} title={title} subtitle={`${formatCurrency(q.data.total)} open across ${q.data.documents.length} documents`}>
              <div className="mb-3 grid grid-cols-5 gap-2">
                {q.data.buckets.map(b => (
                  <div key={b.label} className="rounded-lg bg-[var(--surface-2)] px-2 py-2">
                    <p className="text-[10.5px] text-[var(--muted)]">{b.label}</p>
                    <p className="tabular text-sm font-bold">{formatCompact(b.amount)}</p>
                    <p className="text-[10.5px] text-[var(--faint)]">{b.count} docs</p>
                  </div>
                ))}
              </div>
              <Table columns={[
                { key: 'number', label: 'Document', render: r => <span className="font-mono text-xs">{r.number}</span> },
                { key: 'party', label: 'Party' },
                { key: 'dueDate', label: 'Due' },
                { key: 'daysOverdue', label: 'Late', render: r => r.daysOverdue ? <span className="font-semibold text-[var(--neg)]">{r.daysOverdue}d</span> : <span className="text-[var(--muted)]">—</span> },
                { key: 'balance', label: 'Balance', align: 'right', render: r => <Money value={r.balance} /> },
              ]} rows={q.data.documents} empty="Nothing open" />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
