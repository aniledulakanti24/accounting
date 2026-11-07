import { useState } from 'react'
import { Download, FileSpreadsheet, FileCheck, CheckCheck, Loader2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Panel from '../../components/ui/Panel'
import Button from '../../components/ui/Button'
import { cn } from '../../lib/cn'
import { toast } from '../../lib/toast'

const EXPORT_SETS = [
  {
    id: 'all',
    label: 'Full Company Backup',
    description: 'Everything — ledgers, parties, invoices, vouchers, inventory, settings.',
    size: '~4.2 MB',
    format: 'ZIP (CSV)',
    popular: true,
    icon: '🗂️',
  },
  {
    id: 'parties',
    label: 'Parties (Customers & Suppliers)',
    description: 'All contacts with ledger balances, GSTIN, email, and phone.',
    size: '~120 KB',
    format: 'CSV',
    popular: true,
    icon: '👥',
  },
  {
    id: 'invoices',
    label: 'Sales Invoices',
    description: 'All sales invoices with line items, GST, and payment status.',
    size: '~380 KB',
    format: 'CSV',
    popular: true,
    icon: '🧾',
  },
  {
    id: 'purchases',
    label: 'Purchase Bills',
    description: 'All purchase bills and supplier payments.',
    size: '~210 KB',
    format: 'CSV',
    popular: false,
    icon: '📦',
  },
  {
    id: 'ledgers',
    label: 'Chart of Accounts',
    description: 'All ledger accounts with groups and opening balances.',
    size: '~45 KB',
    format: 'CSV',
    popular: false,
    icon: '📋',
  },
  {
    id: 'inventory',
    label: 'Inventory Items',
    description: 'All stock items with HSN codes, rates, and opening quantities.',
    size: '~90 KB',
    format: 'CSV',
    popular: false,
    icon: '📊',
  },
  {
    id: 'journals',
    label: 'Journal Vouchers',
    description: 'All manual journal entries for the selected financial year.',
    size: '~75 KB',
    format: 'CSV',
    popular: false,
    icon: '📝',
  },
  {
    id: 'gst',
    label: 'GST Data',
    description: 'GSTR-1 and GSTR-3B data ready for government portal upload.',
    size: '~55 KB',
    format: 'CSV / JSON',
    popular: false,
    icon: '🏛️',
  },
]

const DESTINATIONS = [
  { id: 'csv',   label: 'Excel / CSV',    icon: '📊', desc: 'Open in Excel, Google Sheets, or any tool' },
  { id: 'tally', label: 'Tally XML',      icon: '🧾', desc: 'Import directly into Tally Prime / ERP 9'  },
  { id: 'json',  label: 'JSON (API)',      icon: '{}', desc: 'For developers and custom integrations'    },
]

export default function DataExport() {
  const [selected, setSelected] = useState(new Set())
  const [format,   setFormat]   = useState('csv')
  const [loading,  setLoading]  = useState(null) // id of exporting set

  function toggle(id) {
    setSelected(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function handleExport(id) {
    setLoading(id)
    setTimeout(() => {
      setLoading(null)
      const set = EXPORT_SETS.find(s => s.id === id)
      toast.success(`${set.label} exported successfully`)
    }, 1400)
  }

  function handleBulkExport() {
    if (!selected.size) { toast.warn('Select at least one dataset to export'); return }
    setLoading('bulk')
    setTimeout(() => {
      setLoading(null)
      toast.success(`Exported ${selected.size} dataset${selected.size > 1 ? 's' : ''} — check your Downloads folder`)
    }, 1800)
  }

  return (
    <div>
      <PageHeader
        title="Export Data"
        subtitle="Download your data in formats compatible with Excel, Tally, or other tools."
        breadcrumb={['Data Migration', 'Export Data']}
      />

      {/* Format selector */}
      <Panel className="mb-5">
        <p className="text-sm font-semibold text-[var(--text)] mb-3">Export format</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DESTINATIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => setFormat(d.id)}
              className={cn(
                'text-left p-3 rounded-[var(--radius-sm)] border-2 transition-all',
                format === d.id
                  ? 'border-[var(--primary)] bg-[var(--primary-tint)]'
                  : 'border-[var(--border)] hover:border-[var(--primary)]/40'
              )}
            >
              <span className="text-xl">{d.icon}</span>
              <p className="text-sm font-semibold text-[var(--text)] mt-1">{d.label}</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">{d.desc}</p>
            </button>
          ))}
        </div>
      </Panel>

      {/* Dataset grid */}
      <Panel padded={false}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">Choose datasets to export</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Select one or more, then export together — or download each individually.
            </p>
          </div>
          <Button
            variant="primary"
            icon={loading === 'bulk' ? Loader2 : Download}
            size="sm"
            disabled={!selected.size || !!loading}
            onClick={handleBulkExport}
          >
            {loading === 'bulk' ? 'Exporting…' : `Export Selected (${selected.size})`}
          </Button>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {EXPORT_SETS.map((set) => {
            const checked = selected.has(set.id)
            const busy    = loading === set.id
            return (
              <div
                key={set.id}
                className={cn(
                  'flex items-center gap-4 px-5 py-4 transition-colors',
                  checked ? 'bg-[var(--primary-tint)]' : 'hover:bg-[var(--surface-2)]'
                )}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggle(set.id)}
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                    checked
                      ? 'border-[var(--primary)] bg-[var(--primary)]'
                      : 'border-[var(--border)] hover:border-[var(--primary)]'
                  )}
                >
                  {checked && <CheckCheck size={11} className="text-white" />}
                </button>

                {/* Icon */}
                <span className="text-xl flex-shrink-0">{set.icon}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[var(--text)]">{set.label}</p>
                    {set.popular && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--primary-tint)] px-2 py-0.5 rounded-full border border-[var(--primary)]/20">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{set.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--faint)]">
                      <FileSpreadsheet size={9} /> {set.format}
                    </span>
                    <span className="text-[10px] text-[var(--faint)]">{set.size}</span>
                  </div>
                </div>

                {/* Individual download */}
                <Button
                  variant="secondary"
                  icon={busy ? Loader2 : FileCheck}
                  size="sm"
                  disabled={!!loading}
                  onClick={() => handleExport(set.id)}
                  className="flex-shrink-0"
                >
                  {busy ? 'Exporting…' : 'Export'}
                </Button>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
