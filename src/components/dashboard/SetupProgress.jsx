import { CheckCircle2, ChevronRight, CircleDashed } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Panel from '../ui/Panel'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

export default function SetupProgress() {
  const navigate = useNavigate()
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)
  const integrations = useAppStore(s => s.integrations)
  const importJobs = useAppStore(s => s.importJobs)
  const completedSetupActions = useAppStore(s => s.completedSetupActions ?? [])

  const setupItems = [
    { id: 'company', label: 'Company profile', href: '/settings/company-profile' },
    { id: 'gstin', label: `${countryConfig.taxIdLabel} & statutory rates`, href: '/settings/configuration' },
    { id: 'bank', label: 'Bank connection', href: '/settings/integrations' },
    { id: 'template', label: 'Invoice template', href: '/sales/sales-invoices' },
    { id: 'import', label: 'Import opening data', href: '/migration/import' },
    { id: 'first-invoice', label: 'Create first invoice', href: '/sales/sales-invoices' },
  ]

  const completed = new Set([
    (activeCompany?.taxId || activeCompany?.gstin) ? 'company' : null,
    (activeCompany?.taxId || activeCompany?.gstin) ? 'gstin' : null,
    Object.values(integrations).some(i => i.status === 'connected') ? 'bank' : null,
    importJobs.length > 0 ? 'import' : null,
    completedSetupActions.includes('first-invoice') ? 'first-invoice' : null,
  ].filter(Boolean))

  const done = completed.size
  const progress = Math.round((done / setupItems.length) * 100)
  const next = setupItems.find(item => !completed.has(item.id)) ?? setupItems[0]

  return (
    <Panel>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">5-minute setup path</h3>
          <p className="text-xs text-[var(--muted)] mt-1">
            Built to beat low-friction SMB tools: finish setup, import data, and create first invoice fast.
          </p>
        </div>
        <button
          onClick={() => navigate(next.href)}
          className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-white"
        >
          Continue: {next.label}
          <ChevronRight size={12} />
        </button>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs font-semibold text-[var(--primary)]">{progress}%</span>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {setupItems.map(item => {
          const isDone = completed.has(item.id)
          const Icon = isDone ? CheckCircle2 : CircleDashed
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.href)}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-xs"
            >
              <Icon size={13} className={isDone ? 'text-[var(--pos)]' : 'text-[var(--faint)]'} />
              <span className={isDone ? 'text-[var(--text)]' : 'text-[var(--muted)]'}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
