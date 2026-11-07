import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Search, FileText, Users, Package, ShoppingCart, Receipt,
  CreditCard, Landmark, BookMarked, BarChart3, Settings,
  ArrowRight, Hash, Sparkles, AlertCircle, TrendingUp,
  Building2, CheckCircle, Clock,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import sections from '../../config/sections'
import { localizeMoneyText } from '../../lib/currency'

/* ── Section icons ── */
const SECTION_ICONS = {
  dashboard: BarChart3, masters: Settings, parties: Users,
  inventory: Package, sales: ShoppingCart, receivables: FileText,
  procurement: Receipt, payables: CreditCard, cashbank: Landmark,
  expenses: BookMarked, tax: Hash, reports: BarChart3,
  assets: Package, alerts: Settings, 'business-tools': Users,
  settings: Settings, storage: Package, migration: ArrowRight,
}

/* ── Quick nav actions (no query) ── */
const QUICK_ACTIONS = [
  { label: 'New Sales Invoice',    href: '/sales/sales-invoices',        icon: FileText  },
  { label: 'New Purchase Invoice', href: '/procurement/purchase-invoices', icon: Receipt  },
  { label: 'Record Receipt',       href: '/receivables/payments-received', icon: CreditCard },
  { label: 'New Expense',          href: '/expenses/expense-center',      icon: BookMarked },
  { label: 'New Journal Voucher',  href: '/expenses/journal-vouchers',    icon: Hash      },
  { label: 'Bank Reconciliation',  href: '/cashbank/bank-rules',      icon: Landmark  },
]

/* ── AI query mock results ── */
const AI_RESULT_SETS = [
  {
    keywords: ['overdue', 'unpaid', 'pending invoice'],
    results: [
      { label: 'INV-2024-0841 — Infosys BPO',    sub: '₹2,85,000 · 45 days overdue', href: '/receivables/overdue-collections', icon: AlertCircle, color: 'var(--neg)'  },
      { label: 'INV-2024-0838 — Tech Mahindra',   sub: '₹1,92,000 · 32 days overdue', href: '/receivables/overdue-collections', icon: AlertCircle, color: 'var(--neg)'  },
      { label: 'INV-2024-0825 — Wipro Digital',   sub: '₹1,54,000 · 28 days overdue', href: '/receivables/overdue-collections', icon: AlertCircle, color: 'var(--warn)' },
    ],
    summary: '3 invoices totalling ₹6.3L overdue',
  },
  {
    keywords: ['gst', 'gstr', 'filing', 'return', 'vat', 'sales tax', 'tax'],
    results: [
      { label: 'GSTR-1 Dec — Due in 11 days',   sub: 'File before 11th Jan · ₹0 penalty risk', href: '/tax/gst-returns', icon: Clock,       color: 'var(--warn)' },
      { label: 'GSTR-3B Dec — Due in 21 days',  sub: 'Estimated liability ₹1.2L',               href: '/tax/gst-returns', icon: Clock,       color: 'var(--pos)'  },
      { label: 'ITC Available — ₹84,500',        sub: '3 vendors · pending reconciliation',      href: '/tax/gst-returns', icon: CheckCircle, color: 'var(--pos)'  },
    ],
    summary: '2 filings upcoming · ITC ₹84,500 claimable',
  },
  {
    keywords: ['cash', 'balance', 'bank', 'account'],
    results: [
      { label: 'HDFC Current A/c ****4821',   sub: '₹82,45,000 balance', href: '/cashbank/bank-accounts', icon: Building2,  color: 'var(--primary)' },
      { label: 'SBI OD Account ****2201',     sub: '₹31,00,000 balance', href: '/cashbank/bank-accounts', icon: Building2,  color: 'var(--primary)' },
      { label: 'Kotak Savings ****9934',      sub: '₹12,00,000 balance', href: '/cashbank/bank-accounts', icon: Building2,  color: 'var(--primary)' },
    ],
    summary: 'Total liquid: ₹1.26Cr across 4 accounts',
  },
  {
    keywords: ['profit', 'revenue', 'sales', 'income'],
    results: [
      { label: 'Revenue Dec 2024',         sub: '₹94,00,000 · +18% vs Nov',  href: '/reports/financial-statements', icon: TrendingUp, color: 'var(--pos)'  },
      { label: 'Net Profit FY 2024–25',    sub: '₹54,20,000 · 18.4% margin', href: '/reports/financial-statements', icon: TrendingUp, color: 'var(--pos)'  },
      { label: 'Top Customer — Infosys',   sub: '₹28,50,000 billed this FY', href: '/parties/customers',            icon: Users,      color: 'var(--primary)' },
    ],
    summary: 'FY revenue ₹3.8Cr · on track for target',
  },
  {
    keywords: ['bill', 'payable', 'vendor', 'supplier', 'due'],
    results: [
      { label: 'Amazon Web Services',   sub: '₹12,500 · due tomorrow!',      href: '/payables/bills', icon: AlertCircle, color: 'var(--neg)'  },
      { label: 'Freshworks India',      sub: '₹45,000 · due in 3 days',      href: '/payables/bills', icon: Clock,       color: 'var(--warn)' },
      { label: 'Office Rent — Jan',     sub: '₹75,000 · due in 5 days',      href: '/payables/bills', icon: Clock,       color: 'var(--warn)' },
    ],
    summary: '3 bills totalling ₹1.3L due this week',
  },
  {
    keywords: ['tds', 'advance tax', 'tax payment'],
    results: [
      { label: 'TDS Q3 Deposit',        sub: 'Due Jan 7 · ₹45,000 deducted',   href: '/tax/tds',          icon: Clock,       color: 'var(--warn)' },
      { label: 'Advance Tax Q3',        sub: 'Due Jan 15 · Est. ₹1.2L',        href: '/tax/tax-payments', icon: Clock,       color: 'var(--pos)'  },
      { label: 'TDS Challan Upload',    sub: 'Oct–Dec not yet uploaded',        href: '/tax/tds',          icon: AlertCircle, color: 'var(--neg)'  },
    ],
    summary: 'TDS + Advance Tax ₹1.65L due by Jan 15',
  },
]

const AI_TRIGGERS = [
  'show', 'find', 'which', 'what', 'how much', 'how many',
  'list', 'get', 'fetch', 'display', 'overdue', 'pending', 'due',
]

function isAiQuery(q) {
  const lower = q.toLowerCase()
  if (q.includes('?')) return true
  return AI_TRIGGERS.some(t => lower.startsWith(t) || lower.includes(' ' + t + ' '))
}

function getAiResults(q) {
  const lower = q.toLowerCase()
  for (const set of AI_RESULT_SETS) {
    if (set.keywords.some(k => lower.includes(k))) return set
  }
  return null
}

export default function CommandPalette({ open, onClose }) {
  const [query,  setQuery]  = useState('')
  const [active, setActive] = useState(0)
  const inputRef            = useRef(null)
  const navigate            = useNavigate()

  useEffect(() => {
    if (open) { setQuery(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  const allPages = useMemo(() => sections.flatMap(s =>
    s.tabs.map(t => ({
      label:   t.label,
      section: s.label,
      href:    `/${s.id}/${t.id}`,
      icon:    SECTION_ICONS[s.id] ?? Settings,
    }))
  ), [])

  const aiMode    = query.trim().length > 2 && isAiQuery(query)
  const aiResults = aiMode ? getAiResults(query) : null

  const navResults = useMemo(() => {
    if (!query.trim() || aiMode) return { actions: QUICK_ACTIONS, pages: [] }
    const q = query.toLowerCase()
    return {
      actions: QUICK_ACTIONS.filter(a => a.label.toLowerCase().includes(q)),
      pages:   allPages.filter(p =>
        p.label.toLowerCase().includes(q) || p.section.toLowerCase().includes(q)
      ).slice(0, 8),
    }
  }, [query, allPages, aiMode])

  const flatNav = [
    ...navResults.actions.map(a => ({ ...a, _type: 'action' })),
    ...navResults.pages.map(p => ({ ...p, _type: 'page' })),
  ]
  const flatAi = aiResults?.results ?? []

  const flatAll = aiMode ? flatAi : flatNav

  const go = (href) => { navigate(href); onClose() }

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, flatAll.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && flatAll[active]) go(flatAll[active].href)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[var(--surface)] rounded-[var(--radius)] shadow-2xl border border-[var(--border)] overflow-hidden">

        {/* ── Search input ── */}
        <div className={`flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] transition-colors ${aiMode ? 'bg-[var(--primary-tint)]' : ''}`}>
          {aiMode
            ? <Sparkles size={16} className="shrink-0" style={{ color: 'var(--primary)' }} />
            : <Search   size={16} className="text-[var(--muted)] shrink-0" />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActive(0) }}
            onKeyDown={handleKey}
            placeholder={aiMode ? 'Ask anything about your finances…' : 'Search pages, actions… or ask AI a question'}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text)' }}
          />
          {aiMode && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              AI
            </span>
          )}
          <kbd className="text-[10px] bg-[var(--surface-2)] border border-[var(--border)] px-1.5 py-0.5 rounded shrink-0" style={{ color: 'var(--faint)' }}>ESC</kbd>
        </div>

        {/* ── Results ── */}
        <div className="max-h-[360px] overflow-y-auto py-2">

          {/* AI mode */}
          {aiMode && (
            <>
              {aiResults ? (
                <>
                  {/* AI summary pill */}
                  <div className="mx-3 mb-2 px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: 'var(--primary-tint)' }}>
                    <Sparkles size={11} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--primary)' }}>
                      {localizeMoneyText(aiResults.summary)}
                    </span>
                  </div>
                  <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--faint)' }}>Results</p>
                  {aiResults.results.map((r, i) => (
                    <AiResultRow key={r.label} item={r} active={active === i} onClick={() => go(r.href)} />
                  ))}
                  {/* Ask AI assistant fallback */}
                  <div className="mx-3 mt-2">
                    <button
                      onClick={() => { navigate('/dashboard'); onClose() }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-colors hover:opacity-90"
                      style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                    >
                      <Sparkles size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                        Open AI Assistant for deeper analysis
                      </span>
                      <ArrowRight size={12} style={{ color: 'var(--faint)', marginLeft: 'auto' }} />
                    </button>
                  </div>
                </>
              ) : (
                /* No AI match — forward to assistant */
                <div className="px-4 py-6 flex flex-col items-center gap-3 text-center">
                  <Sparkles size={24} style={{ color: 'var(--primary)', opacity: 0.5 }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>"{query}"</p>
                  <p className="text-xs" style={{ color: 'var(--faint)' }}>
                    No quick result found. Open the AI Assistant for a full answer.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-1 text-xs font-bold px-4 py-2 rounded-full"
                    style={{ background: 'var(--primary)', color: '#fff' }}
                  >
                    Open AI Assistant  (Ctrl+Shift+A)
                  </button>
                </div>
              )}
            </>
          )}

          {/* Normal nav mode */}
          {!aiMode && (
            <>
              {!query && (
                <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--faint)' }}>Quick Actions</p>
              )}
              {query && navResults.actions.length > 0 && (
                <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--faint)' }}>Actions</p>
              )}
              {flatNav.map((item, i) => {
                const isPageSection = item._type === 'page' &&
                  navResults.actions.length > 0 &&
                  i === navResults.actions.length
                return (
                  <span key={item.href + i}>
                    {isPageSection && (
                      <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--faint)' }}>Pages</p>
                    )}
                    <NavResultRow item={item} active={active === i} onClick={() => go(item.href)} />
                  </span>
                )
              })}
              {flatNav.length === 0 && query && (
                <div className="px-4 py-5 text-center">
                  <p className="text-sm" style={{ color: 'var(--faint)' }}>No results for "{query}"</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--faint)', opacity: 0.7 }}>
                    Try asking a question — e.g. "show overdue invoices"
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--border)] bg-[var(--surface-2)]">
          {[['↑↓', 'navigate'], ['↵', 'open'], ['esc', 'close']].map(([k, l]) => (
            <span key={k} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--faint)' }}>
              <kbd className="bg-[var(--surface)] border border-[var(--border)] px-1 rounded text-[9px]">{k}</kbd> {l}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-1 text-[10px]" style={{ color: 'var(--primary)' }}>
            <Sparkles size={10} />
            Ask a question to activate AI search
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Nav result row ── */
function NavResultRow({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${active ? 'bg-[var(--primary-tint)]' : 'hover:bg-[var(--surface-2)]'}`}
    >
      <span
        className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
        style={{
          background: active ? 'var(--primary)' : 'var(--surface-2)',
          color:      active ? '#fff'            : 'var(--muted)',
        }}
      >
        <Icon size={13} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{localizeMoneyText(item.label)}</p>
        {item.section && <p className="text-xs truncate" style={{ color: 'var(--faint)' }}>{item.section}</p>}
      </div>
      <ArrowRight size={12} style={{ color: 'var(--faint)', flexShrink: 0 }} />
    </button>
  )
}

/* ── AI result row ── */
function AiResultRow({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${active ? 'bg-[var(--primary-tint)]' : 'hover:bg-[var(--surface-2)]'}`}
    >
      <span
        className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
        style={{ background: item.color + '18', color: item.color }}
      >
        <Icon size={13} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{localizeMoneyText(item.label)}</p>
        <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{localizeMoneyText(item.sub)}</p>
      </div>
      <ArrowRight size={12} style={{ color: item.color, flexShrink: 0, opacity: 0.7 }} />
    </button>
  )
}
