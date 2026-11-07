import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToastStore } from '../../lib/toast'
import { cn } from '../../lib/cn'

const TYPE_CFG = {
  success: { icon: CheckCircle2,  bg: 'bg-[#16a34a]',        text: 'text-white' },
  error:   { icon: XCircle,       bg: 'bg-[#e11d48]',        text: 'text-white' },
  info:    { icon: Info,          bg: 'bg-[var(--primary)]',  text: 'text-white' },
  warn:    { icon: AlertTriangle, bg: 'bg-[#d97706]',         text: 'text-white' },
}

export default function ToastContainer() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 end-5 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => {
        const cfg  = TYPE_CFG[t.type] ?? TYPE_CFG.info
        const Icon = cfg.icon
        return (
          <div
            key={t.id}
            role="alert"
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-[var(--radius-sm)] shadow-xl pointer-events-auto',
              'min-w-[260px] max-w-[400px]',
              cfg.bg, cfg.text,
              'animate-[item-in_240ms_cubic-bezier(0.16,1,0.3,1)_both]'
            )}
          >
            <Icon size={16} className="flex-shrink-0" strokeWidth={2} />
            <span className="flex-1 text-sm font-medium leading-snug">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
