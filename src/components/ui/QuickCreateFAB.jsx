import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FilePlus, CreditCard, Wallet, Receipt } from 'lucide-react'
import QuickInvoiceModal from './QuickInvoiceModal'
import { useCan } from '../../hooks/useCan'

const ACTIONS = [
  { label: 'New Invoice',    icon: FilePlus,   key: 'invoice', section: 'sales',       color: 'var(--primary)' },
  { label: 'Pay Supplier',   icon: CreditCard, href: '/payables/bills',               section: 'payables',    color: 'var(--neg)'     },
  { label: 'Record Receipt', icon: CreditCard, href: '/receivables/payments-received', section: 'receivables', color: 'var(--pos)'     },
  { label: 'New Expense',    icon: Wallet,     href: '/expenses/expense-center',      section: 'expenses',    color: 'var(--warn)'    },
  { label: 'New Bill',       icon: Receipt,    href: '/procurement/purchase-invoices', section: 'procurement', color: 'var(--neg)'     },
]

export default function QuickCreateFAB({ hidden = false, onOpenChange }) {
  const [open,        setOpen]        = useState(false)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const navigate                      = useNavigate()
  const ref                           = useRef(null)
  const can                           = useCan()
  const actions                       = ACTIONS.filter(a => can('create', a.section))

  useEffect(() => { onOpenChange?.(open) }, [open, onOpenChange])

  /* Close on outside click */
  useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  /* Close on Esc */
  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open])

  if (hidden || actions.length === 0) return null

  function go(action) {
    if (action.key === 'invoice') { setInvoiceOpen(true); setOpen(false); return }
    navigate(action.href)
    setOpen(false)
  }

  return (
    <>
    <div
      ref={ref}
      style={{ position: 'fixed', bottom: 24, insetInlineEnd: 24, zIndex: 850 }}
    >
      {/* Speed-dial options — appear above trigger */}
      {open && (
        <div className="absolute bottom-full mb-3 right-0 flex flex-col-reverse gap-2">
          {actions.map((action, i) => {
            const Icon = action.icon
            return (
              <div
                key={action.label}
                className="flex items-center gap-2.5 justify-end"
                style={{
                  animation: `fabItemIn 200ms cubic-bezier(0.34,1.56,0.64,1) ${i * 45}ms both`,
                }}
              >
                {/* Label chip */}
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap"
                  style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  {action.label}
                </span>

                {/* Icon button */}
                <button
                  onClick={() => go(action)}
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
                  style={{ background: action.color, color: '#fff' }}
                  title={action.label}
                >
                  <Icon size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Main "+" trigger */}
      <button
        data-tour="create"
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: open
            ? 'var(--neg)'
            : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-600) 100%)',
          color: '#fff',
          boxShadow: open
            ? '0 4px 20px rgba(239,68,68,0.4)'
            : '0 4px 24px rgba(15,110,86,0.45)',
        }}
        title="Quick create"
        aria-label="Quick create"
      >
        <div style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 220ms cubic-bezier(0.34,1.56,0.64,1)' }}>
          <Plus size={22} strokeWidth={2.5} />
        </div>
      </button>

      <style>{`
        @keyframes fabItemIn {
          from { opacity: 0; transform: translateY(10px) scale(0.85); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>

    {/* Quick Invoice Modal — AI duplicate check + voice amount */}
    <QuickInvoiceModal
      open={invoiceOpen}
      onClose={() => setInvoiceOpen(false)}
    />
    </>
  )
}
