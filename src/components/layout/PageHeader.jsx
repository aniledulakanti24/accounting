import { cn } from '../../lib/cn'

/**
 * PageHeader — the CRM page heading: a 21px title, a one-line subtitle,
 * and actions on the right. Where you are is shown in the side menu, so
 * the `breadcrumb` prop is accepted for compatibility but not drawn.
 */
export default function PageHeader({
  title,
  subtitle,
  breadcrumb: _breadcrumb, // eslint-disable-line no-unused-vars
  action,
  children,
  className,
}) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 className="text-[21px] font-[680] leading-tight tracking-[-0.015em] text-[var(--text)]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] leading-snug text-[var(--muted)]">{subtitle}</p>}
      </div>
      {(action || children) && (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          {children}
          {action}
        </div>
      )}
    </div>
  )
}
