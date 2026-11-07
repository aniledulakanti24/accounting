import { useState } from 'react'
import { Wand2, Upload, Trash2, Plus, CheckCircle2, AlertTriangle, Link2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { api } from '../../data/api/client'
import { toast } from '../../lib/toast'
import { formatCurrency } from '../../lib/currency'
import { ErrorBox, Chip } from '../tax/global/shared'
import { Card, Money, Table, Stat } from './ui'
import { inputCls } from './styles'

const SAMPLE = `Date,Description,Amount,Balance
05/11/2026,BANK CHARGES QTR,-118,
06/11/2026,OFFICE RENT NOV,-75000,
06/11/2026,INTEREST CREDIT,412,`

const ACCOUNTS = ['Operating Expenses', 'Payment Processing Fees', 'Purchases', 'Sales', 'Owner\'s Equity', 'Cash']

/** Bank rules, CSV statement upload, matching bank lines to the books, and the reconciliation statement. */
export default function BankReconcile() {
  const rules = useApi('/bank/rules')
  const lines = useApi('/bank/book-matches')
  const recon = useApi('/bank/reconciliation')
  const [csv, setCsv] = useState(SAMPLE)
  const [rule, setRule] = useState({ name: '', contains: '', direction: 'debit', account: 'Operating Expenses', maxAmount: '' })
  const refresh = () => { rules.refetch(); lines.refetch(); recon.refetch() }
  async function act(promise, done) {
    try { const r = await promise; toast.success(done(r)); refresh() } catch (err) { toast.error(err.message) }
  }
  async function readFile(e) {
    const file = e.target.files?.[0]
    if (file) setCsv(await file.text())
  }
  const r = recon.data

  return (
    <div className="space-y-4">
      <PageHeader title="Rules & Reconciliation" subtitle="Let rules post the routine lines, match the rest to invoices and bills, and prove the bank balance" />
      {(recon.error || lines.error) && <ErrorBox error={recon.error || lines.error} onRetry={refresh} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Balance per books" value={r ? formatCurrency(r.bookBalance) : '—'} />
        <Stat label="Balance per bank" value={r ? formatCurrency(r.bankBalance) : '—'} hint={r?.bankBalanceSource} />
        <Stat label="Lines to reconcile" value={lines.data?.length ?? '—'} tone={lines.data?.length ? 'warn' : 'pos'} />
        <Stat label="Unexplained difference" value={r ? formatCurrency(r.unexplained) : '—'} tone={r && r.unexplained !== 0 ? 'neg' : 'pos'} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Upload a bank statement" subtitle="CSV from any bank — Date, Description and Amount (or Debit/Credit). Duplicates are skipped."
          action={<label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--surface-2)]"><Upload size={14} /> Choose file<input id="stmt-file" type="file" accept=".csv,text/csv" className="hidden" onChange={readFile} /></label>}>
          <textarea id="stmt-csv" rows={6} value={csv} onChange={e => setCsv(e.target.value)} className={`${inputCls} !h-auto py-2 font-mono text-xs`} aria-label="Statement CSV" />
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="primary" icon={Upload} onClick={() => act(api.post('/bank/statement/import', { csv }), x => `${x.added} line(s) added, ${x.duplicates} duplicate(s) skipped`)}>Import statement</Button>
          </div>
        </Card>

        <Card title="Bank rules" subtitle="Words to look for (separate with |) and the account to post to"
          action={<Button size="sm" variant="secondary" icon={Wand2} onClick={() => act(api.post('/bank/rules/apply'), x => `Rules posted ${x.categorised} line(s)`)}>Apply rules</Button>}>
          <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_110px_minmax(0,1.3fr)_auto]">
            <input id="rule-name" placeholder="Rule name" className={inputCls} value={rule.name} onChange={e => setRule(x => ({ ...x, name: e.target.value }))} />
            <input id="rule-contains" placeholder="e.g. RENT|LEASE" className={inputCls} value={rule.contains} onChange={e => setRule(x => ({ ...x, contains: e.target.value }))} />
            <select id="rule-dir" className={inputCls} value={rule.direction} onChange={e => setRule(x => ({ ...x, direction: e.target.value }))}><option value="debit">Money out</option><option value="credit">Money in</option><option value="any">Either</option></select>
            <select id="rule-account" className={inputCls} value={rule.account} onChange={e => setRule(x => ({ ...x, account: e.target.value }))}>{ACCOUNTS.map(a => <option key={a}>{a}</option>)}</select>
            <Button size="sm" variant="ghost" icon={Plus} onClick={() => act(api.post('/bank/rules', rule), x => `Rule "${x.name}" added`)}>Add</Button>
          </div>
          <Table columns={[
            { key: 'name', label: 'Rule' },
            { key: 'contains', label: 'Looks for', render: x => <span className="font-mono text-xs">{x.contains}</span> },
            { key: 'account', label: 'Posts to' },
            { key: 'hits', label: 'Used', align: 'right' },
            { key: 'd', label: '', render: x => <button type="button" aria-label={`Delete ${x.name}`} onClick={() => act(api.delete(`/bank/rules/${x.id}`), () => 'Rule deleted')} className="rounded p-1 text-[var(--muted)] hover:bg-[var(--surface-2)] cursor-pointer border-0 bg-transparent"><Trash2 size={14} /></button> },
          ]} rows={rules.data ?? []} />
        </Card>
      </div>

      <Card title="Match to invoices and bills" subtitle="Suggestions score the amount (60), the document number (30) and the party name (10)">
        <Table columns={[
          { key: 'date', label: 'Date' },
          { key: 'description', label: 'Bank description', render: x => <span className="text-xs">{x.description}</span> },
          { key: 'amount', label: 'Amount', align: 'right', render: x => <Money value={x.direction === 'debit' ? -x.amount : x.amount} tone={x.direction === 'debit' ? 'neg' : 'pos'} /> },
          { key: 's', label: 'Best match in the books', render: x => x.bookSuggestions?.length ? (
            <span className="flex flex-wrap items-center gap-2">
              {x.bookSuggestions.slice(0, 2).map(s => (
                <Button key={s.docId} size="sm" variant={s.score >= 90 ? 'primary' : 'secondary'} icon={Link2}
                  onClick={() => act(api.post(`/bank/transactions/${x.id}/settle`, { docId: s.docId }), () => `Settled against ${s.number}`)}>
                  {s.number} · {s.party.split(' ')[0]} · {s.score}%
                </Button>
              ))}
            </span>
          ) : <span className="text-xs text-[var(--faint)]">No match — add a rule or post it manually</span> },
        ]} rows={lines.data ?? []} empty="Every bank line is reconciled" />
      </Card>

      {r && (
        <Card title="Bank reconciliation statement" subtitle={`As of ${r.asOf}`}
          action={r.reconciled
            ? <Chip tone="pos" label="Reconciled" />
            : <span className="flex items-center gap-1 text-xs font-semibold text-[var(--warn)]"><AlertTriangle size={13} /> Items to clear</span>}>
          <div className="max-w-2xl space-y-1 text-sm">
            <div className="flex justify-between py-1.5 font-semibold"><span>Balance per books</span><Money value={r.bookBalance} /></div>
            {r.adjustments.map(a => (
              <div key={a.label} className="flex justify-between border-b border-dashed border-[var(--border)] py-1.5">
                <span className="text-[var(--muted)]">{a.label} <span className="text-[var(--faint)]">({a.items.length})</span></span>
                <Money value={a.amount} tone={a.amount < 0 ? 'neg' : a.amount > 0 ? 'pos' : undefined} />
              </div>
            ))}
            <div className="flex justify-between py-1.5 font-semibold"><span>Adjusted balance</span><Money value={r.adjustedBookBalance} /></div>
            <div className="flex justify-between py-1.5 font-semibold"><span>Balance per bank</span><Money value={r.bankBalance} /></div>
            <div className={`flex items-center justify-between rounded-lg px-3 py-2 font-bold ${r.unexplained === 0 ? 'bg-[var(--pos-tint)] text-[var(--pos)]' : 'bg-[var(--neg-tint)] text-[var(--neg)]'}`}>
              <span className="flex items-center gap-1.5">{r.unexplained === 0 ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />} Unexplained difference</span>
              <span className="tabular">{formatCurrency(r.unexplained)}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
