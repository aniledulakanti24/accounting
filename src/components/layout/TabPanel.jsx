import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PanelLeft, Search, Plus, Sparkles, Bell, HelpCircle, FilePlus, HandCoins, CreditCard, Wallet, Receipt, UserPlus, Package } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import QuickInvoiceModal from '../ui/QuickInvoiceModal'
import { getCountryTaxConfig, SUPPORTED_COUNTRIES } from '../../lib/countryTax'
import { toast } from '../../lib/toast'
import { useAppStore } from '../../store/useAppStore'
import { useCan } from '../../hooks/useCan'
import { getAccountantAlerts } from '../../data/services/aiInsightService'

/* "+ New" — the things people create most, filtered by what they're allowed to do */
const CREATE = [
  { label: 'Invoice', icon: FilePlus, key: 'invoice', section: 'sales' },
  { label: 'Receipt', icon: HandCoins, to: '/sales/invoice-desk', section: 'receivables' },
  { label: 'Supplier bill', icon: Receipt, to: '/procurement/bill-approvals', section: 'procurement' },
  { label: 'Payment', icon: CreditCard, to: '/procurement/bill-approvals', section: 'payables' },
  { label: 'Expense', icon: Wallet, to: '/expenses/expense-center', section: 'expenses' },
  { label: 'Customer or supplier', icon: UserPlus, to: '/parties/all-parties', section: 'parties' },
  { label: 'Item', icon: Package, to: '/inventory/inventory-items', section: 'inventory' },
]

function CreateMenu() {
  const navigate = useNavigate()
  const can = useCan()
  const [open, setOpen] = useState(false)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const ref = useRef(null)
  const items = CREATE.filter(a => can('create', a.section))
  useEffect(() => {
    if (!open) return undefined
    const close = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const esc = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [open])
  if (!items.length) return null
  return (
    <div ref={ref} className="relative">
      <button type="button" data-tour="create" aria-label="Create new" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}
        className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[var(--primary)] bg-[var(--primary)] px-3 text-[13.5px] font-[550] text-[var(--on-primary)] hover:bg-[var(--primary-600)] cursor-pointer">
        <Plus size={16} strokeWidth={2.2} /> New
      </button>
      {open && (
        <div role="menu" className="absolute end-0 top-full z-[960] mt-1.5 w-56 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow-2)]">
          {items.map(a => (
            <button key={a.label} type="button" role="menuitem"
              onClick={() => { setOpen(false); if (a.key === 'invoice') setInvoiceOpen(true); else navigate(a.to) }}
              className="flex w-full items-center gap-2.5 rounded-[7px] border-0 bg-transparent px-2.5 py-2 text-left text-[13.5px] text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer">
              <a.icon size={16} className="text-[var(--muted)]" /> {a.label}
            </button>
          ))}
        </div>
      )}
      <QuickInvoiceModal open={invoiceOpen} onClose={() => setInvoiceOpen(false)} />
    </div>
  )
}

/**
 * Top bar — laid out like the UnifiedTree CRM: side-menu toggle and search on the left;
 * New, Ask, tax country, notifications, help and language on the right.
 * Page titles live in each page's header, not here.
 */
export default function TabPanel({ onSearch, onAsk, onNotifications, onHelp }) {
  const { t } = useTranslation()
  const activeCompany     = useAppStore(s => s.activeCompany)
  const setActiveCompany  = useAppStore(s => s.setActiveCompany)
  const setCompanyCountry = useAppStore(s => s.setCompanyCountry)
  const companies         = useAppStore(s => s.companies)
  const collapsed         = useAppStore(s => s.navCollapsed)
  const toggleNav         = useAppStore(s => s.toggleNav)
  const countryCode       = activeCompany?.country || 'IN'
  const countryConfig     = useMemo(() => getCountryTaxConfig(countryCode), [countryCode])
  const [alerts, setAlerts] = useState(0)

  useEffect(() => {
    let live = true
    getAccountantAlerts().then(list => { if (live) setAlerts(list.filter(a => ['critical', 'high'].includes(a.severity)).length) })
    return () => { live = false }
  }, [])

  function handleSwitchCountry(newCountryCode) {
    const existing = companies.find(c => c.country === newCountryCode)
    if (existing) setActiveCompany(existing)
    else setCompanyCountry(newCountryCode)
    const matched = SUPPORTED_COUNTRIES.find(c => c.code === newCountryCode)
    toast.success(`Switched tax jurisdiction to ${matched?.name || newCountryCode} (${matched?.taxSystem || 'Tax'})`)
  }

  const iconBtn = 'relative inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-transparent bg-transparent text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer'

  return (
    <header className="flex h-[58px] shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-5">
      <button type="button" onClick={toggleNav} aria-label={collapsed ? 'Expand side menu' : 'Collapse side menu'} aria-pressed={collapsed}
        title={collapsed ? 'Expand side menu' : 'Collapse side menu'} className={iconBtn}>
        <PanelLeft size={18} />
      </button>

      <button type="button" data-tour="search" onClick={onSearch}
        className="flex h-9 w-[340px] max-w-[40vw] items-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] px-2.5 text-left text-[14px] text-[var(--faint)] hover:border-[var(--border-strong)] cursor-pointer">
        <Search size={16} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate">{t('shell.searchPlaceholder')}</span>
        <kbd className="font-sans rounded-[5px] border border-[var(--border)] bg-[var(--surface)] px-1.5 py-px text-[11px] font-medium text-[var(--muted)]">Ctrl K</kbd>
      </button>

      <div className="ms-auto flex shrink-0 items-center gap-1.5">
        <CreateMenu />
        <button type="button" onClick={onAsk} title="Ask AI (Ctrl+Shift+A)"
          className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[var(--primary)] bg-[var(--surface)] px-3 text-[13.5px] font-[550] text-[var(--primary-ink)] hover:bg-[var(--primary-tint)] cursor-pointer">
          <Sparkles size={16} /> Ask
        </button>

        {/* Tax country — part of every accounting screen */}
        <label data-tour="country" title={`Tax jurisdiction: ${countryConfig.name} (${countryConfig.taxSystem})`}
          className="ms-1 flex h-9 items-center gap-1.5 rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] ps-2.5 pe-1 text-[13.5px] text-[var(--text)] cursor-pointer hover:border-[var(--primary)]">
          <span className="text-sm leading-none" aria-hidden="true">{countryConfig.flag}</span>
          <select value={countryCode} onChange={e => handleSwitchCountry(e.target.value)} aria-label="Tax jurisdiction"
            className="max-w-[120px] xl:max-w-[200px] cursor-pointer border-0 bg-transparent text-[13.5px] font-medium text-[var(--text)] outline-none">
            {SUPPORTED_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.code} · {c.taxSystem} ({c.name})</option>)}
          </select>
        </label>

        <button type="button" onClick={onNotifications} aria-label={`Notifications${alerts ? `, ${alerts} new` : ''}`} title="Notifications" className={iconBtn}>
          <Bell size={18} />
          {alerts > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-[var(--surface)] bg-[var(--neg)] px-1 text-[10px] font-bold leading-none text-white">{alerts}</span>}
        </button>
        <button type="button" onClick={onHelp} aria-label="Help" title="Help" data-tour="help" className={iconBtn}><HelpCircle size={18} /></button>
        <LanguageSwitcher />
      </div>
    </header>
  )
}
