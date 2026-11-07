import { useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Button from '../../../components/ui/Button'
import { useApi } from '../../../hooks/useApi'
import { api } from '../../../data/api/client'
import { formatCurrency, formatCompact } from '../../../lib/currency'
import { toast } from '../../../lib/toast'
import { Chip, KpiStrip, ErrorBox, MockApiNote } from './shared'
import { fmtDate, useTaxProfile } from './taxUtils'

const NEXT_ACTION = { deducted: 'Remit', remitted: 'Issue certificate', 'to-report': 'Mark reported' }

function SchemeCards({ items }) {
  if (!items?.length) return null
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-5">
      {items.map(s => (
        <div key={s.code} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs text-[var(--muted)]">{s.code}</span>
            <span className="tabular text-sm font-bold text-[var(--primary)]">{s.rate ? `${s.rate}%` : 'Report only'}</span>
          </div>
          <p className="text-sm font-semibold text-[var(--text)]">{s.name}</p>
          <p className="text-xs text-[var(--muted)] mt-1">{s.appliesTo}</p>
        </div>
      ))}
    </div>
  )
}

/**
 * kind="withholding": withholding at source (CIS, 1099, PAYG, Bauabzugsteuer, IRAS s45…)
 * kind="secondary":   the jurisdiction's secondary scheme (reverse charge, provincial tax, exemption certificates)
 */
export default function GlobalWithholding({ kind = 'withholding' }) {
  const { catalog } = useTaxProfile()
  const endpoint = kind === 'withholding' ? '/tax/withholding' : '/tax/secondary'
  const { data, loading, error, refetch, setData } = useApi(endpoint)
  const [busyId, setBusyId] = useState(null)
  const rows = data ?? []

  const schemes = kind === 'withholding' ? catalog?.withholding : catalog?.secondary?.items
  const title = kind === 'withholding' ? 'Withholding Tax' : (catalog?.secondary?.name ?? 'Other tax schemes')

  async function act(row) {
    setBusyId(row.id)
    try {
      const url = kind === 'withholding' ? `/tax/withholding/${row.id}/remit` : `/tax/secondary/${row.id}/account`
      const updated = await api.post(url)
      setData(list => list.map(r => (r.id === updated.id ? updated : r)))
      toast.success(`${row.code} · ${updated.status}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const amountKey = kind === 'withholding' ? 'withheld' : 'tax'
  const openRows = rows.filter(r => ['deducted', 'to-report', 'pending'].includes(r.status))
  const kpis = [
    { label: 'Entries', value: rows.length },
    { label: kind === 'withholding' ? 'Withheld (total)' : 'Tax (total)', value: formatCompact(rows.reduce((s, r) => s + (r[amountKey] || 0), 0)) },
    { label: 'Awaiting action', value: openRows.length, color: openRows.length ? 'var(--warn)' : 'var(--text)' },
    { label: 'Open amount', value: formatCompact(openRows.reduce((s, r) => s + (r[amountKey] || 0), 0)), color: 'var(--neg)' },
  ]

  const columns = kind === 'withholding' ? [
    { key: 'date', label: 'Date', render: v => <span className="text-sm text-[var(--muted)]">{fmtDate(v)}</span> },
    { key: 'payee', label: 'Payee', render: v => <span className="text-sm font-medium text-[var(--text)]">{v}</span> },
    { key: 'scheme', label: 'Scheme', render: (v, r) => <div><p className="text-sm text-[var(--text)]">{v}</p><p className="font-mono text-xs text-[var(--muted)]">{r.code}</p></div> },
    { key: 'gross', label: 'Gross payment', align: 'right', render: v => <span className="tabular text-sm">{formatCurrency(v)}</span> },
    { key: 'rate', label: 'Rate', align: 'right', render: v => <span className="tabular text-sm">{v}%</span> },
    { key: 'withheld', label: 'Withheld', align: 'right', render: v => <span className="tabular text-sm font-semibold">{formatCurrency(v)}</span> },
    { key: 'status', label: 'Status', render: v => <Chip status={v} /> },
    { key: 'id', label: '', align: 'right', render: (v, r) => NEXT_ACTION[r.status]
      ? <Button size="sm" variant="secondary" disabled={busyId === v} onClick={() => act(r)}>{NEXT_ACTION[r.status]}</Button> : null },
  ] : [
    { key: 'date', label: 'Date', render: v => <span className="text-sm text-[var(--muted)]">{fmtDate(v)}</span> },
    { key: 'party', label: 'Party', render: v => <span className="text-sm font-medium text-[var(--text)]">{v}</span> },
    { key: 'name', label: 'Scheme', render: (v, r) => <div><p className="text-sm text-[var(--text)]">{v}</p><p className="font-mono text-xs text-[var(--muted)]">{r.code}</p></div> },
    { key: 'base', label: 'Taxable value', align: 'right', render: v => <span className="tabular text-sm">{formatCurrency(v)}</span> },
    { key: 'rate', label: 'Rate', align: 'right', render: v => <span className="tabular text-sm">{v}%</span> },
    { key: 'tax', label: 'Tax', align: 'right', render: v => <span className="tabular text-sm font-semibold">{formatCurrency(v)}</span> },
    { key: 'status', label: 'Status', render: v => <Chip status={v} /> },
    { key: 'id', label: '', align: 'right', render: (v, r) => r.status === 'pending'
      ? <Button size="sm" variant="secondary" disabled={busyId === v} onClick={() => act(r)}>Account for it</Button> : null },
  ]

  return (
    <div>
      <PageHeader title={title} subtitle={catalog?.authority ?? ''} breadcrumb={['Tax', title]} />
      <ErrorBox error={error} onRetry={refetch} />
      <SchemeCards items={schemes} />
      {!loading && rows.length === 0 ? (
        <div className="p-6 text-sm text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)]">
          No {kind === 'withholding' ? 'withholding tax' : 'entries'} apply in this jurisdiction.
        </div>
      ) : (
        <>
          <KpiStrip items={kpis} />
          <DataTable columns={columns} data={rows} loading={loading} rowKey="id" />
        </>
      )}
      <MockApiNote />
    </div>
  )
}
