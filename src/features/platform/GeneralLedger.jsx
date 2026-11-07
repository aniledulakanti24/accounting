import { useMemo, useState } from 'react'
import { Plus, Trash2, Undo2, Lock, CheckCircle2, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { api } from '../../data/api/client'
import { formatCurrency } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { Chip, KpiStrip, ErrorBox } from '../tax/global/shared'
import { fmtDate } from '../tax/global/taxUtils'

const input = 'h-9 w-full px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]'
const today = () => new Date().toISOString().slice(0, 10)
const blankLine = () => ({ account: '', debit: '', credit: '' })

function TrialBalance({ tb, loading }) {
  if (loading || !tb) return <p className="p-4 text-sm text-[var(--muted)]">Loading…</p>
  const rows = tb.rows.filter(r => r.debit || r.credit)
  return (
    <div className="overflow-x-auto bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--surface-2)] text-left text-xs uppercase tracking-wider text-[var(--muted)]">
            <th className="px-3 py-2">Code</th><th className="px-3 py-2">Account</th><th className="px-3 py-2">Type</th>
            <th className="px-3 py-2 text-right">Debit</th><th className="px-3 py-2 text-right">Credit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.code} className="border-t border-[var(--border)]">
              <td className="px-3 py-2 font-mono text-xs text-[var(--muted)]">{r.code}</td>
              <td className="px-3 py-2 text-[var(--text)]">{r.name}</td>
              <td className="px-3 py-2 text-xs capitalize text-[var(--muted)]">{r.type}</td>
              <td className="px-3 py-2 text-right tabular">{r.balanceDebit ? formatCurrency(r.balanceDebit) : ''}</td>
              <td className="px-3 py-2 text-right tabular">{r.balanceCredit ? formatCurrency(r.balanceCredit) : ''}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-[var(--border)] font-bold">
            <td className="px-3 py-2" colSpan={3}>Total {tb.balanced ? '' : '(out of balance)'}</td>
            <td className="px-3 py-2 text-right tabular">{formatCurrency(tb.totalDebit)}</td>
            <td className="px-3 py-2 text-right tabular">{formatCurrency(tb.totalCredit)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function Journals({ journals, onReverse }) {
  return (
    <div className="space-y-2">
      {journals.map(j => (
        <div key={j.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-3">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-xs font-semibold text-[var(--text)]">{j.id}</span>
            <span className="text-xs text-[var(--muted)]">{fmtDate(j.date)}</span>
            <Chip tone={j.source === 'manual' ? 'primary' : j.source === 'reversal' ? 'warn' : 'muted'} label={j.source} />
            <span className="text-sm text-[var(--text)] flex-1 min-w-0 truncate">{j.memo}</span>
            {j.source !== 'reversal' && !j.reversedBy && (
              <Button size="sm" variant="ghost" icon={Undo2} onClick={() => onReverse(j)}>Reverse</Button>
            )}
          </div>
          <table className="w-full text-xs">
            <tbody>
              {j.lines.map((l, i) => (
                <tr key={i}>
                  <td className={`py-0.5 ${l.credit ? 'ps-6' : ''} text-[var(--text)]`}><span className="font-mono text-[var(--muted)] me-2">{l.account}</span>{l.accountName}</td>
                  <td className="py-0.5 text-right tabular w-32">{l.debit ? formatCurrency(l.debit) : ''}</td>
                  <td className="py-0.5 text-right tabular w-32">{l.credit ? formatCurrency(l.credit) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

function NewJournal({ accounts, onPosted }) {
  const [date, setDate] = useState(today())
  const [memo, setMemo] = useState('')
  const [lines, setLines] = useState([blankLine(), blankLine()])
  const [busy, setBusy] = useState(false)
  const dr = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0)
  const cr = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
  const balanced = dr > 0 && Math.abs(dr - cr) < 0.005

  const set = (i, k, v) => setLines(ls => ls.map((l, j) => (j === i ? { ...l, [k]: v, ...(k === 'debit' && v ? { credit: '' } : {}), ...(k === 'credit' && v ? { debit: '' } : {}) } : l)))

  async function post() {
    setBusy(true)
    try {
      const j = await api.post('/ledger/journals', { date, memo, lines: lines.filter(l => l.account).map(l => ({ account: l.account, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })) })
      toast.success(`Journal ${j.id} posted`)
      setMemo(''); setLines([blankLine(), blankLine()])
      onPosted()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4">
      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 mb-3">
        <input type="date" className={input} value={date} onChange={e => setDate(e.target.value)} />
        <input className={input} placeholder="Narration" value={memo} onChange={e => setMemo(e.target.value)} />
      </div>
      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-[1fr_120px_120px_36px] gap-2">
            <select className={input} value={l.account} onChange={e => set(i, 'account', e.target.value)}>
              <option value="">Account…</option>
              {accounts.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
            </select>
            <input type="number" min="0" step="0.01" placeholder="Debit" className={`${input} text-right tabular`} value={l.debit} onChange={e => set(i, 'debit', e.target.value)} />
            <input type="number" min="0" step="0.01" placeholder="Credit" className={`${input} text-right tabular`} value={l.credit} onChange={e => set(i, 'credit', e.target.value)} />
            <button type="button" aria-label="Remove line" disabled={lines.length <= 2} onClick={() => setLines(ls => ls.filter((_, j) => j !== i))} className="flex items-center justify-center rounded border-0 bg-transparent text-[var(--muted)] hover:text-[var(--neg)] cursor-pointer disabled:opacity-30"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <Button size="sm" variant="ghost" icon={Plus} onClick={() => setLines(ls => [...ls, blankLine()])}>Add line</Button>
        <span className="ms-auto text-sm tabular text-[var(--muted)]">Debits {formatCurrency(dr)} · Credits {formatCurrency(cr)}</span>
        <span className={`flex items-center gap-1 text-xs font-semibold ${balanced ? 'text-[var(--pos)]' : 'text-[var(--warn)]'}`}>
          {balanced ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}{balanced ? 'Balanced' : 'Must balance'}
        </span>
        <Button size="sm" variant="primary" onClick={post} disabled={!balanced || busy}>{busy ? 'Posting…' : 'Post journal'}</Button>
      </div>
    </div>
  )
}

export default function GeneralLedger() {
  const [view, setView] = useState('tb')
  const [lockDate, setLockDate] = useState('')
  const tb = useApi('/ledger/trial-balance')
  const journals = useApi('/ledger/journals?limit=200')
  const reversed = useMemo(() => new Set((journals.data ?? []).filter(j => j.reverses).map(j => j.reverses)), [journals.data])
  const list = (journals.data ?? []).map(j => ({ ...j, reversedBy: reversed.has(j.id) }))

  function refresh() { tb.refetch(); journals.refetch() }

  async function reverse(j) {
    try {
      const r = await api.post(`/ledger/journals/${j.id}/reverse`, { date: today() })
      toast.success(`${j.id} reversed by ${r.id}`)
      refresh()
    } catch (err) { toast.error(err.message) }
  }

  async function lock() {
    try {
      const r = await api.post('/ledger/lock', { through: lockDate })
      toast.success(`Books closed through ${fmtDate(r.lockedThrough)}`)
    } catch (err) { toast.error(err.message) }
  }

  const income = (tb.data?.rows ?? []).filter(r => r.type === 'income').reduce((s, r) => s + r.balance, 0)
  const expense = (tb.data?.rows ?? []).filter(r => r.type === 'expense').reduce((s, r) => s + r.balance, 0)
  const kpis = [
    { label: 'Trial balance', value: tb.data ? (tb.data.balanced ? 'Balanced' : 'Out of balance') : '—', color: tb.data?.balanced ? 'var(--pos)' : 'var(--neg)', hint: tb.data ? `${formatCurrency(tb.data.totalDebit)} each side` : '' },
    { label: 'Journals', value: journals.data?.length ?? '—' },
    { label: 'Income', value: formatCurrency(income), color: 'var(--pos)' },
    { label: 'Net result', value: formatCurrency(income - expense), color: income - expense >= 0 ? 'var(--pos)' : 'var(--neg)' },
  ]

  return (
    <div>
      <PageHeader title="General Ledger" subtitle="Double-entry books — every posting balances, journals are immutable" breadcrumb={['Reports', 'General Ledger']} />
      <ErrorBox error={tb.error} onRetry={refresh} />
      <KpiStrip items={kpis} />
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {[['tb', 'Trial balance'], ['journals', 'Journals'], ['new', 'New journal'], ['close', 'Close period']].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} className={`h-8 px-3 text-xs font-medium rounded-full border cursor-pointer ${view === k ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]'}`}>{l}</button>
        ))}
      </div>
      {view === 'tb' && <TrialBalance tb={tb.data} loading={tb.loading} />}
      {view === 'journals' && <Journals journals={list} onReverse={reverse} />}
      {view === 'new' && <NewJournal accounts={tb.data?.rows ?? []} onPosted={refresh} />}
      {view === 'close' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 max-w-lg">
          <p className="text-sm text-[var(--text)] mb-3">Closing a period stops any posting dated on or before the date — corrections then go into an open period.</p>
          <div className="flex gap-2">
            <input type="date" className={input} value={lockDate} onChange={e => setLockDate(e.target.value)} />
            <Button variant="primary" icon={Lock} disabled={!lockDate} onClick={lock}>Close books</Button>
          </div>
        </div>
      )}
    </div>
  )
}
