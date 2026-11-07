import { useState } from 'react'
import { Send, Network } from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Button from '../../../components/ui/Button'
import { useApi } from '../../../hooks/useApi'
import { api } from '../../../data/api/client'
import { formatCurrency } from '../../../lib/currency'
import { toast } from '../../../lib/toast'
import { Chip, KpiStrip, ErrorBox, MockApiNote } from './shared'
import { fmtDate, useTaxProfile } from './taxUtils'
import EInvoiceArtifact from './EInvoiceArtifact'

const MANDATE_TONE = { mandatory: 'neg', phased: 'warn', voluntary: 'primary', 'not-required': 'muted' }
const MANDATE_LABEL = { mandatory: 'Mandatory', phased: 'Phased roll-out', voluntary: 'Voluntary', 'not-required': 'No mandate' }

export default function GlobalEInvoicing() {
  const { catalog } = useTaxProfile()
  const { data, loading, error, refetch, setData } = useApi('/tax/einvoices')
  const [busyId, setBusyId] = useState(null)
  const [viewing, setViewing] = useState(null)
  const ei = catalog?.eInvoicing
  const docs = data ?? []

  async function transmit(doc) {
    setBusyId(doc.id)
    try {
      const updated = await api.post(`/tax/einvoices/${doc.id}/transmit`)
      setData(list => list.map(d => (d.id === updated.id ? updated : d)))
      toast.success(`${doc.invoiceNo} transmitted · ${updated.artifact?.idLabel ?? 'reference'} issued`)
      setViewing(updated)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function transmitAll() {
    for (const d of docs.filter(x => ['pending', 'not-sent', 'rejected'].includes(x.status))) {
      await transmit(d)
    }
  }

  const pending = docs.filter(d => ['pending', 'not-sent', 'rejected'].includes(d.status))
  const kpis = [
    { label: 'Documents', value: docs.length },
    { label: 'Accepted / delivered', value: docs.filter(d => ['accepted', 'delivered'].includes(d.status)).length, color: 'var(--pos)' },
    { label: 'Awaiting transmission', value: pending.length, color: pending.length ? 'var(--warn)' : 'var(--text)' },
    { label: 'Rejected', value: docs.filter(d => d.status === 'rejected').length, color: 'var(--neg)' },
  ]

  const columns = [
    { key: 'invoiceNo', label: 'Invoice', render: (v, r) => <div><p className="text-sm font-medium text-[var(--text)]">{v}</p><p className="text-xs text-[var(--muted)]">{fmtDate(r.date)}</p></div> },
    { key: 'customer', label: 'Customer', render: v => <span className="text-sm text-[var(--text)]">{v}</span> },
    { key: 'total', label: 'Total', align: 'right', sortable: true, render: v => <span className="tabular text-sm font-semibold">{formatCurrency(v)}</span> },
    { key: 'status', label: 'Status', render: (v, r) => <div><Chip status={v} />{r.error && <p className="text-xs text-[var(--neg)] mt-1">{r.error}</p>}</div> },
    { key: 'networkRef', label: ei?.idLabel ?? 'Reference', render: (v, r) => (r.artifact
      ? <button type="button" onClick={() => setViewing(r)} className="font-mono text-xs text-[var(--primary)] underline-offset-2 hover:underline border-0 bg-transparent cursor-pointer">{String(v).slice(0, 18)}{String(v).length > 18 ? '…' : ''}</button>
      : <span className="font-mono text-xs text-[var(--muted)]">{v ?? '—'}</span>) },
    { key: 'id', label: '', align: 'right', render: (v, r) => ['pending', 'not-sent', 'rejected'].includes(r.status)
      ? <Button size="sm" variant="primary" icon={Send} disabled={busyId === v} onClick={() => transmit(r)}>{busyId === v ? 'Sending…' : r.status === 'rejected' ? 'Fix & resend' : 'Transmit'}</Button>
      : null },
  ]

  return (
    <div>
      <PageHeader
        title={ei?.name ?? 'E-Invoicing'}
        subtitle={ei ? ei.network : 'Loading…'}
        breadcrumb={['Tax', ei?.name ?? 'E-Invoicing']}
        action={pending.length > 0 && <Button size="sm" variant="primary" icon={Send} onClick={transmitAll}>Transmit all ({pending.length})</Button>}
      />
      <ErrorBox error={error} onRetry={refetch} />
      {ei && (
        <div className="flex items-start gap-3 p-4 mb-5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] shadow-sm">
          <Network size={18} className="text-[var(--primary)] mt-0.5 shrink-0" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-[var(--text)]">{ei.network}</p>
              <Chip tone={MANDATE_TONE[ei.status]} label={MANDATE_LABEL[ei.status]} />
            </div>
            <p className="text-sm text-[var(--muted)]">{ei.note}</p>
          </div>
        </div>
      )}
      <KpiStrip items={kpis} />
      <DataTable columns={columns} data={docs} loading={loading} rowKey="id" />
      {viewing && <EInvoiceArtifact doc={viewing} onClose={() => setViewing(null)} />}
      <MockApiNote />
    </div>
  )
}
