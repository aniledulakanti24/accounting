import { useState } from 'react'
import { CheckCircle2, Send, HandCoins } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { api } from '../../data/api/client'
import { toast } from '../../lib/toast'
import { formatCurrency } from '../../lib/currency'
import { useAppStore } from '../../store/useAppStore'
import { ErrorBox, Chip } from '../tax/global/shared'
import { Card, Money, Table, Stat } from './ui'
import { inputCls } from './styles'

/** Supplier bills with maker-checker: bills above the limit post only after someone else approves. */
export default function BillApprovals() {
  const me = useAppStore(s => s.session?.user)
  const parties = useApi('/books/parties')
  const items = useApi('/books/items')
  const bills = useApi('/books/bills')
  const [form, setForm] = useState({ partyId: '', itemId: '', qty: 1, rate: '', supplierRef: '' })
  const suppliers = (parties.data ?? []).filter(p => p.type === 'supplier')
  const pending = (bills.data ?? []).filter(b => b.status === 'pending_approval')
  const refresh = () => { bills.refetch(); parties.refetch(); items.refetch() }

  async function act(promise, done) {
    try { const r = await promise; toast.success(done(r)); refresh() } catch (err) { toast.error(err.message) }
  }
  function submit() {
    if (!form.partyId || !form.itemId || !form.rate) return toast.error('Choose a supplier and item, and enter a rate')
    act(api.post('/books/bills', { partyId: form.partyId, supplierRef: form.supplierRef || undefined, lines: [{ itemId: form.itemId, qty: Number(form.qty), rate: Number(form.rate) }] }),
      b => b.status === 'pending_approval' ? `Bill ${b.id} is waiting for approval (${formatCurrency(b.total)})` : `Bill ${b.id} posted`)
    setForm(f => ({ ...f, qty: 1, rate: '', supplierRef: '' }))
    return undefined
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Bill Approvals" subtitle="Bills above the approval limit wait for a second person before they reach the books" />
      {bills.error && <ErrorBox error={bills.error} onRetry={refresh} />}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Waiting for approval" value={pending.length} tone={pending.length ? 'warn' : undefined} />
        <Stat label="Value waiting" value={formatCurrency(pending.reduce((s, b) => s + b.total, 0))} />
        <Stat label="Open bills" value={(bills.data ?? []).filter(b => b.status === 'open').length} />
        <Stat label="Owed to suppliers" value={formatCurrency((bills.data ?? []).reduce((s, b) => s + (b.status === 'open' ? b.balance : 0), 0))} tone="neg" />
      </div>

      <Card title="Record a bill" subtitle="Stock items go to inventory at cost; GST paid becomes input tax credit">
        <div className="grid gap-2 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_90px_120px_minmax(0,1fr)_auto]">
          <select id="bill-party" className={inputCls} value={form.partyId} onChange={e => setForm(f => ({ ...f, partyId: e.target.value }))}>
            <option value="">Supplier…</option>{suppliers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select id="bill-item" className={inputCls} value={form.itemId} onChange={e => setForm(f => ({ ...f, itemId: e.target.value }))}>
            <option value="">Item…</option>{(items.data ?? []).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <input id="bill-qty" type="number" min="1" aria-label="Quantity" className={inputCls} value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
          <input id="bill-rate" type="number" min="0" placeholder="Rate" aria-label="Rate" className={inputCls} value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} />
          <input id="bill-ref" placeholder="Supplier invoice no." className={inputCls} value={form.supplierRef} onChange={e => setForm(f => ({ ...f, supplierRef: e.target.value }))} />
          <Button size="sm" variant="primary" icon={Send} onClick={submit}>Submit</Button>
        </div>
      </Card>

      <Card title="Waiting for approval" subtitle={`You can't approve a bill you entered yourself${me ? ` (${me.name})` : ''}`}>
        <Table columns={[
          { key: 'id', label: 'Bill', render: r => <span className="font-mono text-xs">{r.id}</span> },
          { key: 'partyName', label: 'Supplier' },
          { key: 'supplierRef', label: 'Their ref' },
          { key: 'total', label: 'Amount', align: 'right', render: r => <Money value={r.total} strong /> },
          { key: 'createdBy', label: 'Entered by', render: r => r.createdBy === me?.id ? 'You' : r.createdBy },
          { key: 'a', label: '', render: r => <span className="flex justify-end"><Button size="sm" variant="secondary" icon={CheckCircle2} disabled={r.createdBy === me?.id} onClick={() => act(api.post(`/books/bills/${r.id}/approve`), b => `Bill ${b.id} approved and posted`)}>Approve</Button></span> },
        ]} rows={pending} empty="Nothing waiting — all bills are approved" />
      </Card>

      <Card title="All bills">
        <Table columns={[
          { key: 'id', label: 'Bill', render: r => <span className="font-mono text-xs">{r.id}</span> },
          { key: 'partyName', label: 'Supplier' },
          { key: 'date', label: 'Date' },
          { key: 'tax', label: 'Input tax', align: 'right', render: r => <Money value={r.tax} /> },
          { key: 'total', label: 'Total', align: 'right', render: r => <Money value={r.total} /> },
          { key: 'balance', label: 'Due', align: 'right', render: r => <Money value={r.balance} /> },
          { key: 'status', label: 'Status', render: r => <Chip tone={r.status === 'paid' ? 'pos' : r.status === 'open' ? 'primary' : 'warn'} label={r.status.replace('_', ' ')} /> },
          { key: 'p', label: '', render: r => r.status === 'open' && r.balance > 0 ? <span className="flex justify-end"><Button size="sm" variant="ghost" icon={HandCoins} onClick={() => act(api.post('/books/payments', { type: 'payment', partyId: r.partyId, amount: r.balance, allocations: [{ docId: r.id, amount: r.balance }] }), p => `Payment ${p.id} recorded`)}>Pay</Button></span> : null },
        ]} rows={bills.data ?? []} />
      </Card>
    </div>
  )
}
