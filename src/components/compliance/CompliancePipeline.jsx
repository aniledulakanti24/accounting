import { CheckCircle2, Clock3, FileCheck2, RefreshCw, ShieldAlert, Zap } from 'lucide-react'
import Panel from '../ui/Panel'
import Button from '../ui/Button'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

const STATUS = {
  done: { label: 'Done', color: 'var(--pos)', bg: 'var(--pos-tint)', icon: CheckCircle2 },
  ready: { label: 'Ready', color: 'var(--primary)', bg: 'var(--primary-tint)', icon: Zap },
  pending: { label: 'Pending', color: 'var(--muted)', bg: 'var(--surface-2)', icon: Clock3 },
  blocked: { label: 'Waiting', color: 'var(--warn)', bg: 'var(--warn-tint)', icon: ShieldAlert },
}

const ACTION_LABEL = {
  'irn-generated': 'Generate IRN',
  'eway-generated': 'Generate E-way Bill',
  'gstr1-staged': 'Stage GSTR-1',
  'gstr3b-reviewed': 'Mark Reviewed',
  'return-filed': 'File Return',
}

export default function CompliancePipeline() {
  const steps = useAppStore(s => s.compliancePipeline)
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)
  const runComplianceAction = useAppStore(s => s.runComplianceAction)
  const resetCompliancePipeline = useAppStore(s => s.resetCompliancePipeline)
  const recordAudit = useAppStore(s => s.recordAudit)

  const done = steps.filter(s => s.status === 'done').length
  const progress = Math.round((done / steps.length) * 100)

  function run(step) {
    runComplianceAction(step.id)
    recordAudit(
      'compliance',
      `${step.label} completed`,
      `${step.label} was completed in the statutory ${countryConfig.taxSystem} compliance pipeline.`,
      { module: 'Tax Center', severity: step.risk === 'high' ? 'warning' : 'info' }
    )
  }

  return (
    <Panel className="mb-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 size={16} className="text-[var(--primary)]" />
            <h3 className="text-sm font-semibold text-[var(--text)]">{countryConfig.taxSystem} Compliance Pipeline</h3>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">
            Invoice generation to electronic compliance to statutory return filing, simulated end-to-end.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="min-w-[150px]">
            <div className="flex items-center justify-between text-[11px] text-[var(--muted)] mb-1">
              <span>Progress</span>
              <span className="font-semibold text-[var(--primary)]">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
              <div className="h-full bg-[var(--primary)]" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <Button size="sm" variant="ghost" icon={RefreshCw} onClick={resetCompliancePipeline}>
            Reset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {steps.map((step, index) => {
          const cfg = STATUS[step.status] ?? STATUS.pending
          const Icon = cfg.icon
          const actionable = step.status === 'ready' || step.status === 'blocked'
          return (
            <div key={step.id} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: cfg.bg, color: cfg.color }}>
                      {step.status === 'done' ? <Icon size={13} /> : index + 1}
                    </span>
                    <p className="text-sm font-semibold text-[var(--text)] truncate">{step.label}</p>
                  </div>
                  <p className="text-[11px] text-[var(--muted)] mt-2">
                    Owner: {step.owner} · Due: {step.due}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
                  <Icon size={10} />
                  {cfg.label}
                </span>
              </div>
              {actionable && (
                <button
                  onClick={() => run(step)}
                  className="mt-3 w-full rounded-[var(--radius-sm)] bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {ACTION_LABEL[step.id] ?? 'Complete Step'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
