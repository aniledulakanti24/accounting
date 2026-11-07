import { useNavigate } from 'react-router-dom'
import { CalendarClock, FileText, CreditCard, HandCoins } from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import { useApi } from '../../../hooks/useApi'
import { formatCurrency } from '../../../lib/currency'
import { Chip, ErrorBox, MockApiNote, DueLabel, RegimeCard } from './shared'
import { useTaxProfile } from './taxUtils'

const TYPE = {
  return:      { icon: FileText,   href: '/tax/gst-filing-wizard' },
  payment:     { icon: CreditCard, href: '/tax/tax-payments' },
  withholding: { icon: HandCoins,  href: '/tax/tds' },
}

/** Upcoming statutory deadlines for the active company's jurisdiction. */
export default function GlobalTaxCalendar() {
  const navigate = useNavigate()
  const { profile } = useTaxProfile()
  const { data, loading, error, refetch } = useApi('/tax/obligations')
  const items = data ?? []

  return (
    <div>
      <PageHeader title="Compliance Calendar" subtitle="Returns, payments and withholding deadlines" breadcrumb={['Tax', 'Compliance Calendar']} />
      <ErrorBox error={error} onRetry={refetch} />
      <RegimeCard profile={profile} />
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] shadow-sm divide-y divide-[var(--border)]">
        {loading && <p className="p-4 text-sm text-[var(--muted)]">Loading deadlines…</p>}
        {!loading && items.length === 0 && (
          <p className="p-4 text-sm text-[var(--muted)] flex items-center gap-2"><CalendarClock size={16} /> Nothing due — every obligation is met.</p>
        )}
        {items.map(item => {
          const t = TYPE[item.type] ?? TYPE.return
          const Icon = t.icon
          return (
            <button
              key={item.id}
              onClick={() => navigate(t.href)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--surface-2)] cursor-pointer bg-transparent border-0"
            >
              <span className="p-2 rounded-md bg-[var(--surface-2)]"><Icon size={16} className="text-[var(--primary)]" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text)] truncate">{item.title}</p>
                <p className="text-xs text-[var(--muted)] truncate">{[item.period, item.authority].filter(Boolean).join(' · ')}</p>
              </div>
              <span className="tabular text-sm font-semibold text-[var(--text)] hidden sm:block">{formatCurrency(item.amount)}</span>
              <div className="w-40 text-right"><DueLabel date={item.dueDate} /></div>
              <Chip status={item.status} />
            </button>
          )
        })}
      </div>
      <MockApiNote />
    </div>
  )
}
