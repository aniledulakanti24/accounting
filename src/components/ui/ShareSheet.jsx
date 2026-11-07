import { useEffect } from 'react'
import {
  X, MessageCircle, Mail, Link2, Download, Printer,
} from 'lucide-react'
import { toast } from '../../lib/toast'
import { formatCurrencyWhole } from '../../lib/currency'

/**
 * ShareSheet — bottom sheet for sharing an invoice / document.
 *
 * Props:
 *   open      boolean
 *   onClose   () => void
 *   onPreview () => void  — opens InvoicePreview modal
 *   item      { ref, customer, total, dueDate }
 */
export default function ShareSheet({ open, onClose, onPreview, item }) {
  /* Close on Esc */
  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open || !item) return null

  const message = encodeURIComponent(
    `Dear ${item.customer},\n\nYour invoice *${item.ref}* for *${formatCurrencyWhole(Number(item.total))}* is due on ${item.dueDate}.\n\nPlease arrange payment at your earliest convenience.\n\n— Sunrise Traders Pvt. Ltd.`
  )
  const waUrl    = `https://wa.me/?text=${message}`
  const mailUrl  = `mailto:?subject=Invoice ${item.ref} — ${formatCurrencyWhole(Number(item.total))}&body=${message}`
  const fakeLink = `https://unifiedtree.app/invoice/${item.ref}`

  function copyLink() {
    navigator.clipboard.writeText(fakeLink)
      .then(() => toast.success('Link copied to clipboard'))
      .catch(() => toast.error('Copy failed — paste manually'))
  }

  const CHANNELS = [
    {
      label: 'WhatsApp',
      sub:   'Open in WhatsApp',
      icon:  MessageCircle,
      bg:    '#25D366',
      action: () => { window.open(waUrl, '_blank'); onClose() },
    },
    {
      label: 'Email',
      sub:   'Compose in mail app',
      icon:  Mail,
      bg:    'var(--primary)',
      action: () => { window.open(mailUrl); onClose() },
    },
    {
      label: 'Copy Link',
      sub:   fakeLink,
      icon:  Link2,
      bg:    'var(--muted)',
      action: () => { copyLink(); onClose() },
    },
    {
      label: 'Print / PDF',
      sub:   'Preview then download',
      icon:  Printer,
      bg:    'var(--warn)',
      action: () => { onClose(); setTimeout(() => onPreview?.(), 80) },
    },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[900] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 150ms ease both' }}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[910] bg-[var(--surface)] rounded-t-2xl shadow-2xl border-t border-[var(--border)]"
        style={{ animation: 'sheetUp 240ms cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-3 border-b border-[var(--border)]">
          <div>
            <p className="text-sm font-bold text-[var(--text)]">Share Invoice</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {item.ref} · {item.customer} · {formatCurrencyWhole(Number(item.total))}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--faint)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Channels grid */}
        <div className="grid grid-cols-4 gap-4 px-6 py-5">
          {CHANNELS.map(ch => {
            const Icon = ch.icon
            return (
              <button
                key={ch.label}
                onClick={ch.action}
                className="flex flex-col items-center gap-2.5 group"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-all group-hover:scale-110 group-active:scale-95"
                  style={{ background: ch.bg }}
                >
                  <Icon size={22} color="#fff" strokeWidth={1.75} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-[var(--text)]">{ch.label}</p>
                  <p className="text-[10px] text-[var(--faint)] mt-0.5 max-w-[72px] truncate">{ch.sub}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer safe area */}
        <div className="pb-6" />
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </>
  )
}
