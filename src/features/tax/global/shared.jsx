import { AlertTriangle, Landmark, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '../../../components/ui/Button'
import { fmtDate, daysUntil } from './taxUtils'
import { formatCompact, getActiveLocale } from '../../../lib/currency'

/** Small helpers shared by the country tax pages. */

const TONES = {
  pos:     'bg-[var(--pos-tint)] text-[var(--pos)]',
  warn:    'bg-[var(--warn-tint)] text-[var(--warn)]',
  neg:     'bg-[var(--neg-tint)] text-[var(--neg)]',
  primary: 'bg-[var(--primary-tint)] text-[var(--primary-ink)]',
  muted:   'bg-[var(--muted-bg)] text-[var(--muted)]',
}

const STATUS_TONE = {
  filed: 'pos', paid: 'pos', accepted: 'pos', delivered: 'pos', matched: 'pos', remitted: 'pos',
  certified: 'pos', reported: 'pos', accounted: 'pos', 'pdf-sent': 'muted',
  ready: 'warn', pending: 'warn', deducted: 'warn', 'to-report': 'warn', 'not-sent': 'muted', deferred: 'muted',
  open: 'primary',
  overdue: 'neg', rejected: 'neg', mismatch: 'neg', 'missing-supplier': 'warn', 'missing-books': 'neg',
}

export function Chip({ status, label, tone }) {
  const { t } = useTranslation()
  const toneKey = tone || STATUS_TONE[status] || 'muted'
  const fallback = status ? status.charAt(0).toUpperCase() + status.slice(1) : '—'
  const text = label || (status ? t(`status.${status}`, { defaultValue: fallback }) : '—')
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-px text-[12px] font-[550] ${TONES[toneKey]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />{text}</span>
}

export function KpiStrip({ items }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {items.map(k => (
        <div key={k.label} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 shadow-[var(--shadow)]">
          <p className="mb-1 text-[12.5px] font-medium text-[var(--muted)]">{k.label}</p>
          <p className="tabular text-[25px] font-bold leading-tight tracking-[-0.02em]" style={{ color: k.color || 'var(--text)' }}>{k.value}</p>
          {k.hint && <p className="text-xs text-[var(--faint)] mt-1">{k.hint}</p>}
        </div>
      ))}
    </div>
  )
}

/** Card describing the jurisdiction's regime — authority, portal, frequency, deadline, threshold. */
export function RegimeCard({ profile }) {
  const { t } = useTranslation()
  if (!profile) return null
  const { country, catalog } = profile
  const facts = [
    [t('tax.regime.authority'), catalog.authority],
    [t('tax.regime.channel'), catalog.portal],
    [t('tax.regime.return'), `${catalog.returnForm} · ${catalog.frequency}`],
    [t('tax.regime.due'), catalog.dueRule.text],
    [t('tax.regime.standardRate'), `${catalog.standardRate}%`],
    [t('tax.regime.threshold'), catalog.registrationThreshold.amount
      ? `${formatCompact(catalog.registrationThreshold.amount)} — ${catalog.registrationThreshold.note}`
      : catalog.registrationThreshold.note],
  ]
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm mb-5">
      <div className="flex items-center gap-2 mb-3">
        <Landmark size={16} className="text-[var(--primary)]" />
        <p className="text-sm font-semibold text-[var(--text)]">
          {country.flag} {country.name} · {country.taxSystemName}
        </p>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
        {facts.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wider text-[var(--faint)] font-semibold">{k}</dt>
            <dd className="text-sm text-[var(--text)]">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-[var(--muted)] mt-3">{catalog.penaltyNote}</p>
    </div>
  )
}

export function ErrorBox({ error, onRetry }) {
  const { t } = useTranslation()
  if (!error) return null
  return (
    <div className="flex items-center justify-between gap-3 p-3 mb-4 rounded-[var(--radius-sm)] border border-[var(--neg)] bg-[var(--neg-tint)] text-sm text-[var(--neg)]">
      <span className="flex items-center gap-2"><AlertTriangle size={14} /> {error.message} {error.status ? `(HTTP ${error.status})` : ''}</span>
      {onRetry && <Button size="sm" variant="secondary" icon={RefreshCw} onClick={onRetry}>{t('common.retry')}</Button>}
    </div>
  )
}

export function MockApiNote() {
  const { t } = useTranslation()
  return (
    <p className="text-[11px] text-[var(--faint)] mt-4">{t('tax.demoNote')}</p>
  )
}

export function DueLabel({ date }) {
  const n = daysUntil(date)
  const cls = n < 0 ? 'text-[var(--neg)]' : n <= 7 ? 'text-[var(--warn)]' : 'text-[var(--muted)]'
  // Localized relative time: 'in 9 days', 'dans 9 jours', 'vor 2 Tagen', 'اليوم'…
  const text = new Intl.RelativeTimeFormat(getActiveLocale(), { numeric: 'auto' }).format(n, 'day')
  return (
    <span className="text-sm">
      <span className="text-[var(--text)]">{fmtDate(date)}</span>{' '}
      <span className={`text-xs ${cls}`}>{text}</span>
    </span>
  )
}
