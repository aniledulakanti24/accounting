import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Clock3, ShieldCheck } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import sections from '../../config/sections'

const ADVANCED_SECTION_IDS = [
  'masters',
  'assets',
  'business-tools',
  'storage',
  'alerts',
  'migration',
]

const STATUS_BY_ID = {
  masters: 'Configured',
  assets: 'Active',
  'business-tools': 'Controlled',
  'party-tools': 'Ready',
  'item-tools': 'Ready',
  storage: 'Synced',
  alerts: 'Monitoring',
  migration: 'Ready',
}

const METRIC_BY_ID = {
  masters: '6 ledgers',
  assets: '3 workflows',
  'business-tools': '4 tools',
  'party-tools': '5 utilities',
  'item-tools': '5 utilities',
  storage: '2 stores',
  alerts: '4 queues',
  migration: '3 stages',
}

function StatusChip({ label }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--pos-tint)] px-2 py-0.5 text-[11px] font-semibold text-[var(--pos)]">
      <CheckCircle2 size={11} />
      {label}
    </span>
  )
}

export default function AdvancedFeatures() {
  const navigate = useNavigate()
  const modules = ADVANCED_SECTION_IDS
    .map(id => sections.find(section => section.id === id))
    .filter(Boolean)

  return (
    <div>
      <PageHeader
        title="Advanced Features"
        subtitle="Setup, controls, assets, tools, storage, alerts, and migration"
        breadcrumb={['Advanced Features', 'Overview']}
      />

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Advanced Modules</p>
            <ShieldCheck size={15} className="text-[var(--primary)]" />
          </div>
          <p className="tabular text-2xl font-bold text-[var(--primary)]">{modules.length}</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Active Controls</p>
            <CheckCircle2 size={15} className="text-[var(--pos)]" />
          </div>
          <p className="tabular text-2xl font-bold text-[var(--pos)]">18</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Pending Reviews</p>
            <Clock3 size={15} className="text-[var(--warn)]" />
          </div>
          <p className="tabular text-2xl font-bold text-[var(--warn)]">3</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((section) => {
          const Icon = section.icon
          const firstTab = section.tabs[0]
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => navigate(`/${section.id}/${firstTab.id}`)}
              className="group flex min-h-[136px] flex-col justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[var(--shadow)]"
            >
              <div>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--primary-tint)] text-[var(--primary)]">
                    <Icon size={18} />
                  </span>
                  <StatusChip label={STATUS_BY_ID[section.id] ?? 'Ready'} />
                </div>
                <p className="text-sm font-bold text-[var(--text)]">{section.label}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{METRIC_BY_ID[section.id] ?? `${section.tabs.length} tabs`}</p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 text-xs font-semibold text-[var(--primary)]">
                <span>{firstTab.label}</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
