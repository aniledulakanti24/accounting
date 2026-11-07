import { cn } from '../../lib/cn'

/** Card surface — white, 1px line, 10px radius, faint shadow (CRM card). */
export default function Panel({ children, className, padded = true, ...props }) {
  return (
    <div
      className={cn(
        'bg-[var(--surface)] rounded-[var(--radius)] border border-[var(--border)] shadow-[var(--shadow)]',
        padded && 'px-4 py-3.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
