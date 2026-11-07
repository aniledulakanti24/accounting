import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, Bell, BellOff, CheckCircle, AlertOctagon,
  Clock, ChevronRight, Trash2, CheckCheck,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { toast } from '../../lib/toast'
import { localizeMoneyText } from '../../lib/currency'

/* ─── Mock notifications ────────────────────────────────────────────── */
const INITIAL = [
  {
    id: 1, type: 'critical',
    title: 'GSTR-1 Filing Overdue',
    desc: 'GSTR-1 for December was due yesterday. File immediately to avoid ₹50 per day penalty.',
    time: '2h ago', read: false, href: '/tax/gst-returns', category: 'tax',
  },
  {
    id: 2, type: 'payment',
    title: 'Payment Received — ₹8,50,000',
    desc: 'Infosys BPO Ltd cleared INV-2024-0842. Balance outstanding: ₹20L.',
    time: '3h ago', read: false, href: '/receivables/payments-received', category: 'payments',
  },
  {
    id: 3, type: 'warn',
    title: 'Bill Due Tomorrow',
    desc: 'Amazon Web Services — ₹12,500 due on 25 Dec. Ensure funds available.',
    time: '4h ago', read: false, href: '/payables/bills', category: 'payments',
  },
  {
    id: 4, type: 'info',
    title: 'Bank Statement Ready',
    desc: 'HDFC Current A/c December statement ready — 8 transactions unreconciled.',
    time: '1d ago', read: true, href: '/cashbank/bank-rules', category: 'system',
  },
  {
    id: 5, type: 'ai',
    title: 'AI Cash Flow Forecast Updated',
    desc: 'New prediction: cash turns negative in ~87 days. Review recommended actions.',
    time: '1d ago', read: true, href: '/dashboard/cash-flow', category: 'ai',
  },
  {
    id: 6, type: 'payment',
    title: 'Payment Sent — ₹4,20,000',
    desc: 'Payment to Reliance Industries processed via NEFT. Ref: HDFC240214.',
    time: '2d ago', read: true, href: '/payables/payments', category: 'payments',
  },
  {
    id: 7, type: 'warn',
    title: 'TDS Challan Not Uploaded',
    desc: 'TDS deducted for Q3 (Oct–Dec) not yet deposited. Due 7 Jan 2025.',
    time: '2d ago', read: true, href: '/tax/tds', category: 'tax',
  },
  {
    id: 8, type: 'info',
    title: 'New User Added',
    desc: 'Sneha Patel added as Accountant. Access granted to Sales, Expenses, Reports.',
    time: '3d ago', read: true, href: '/business-tools/manage-users', category: 'system',
  },
  {
    id: 9, type: 'ai',
    title: 'AI Detected Duplicate Purchase Order',
    desc: 'PO-2024-0121 appears to duplicate PO-2024-0118 (same vendor + amount). Review before approving.',
    time: '3d ago', read: true, href: '/procurement/purchase-orders', category: 'ai',
  },
  {
    id: 10, type: 'critical',
    title: 'Advance Tax Q3 Due in 15 Days',
    desc: 'Estimated advance tax ₹1.2L due 15 Dec. Pay via Tax Payments section.',
    time: '4d ago', read: true, href: '/tax/tax-payments', category: 'tax',
  },
]

const TYPE_CFG = {
  critical: { dot: 'bg-[var(--neg)]',     icon: AlertOctagon, iconCls: 'text-[var(--neg)]',     bg: 'bg-[var(--neg-tint)]'     },
  warn:     { dot: 'bg-[var(--warn)]',     icon: Clock,        iconCls: 'text-[var(--warn)]',    bg: 'bg-[var(--warn-tint)]'    },
  payment:  { dot: 'bg-[var(--pos)]',      icon: CheckCircle,  iconCls: 'text-[var(--pos)]',     bg: 'bg-[var(--pos-tint)]'     },
  info:     { dot: 'bg-[var(--primary)]',  icon: Bell,         iconCls: 'text-[var(--primary)]', bg: 'bg-[var(--primary-tint)]' },
  ai:       { dot: 'bg-purple-500',        icon: Bell,         iconCls: 'text-purple-500',       bg: 'bg-purple-50'             },
}

const CATS = ['all', 'tax', 'payments', 'ai', 'system']

export default function NotificationsPanel({ open, onClose }) {
  const navigate = useNavigate()
  const [items,   setItems]   = useState(INITIAL)
  const [filter,  setFilter]  = useState('all')

  if (!open) return null

  const unreadCount = items.filter(n => !n.read).length

  const visible = filter === 'all'
    ? items
    : items.filter(n => n.category === filter)

  function markRead(id) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function markAllRead() {
    setItems(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }

  function dismiss(id) {
    setItems(prev => prev.filter(n => n.id !== id))
  }

  function clearAll() {
    setItems([])
    toast.success('All notifications cleared')
  }

  function handleClick(item) {
    markRead(item.id)
    navigate(item.href)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 end-0 h-full w-[400px] z-50 flex flex-col bg-[var(--surface)] border-s border-[var(--border)] shadow-2xl"
        style={{ animation: 'slideInRight 220ms cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-[var(--text)]" />
              <h2 className="text-sm font-bold text-[var(--text)]">Notifications</h2>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-white bg-[var(--neg)] px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                title="Mark all read"
                className="flex items-center gap-1 text-[10px] font-semibold text-[var(--primary)] hover:underline px-2 py-1"
              >
                <CheckCheck size={11} /> Mark all read
              </button>
            )}
            {items.length > 0 && (
              <button
                onClick={clearAll}
                title="Clear all"
                className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors text-[var(--faint)]"
              >
                <Trash2 size={13} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors text-[var(--faint)]"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 py-2.5 border-b border-[var(--border)] flex-shrink-0 overflow-x-auto hide-scrollbar">
          {CATS.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                'text-[11px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all capitalize',
                filter === cat
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--border)]'
              )}
            >
              {cat}
              {cat === 'all' && unreadCount > 0 && (
                <span className="ml-1.5 bg-white/30 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
              <BellOff size={32} className="text-[var(--faint)]" />
              <p className="text-sm font-semibold text-[var(--muted)]">No notifications</p>
              <p className="text-xs text-[var(--faint)]">You're all caught up. Notifications will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {visible.map(item => {
                const cfg  = TYPE_CFG[item.type] ?? TYPE_CFG.info
                const Icon = cfg.icon
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex gap-3 px-4 py-4 transition-colors group relative',
                      !item.read && 'bg-[var(--primary-tint)]/30',
                      'hover:bg-[var(--surface-2)]'
                    )}
                  >
                    {/* Unread dot */}
                    {!item.read && (
                      <div className={cn('absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full', cfg.dot)} />
                    )}

                    {/* Icon */}
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg)}>
                      <Icon size={14} className={cfg.iconCls} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleClick(item)}>
                      <p className={cn('text-sm leading-snug mb-0.5', item.read ? 'font-medium text-[var(--text)]' : 'font-bold text-[var(--text)]')}>
                        {localizeMoneyText(item.title)}
                      </p>
                      <p className="text-xs text-[var(--muted)] leading-relaxed mb-1">{localizeMoneyText(item.desc)}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--faint)]">{item.time}</span>
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                          View <ChevronRight size={9} />
                        </span>
                      </div>
                    </div>

                    {/* Dismiss */}
                    <button
                      onClick={() => dismiss(item.id)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--border)] text-[var(--faint)]"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-[var(--border)] px-5 py-3 flex items-center justify-between">
          <p className="text-xs text-[var(--faint)]">
            {items.length} notification{items.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={() => { navigate('/alerts/accountant-alerts'); onClose() }}
            className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-0.5"
          >
            View all in Alerts <ChevronRight size={11} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}
