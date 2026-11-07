import { useState } from 'react'
import { CheckCircle2, Circle, Lock } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

export default function PeriodClose() {
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  const checklist = [
    { id: 'PC001', name: 'Bank reconciliation complete', status: 'done', by: 'Rahul M', date: '2026-01-06' },
    { id: 'PC002', name: 'All invoices posted', status: 'done', by: 'Ankit R', date: '2026-01-06' },
    { id: 'PC003', name: `${countryConfig.taxSystem} reconciled`, status: 'done', by: 'Priya S', date: '2026-01-06' },
    { id: 'PC004', name: `${countryCode === 'IN' ? 'TDS' : 'Withholding'} deposited`, status: 'done', by: 'Priya S', date: '2026-01-07' },
    { id: 'PC005', name: 'Salary processed', status: 'pending', by: null, date: null },
    { id: 'PC006', name: 'Depreciation posted', status: 'done', by: 'Priya S', date: '2026-01-06' },
    { id: 'PC007', name: 'Provisions reviewed', status: 'pending', by: null, date: null },
    { id: 'PC008', name: 'Trial balance checked', status: 'pending', by: null, date: null },
  ]

  const [items] = useState(checklist)
  const doneCount = items.filter(i => i.status === 'done').length
  const totalCount = items.length
  const allDone = doneCount === totalCount

  return (
    <div>
      <PageHeader title="Period Close" subtitle="Month-end closing checklist — Jan 2026" breadcrumb={['Expenses & Journals', 'Period Close']} />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm col-span-2 md:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Tasks Complete</p>
          <div className="flex items-end gap-3">
            <p className="tabular text-xl font-bold" style={{ color: allDone ? 'var(--pos)' : 'var(--warn)' }}>{doneCount} of {totalCount}</p>
            <div className="flex-1 max-w-xs h-2 rounded-full bg-[var(--faint)] mb-1">
              <div className="h-2 rounded-full transition-all" style={{ width: `${(doneCount / totalCount) * 100}%`, backgroundColor: allDone ? 'var(--pos)' : 'var(--warn)' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-sm mb-4">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text)]">Closing Checklist — January 2026</h3>
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {items.map(item => (
            <li key={item.id} className="flex items-center gap-4 px-4 py-3">
              {item.status === 'done'
                ? <CheckCircle2 size={18} className="shrink-0 text-[var(--pos)]" />
                : <Circle size={18} className="shrink-0 text-[var(--faint)]" />
              }
              <div className="flex-1">
                <p className={`text-sm font-medium ${item.status === 'done' ? 'text-[var(--text)]' : 'text-[var(--muted)]'}`}>{item.name}</p>
                {item.status === 'done' && <p className="text-xs text-[var(--muted)]">{item.by} · {item.date}</p>}
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'done' ? 'bg-[var(--pos-tint)] text-[var(--pos)]' : 'bg-[var(--faint)] text-[var(--muted)]'}`}>
                {item.status === 'done' ? 'Done' : 'Pending'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" icon={Lock} disabled={!allDone}>
          Close Period
        </Button>
        {!allDone && <p className="ml-3 text-sm text-[var(--muted)] self-center">{totalCount - doneCount} task(s) still pending</p>}
      </div>
    </div>
  )
}
