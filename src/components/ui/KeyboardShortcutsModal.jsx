import { Keyboard, Command, Sparkles, Navigation, PlusCircle, X } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

const SHORTCUT_GROUPS = [
  {
    title: 'Global Shortcuts',
    icon: Command,
    shortcuts: [
      { keys: ['Ctrl', 'K'], desc: 'Open Command Palette & Global Search' },
      { keys: ['?'], desc: 'Open this Keyboard Shortcuts cheat sheet' },
      { keys: ['Ctrl', 'Shift', 'A'], desc: 'Open AI Financial Copilot' },
      { keys: ['Esc'], desc: 'Close any active modal, drawer, or search' },
    ],
  },
  {
    title: 'Quick Create Actions',
    icon: PlusCircle,
    shortcuts: [
      { keys: ['C', 'then', 'I'], desc: 'Create New Sales Invoice' },
      { keys: ['C', 'then', 'P'], desc: 'Create New Customer or Supplier' },
      { keys: ['C', 'then', 'C'], desc: 'Switch Company or Tax Jurisdiction' },
    ],
  },
  {
    title: 'Jump Navigation (Press sequentially)',
    icon: Navigation,
    shortcuts: [
      { keys: ['G', 'then', 'D'], desc: 'Go to Dashboard Overview' },
      { keys: ['G', 'then', 'S'], desc: 'Go to Sales & Invoices' },
      { keys: ['G', 'then', 'R'], desc: 'Go to Money In (Receivables)' },
      { keys: ['G', 'then', 'P'], desc: 'Go to Purchases & Payables' },
      { keys: ['G', 'then', 'B'], desc: 'Go to Cash & Bank Accounts' },
      { keys: ['G', 'then', 'T'], desc: 'Go to Tax Center & Returns' },
      { keys: ['G', 'then', 'M'], desc: 'Go to Setup & Tax Masters' },
    ],
  },
]

export default function KeyboardShortcutsModal({ open, onClose }) {
  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Keyboard Shortcuts & Ergonomics"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between">
          <span className="text-xs text-[var(--muted)]">Tip: Press <kbd className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[11px] font-bold">?</kbd> anywhere to open this dialog</span>
          <Button variant="primary" onClick={onClose}>Got it</Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--primary)]/20 bg-[var(--primary-tint)] p-3 text-xs text-[var(--primary)]">
          <Keyboard size={18} className="flex-shrink-0" />
          <p>
            UnifiedTree is engineered for <strong>keyboard-first speed</strong>. Financial operators and accountants can navigate the entire platform without touching a mouse.
          </p>
        </div>

        <div className="space-y-5">
          {SHORTCUT_GROUPS.map((group) => {
            const Icon = group.icon
            return (
              <div key={group.title} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  <Icon size={14} className="text-[var(--primary)]" />
                  <span>{group.title}</span>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {group.shortcuts.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2 text-xs">
                      <span className="text-[var(--text)]">{s.desc}</span>
                      <div className="flex items-center gap-1">
                        {s.keys.map((k, ki) =>
                          k === 'then' ? (
                            <span key={ki} className="text-[10px] text-[var(--muted)]">then</span>
                          ) : (
                            <kbd
                              key={ki}
                              className="inline-flex min-w-[22px] items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[var(--text)] shadow-xs"
                            >
                              {k}
                            </kbd>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
