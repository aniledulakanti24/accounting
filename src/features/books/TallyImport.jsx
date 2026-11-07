import { useState } from 'react'
import { Upload, Eye, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { api } from '../../data/api/client'
import { toast } from '../../lib/toast'
import { formatCurrency } from '../../lib/currency'
import { SAMPLE_TALLY_XML } from '../../data/api/migrationServer'
import { Card, Table, Segmented } from './ui'
import { inputCls } from './styles'

const SAMPLE_CSV = `Invoice Number,Invoice Date,Customer Name,Item Name,Quantity,Item Price,Tax %
INV-0091,03/10/2026,Acme Corp,Design retainer,2,5000,18%
INV-0091,03/10/2026,Acme Corp,Hosting,1,1000,18%
INV-0092,05/10/2026,Beta LLP,Annual audit,1,20000,18%`

const ICON = { error: XCircle, warn: AlertTriangle, info: Info, ok: CheckCircle2 }
const TONE = { error: 'var(--neg)', warn: 'var(--warn)', info: 'var(--primary)', ok: 'var(--pos)' }

/** Move in from Tally (XML) or Zoho Books / QuickBooks (CSV) — always previewed before anything is posted. */
export default function TallyImport() {
  const history = useApi('/migration/history')
  const [source, setSource] = useState('tally')
  const [text, setText] = useState(SAMPLE_TALLY_XML)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)

  function choose(s) { setSource(s); setText(s === 'tally' ? SAMPLE_TALLY_XML : SAMPLE_CSV); setPreview(null) }
  async function run(dryRun) {
    setBusy(true)
    try {
      const r = source === 'tally'
        ? await api.post('/migration/tally', { xml: text, dryRun })
        : await api.post('/migration/invoices-csv', { csv: text, dryRun, source: source === 'zoho' ? 'Zoho Books' : 'QuickBooks' })
      setPreview(r)
      if (!dryRun) { toast.success(source === 'tally' ? `Imported ${r.posted.length} journals and ${r.parties} parties` : `Imported ${r.created.length} invoices`); history.refetch() }
    } catch (err) { toast.error(err.message); setPreview(null) } finally { setBusy(false) }
  }
  async function readFile(e) { const f = e.target.files?.[0]; if (f) { setText(await f.text()); setPreview(null) } }
  const blocking = preview?.issues?.some(i => i.level === 'error') && (preview.vouchers === 0 && preview.invoices === 0)

  return (
    <div className="space-y-4">
      <PageHeader title="Import from Tally & Zoho" subtitle="Bring your ledgers, opening balances, vouchers and invoices across — check the preview, then import" />
      <Segmented value={source} onChange={choose} options={[['tally', 'Tally (XML)'], ['zoho', 'Zoho Books (CSV)'], ['qb', 'QuickBooks (CSV)']]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card title={source === 'tally' ? 'Tally export' : 'Invoice export'}
          subtitle={source === 'tally' ? 'In Tally: Gateway of Tally → Export → Masters and Vouchers → format XML. A sample is filled in.' : 'Export invoices as CSV (Invoice Number, Date, Customer, Item, Quantity, Price, Tax %). A sample is filled in.'}
          action={<label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--surface-2)]"><Upload size={14} /> Choose file<input id="mig-file" type="file" accept={source === 'tally' ? '.xml,text/xml' : '.csv,text/csv'} className="hidden" onChange={readFile} /></label>}>
          <textarea id="mig-text" rows={12} value={text} onChange={e => { setText(e.target.value); setPreview(null) }} className={`${inputCls} !h-auto py-2 font-mono text-[11px] leading-relaxed`} aria-label="File contents" />
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="secondary" icon={Eye} disabled={busy} onClick={() => run(true)}>Preview</Button>
            <Button size="sm" variant="primary" icon={Upload} disabled={busy || !preview?.dryRun || blocking} onClick={() => run(false)}>Import</Button>
          </div>
        </Card>

        <Card title="Preview" subtitle={preview ? (preview.dryRun ? 'Nothing has been written yet' : 'Imported') : 'Press Preview to check the file'}>
          {!preview ? <p className="text-sm text-[var(--muted)]">You'll see what will be created, how each Tally ledger maps to the chart of accounts, and anything that needs attention.</p> : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {(source === 'tally'
                  ? [['Ledgers', preview.ledgers], ['New parties', preview.parties], ['Vouchers', preview.vouchers]]
                  : [['Invoices', preview.invoices], ['New customers', preview.newCustomers], ['Total', formatCurrency(preview.total)]]
                ).map(([l, v]) => <div key={l} className="rounded-lg bg-[var(--surface-2)] px-3 py-2"><p className="text-[11px] text-[var(--muted)]">{l}</p><p className="tabular font-bold">{v}</p></div>)}
              </div>
              {preview.issues.length > 0 && (
                <ul className="space-y-1.5">
                  {preview.issues.map((i, n) => { const I = ICON[i.level] ?? Info; return <li key={n} className="flex gap-2 text-sm"><I size={15} className="mt-0.5 shrink-0" style={{ color: TONE[i.level] }} />{i.message}</li> })}
                </ul>
              )}
              {preview.mapping && <Table columns={[{ key: 'name', label: 'Tally ledger' }, { key: 'group', label: 'Tally group' }, { key: 'to', label: 'Goes to' }]} rows={preview.mapping.map(m => ({ ...m, id: m.name }))} />}
              {!preview.dryRun && <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--pos)]"><CheckCircle2 size={15} /> Done — see the journals in Reports → General Ledger.</p>}
            </div>
          )}
        </Card>
      </div>

      <Card title="Import history">
        <Table columns={[{ key: 'at', label: 'When', render: r => new Date(r.at).toLocaleString() }, { key: 'source', label: 'From' }, { key: 'created', label: 'Created' }]} rows={history.data ?? []} empty="No imports yet" />
      </Card>
    </div>
  )
}
