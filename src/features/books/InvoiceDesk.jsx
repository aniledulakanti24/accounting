import { useState } from 'react'
import { Plus, Trash2, Repeat, Undo2, HandCoins, ShieldAlert } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { api } from '../../data/api/client'
import { toast } from '../../lib/toast'
import { formatCurrency } from '../../lib/currency'
import { useCan } from '../../hooks/useCan'
import { ErrorBox, Chip } from '../tax/global/shared'
import { Card, Money, Table } from './ui'
import { inputCls } from './styles'

const blank = () => ({ itemId: '', qty: 1, rate: '' })

/** Raise invoices that post to the books, with stock, tax and credit-limit checks. */
export default function InvoiceDesk() {
  const can = useCan()
  const parties = useApi('/books/parties')
  const items = useApi('/books/items')
  const invoices = useApi('/books/invoices')
  const recurring = useApi('/books/recurring')
  const [partyId, setPartyId] = useState('')
  const [lines, setLines] = useState([blank()])
  const [busy, setBusy] = useState(false)
  const [limitHit, setLimitHit] = useState(null)
  const fx = useApi('/fx/rates')
  const [currency, setCurrency] = useState('')
  const [fxRate, setFxRate] = useState('')
  const base = fx.data?.base
  const foreign = currency && currency !== base
  const customers = (parties.data ?? []).filter(p => p.type === 'customer')
  const party = customers.find(p => p.id === partyId)
  const itemById = id => (items.data ?? []).find(i => i.id === id)
  const preview = lines.reduce((s, l) => {
    const it = itemById(l.itemId); if (!it) return s
    const taxable = Number(l.qty || 0) * Number(l.rate || it.salePrice)
    return s + taxable * (1 + it.taxRate / 100)
  }, 0)

  const refresh = () => { invoices.refetch(); parties.refetch(); items.refetch(); recurring.refetch() }

  async function submit(override = false) {
    if (!partyId) return toast.error('Choose a customer')
    const clean = lines.filter(l => l.itemId).map(l => ({ itemId: l.itemId, qty: Number(l.qty), ...(l.rate ? { rate: Number(l.rate) } : {}) }))
    if (!clean.length) return toast.error('Add at least one item')
    setBusy(true)
    try {
      const inv = await api.post('/books/invoices', { partyId, lines: clean, overrideCreditLimit: override, ...(foreign ? { currency, baseCurrency: base, fxRate: Number(fxRate) } : {}) })
      toast.success(`Invoice ${inv.number} raised · ${foreign ? `${currency} ${inv.total.toLocaleString()} = ` : ''}${formatCurrency(inv.totalBase)}`)
      setLines([blank()]); setLimitHit(null); refresh()
    } catch (err) {
      if (err.details?.code === 'CREDIT_LIMIT') setLimitHit(err.details)
      else toast.error(err.message)
    } finally { setBusy(false) }
    return undefined
  }

  async function act(promise, done) {
    try { const r = await promise; toast.success(done(r)); refresh() } catch (err) { toast.error(err.message) }
  }

  const canOverride = can.role === 'Super Admin' || can.role === 'Finance Lead'
  return (
    <div className="space-y-4">
      <PageHeader title="Invoice Desk" subtitle="Every invoice posts sales, tax and cost of goods sold to the ledger straight away" />
      {invoices.error && <ErrorBox error={invoices.error} onRetry={refresh} />}

      <Card title="New invoice" subtitle="Rates default to the item's sale price; tax and GST split follow the customer's state">
        <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <select id="inv-party" className={inputCls} value={partyId} onChange={e => { setPartyId(e.target.value); setLimitHit(null) }}>
            <option value="">Choose customer…</option>
            {customers.map(p => <option key={p.id} value={p.id}>{p.name}{p.gstin ? ` · ${p.gstin}` : ''}</option>)}
          </select>
          <div className="flex gap-2">
            <select id="inv-currency" aria-label="Invoice currency" className={inputCls} value={currency || base || ''} onChange={e => { const c = e.target.value; setCurrency(c); setFxRate(c !== base && fx.data?.rates?.[c] ? String(Math.round(fx.data.rates[c] * 10000) / 10000) : '') }}>
              {base && <option value={base}>{base} (home)</option>}
              {['USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD'].filter(c => c !== base).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {foreign && <input id="inv-fx" type="number" step="0.0001" aria-label={`${base} per 1 ${currency}`} title={`${base} per 1 ${currency}`} className={inputCls} value={fxRate} onChange={e => setFxRate(e.target.value)} />}
          </div>
          {foreign && <p className="text-xs text-[var(--muted)] md:col-span-2">Prices are in {currency}. The books record {base} at 1 {currency} = {fxRate} {base}, and receipts are entered in {base}.</p>}
          {party && (
            <p className="flex items-center text-xs text-[var(--muted)]">
              Owes {formatCurrency(party.outstanding)}{party.creditLimit ? ` of ${formatCurrency(party.creditLimit)} limit` : ' · no credit limit'} · {party.terms}-day terms
            </p>
          )}
        </div>
        <div className="mt-3 space-y-2">
          {lines.map((l, i) => {
            const it = itemById(l.itemId)
            return (
              <div key={i} className="grid grid-cols-[minmax(0,3fr)_90px_120px_auto] items-center gap-2">
                <select id={`inv-item-${i}`} className={inputCls} value={l.itemId} onChange={e => setLines(ls => ls.map((x, k) => k === i ? { ...x, itemId: e.target.value } : x))}>
                  <option value="">Item…</option>
                  {(items.data ?? []).map(it2 => <option key={it2.id} value={it2.id}>{it2.name}{it2.type !== 'service' ? ` (${it2.stock.qty} ${it2.unit} in stock)` : ''}</option>)}
                </select>
                <input id={`inv-qty-${i}`} type="number" min="0" className={inputCls} value={l.qty} onChange={e => setLines(ls => ls.map((x, k) => k === i ? { ...x, qty: e.target.value } : x))} aria-label="Quantity" />
                <input id={`inv-rate-${i}`} type="number" min="0" className={inputCls} placeholder={it ? String(it.salePrice) : 'Rate'} value={l.rate} onChange={e => setLines(ls => ls.map((x, k) => k === i ? { ...x, rate: e.target.value } : x))} aria-label="Rate" />
                <button type="button" aria-label="Remove line" onClick={() => setLines(ls => ls.length > 1 ? ls.filter((_, k) => k !== i) : [blank()])} className="rounded-md border-0 bg-transparent p-2 text-[var(--muted)] hover:bg-[var(--surface-2)] cursor-pointer"><Trash2 size={15} /></button>
              </div>
            )
          })}
        </div>
        {limitHit && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--warn)] bg-[var(--warn-tint)] px-3 py-2.5 text-sm">
            <ShieldAlert size={16} className="text-[var(--warn)]" />
            <span className="flex-1">Over credit limit: owes {formatCurrency(limitHit.outstanding)} against a limit of {formatCurrency(limitHit.limit)}.</span>
            {canOverride
              ? <Button size="sm" variant="secondary" onClick={() => submit(true)} disabled={busy}>Override and raise</Button>
              : <span className="text-xs text-[var(--muted)]">Ask a Finance Lead to override.</span>}
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Button size="sm" variant="ghost" icon={Plus} onClick={() => setLines(ls => [...ls, blank()])}>Add line</Button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--muted)]">Approx. total <strong className="tabular text-[var(--text)]">{formatCurrency(preview)}</strong></span>
            <Button size="sm" variant="primary" onClick={() => submit(false)} disabled={busy || !can('create', 'sales')}>Raise invoice</Button>
          </div>
        </div>
      </Card>

      <Card title="Invoices" subtitle="Newest first">
        <Table columns={[
          { key: 'number', label: 'Number', render: r => <span className="font-mono text-xs">{r.number}</span> },
          { key: 'partyName', label: 'Customer' },
          { key: 'date', label: 'Date' },
          { key: 'gst', label: 'Tax', render: r => <span className="text-xs text-[var(--muted)]">{r.igst ? `IGST ${formatCurrency(r.igst)}` : r.cgst ? `CGST+SGST ${formatCurrency(r.cgst + r.sgst)}` : formatCurrency(r.tax)}</span> },
          { key: 'total', label: 'Total', align: 'right', render: r => <Money value={r.totalBase} /> },
          { key: 'balance', label: 'Due', align: 'right', render: r => <Money value={r.balance} tone={r.balance > 0 ? undefined : 'pos'} /> },
          { key: 'status', label: 'Status', render: r => <Chip tone={r.status === 'paid' ? 'pos' : 'warn'} label={r.status} /> },
          { key: 'actions', label: '', render: r => (
            <span className="flex justify-end gap-1">
              {r.balance > 0 && <Button size="sm" variant="ghost" icon={HandCoins} onClick={() => act(api.post('/books/payments', { type: 'receipt', partyId: r.partyId, amount: r.balance, allocations: [{ docId: r.id, amount: r.balance }] }), p => `Receipt ${p.id} recorded`)}>Receive</Button>}
              <Button size="sm" variant="ghost" icon={Undo2} onClick={() => act(api.post(`/books/invoices/${r.id}/credit-note`, { fraction: 1, reason: 'Full return' }), n => `Credit note ${n.id} issued`)}>Credit</Button>
            </span>
          ) },
        ]} rows={invoices.data ?? []} />
      </Card>

      <Card title="Recurring invoices" subtitle="Schedules raise invoices automatically when due"
        action={<Button size="sm" variant="secondary" icon={Repeat} onClick={() => act(api.post('/books/recurring/run', {}), r => `${r.created.length} recurring invoice(s) raised`)}>Run due now</Button>}>
        <Table columns={[
          { key: 'id', label: 'Schedule', render: r => <span className="font-mono text-xs">{r.id}</span> },
          { key: 'party', label: 'Customer', render: r => customers.find(p => p.id === r.partyId)?.name ?? r.partyId },
          { key: 'memo', label: 'What' },
          { key: 'every', label: 'Repeats', render: r => <span className="capitalize">{r.every}</span> },
          { key: 'nextDate', label: 'Next invoice' },
        ]} rows={recurring.data ?? []} />
      </Card>
    </div>
  )
}
