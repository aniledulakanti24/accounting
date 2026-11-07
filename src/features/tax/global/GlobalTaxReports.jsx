import { useMemo } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import Button from '../../../components/ui/Button'
import { Download } from 'lucide-react'
import { useApi } from '../../../hooks/useApi'
import { formatCurrency } from '../../../lib/currency'
import { ErrorBox, MockApiNote } from './shared'
import { useTaxProfile } from './taxUtils'

/** Box-by-box history of the jurisdiction's return across recent periods. */
export default function GlobalTaxReports() {
  const { catalog } = useTaxProfile()
  const { data, loading, error, refetch } = useApi('/tax/returns')

  // Aggregate jurisdictions (US states) into one column per period
  const periods = useMemo(() => {
    const map = new Map()
    for (const r of data ?? []) {
      const key = r.periodStart
      if (!map.has(key)) map.set(key, { key, label: r.periodLabel, boxes: {} })
      const p = map.get(key)
      for (const b of r.boxes) p.boxes[b.box] = (p.boxes[b.box] ?? 0) + b.amount
    }
    return [...map.values()].sort((a, b) => a.key.localeCompare(b.key))
  }, [data])

  function exportCsv() {
    const header = ['Box', 'Description', ...periods.map(p => p.label)]
    const lines = catalog.boxes.map(b => [b.box, b.label, ...periods.map(p => (p.boxes[b.box] ?? 0).toFixed(2))])
    const csv = [header, ...lines].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${catalog.returnForm}-history.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title={`${catalog?.returnForm ?? 'Tax'} Reports`}
        subtitle={catalog ? `${catalog.returnName} · box totals by period` : ''}
        breadcrumb={['Reports', 'Tax Reports']}
        action={catalog && periods.length > 0 && <Button size="sm" variant="secondary" icon={Download} onClick={exportCsv}>Export CSV</Button>}
      />
      <ErrorBox error={error} onRetry={refetch} />
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] shadow-sm overflow-x-auto">
        {loading || !catalog ? <p className="p-4 text-sm text-[var(--muted)]">Loading…</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--surface-2)]">
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] sticky left-0 bg-[var(--surface-2)]">Box</th>
                {periods.map(p => <th key={p.key} className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] whitespace-nowrap">{p.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {catalog.boxes.map(b => (
                <tr key={b.box} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2 sticky left-0 bg-[var(--surface)] min-w-[220px]">
                    <span className="font-mono text-xs text-[var(--muted)] mr-2">{b.box}</span>
                    <span className="text-[var(--text)]">{b.label}</span>
                  </td>
                  {periods.map(p => <td key={p.key} className="px-3 py-2 text-right tabular whitespace-nowrap">{formatCurrency(p.boxes[b.box] ?? 0)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <MockApiNote />
    </div>
  )
}
