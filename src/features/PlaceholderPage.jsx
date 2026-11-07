import { Construction } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'

/**
 * Placeholder — shown for tabs not yet implemented.
 * Replace with real feature component at Milestone 2+.
 */
export default function PlaceholderPage({ section, tab }) {
  return (
    <div>
      <PageHeader title={tab} breadcrumb={[section, tab]} />
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--primary-tint)] flex items-center justify-center mb-5">
          <Construction size={28} className="text-[var(--primary)]" strokeWidth={1.5} />
        </div>
        <h2 className="text-base font-semibold text-[var(--text)] mb-2">Coming in the next milestone</h2>
        <p className="text-sm text-[var(--muted)] max-w-xs">
          The <strong>{tab}</strong> page is scaffolded and routed. Full implementation follows in Milestone 2+.
        </p>
      </div>
    </div>
  )
}
