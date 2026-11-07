import { cn } from '../../lib/cn'

/**
 * StatusBadge — CRM-style pill: tinted background, coloured dot and label.
 */
const TONE = {
  good: 'bg-[var(--pos-tint)] text-[var(--pos)]',
  warn: 'bg-[var(--warn-tint)] text-[var(--warn)]',
  bad: 'bg-[var(--neg-tint)] text-[var(--neg)]',
  info: 'bg-[var(--info-tint)] text-[var(--info)]',
  brand: 'bg-[var(--primary-tint)] text-[var(--primary-ink)]',
  muted: 'bg-[var(--muted-bg)] text-[var(--muted)]',
}
const CONFIG = {
  paid: ['Paid', 'good'], unpaid: ['Unpaid', 'warn'], partial: ['Partial', 'warn'], overdue: ['Overdue', 'bad'],
  draft: ['Draft', 'muted'], active: ['Active', 'good'], expired: ['Expired', 'muted'], revoked: ['Revoked', 'bad'],
  pending: ['Pending', 'warn'], cancelled: ['Cancelled', 'muted'], open: ['Open', 'info'], closed: ['Closed', 'good'],
  locked: ['Locked', 'muted'], synced: ['Synced', 'brand'], sent: ['Sent', 'info'], scheduled: ['Scheduled', 'info'],
  promised: ['Promised', 'good'], approved: ['Approved', 'good'], rejected: ['Rejected', 'bad'], new: ['New', 'info'],
}

export default function StatusBadge({ status, label: customLabel, className, dot = true }) {
  const [label, tone] = CONFIG[status] ?? [status, 'muted']
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-px text-[12px] font-[550]', TONE[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {customLabel ?? (typeof label === 'string' ? label.charAt(0).toUpperCase() + label.slice(1) : label)}
    </span>
  )
}
