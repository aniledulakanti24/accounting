import { useState } from 'react'
import { Download, QrCode, Truck, XCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { api } from '../../data/api/client'
import { toast } from '../../lib/toast'
import { formatCurrency } from '../../lib/currency'
import { ErrorBox, Chip } from '../tax/global/shared'
import { Card, Money, Table, Stat, Segmented } from './ui'
import { inputCls } from './styles'

const STATUS_TONE = { matched: 'pos', mismatch: 'warn', missing_in_2b: 'neg', missing_in_books: 'primary' }
const STATUS_LABEL = { matched: 'Matched', mismatch: 'Value differs', missing_in_2b: 'Not in 2B', missing_in_books: 'Not in books' }

function download(name, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** GSTR-1, GSTR-3B, GSTR-2B matching, e-invoices and e-way bills — all from posted invoices and bills. */
export default function GstFromBooks() {
  const periods = useApi('/gst/periods')
  const [picked, setPicked] = useState('')
  const period = picked || periods.data?.[0] || ''
  const q = period ? `?period=${period}` : ''
  const g1 = useApi(period ? `/gst/gstr1${q}` : null)
  const g3 = useApi(period ? `/gst/gstr3b${q}` : null)
  const twoB = useApi(period ? `/gst/2b-recon${q}` : null)
  const invoices = useApi('/books/invoices')
  const [view, setView] = useState('r1')
  const [ewb, setEwb] = useState({ id: null, vehicleNo: '', distanceKm: '' })
  const refresh = () => { g1.refetch(); g3.refetch(); twoB.refetch(); invoices.refetch() }
  async function act(promise, done) {
    try { const r = await promise; toast.success(done(r)); refresh() } catch (err) { toast.error(err.message) }
  }
  const monthInvoices = (invoices.data ?? []).filter(i => !period || i.date.startsWith(period))
  const heads = ['igst', 'cgst', 'sgst']

  return (
    <div className="space-y-4">
      <PageHeader title="GST from Books" subtitle="Returns, e-invoices and e-way bills generated from the invoices and bills you posted" />
      {(periods.error || g1.error) && <ErrorBox error={periods.error || g1.error} onRetry={refresh} />}

      <div className="flex flex-wrap items-center gap-3">
        <select id="gst-period" className={`${inputCls} !w-40`} value={period} onChange={e => setPicked(e.target.value)} aria-label="Return period">
          {(periods.data ?? []).map(p => <option key={p} value={p}>{new Date(`${p}-01T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</option>)}
        </select>
        <Segmented value={view} onChange={setView} options={[['r1', 'GSTR-1'], ['r3b', 'GSTR-3B'], ['2b', 'GSTR-2B match'], ['einv', 'e-Invoice & e-Way']]} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Taxable sales" value={g1.data ? formatCurrency(g1.data.totals.taxable) : '—'} hint={g1.data ? `${g1.data.totals.invoices} invoices` : ''} />
        <Stat label="Output tax" value={g1.data ? formatCurrency(g1.data.totals.igst + g1.data.totals.cgst + g1.data.totals.sgst) : '—'} />
        <Stat label="Eligible credit (2B)" value={twoB.data ? formatCurrency(twoB.data.eligible.igst + twoB.data.eligible.cgst + twoB.data.eligible.sgst) : '—'} tone="pos" />
        <Stat label="Cash to pay" value={g3.data ? formatCurrency(g3.data.totalCash) : '—'} tone="warn" hint="After set-off" />
      </div>

      {view === 'r1' && g1.data && (
        <Card title="GSTR-1 — outward supplies" subtitle="In the GSTN offline-tool JSON layout"
          action={<Button size="sm" variant="secondary" icon={Download} onClick={() => download(`GSTR1_${g1.data.json.gstin}_${g1.data.json.fp}.json`, g1.data.json)}>Download JSON</Button>}>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[['B2B invoices', g1.data.counts.b2b], ['B2C large', g1.data.counts.b2cl], ['B2C small (rows)', g1.data.counts.b2cs], ['Credit notes', g1.data.counts.cdnr], ['HSN rows', g1.data.counts.hsn]].map(([l, v]) => (
              <div key={l} className="rounded-lg bg-[var(--surface-2)] px-3 py-2"><p className="text-[11px] text-[var(--muted)]">{l}</p><p className="tabular text-lg font-bold">{v}</p></div>
            ))}
          </div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">HSN summary</p>
          <Table columns={[
            { key: 'hsn_sc', label: 'HSN/SAC', render: r => <span className="font-mono text-xs">{r.hsn_sc}</span> },
            { key: 'desc', label: 'Description' }, { key: 'qty', label: 'Qty', align: 'right' }, { key: 'rt', label: 'Rate', align: 'right', render: r => `${r.rt}%` },
            { key: 'txval', label: 'Taxable', align: 'right', render: r => <Money value={r.txval} /> },
            { key: 'tax', label: 'IGST / CGST / SGST', align: 'right', render: r => <span className="tabular text-xs">{formatCurrency(r.iamt)} / {formatCurrency(r.camt)} / {formatCurrency(r.samt)}</span> },
          ]} rows={g1.data.json.hsn.data.map(h => ({ ...h, id: h.num }))} />
        </Card>
      )}

      {view === 'r3b' && g3.data && (
        <Card title="GSTR-3B — summary return" subtitle="Credit limited to GSTR-2B, then used in the order the law sets: IGST first; CGST and SGST never against each other">
          <div className="grid gap-4 lg:grid-cols-3">
            {[['3.1(a) Output tax', g3.data.table31a], ['4 Eligible credit', g3.data.table4.eligible], ['6.1 Cash to pay', g3.data.table61.cashPayable]].map(([title, t]) => (
              <div key={title} className="rounded-lg border border-[var(--border)] p-3">
                <p className="mb-2 text-xs font-bold text-[var(--muted)]">{title}</p>
                {heads.map(h => <div key={h} className="flex justify-between py-1 text-sm"><span className="uppercase text-[var(--muted)]">{h}</span><Money value={t[h]} /></div>)}
              </div>
            ))}
          </div>
          <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">How credit was used</p>
          <div className="flex flex-wrap gap-2">
            {g3.data.table61.used.map((u, i) => <span key={i} className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs"><strong className="uppercase">{u.from}</strong> credit → <strong className="uppercase">{u.to}</strong> {formatCurrency(u.amount)}</span>)}
          </div>
          {(g3.data.table4.reversed.igst + g3.data.table4.reversed.cgst + g3.data.table4.reversed.sgst) > 0 && (
            <p className="mt-3 rounded-lg bg-[var(--warn-tint)] px-3 py-2 text-sm">Credit of {formatCurrency(g3.data.table4.reversed.igst + g3.data.table4.reversed.cgst + g3.data.table4.reversed.sgst)} in your books is held back because suppliers have not reported it in GSTR-2B.</p>
          )}
        </Card>
      )}

      {view === '2b' && twoB.data && (
        <Card title="Purchase register vs GSTR-2B" subtitle={`${twoB.data.summary.matched} matched · ${twoB.data.summary.mismatch} differ · ${twoB.data.summary.missing_in_2b} not in 2B · ${twoB.data.summary.missing_in_books} not in books`}>
          <Table columns={[
            { key: 'supplier', label: 'Supplier' }, { key: 'gstin', label: 'GSTIN', render: r => <span className="font-mono text-xs">{r.gstin}</span> },
            { key: 'ref', label: 'Invoice' },
            { key: 'bookTax', label: 'Tax in books', align: 'right', render: r => <Money value={r.bookTax} /> },
            { key: 'portalTax', label: 'Tax in 2B', align: 'right', render: r => <Money value={r.portalTax} /> },
            { key: 'status', label: 'Status', render: r => <Chip tone={STATUS_TONE[r.status]} label={STATUS_LABEL[r.status]} /> },
          ]} rows={twoB.data.rows.map((r, i) => ({ ...r, id: `${r.ref}-${i}` }))} />
        </Card>
      )}

      {view === 'einv' && (
        <Card title="e-Invoices and e-way bills" subtitle="IRN for registered buyers; e-way bill for goods worth more than ₹50,000 (1 day per 200 km)">
          <Table columns={[
            { key: 'number', label: 'Invoice', render: r => <span className="font-mono text-xs">{r.number}</span> },
            { key: 'partyName', label: 'Buyer' },
            { key: 'total', label: 'Value', align: 'right', render: r => <Money value={r.total} /> },
            { key: 'irn', label: 'IRN', render: r => r.irn && !r.irnCancelled
              ? <span className="flex items-center gap-1.5"><span className="font-mono text-[11px]" title={r.irn}>{r.irn.slice(0, 10)}…</span><button type="button" aria-label="Cancel IRN" title="Cancel IRN (within 24 hours)" onClick={() => act(api.post(`/gst/einvoice/${r.id}/cancel`, { reason: 'Data entry mistake' }), () => 'IRN cancelled')} className="border-0 bg-transparent p-0.5 text-[var(--muted)] hover:text-[var(--neg)] cursor-pointer"><XCircle size={13} /></button></span>
              : r.partyGstin ? <Button size="sm" variant="ghost" icon={QrCode} onClick={() => act(api.post(`/gst/einvoice/${r.id}`), x => `IRN ${x.irn.slice(0, 12)}… · Ack ${x.ackNo}`)}>Generate</Button>
                : <span className="text-xs text-[var(--faint)]">B2C — not needed</span> },
            { key: 'ewb', label: 'e-Way bill', render: r => r.ewb && !r.ewb.cancelled
              ? <span className="text-xs"><span className="font-mono">{r.ewb.ewbNo}</span> · valid {r.ewb.validityDays}d</span>
              : r.total > 50000 ? (ewb.id === r.id ? (
                <span className="flex items-center gap-1">
                  <input id={`ewb-veh-${r.id}`} placeholder="MH12AB1234" className={`${inputCls} !h-8 !w-28`} value={ewb.vehicleNo} onChange={e => setEwb(x => ({ ...x, vehicleNo: e.target.value }))} aria-label="Vehicle number" />
                  <input id={`ewb-km-${r.id}`} placeholder="km" type="number" className={`${inputCls} !h-8 !w-20`} value={ewb.distanceKm} onChange={e => setEwb(x => ({ ...x, distanceKm: e.target.value }))} aria-label="Distance in km" />
                  <Button size="sm" variant="primary" onClick={() => act(api.post(`/gst/ewaybill/${r.id}`, ewb), x => { setEwb({ id: null, vehicleNo: '', distanceKm: '' }); return `E-way bill ${x.ewbNo} · valid ${x.validityDays} day(s)` })}>Go</Button>
                </span>
              ) : <Button size="sm" variant="ghost" icon={Truck} onClick={() => setEwb({ id: r.id, vehicleNo: '', distanceKm: '' })}>Create</Button>)
                : <span className="text-xs text-[var(--faint)]">Under ₹50,000</span> },
          ]} rows={monthInvoices} empty="No invoices in this month" />
        </Card>
      )}
    </div>
  )
}
