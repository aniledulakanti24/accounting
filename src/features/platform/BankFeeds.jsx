import { useState } from 'react'
import { Landmark, Link2, Wand2, CheckCircle2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { useApi } from '../../hooks/useApi'
import { api } from '../../data/api/client'
import { formatCurrency } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { Chip, KpiStrip, ErrorBox } from '../tax/global/shared'
import { fmtDate } from '../tax/global/taxUtils'

const ACCOUNTS = ['Operating Expenses', 'Payment Processing Fees', 'Purchases', 'Sales', "Owner's Equity"]

function ConnectBank({ open, provider, onClose, onConnected }) {
  const [bank, setBank] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  async function connect() {
    setBusy(true)
    try {
      const c = await api.post('/bank/connections', { bank, consent })
      toast.success(`${c.bank} ${c.account} connected via ${c.aggregator}`)
      onConnected(); onClose()
    } catch (err) { toast.error(err.message) } finally { setBusy(false) }
  }
  return (
    <Modal open={open} onClose={onClose} title="Connect a bank feed"
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={connect} disabled={!bank || !consent || busy}>{busy ? 'Connecting…' : 'Authorise & connect'}</Button></div>}>
      <p className="text-sm text-[var(--muted)] mb-3">Secure read-only access through <strong className="text-[var(--text)]">{provider?.aggregator}</strong>. UnifiedTree never sees your banking password.</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {(provider?.banks ?? []).map(b => (
          <button key={b} type="button" onClick={() => setBank(b)} className={`flex items-center gap-2 rounded-[var(--radius-sm)] border p-3 text-left text-sm cursor-pointer ${bank === b ? 'border-[var(--primary)] bg-[var(--primary-tint)]' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
            <Landmark size={15} className="text-[var(--primary)]" /> {b}
          </button>
        ))}
      </div>
      <label className="flex items-start gap-2 text-sm text-[var(--text)] cursor-pointer">
        <input type="checkbox" className="mt-1" checked={consent} onChange={e => setConsent(e.target.checked)} />
        <span>I consent to sharing account balances and transactions for 12 months. I can revoke this at any time.</span>
      </label>
    </Modal>
  )
}

export default function BankFeeds() {
  const providers = useApi('/bank/providers')
  const connections = useApi('/bank/connections')
  const txns = useApi('/bank/transactions')
  const [connectOpen, setConnectOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const rows = txns.data ?? []

  function refresh() { connections.refetch(); txns.refetch() }

  async function act(fn, id, success) {
    setBusyId(id)
    try { const r = await fn(); toast.success(success(r)); refresh() } catch (err) { toast.error(err.message) } finally { setBusyId(null) }
  }

  const unmatched = rows.filter(t => t.status === 'unmatched')
  const exact = unmatched.filter(t => t.suggestions.some(s => s.confidence === 'exact'))
  const kpis = [
    { label: 'Connected accounts', value: connections.data?.length ?? '—' },
    { label: 'To reconcile', value: unmatched.length, color: unmatched.length ? 'var(--warn)' : 'var(--pos)' },
    { label: 'Exact matches ready', value: exact.length, color: 'var(--primary)' },
    { label: 'Reconciled', value: rows.length - unmatched.length, color: 'var(--pos)' },
  ]

  const columns = [
    { key: 'date', label: 'Date', render: v => <span className="text-sm text-[var(--muted)]">{fmtDate(v)}</span> },
    { key: 'description', label: 'Description', render: v => <span className="font-mono text-xs text-[var(--text)]">{v}</span> },
    { key: 'amount', label: 'Amount', align: 'right', render: (v, r) => <span className={`tabular text-sm font-semibold ${r.direction === 'credit' ? 'text-[var(--pos)]' : 'text-[var(--text)]'}`}>{r.direction === 'credit' ? '+' : '−'}{formatCurrency(v)}</span> },
    { key: 'status', label: 'Status', render: (v, r) => <div><Chip tone={v === 'unmatched' ? 'warn' : 'pos'} label={v === 'unmatched' ? 'To reconcile' : v === 'matched' ? 'Matched' : 'Posted'} />{r.journalId && <p className="font-mono text-[10px] text-[var(--muted)] mt-0.5">{r.journalId}</p>}</div> },
    { key: 'id', label: 'Reconcile', render: (v, r) => {
      if (r.status !== 'unmatched') return null
      if (r.suggestions.length) {
        const s = r.suggestions[0]
        return <Button size="sm" variant={s.confidence === 'exact' ? 'primary' : 'secondary'} disabled={busyId === v} onClick={() => act(() => api.post(`/bank/transactions/${v}/match`, { documentId: s.documentId }), v, () => `Matched to ${s.invoiceNo}`)}>Match {s.invoiceNo}{s.confidence === 'exact' ? '' : ' (amount)'}</Button>
      }
      return (
        <select defaultValue="" disabled={busyId === v} onChange={e => e.target.value && act(() => api.post(`/bank/transactions/${v}/categorize`, { account: e.target.value }), v, () => `Posted to ${e.target.value}`)}
          className="h-8 px-2 text-xs rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
          <option value="">Post to account… {r.suggestedAccount ? `(suggested: ${r.suggestedAccount})` : ''}</option>
          {ACCOUNTS.map(a => <option key={a}>{a}</option>)}
        </select>
      )
    } },
  ]

  return (
    <div>
      <PageHeader
        title="Bank Feeds"
        subtitle={providers.data ? `Live transactions via ${providers.data.aggregator}` : 'Loading…'}
        breadcrumb={['Cash & Bank', 'Bank Feeds']}
        action={<div className="flex gap-2">
          {exact.length > 0 && <Button size="sm" variant="secondary" icon={Wand2} onClick={() => act(() => api.post('/bank/auto-match'), 'auto', r => `Auto-matched ${r.matched} transaction(s)`)}>Auto-match {exact.length}</Button>}
          <Button size="sm" variant="primary" icon={Link2} onClick={() => setConnectOpen(true)}>Connect bank</Button>
        </div>}
      />
      <ErrorBox error={txns.error} onRetry={refresh} />
      <KpiStrip items={kpis} />
      {(connections.data ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {connections.data.map(c => (
            <span key={c.id} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text)]">
              <CheckCircle2 size={12} className="text-[var(--pos)]" /> {c.bank} {c.account} · {c.aggregator} · consent to {fmtDate(c.consentExpires)}
            </span>
          ))}
        </div>
      )}
      {!connections.loading && (connections.data ?? []).length === 0 ? (
        <div className="p-8 text-center bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-[var(--radius-sm)]">
          <Landmark size={28} className="mx-auto text-[var(--primary)] mb-2" />
          <p className="text-sm font-semibold text-[var(--text)]">No bank connected yet</p>
          <p className="text-sm text-[var(--muted)] mb-3">Connect a bank to import transactions and reconcile them in a click.</p>
          <Button variant="primary" icon={Link2} onClick={() => setConnectOpen(true)}>Connect bank</Button>
        </div>
      ) : (
        <DataTable columns={columns} data={rows} loading={txns.loading} rowKey="id" />
      )}
      <ConnectBank open={connectOpen} provider={providers.data} onClose={() => setConnectOpen(false)} onConnected={refresh} />
    </div>
  )
}
