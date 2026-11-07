import { useState, useEffect, useMemo } from 'react'
import { Play } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getDepreciationSchedule } from '../../data/services/assetsService'

function MethodChip({ method }) {
  const styles = method === 'WDV' ? 'bg-[var(--primary-tint)] text-[var(--primary)]' : 'bg-[#fef3c7] text-[#92400e]'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>{method}</span>
}

export default function Depreciation() {
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState('Jan 2026')

  useEffect(() => { getDepreciationSchedule(month).then(d => { setSchedule(d); setLoading(false) }) }, [month])

  const totalDep = schedule.reduce((s, i) => s + i.depAmount, 0)
  const assetCount = schedule.length

  const kpis = [
    { label: `Total Depreciation (${month})`, value: formatCompact(totalDep), color: 'var(--neg)' },
    { label: 'Assets with Entries', value: assetCount, color: 'var(--text)' },
  ]

  const columns = [
    { key: 'assetName', label: 'Asset', render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'method', label: 'Method', render: v => <MethodChip method={v} /> },
    { key: 'openingValue', label: 'Opening Value', align: 'right', render: v => <span className="tabular text-sm text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'depAmount', label: 'Depreciation', align: 'right', sortable: true, render: v => <span className="tabular text-sm font-semibold" style={{ color: 'var(--neg)' }}>{formatCurrency(v)}</span> },
    { key: 'closingValue', label: 'Closing Value', align: 'right', render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
  ]

  return (
    <div>
      <PageHeader title="Depreciation Schedule" subtitle="Monthly asset depreciation entries" breadcrumb={['Fixed Assets', 'Depreciation']}
        action={<Button variant="primary" icon={Play} size="sm">Run Depreciation</Button>}
      />
      <div className="flex items-center gap-3 mb-5">
        <label className="text-sm font-medium text-[var(--muted)]">Month:</label>
        <select value={month} onChange={e => setMonth(e.target.value)} className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]">
          <option value="Jan 2026">Jan 2026</option>
          <option value="Dec 2025">Dec 2025</option>
          <option value="Nov 2025">Nov 2025</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {kpis.map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={schedule} loading={loading} rowKey="id" />
    </div>
  )
}
