import { useState } from 'react'
import { CheckCheck, X, AlertTriangle, RotateCcw, Download, Eye } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Panel from '../../components/ui/Panel'
import Button from '../../components/ui/Button'
import { cn } from '../../lib/cn'
import { toast } from '../../lib/toast'

const HISTORY = [
  {
    id: 'imp-007',
    source:    'Tally Prime',
    logo:      '🧾',
    type:      'Parties',
    records:   142,
    status:    'success',
    date:      '24 May 2026',
    time:      '11:32 AM',
    size:      '94 KB',
    user:      'Rahul Gupta',
    canUndo:   true,
  },
  {
    id: 'imp-006',
    source:    'Tally Prime',
    logo:      '🧾',
    type:      'Sales Invoices',
    records:   389,
    status:    'success',
    date:      '24 May 2026',
    time:      '11:28 AM',
    size:      '210 KB',
    user:      'Rahul Gupta',
    canUndo:   true,
  },
  {
    id: 'imp-005',
    source:    'Zoho Books',
    logo:      '📘',
    type:      'Chart of Accounts',
    records:   67,
    status:    'partial',
    warnings:  3,
    date:      '20 May 2026',
    time:      '3:15 PM',
    size:      '32 KB',
    user:      'Sneha Patel',
    canUndo:   false,
  },
  {
    id: 'imp-004',
    source:    'Excel / CSV',
    logo:      '📊',
    type:      'Inventory Items',
    records:   0,
    status:    'failed',
    error:     'Column mismatch — "Item Code" not mapped',
    date:      '18 May 2026',
    time:      '10:02 AM',
    size:      '55 KB',
    user:      'Rahul Gupta',
    canUndo:   false,
  },
  {
    id: 'imp-003',
    source:    'Vyapar',
    logo:      '📦',
    type:      'Purchase Bills',
    records:   211,
    status:    'success',
    date:      '12 May 2026',
    time:      '9:45 AM',
    size:      '128 KB',
    user:      'Amit Shah',
    canUndo:   false,
  },
]

const STATUS_CFG = {
  success: { icon: CheckCheck,    bg: 'bg-[var(--pos-tint)]',     text: 'text-[var(--pos)]',     label: 'Success'    },
  partial: { icon: AlertTriangle, bg: 'bg-[var(--warn-tint)]',    text: 'text-[var(--warn)]',    label: 'Partial'    },
  failed:  { icon: X,             bg: 'bg-[var(--neg-tint)]',     text: 'text-[var(--neg)]',     label: 'Failed'     },
}

function StatusChip({ status }) {
  const c    = STATUS_CFG[status] ?? STATUS_CFG.success
  const Icon = c.icon
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full', c.bg, c.text)}>
      <Icon size={11} />{c.label}
    </span>
  )
}

export default function MigrationHistory() {
  const [undone, setUndone] = useState(new Set())

  function handleUndo(id) {
    setUndone(s => new Set([...s, id]))
    toast.success('Import rolled back — records removed from UnifiedTree')
  }

  const totalImported = HISTORY.filter(h => h.status === 'success').reduce((s, h) => s + h.records, 0)
  const totalFailed   = HISTORY.filter(h => h.status === 'failed').length
  const totalSources  = [...new Set(HISTORY.map(h => h.source))].length

  return (
    <div>
      <PageHeader
        title="Import History"
        subtitle="A log of all data imports. You can undo recent imports if something went wrong."
        breadcrumb={['Data Migration', 'Import History']}
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Imports',    value: HISTORY.length, color: 'var(--text)'    },
          { label: 'Records Imported', value: totalImported,  color: 'var(--pos)'     },
          { label: 'Failed Imports',   value: totalFailed,    color: 'var(--neg)'     },
          { label: 'Sources Used',     value: totalSources,   color: 'var(--primary)' },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <Panel padded={false}>
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text)]">All imports</h3>
          <p className="text-xs text-[var(--muted)] mt-0.5">Most recent first. Undo removes all imported records.</p>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {HISTORY.map((item) => {
            const rolled = undone.has(item.id)
            return (
              <div
                key={item.id}
                className={cn(
                  'px-5 py-4 flex items-start gap-4 transition-colors',
                  rolled ? 'opacity-50 bg-[var(--surface-2)]' : 'hover:bg-[var(--surface-2)]'
                )}
              >
                {/* Logo */}
                <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-lg flex-shrink-0">
                  {item.logo}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[var(--text)]">{item.type}</p>
                    <span className="text-xs text-[var(--faint)]">from {item.source}</span>
                    <StatusChip status={rolled ? 'failed' : item.status} />
                    {rolled && (
                      <span className="text-xs font-medium text-[var(--neg)]">Rolled back</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    {item.status === 'success' && !rolled && (
                      <span className="text-xs text-[var(--pos)]">{item.records} records imported</span>
                    )}
                    {item.status === 'partial' && (
                      <span className="text-xs text-[var(--warn)]">{item.records} imported, {item.warnings} warnings</span>
                    )}
                    {item.status === 'failed' && (
                      <span className="text-xs text-[var(--neg)]">{item.error}</span>
                    )}
                    <span className="text-xs text-[var(--faint)]">{item.date} at {item.time}</span>
                    <span className="text-xs text-[var(--faint)]">by {item.user}</span>
                    <span className="text-xs text-[var(--faint)]">{item.size}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    icon={Eye}
                    size="sm"
                    onClick={() => toast.info(`Viewing import log ${item.id}`)}
                  >
                    Log
                  </Button>
                  {item.canUndo && !rolled && (
                    <Button
                      variant="secondary"
                      icon={RotateCcw}
                      size="sm"
                      onClick={() => handleUndo(item.id)}
                    >
                      Undo
                    </Button>
                  )}
                  {item.status !== 'failed' && (
                    <Button
                      variant="ghost"
                      icon={Download}
                      size="sm"
                      onClick={() => toast.success(`Downloading import report for ${item.id}`)}
                    >
                      Report
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
