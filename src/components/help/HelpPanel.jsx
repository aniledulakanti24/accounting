import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, Search, ChevronDown, ChevronUp, ChevronRight,
  BookOpen, PlayCircle, Keyboard, LifeBuoy,
  MessageCircle, Mail, Phone, ExternalLink,
  Sparkles, FileText, Calculator, Landmark,
  ShoppingCart, ArrowRightLeft,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'
import { localizeMoneyText } from '../../lib/currency'

/* ─── Content ───────────────────────────────────────────────────────── */
const SHORTCUTS = [
  { keys: ['Ctrl', 'K'],         label: 'Open search / command palette' },
  { keys: ['Ctrl', 'Shift', 'A'], label: 'Open AI assistant'           },
  { keys: ['Alt', '1'],          label: 'Go to Dashboard'              },
  { keys: ['Alt', '2'],          label: 'Go to Sales'                  },
  { keys: ['Alt', '3'],          label: 'Go to Money In'               },
  { keys: ['Alt', '4'],          label: 'Go to Expenses'               },
  { keys: ['Esc'],               label: 'Close any open panel'         },
]

const QUICK_LINKS = [
  { icon: ShoppingCart,    label: 'Create a Sales Invoice',     href: '/sales/sales-invoices',       color: 'var(--primary)' },
  { icon: Landmark,        label: 'Reconcile Bank Statement',   href: '/cashbank/bank-rules',    color: '#16a34a'        },
  { icon: Calculator,      label: 'File GST Returns',           href: '/tax/gst-returns',            color: '#d97706'        },
  { icon: ArrowRightLeft,  label: 'Import from Tally / Zoho',   href: '/migration/import',           color: '#8b5cf6'        },
  { icon: FileText,        label: 'View Profit & Loss',         href: '/reports/financial-statements', color: '#e11d48'      },
  { icon: Sparkles,        label: 'Ask AI a question',          href: null,                          color: '#6366f1', ai: true },
]

function getFaqs(countryConfig) {
  const isUS = countryConfig.countryCode === 'US' || countryConfig.taxSystem === 'SalesTax'
  const isVAT = countryConfig.taxSystem === 'VAT'

  const taxSection = isUS
    ? {
        category: 'Sales Tax & Compliance',
        icon: Calculator,
        items: [
          { q: 'How do I remit State Sales Tax?', a: 'Go to Sales Tax Center → Returns. Review nexus and jurisdiction breakdown by state and county, then prepare your scheduled remittance.' },
          { q: 'How do I handle 1099 Withholding?', a: 'Go to Sales Tax → 1099 Withholding. Track vendor payments above $600 and generate annual 1099-NEC and 1099-MISC packets.' },
          { q: 'What is Sales Tax Exemption management?', a: 'Go to Sales Tax → Exemption Matching to verify and store resale certificates for wholesale tax-exempt customers.' },
          { q: 'When should I generate electronic invoices?', a: 'Electronic invoices with EDI and automated audit trails are supported under Sales Tax → E-Invoicing.' },
        ],
      }
    : isVAT
    ? {
        category: 'VAT & Statutory Filing',
        icon: Calculator,
        items: [
          { q: 'How do I submit MTD 9-Box VAT or FTA VAT 201?', a: 'Go to VAT Center → VAT Returns. Review Box 1 to 9 totals or FTA Standard Rated Supplies and Input Recovery, then download digital submission files.' },
          { q: 'What is Input VAT Reconciliation?', a: 'Go to VAT Center → VAT Reconciliation to match supplier invoices against statements and customs entry declarations.' },
          { q: 'How are Reverse Charge transactions handled?', a: 'Domestic and cross-border reverse charges are automatically segregated into the statutory return boxes.' },
          { q: 'How do Peppol / ZATCA e-Invoices work?', a: 'Go to VAT Center → E-Invoicing. UnifiedTree generates compliant XML/UBL digital invoices.' },
        ],
      }
    : {
        category: 'GST & Statutory Filing',
        icon: Calculator,
        items: [
          { q: 'How do I file GSTR-1?', a: 'Go to Tax → GST Filing. Select the return period, review the auto-populated B2B and B2C tables, verify totals, then click "Prepare JSON". Download and upload to the GST portal.' },
          { q: 'What is GSTR-2B reconciliation?', a: 'GSTR-2B is the Input Tax Credit (ITC) statement from the government. Go to Tax → GST Matching to compare your purchases with what suppliers have reported. Mismatches are highlighted — resolve them before filing 3B.' },
          { q: 'How do I handle TDS?', a: 'Go to Tax → TDS. Record TDS deducted against vendor payments, generate Form 26Q, and upload the challan. UnifiedTree tracks deductee-wise TDS and generates the quarterly return data.' },
          { q: 'When should I use e-Invoicing?', a: 'E-invoicing is mandatory for businesses with turnover above ₹5 crore. Go to Tax → E-Invoices. UnifiedTree auto-generates the IRN and QR code for eligible invoices.' },
        ],
      }

  return [
    {
      category: 'Getting Started',
      icon: BookOpen,
      items: [
        { q: 'How do I set up my company?', a: `Go to Settings (gear icon at bottom of sidebar) → Company Profile. Fill in your legal name, ${countryConfig.taxIdLabel}, and financial year start date. Save to activate.` },
        { q: 'How do I add my opening balances?', a: 'Go to Setup & Configuration → Starting Balances. Enter the closing balance from your previous software as of 31 March. This becomes your opening balance for the new FY.' },
        { q: 'Can I import data from Tally or Zoho?', a: 'Yes! Go to Data Migration → Import Data. Select your source (Tally, Zoho, QuickBooks, Vyapar, etc.), follow the export guide, upload your file, and map the fields. The AI auto-maps ~90% of fields.' },
        { q: 'How do I invite my accountant / CA?', a: 'Go to Team & Tools → User Access → Add User. Set role to "CA / Accountant" for read-only access, or choose "Accountant Full" for edit access.' },
      ],
    },
    {
      category: 'Invoicing & Sales',
      icon: ShoppingCart,
      items: [
        { q: `How do I create a compliant ${countryConfig.taxSystem} invoice?`, a: `Go to Sales → Invoices → New Invoice. Select the customer (their ${countryConfig.taxIdLabel} auto-fills), add line items with statutory tax rates. UnifiedTree calculates taxes automatically.` },
        { q: 'How do I record a partial payment?', a: 'Go to Money In → Payments Received → New Receipt. Select the invoice, enter the amount received (can be less than the total), and save. The invoice status changes to "Partial".' },
        { q: 'How do I send a payment reminder?', a: 'Go to Money In → Follow-ups. Select overdue invoices, click "Send Reminder", and choose WhatsApp, Email, or SMS. The AI drafts the message for you.' },
        { q: 'What is the difference between Sales and Money In?', a: '"Sales" is where you create invoices and quotes. "Money In" (Receivables) tracks the money customers actually pay you — receipts, credit notes, and overdue tracking.' },
      ],
    },
    taxSection,
    {
      category: 'Banking & Cash',
      icon: Landmark,
      items: [
        { q: 'How do I reconcile my bank statement?', a: 'Go to Cash & Bank → Match Transactions. Import your bank statement (CSV from net banking), and UnifiedTree matches transactions automatically. Review unmatched items and confirm.' },
        { q: 'How do I record cash expenses?', a: 'Go to Expenses → All Expenses → New Expense. Set "Paid By" to Petty Cash or Cash in Hand. The petty cash balance updates automatically.' },
        { q: 'What is a Contra entry?', a: 'A contra is a fund transfer between your own accounts — e.g., transferring from bank to Petty Cash. Go to Cash & Bank → Between Accounts to record these.' },
      ],
    },
    {
      category: 'Reports',
      icon: FileText,
      items: [
        { q: 'How do I view my Profit & Loss?', a: 'Go to Reports → Financial Reports → select "Profit & Loss". Choose the date range. You can view month-wise, quarter-wise, or full FY. Export to PDF or Excel.' },
        { q: 'What is the Balance Sheet?', a: 'The Balance Sheet shows your business\' net worth — Assets vs Liabilities + Capital. Go to Reports → Financial Reports → Balance Sheet.' },
        { q: 'Can I create custom reports?', a: 'Yes. Go to Reports → Custom Reports. Choose data source, select fields, add filters and grouping, then save the report. AI can also generate narrative summaries.' },
      ],
    },
  ]
}

function Kbd({ children }) {
  return (
    <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--surface-2)] text-[10px] font-mono font-bold text-[var(--muted)] shadow-sm">
      {children}
    </kbd>
  )
}

function FaqSection({ section }) {
  const [open,  setOpen]  = useState(null)
  const Icon = section.icon
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} className="text-[var(--primary)]" />
        <p className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">{section.category}</p>
      </div>
      <div className="rounded-[var(--radius-sm)] border border-[var(--border)] overflow-hidden">
        {section.items.map((item, i) => (
          <div key={i} className="border-b border-[var(--border)] last:border-0">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--surface-2)] transition-colors gap-3"
            >
              <span className="text-xs font-semibold text-[var(--text)] leading-snug">{item.q}</span>
              {open === i
                ? <ChevronUp  size={13} className="text-[var(--faint)] flex-shrink-0" />
                : <ChevronDown size={13} className="text-[var(--faint)] flex-shrink-0" />
              }
            </button>
            {open === i && (
              <div className="px-4 pb-3 text-xs text-[var(--muted)] leading-relaxed bg-[var(--surface-2)] border-t border-[var(--border)]">
                {localizeMoneyText(item.a)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Main panel ─────────────────────────────────────────────────────── */
export default function HelpPanel({ open, onClose, onOpenAI }) {
  const navigate = useNavigate()
  const [search, setSearch]   = useState('')
  const [tab,    setTab]      = useState('help') // 'help' | 'shortcuts'
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryConfig = useMemo(() => getCountryTaxConfig(activeCompany?.country || 'IN'), [activeCompany?.country])
  const faqs = useMemo(() => getFaqs(countryConfig), [countryConfig])

  if (!open) return null

  // Search filter across all FAQs
  const q = search.toLowerCase().trim()
  const filteredFaqs = q
    ? faqs.map(sec => ({
        ...sec,
        items: sec.items.filter(
          item => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
        ),
      })).filter(sec => sec.items.length > 0)
    : faqs

  function handleQuickLink(link) {
    if (link.ai) { onClose(); onOpenAI?.(); return }
    navigate(link.href)
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
        className="fixed top-0 end-0 h-full w-[420px] z-50 flex flex-col bg-[var(--surface)] border-s border-[var(--border)] shadow-2xl"
        style={{ animation: 'slideInRight 220ms cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LifeBuoy size={16} className="text-[var(--primary)]" />
              <h2 className="text-sm font-bold text-[var(--text)]">Help & Support</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors text-[var(--faint)]">
              <X size={14} />
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 h-9 px-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] focus-within:border-[var(--primary)] transition-colors">
            <Search size={13} className="text-[var(--faint)] flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search help topics…"
              className="flex-1 text-sm bg-transparent focus:outline-none text-[var(--text)] placeholder:text-[var(--faint)]"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-[var(--faint)] hover:text-[var(--muted)]">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Tabs */}
          {!search && (
            <div className="flex gap-1 mt-3">
              {[['help', 'Help Topics'], ['shortcuts', 'Keyboard Shortcuts']].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    'text-xs font-semibold px-3 py-1.5 rounded-full transition-all',
                    tab === id
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--border)]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">

          {/* ── HELP TAB ── */}
          {(tab === 'help' || search) && (
            <>
              {/* Quick links — only when not searching */}
              {!search && (
                <div className="mb-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Quick actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_LINKS.map(link => {
                      const Icon = link.icon
                      return (
                        <button
                          key={link.label}
                          onClick={() => handleQuickLink(link)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface)] hover:shadow-sm transition-all text-left group"
                        >
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                            style={{ background: `${link.color}18` }}
                          >
                            <Icon size={12} style={{ color: link.color }} />
                          </div>
                          <span className="text-xs font-medium text-[var(--text)] leading-tight group-hover:text-[var(--primary)] transition-colors">
                            {link.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* FAQ sections */}
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-8">
                  <Search size={28} className="mx-auto mb-3 text-[var(--faint)]" />
                  <p className="text-sm font-semibold text-[var(--muted)]">No results for "{search}"</p>
                  <p className="text-xs text-[var(--faint)] mt-1">Try different keywords or ask the AI assistant.</p>
                </div>
              ) : (
                filteredFaqs.map(sec => <FaqSection key={sec.category} section={sec} />)
              )}

              {/* Video tutorials */}
              {!search && (
                <div className="mt-2 mb-4 rounded-[var(--radius-sm)] border border-[var(--border)] overflow-hidden">
                  <div className="px-4 py-3 bg-[var(--surface-2)] border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <PlayCircle size={13} className="text-[var(--primary)]" />
                      <p className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Video Tutorials</p>
                    </div>
                  </div>
                  {[
                    'Getting started with UnifiedTree (5 min)',
                    'Creating your first GST invoice (8 min)',
                    'Bank reconciliation walkthrough (12 min)',
                    'Filing GSTR-1 step by step (15 min)',
                    'Importing data from Tally (10 min)',
                  ].map(title => (
                    <button
                      key={title}
                      onClick={() => {}}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[var(--surface-2)] transition-colors border-b border-[var(--border)] last:border-0 group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center flex-shrink-0">
                          <PlayCircle size={12} className="text-red-500" />
                        </div>
                        <span className="text-xs text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">{title}</span>
                      </div>
                      <ExternalLink size={11} className="text-[var(--faint)] group-hover:text-[var(--primary)] flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── SHORTCUTS TAB ── */}
          {tab === 'shortcuts' && !search && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Keyboard shortcuts</p>
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
                {SHORTCUTS.map(sc => (
                  <div key={sc.label} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-2)] transition-colors">
                    <span className="text-xs text-[var(--text)]">{sc.label}</span>
                    <div className="flex items-center gap-1">
                      {sc.keys.map((k, i) => (
                        <span key={k} className="flex items-center gap-1">
                          <Kbd>{k}</Kbd>
                          {i < sc.keys.length - 1 && <span className="text-[10px] text-[var(--faint)]">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mt-5 mb-3">Navigation shortcuts</p>
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
                {[
                  { keys: ['Alt', '←'], label: 'Go back' },
                  { keys: ['Alt', '→'], label: 'Go forward' },
                  { keys: ['?'],        label: 'Open help' },
                ].map(sc => (
                  <div key={sc.label} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-2)] transition-colors">
                    <span className="text-xs text-[var(--text)]">{sc.label}</span>
                    <div className="flex items-center gap-1">
                      {sc.keys.map((k, i) => (
                        <span key={k} className="flex items-center gap-1">
                          <Kbd>{k}</Kbd>
                          {i < sc.keys.length - 1 && <span className="text-[10px] text-[var(--faint)]">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contact support footer */}
        <div className="flex-shrink-0 border-t border-[var(--border)] px-5 py-4 bg-[var(--surface-2)]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Contact Support</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: MessageCircle, label: 'Live Chat',   color: '#16a34a', sub: 'Online now' },
              { icon: Mail,          label: 'Email',       color: 'var(--primary)', sub: '< 4h reply' },
              { icon: Phone,         label: 'Call Us',     color: '#d97706', sub: 'Mon–Sat 9–6' },
            ].map(c => {
              const Icon = c.icon
              return (
                <button
                  key={c.label}
                  onClick={() => {}}
                  className="flex flex-col items-center gap-1 px-2 py-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] hover:shadow-sm hover:-translate-y-px transition-all"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${c.color}18` }}>
                    <Icon size={13} style={{ color: c.color }} />
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--text)]">{c.label}</span>
                  <span className="text-[10px] text-[var(--faint)]">{c.sub}</span>
                </button>
              )
            })}
          </div>
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
