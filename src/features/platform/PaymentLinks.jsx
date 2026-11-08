import { useState } from 'react'
import { Link2, Copy, ExternalLink } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { api } from '../../data/api/client'
import { formatCurrency } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { Chip, KpiStrip, ErrorBox } from '../tax/global/shared'
import { fmtDate } from '../tax/global/taxUtils'

const checkoutUrl = id => `${window.location.origin}${import.meta.env.BASE_URL}pay/${id}`

export default function PaymentLinks() {
  const providers = useApi('/bank/providers')
  const links = useApi('/payment-links')
  const invoices = useApi('/tax/einvoices')
  const [invoiceId, setInvoiceId] = useState('')
  const [busy, setBusy] = useState(false)
  const unpaid = (invoices.data ?? []).filter(e => !e.paid)
  const rows = links.data ?? []

  async function create() {
    setBusy(true)
    try {
      const link = await api.post('/payment-links', { invoiceId })
      await navigator.clipboard?.writeText(checkoutUrl(link.id)).catch(() => {})
      toast.success(`Payment link created for ${link.invoiceNo} — copied to clipboard`)
      setInvoiceId('')
      links.refetch(); invoices.refetch()
    } catch (err) { toast.error(err.message) } finally { setBusy(false) }
  }

  const paid = rows.filter(l => l.status === 'paid')
  const kpis = [
    { label: 'Open links', value: rows.filter(l => l.status === 'open').length },
    { label: 'Collected', value: formatCurrency(paid.reduce((s, l) => s + l.amount, 0)), color: 'var(--pos)' },
    { label: 'Gateway fees', value: formatCurrency(paid.reduce((s, l) => s + (l.fee || 0), 0)) },
    { label: 'Gateway', value: providers.data?.gateway?.name ?? '—', hint: providers.data?.gateway?.methods?.join(' · ') },
  ]

  const columns = [
    { key: 'invoiceNo', label: 'Invoice', render: (v, r) => <div><p className="text-sm font-medium text-[var(--text)]">{v}</p><p className="text-xs text-[var(--muted)]">{r.customer}</p></div> },
    { key: 'amount', label: 'Amount', align: 'right', render: v => <span className="tabular text-sm font-semibold">{formatCurrency(v)}</span> },
    { key: 'status', label: 'Status', render: (v, r) => <div><Chip status={v === 'paid' ? 'paid' : 'open'} label={v === 'paid' ? `Paid · ${r.method}` : 'Awaiting payment'} />{r.paidAt && <p className="text-[10px] text-[var(--muted)] mt-0.5">{fmtDate(r.paidAt.slice(0, 10))} · fee {formatCurrency(r.fee)}</p>}</div> },
    { key: 'gateway', label: 'Gateway', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'id', label: 'Link', render: v => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" icon={Copy} onClick={() => navigator.clipboard?.writeText(checkoutUrl(v)).then(() => toast.success('Link copied'))}>Copy</Button>
        <Button size="sm" variant="ghost" icon={ExternalLink} onClick={() => window.open(`/pay/${v}`, '_blank', 'noopener')}>Open</Button>
      </div>
    ) },
  ]

  return (
    <div>
      <PageHeader title="Payment Links" subtitle="Get paid online — the receipt, gateway fee and ledger entry post automatically" breadcrumb={['Money In', 'Payment Links']} />
      <ErrorBox error={links.error} onRetry={links.refetch} />
      <KpiStrip items={kpis} />
      <div className="flex flex-wrap items-center gap-2 mb-4 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-3">
        <select value={invoiceId} onChange={e => setInvoiceId(e.target.value)} className="h-9 min-w-[260px] flex-1 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
          <option value="">Choose an unpaid invoice…</option>
          {unpaid.map(e => <option key={e.id} value={e.id}>{e.invoiceNo} · {e.customer} · {formatCurrency(e.total)}</option>)}
        </select>
        <Button variant="primary" icon={Link2} disabled={!invoiceId || busy} onClick={create}>{busy ? 'Creating…' : 'Create payment link'}</Button>
      </div>
      <DataTable columns={columns} data={rows} loading={links.loading} rowKey="id" />
    </div>
  )
}
