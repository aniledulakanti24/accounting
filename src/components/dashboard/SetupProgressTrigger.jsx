import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, ChevronRight, CircleDashed } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

export default function SetupProgressTrigger() {
  const navigate = useNavigate()
  const ref = useRef(null)
  const [open, setOpen] = useState(false)

  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)
  const integrations = useAppStore(s => s.integrations)
  const importJobs = useAppStore(s => s.importJobs)
  const completedSetupActions = useAppStore(s => s.completedSetupActions ?? [])

  const setupItems = [
    { id: 'company', label: 'Company profile', href: '/settings/company-profile' },
    { id: 'gstin', label: `${countryConfig.taxIdLabel} and tax defaults`, href: '/settings/configuration' },
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

  const progress = Math.round((completed.size / setupItems.length) * 100)
  const next = setupItems.find(item => !completed.has(item.id)) ?? setupItems[0]

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function go(href) {
    setOpen(false)
    navigate(href)
  }

  return (
    <div ref={ref} className="relative" style={{ flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="5-minute setup path"
        className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all hover:border-[var(--primary)]/50 hover:shadow-sm"
        style={{ background: open ? 'var(--surface)' : 'var(--surface-2)', borderColor: open ? 'var(--primary)' : 'var(--border)' }}
      >
        <span
          className="relative flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(#42f266 0 ${progress}%, #eeeeee ${progress}% 100%)` }}
        >
          <span className="absolute h-[18px] w-[18px] rounded-full bg-[var(--surface)]" />
          <span className="relative tabular text-[9px] font-black leading-none text-black">
            {progress}%
          </span>
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-40 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl"
          style={{ animation: 'setupPopoverIn 160ms cubic-bezier(0.16,1,0.3,1) both' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">5-minute setup path</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Finish the minimum setup, then create the first invoice.
              </p>
            </div>
            <span className="rounded-full bg-[var(--primary-tint)] px-2 py-1 text-xs font-semibold text-[var(--primary)]">
              {progress}%
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <button
            onClick={() => go(next.href)}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-white"
          >
            Continue: {next.label}
            <ChevronRight size={12} />
          </button>

          <div className="mt-3 grid gap-2">
            {setupItems.map(item => {
              const isDone = completed.has(item.id)
              const Icon = isDone ? CheckCircle2 : CircleDashed
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.href)}
                  className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--surface)]"
                >
                  <Icon size={13} className={isDone ? 'text-[var(--pos)]' : 'text-[var(--faint)]'} />
                  <span className={isDone ? 'text-[var(--text)]' : 'text-[var(--muted)]'}>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes setupPopoverIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
