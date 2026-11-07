import { cn } from '../../lib/cn'

/**
 * Button — sized and styled like the UnifiedTree CRM.
 * variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
 * size: 'sm' (30px) | 'md' (36px) | 'lg' (40px)
 */
export default function Button({
  children,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  disabled,
  className,
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-[550] border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

  const variants = {
    primary:   'bg-[var(--primary)] border-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-600)] hover:border-[var(--primary-600)]',
    secondary: 'bg-[var(--surface)] border-[var(--border-strong)] text-[var(--text)] hover:bg-[var(--surface-2)]',
    outline:   'bg-[var(--surface)] border-[var(--primary)] text-[var(--primary-ink)] hover:bg-[var(--primary-tint)]',
    ghost:     'bg-transparent border-transparent text-[var(--text)] hover:bg-[var(--surface-2)]',
    danger:    'bg-[var(--neg)] border-[var(--neg)] text-white hover:opacity-90',
  }

  const sizes = {
    sm: 'h-[30px] px-[9px] text-[12.5px] rounded-[7px]',
    md: 'h-9 px-3 text-[13.5px] rounded-[8px]',
    lg: 'h-10 px-4 text-[14px] rounded-[8px]',
  }

  return (
    <button
      className={cn(base, variants[variant] ?? variants.secondary, sizes[size] ?? sizes.md, className)}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2} />}
      {children}
      {IconRight && <IconRight size={size === 'sm' ? 14 : 16} strokeWidth={2} />}
    </button>
  )
}
