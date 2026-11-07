import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { useApi } from '../../../hooks/useApi'
import { api } from '../../../data/api/client'
import { formatCurrency, formatCompact } from '../../../lib/currency'
import { toast } from '../../../lib/toast'
import { useAppStore } from '../../../store/useAppStore'
import { Chip, KpiStrip, ErrorBox, MockApiNote, DueLabel } from './shared'
import { fmtDate } from './taxUtils'

const METHODS = ['Bank transfer', 'Direct debit', 'Online banking', 'Card payment']

export default function GlobalTaxPayments() {
  const { data, loading, error, refetch, setData } = useApi('/tax/payments')
  const recordAudit = useAppStore(s => s.recordAudit)
  const [paying, setPaying] = useState(null)
  const [method, setMethod] = useState(METHODS[0])
  const [busy, setBusy] = useState(false)
  const rows = data ?? []

  async function pay() {
    setBusy(true)
    try {
      const updated = await api.post('/tax/payments', { paymentId: paying.id, method })
      setData(list => list.map(p => (p.id === updated.id ? updated : p)))
      toast.success(`Payment recorded · ${updated.reference}`)
      recordAudit('compliance', 'Tax payment recorded', `${updated.description} paid via ${method} (${updated.reference}).`, { module: 'Tax' })
      setPaying(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const pending = rows.filter(r => r.status === 'pending')
  const kpis = [
    { label: 'Outstanding', value: formatCompact(pending.reduce((s, r) => s + r.amount, 0)), color: 'var(--neg)' },
    { label: 'Payments due', value: pending.length, color: pending.length ? 'var(--warn)' : 'var(--text)' },
    { label: 'Paid', value: formatCompact(rows.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0)), color: 'var(--pos)' },
    { label: 'Records', value: rows.length },
  ]

  const columns = [
    { key: 'description', label: 'Liability', render: (v, r) => <div><p className="text-sm font-medium text-[var(--text)]">{v}</p><p className="text-xs text-[var(--muted)]">{r.authority}</p></div> },
    { key: 'dueDate', label: 'Due', sortable: true, render: (v, r) => r.status === 'paid' ? <span className="text-sm text-[var(--muted)]">{fmtDate(v)}</span> : <DueLabel date={v} /> },
    { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: v => <span className="tabular text-sm font-semibold">{formatCurrency(v)}</span> },
    { key: 'paidOn', label: 'Paid on', render: (v, r) => <span className="text-sm text-[var(--muted)]">{v ? `${fmtDate(v)} · ${r.method}` : '—'}</span> },
    { key: 'reference', label: 'Reference', render: v => <span className="font-mono text-xs text-[var(--muted)]">{v ?? '—'}</span> },
    { key: 'status', label: 'Status', render: v => <Chip status={v} /> },
    { key: 'id', label: '', align: 'right', render: (v, r) => r.status === 'pending' && r.amount > 0
      ? <Button size="sm" variant="primary" icon={CreditCard} onClick={() => setPaying(r)}>Pay</Button> : null },
  ]

  return (
    <div>
      <PageHeader title="Tax Payments" subtitle="Liabilities from filed and ready returns" breadcrumb={['Tax', 'Tax Payments']} />
      <ErrorBox error={error} onRetry={refetch} />
      <KpiStrip items={kpis} />
      <DataTable columns={columns} data={rows} loading={loading} rowKey="id" />
      <Modal
        open={!!paying}
        onClose={() => setPaying(null)}
        title="Record tax payment"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPaying(null)}>Cancel</Button>
            <Button variant="primary" onClick={pay} disabled={busy}>{busy ? 'Recording…' : 'Record payment'}</Button>
          </div>
        }
      >
        {paying && (
          <div className="space-y-3 text-sm">
            <p className="text-[var(--text)]">{paying.description}</p>
            <p className="tabular text-2xl font-bold text-[var(--text)]">{formatCurrency(paying.amount)}</p>
            <p className="text-[var(--muted)]">Payable to {paying.authority} by {fmtDate(paying.dueDate)}</p>
            <label className="block">
              <span className="text-xs font-semibold text-[var(--muted)]">Payment method</span>
              <select value={method} onChange={e => setMethod(e.target.value)} className="mt-1 w-full h-9 px-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
                {METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </label>
          </div>
        )}
      </Modal>
      <MockApiNote />
    </div>
  )
}
