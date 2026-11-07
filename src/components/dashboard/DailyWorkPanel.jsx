import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, FilePlus, Receipt, Wallet } from 'lucide-react'
import Panel from '../ui/Panel'
import QuickInvoiceModal from '../ui/QuickInvoiceModal'

const ACTIONS = [
  {
    id: 'invoice',
    label: 'Create Invoice',
    hint: 'Sales > Invoices',
    icon: FilePlus,
    color: 'var(--primary)',
  },
  {
    id: 'supplier-payment',
    label: 'Pay Supplier',
    hint: 'Bills to Pay > Bills',
    icon: CreditCard,
    href: '/payables/bills',
    color: 'var(--neg)',
  },
  {
    id: 'receipt',
    label: 'Record Receipt',
    hint: 'Money In > Payments Received',
    icon: Receipt,
    href: '/receivables/receipts',
    color: 'var(--pos)',
  },
  {
    id: 'expense',
    label: 'Add Expense',
    hint: 'Expenses > All Expenses',
    icon: Wallet,
    href: '/expenses/expense-center',
    color: 'var(--warn)',
  },
]

export default function DailyWorkPanel() {
  const navigate = useNavigate()
  const [invoiceOpen, setInvoiceOpen] = useState(false)

  function run(action) {
    if (action.id === 'invoice') {
      setInvoiceOpen(true)
      return
    }
    navigate(action.href)
  }

  return (
    <>
      <Panel>
        <div className="flex flex-col gap-1 mb-4">
          <h3 className="text-sm font-semibold text-[var(--text)]">Daily Work</h3>
          <p className="text-xs text-[var(--muted)]">
            The two common accountant jobs are first: create customer invoices and pay supplier bills.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => run(action)}
                className="group min-h-[92px] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3 text-left transition-all hover:-translate-y-px hover:border-[var(--primary)] hover:bg-[var(--surface)] hover:shadow-sm"
              >
                <span
                  className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: 'var(--surface)', color: action.color, border: '1px solid var(--border)' }}
                >
                  <Icon size={16} />
                </span>
                <span className="block text-sm font-semibold text-[var(--text)]">{action.label}</span>
                <span className="mt-1 block text-[11px] text-[var(--muted)]">{action.hint}</span>
              </button>
            )
          })}
        </div>
      </Panel>

      <QuickInvoiceModal open={invoiceOpen} onClose={() => setInvoiceOpen(false)} />
    </>
  )
}
