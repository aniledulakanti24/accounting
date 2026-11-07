import { useMemo, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import { api } from '../../../data/api/client'
import { formatCurrency, formatNumber } from '../../../lib/currency'
import { settleDocument, toBase } from '../../../lib/fx'
import { toast } from '../../../lib/toast'
import { useAppStore } from '../../../store/useAppStore'
import { today, useMarketRate } from './fxHooks'

const input = 'h-9 w-full px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]'

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[var(--muted)]">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="text-[11px] text-[var(--faint)]">{hint}</span>}
    </label>
  )
}

function Row({ label, value, strong, color }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className={strong ? 'font-semibold text-[var(--text)]' : 'text-[var(--muted)]'}>{label}</span>
      <span className={`tabular ${strong ? 'font-bold' : ''}`} style={{ color }}>{value}</span>
    </div>
  )
}

const pnlColor = v => (v > 0 ? 'var(--pos)' : v < 0 ? 'var(--neg)' : undefined)

/** Receive / pay all or part of a foreign-currency document. */
export function SettleModal({ doc, onClose, onSettled }) {
  const recordAudit = useAppStore(s => s.recordAudit)
  const [amount, setAmount] = useState(doc?.openAmount ?? 0)
  const [date, setDate] = useState(today())
  const [rateOverride, setRateOverride] = useState('')
  const [busy, setBusy] = useState(false)
  const [marketRate, loadingRate] = useMarketRate(doc?.currency, date)
  const rate = rateOverride !== '' ? Number(rateOverride) : marketRate

  const preview = useMemo(() => {
    if (!doc || !(rate > 0) || !(Number(amount) > 0)) return null
    try { return settleDocument(doc, { amount: Number(amount), rate }) } catch { return null }
  }, [doc, amount, rate])

  if (!doc) return null
  const verb = doc.kind === 'receivable' ? 'Receive' : 'Pay'

  async function submit() {
    setBusy(true)
    try {
      const res = await api.post(`/fx/documents/${doc.id}/settle`, { amount: Number(amount), rate, date })
      const r = res.result
      toast.success(`${doc.reference} ${r.status === 'settled' ? 'settled' : 'part-settled'} · realized ${r.realized >= 0 ? 'gain' : 'loss'} ${formatCurrency(Math.abs(r.realized))}`)
      recordAudit('fx', 'FX settlement posted', `${verb} ${doc.currency} ${r.settledAmount} on ${doc.reference} at ${rate} — realized ${r.realized}.`, { module: 'Cash & Bank' })
      onSettled?.(res)
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`${verb} ${doc.reference} · ${doc.party}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!preview || busy}>{busy ? "Posting…" : doc.kind === "receivable" ? "Post receipt" : "Post payment"}</Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Field label={`Amount (${doc.currency})`} hint={`Open: ${formatNumber(doc.openAmount)} ${doc.currency}`}>
          <input type="number" className={`${input} tabular text-right`} value={amount} max={doc.openAmount} onChange={e => setAmount(e.target.value)} />
        </Field>
        <Field label="Date">
          <input type="date" className={input} value={date} min={doc.date} max={today()} onChange={e => setDate(e.target.value)} />
        </Field>
        <Field label={`Rate (1 ${doc.currency} = ? base)`} hint={loadingRate ? 'Fetching market rate…' : `Market: ${marketRate ?? '—'} · leave blank to use it`}>
          <input type="number" step="0.000001" className={`${input} tabular text-right`} placeholder={marketRate ?? ''} value={rateOverride} onChange={e => setRateOverride(e.target.value)} />
        </Field>
        <Field label="Booked rate" hint={`Carried at ${doc.carryingRate}`}>
          <div className={`${input} flex items-center justify-end tabular bg-[var(--surface-2)]`}>{doc.bookedRate}</div>
        </Field>
      </div>
      {preview && (
        <div className="space-y-2 p-3 rounded-[var(--radius-sm)] bg-[var(--surface-2)]">
          <Row label={doc.kind === 'receivable' ? 'Base currency received' : 'Base currency paid'} value={formatCurrency(preview.baseReceived)} />
          <Row label="Carrying value of settled part" value={formatCurrency(preview.baseCarrying)} />
          <Row label="Realized gain / loss (vs booked rate)" value={formatCurrency(preview.realized)} color={pnlColor(preview.realized)} />
          <Row label="Reversal of unrealized already posted" value={formatCurrency(-preview.unrealizedReversal)} color={pnlColor(-preview.unrealizedReversal)} />
          <div className="border-t border-[var(--border)] pt-2">
            <Row label="Net effect on profit" value={formatCurrency(preview.netPnl)} strong color={pnlColor(preview.netPnl)} />
          </div>
          <p className="text-[11px] text-[var(--faint)]">{preview.status === 'settled' ? 'Fully settles the document.' : `Leaves ${formatNumber(preview.remaining)} ${doc.currency} open.`}</p>
        </div>
      )}
    </Modal>
  )
}

/** Create a foreign-currency invoice (receivable) or bill (payable). */
export function NewFxDocumentModal({ open, base, currencies, onClose, onCreated }) {
  const [form, setForm] = useState({ kind: 'receivable', party: '', currency: currencies[0] ?? 'USD', amount: '', date: today(), reference: '' })
  const [rateOverride, setRateOverride] = useState('')
  const [busy, setBusy] = useState(false)
  // Fall back to the first foreign currency if the selection is not valid for this base
  const currency = currencies.includes(form.currency) ? form.currency : currencies[0]
  const [marketRate] = useMarketRate(open ? currency : null, form.date)
  const rate = rateOverride !== '' ? Number(rateOverride) : marketRate
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function submit() {
    setBusy(true)
    try {
      const doc = await api.post('/fx/documents', { ...form, currency, amount: Number(form.amount), rate })
      toast.success(`${doc.reference} recorded · ${currency} ${formatNumber(Number(form.amount))} = ${formatCurrency(doc.baseAtBooked)}`)
      onCreated?.(doc)
      onClose()
      setForm(f => ({ ...f, party: '', amount: '', reference: '' }))
      setRateOverride('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New foreign-currency document"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={busy || !form.party.trim() || !(Number(form.amount) > 0) || !(rate > 0)}>{busy ? 'Saving…' : 'Record'}</Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <select className={input} value={form.kind} onChange={e => set('kind', e.target.value)}>
            <option value="receivable">Customer invoice (receivable)</option>
            <option value="payable">Supplier bill (payable)</option>
          </select>
        </Field>
        <Field label={form.kind === 'receivable' ? 'Customer' : 'Supplier'}>
          <input className={input} value={form.party} onChange={e => set('party', e.target.value)} placeholder="Party name" />
        </Field>
        <Field label="Currency">
          <select className={input} value={currency} onChange={e => { set('currency', e.target.value); setRateOverride('') }}>
            {currencies.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label={`Amount (${currency})`}>
          <input type="number" className={`${input} tabular text-right`} value={form.amount} onChange={e => set('amount', e.target.value)} />
        </Field>
        <Field label="Document date">
          <input type="date" className={input} value={form.date} max={today()} onChange={e => set('date', e.target.value)} />
        </Field>
        <Field label={`Rate (1 ${currency} = ? ${base})`} hint={`Market on this date: ${marketRate ?? '…'}`}>
          <input type="number" step="0.000001" className={`${input} tabular text-right`} placeholder={marketRate ?? ''} value={rateOverride} onChange={e => setRateOverride(e.target.value)} />
        </Field>
        <Field label="Reference (optional)">
          <input className={input} value={form.reference} onChange={e => set('reference', e.target.value)} placeholder="Auto-numbered" />
        </Field>
        <div className="flex flex-col justify-end">
          <span className="text-xs font-semibold text-[var(--muted)]">Booked in {base}</span>
          <span className="tabular text-lg font-bold text-[var(--text)]">{rate > 0 && Number(form.amount) > 0 ? formatCurrency(toBase(form.amount, rate)) : '—'}</span>
        </div>
      </div>
    </Modal>
  )
}
