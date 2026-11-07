import { useMemo, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Button from '../../../components/ui/Button'
import { useApi } from '../../../hooks/useApi'
import { api } from '../../../data/api/client'
import { formatCurrency, formatCompact } from '../../../lib/currency'
import { toast } from '../../../lib/toast'
import { Chip, KpiStrip, ErrorBox, MockApiNote } from './shared'
import { fmtDate, useTaxProfile } from './taxUtils'

/** Input tax matching — purchase ledger vs supplier-reported invoices. */
export default function GlobalReconciliation() {
  const { country } = useTaxProfile()
  const { data, loading, error, refetch, setData } = useApi('/tax/reconciliation')
  const [filter, setFilter] = useState('issues')
  const [busyId, setBusyId] = useState(null)
  const all = useMemo(() => data ?? [], [data])
  const rows = useMemo(() => all.filter(r => filter === 'all' || (filter === 'issues' ? !['matched', 'deferred'].includes(r.status) : r.status === filter)), [all, filter])
  const taxName = country?.taxSystem === 'SalesTax' ? 'Use tax' : `Input ${country?.taxSystem === 'VAT' ? 'VAT' : 'tax'}`

  async function resolve(row, action) {
    setBusyId(row.id)
    try {
      const updated = await api.post(`/tax/reconciliation/${row.id}/resolve`, { action })
      setData(list => list.map(r => (r.id === updated.id ? updated : r)))
      toast.success(`${row.billNo} ${action === 'defer' ? 'deferred to next period' : 'resolved'}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const issues = all.filter(r => !['matched', 'deferred'].includes(r.status))
  const atRisk = issues.reduce((s, r) => s + Math.abs((r.booksTax ?? 0) - (r.supplierTax ?? 0)), 0)
  const kpis = [
    { label: 'Purchase invoices', value: all.length },
    { label: 'Matched', value: all.filter(r => r.status === 'matched').length, color: 'var(--pos)' },
    { label: 'Need review', value: issues.length, color: issues.length ? 'var(--warn)' : 'var(--text)' },
    { label: `${taxName} at risk`, value: formatCompact(atRisk), color: 'var(--neg)' },
  ]

  const columns = [
    { key: 'supplier', label: 'Supplier', render: (v, r) => <div><p className="text-sm font-medium text-[var(--text)]">{v}</p><p className="text-xs text-[var(--muted)]">{r.billNo} · {fmtDate(r.date)}</p></div> },
    { key: 'net', label: 'Net', align: 'right', render: v => <span className="tabular text-sm">{formatCurrency(v)}</span> },
    { key: 'booksTax', label: `${taxName} (books)`, align: 'right', render: v => <span className="tabular text-sm">{v == null ? '—' : formatCurrency(v)}</span> },
    { key: 'supplierTax', label: `${taxName} (supplier)`, align: 'right', render: v => <span className="tabular text-sm">{v == null ? '—' : formatCurrency(v)}</span> },
    { key: 'status', label: 'Status', render: v => <Chip status={v} /> },
    { key: 'id', label: '', align: 'right', render: (v, r) => {
      if (['matched', 'deferred'].includes(r.status)) return null
      return (
        <div className="flex justify-end gap-1">
          {r.status === 'mismatch' && <Button size="sm" variant="secondary" disabled={busyId === v} onClick={() => resolve(r, 'accept-supplier')}>Use supplier</Button>}
          {r.status === 'missing-books' && <Button size="sm" variant="secondary" disabled={busyId === v} onClick={() => resolve(r, 'accept-supplier')}>Add to books</Button>}
          {r.status === 'missing-supplier' && <Button size="sm" variant="secondary" disabled={busyId === v} onClick={() => resolve(r, 'defer')}>Defer claim</Button>}
          <Button size="sm" variant="ghost" disabled={busyId === v} onClick={() => resolve(r, 'accept-books')}>Keep books</Button>
        </div>
      )
    } },
  ]

  return (
    <div>
      <PageHeader title={`${taxName} Matching`} subtitle="Purchase ledger compared with supplier-reported invoices" breadcrumb={['Tax', 'Matching']} />
      <ErrorBox error={error} onRetry={refetch} />
      <KpiStrip items={kpis} />
      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        rowKey="id"
        toolbar={
          <div className="flex items-center gap-2">
            {[['issues', 'Needs review'], ['matched', 'Matched'], ['all', 'All']].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} className={`h-8 px-3 text-xs font-medium rounded-full border cursor-pointer ${filter === k ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]'}`}>{l}</button>
            ))}
          </div>
        }
      />
      <MockApiNote />
    </div>
  )
}
