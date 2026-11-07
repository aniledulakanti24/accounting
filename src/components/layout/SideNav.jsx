import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Star, ChevronRight,
  LayoutDashboard, Waves, CalendarDays, FileSignature, FileClock, FileText, Truck, ReceiptText, Inbox, HandCoins, Wallet,
  AlarmClock, Undo2, RotateCcw, ScrollText, Link2, ShoppingBag, ClipboardList, PackageCheck, FileInput, SendHorizontal,
  FileMinus, FileStack, Banknote, Users, SlidersHorizontal, Landmark, ListChecks, Coins, ArrowLeftRight, BookCheck,
  Globe2, Rss, Gauge, Tags, Repeat, NotebookPen, PiggyBank, Eraser, Lock, FileCheck2, Wand2, GitCompare, QrCode,
  Route, Percent, Receipt, CalendarCheck, KeyRound, BarChart3, BookOpen, Library, PieChart, Scale, TrendingUp,
  Target, LineChart, Blocks, Sparkles, Contact, UserRound, Building, Share2, FileSpreadsheet, BellRing, Package,
  Warehouse, MoveRight, BadgeIndianRupee, Archive, TrendingDown, Trash2, ListTree, Calculator, Network, FileType,
  Scale3d, Coins as CurrencyIcon, IdCard, UserCog, ShoppingCart, MessageSquare, FolderOpen, Globe, Upload, Merge,
  SearchCheck, AlertTriangle, Barcode, Hash, PackageSearch, HardDrive, Cloud, ShieldAlert, Flame, Download, History,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { getSectionsForCountry } from '../../config/sections'
import { useCan } from '../../hooks/useCan'
import { useAppStore } from '../../store/useAppStore'
import CompanySwitcher from './CompanySwitcher'
import AccountPanel from './AccountPanel'

/*
 * The menu tree: categories hold areas (folders); each area holds pages.
 * An area can combine several small sections, so related pages live in one place
 * while each page keeps its own section for access rules.
 */
const TREE = [
  { key: 'overview', labelKey: 'nav.tabs.dashboard.overview', areas: [
    { id: 'dashboard', sections: ['dashboard', 'alerts'], exclude: ['dashboard/tax-calendar'] },
  ] },
  { key: 'daily', labelKey: 'nav.group.daily', areas: [
    { id: 'sales', sections: ['sales'] },
    { id: 'receivables', sections: ['receivables'] },
    { id: 'procurement', sections: ['procurement', 'payables'], labelKey: 'nav.areas.purchasesPayments', label: 'Purchases & Payments' },
    { id: 'expenses', sections: ['expenses'] },
    { id: 'cashbank', sections: ['cashbank'] },
    { id: 'parties', sections: ['parties'] },
    { id: 'inventory', sections: ['inventory'] },
  ] },
  { key: 'finance', labelKey: 'nav.group.finance', areas: [
    { id: 'tax', sections: ['tax'], extra: ['dashboard/tax-calendar'] },
    { id: 'reports', sections: ['reports'] },
    { id: 'setup', sections: ['masters', 'assets'], labelKey: 'nav.areas.accountingSetup', label: 'Accounting Setup' },
  ] },
  { key: 'advanced', labelKey: 'nav.group.advanced', areas: [
    { id: 'business-tools', sections: ['business-tools', 'advanced-features'] },
    { id: 'data', sections: ['migration', 'storage'], labelKey: 'nav.areas.dataDocuments', label: 'Data & Documents' },
  ] },
]

/* An icon for every page (section/page), like the CRM menu */
const PAGE_ICONS = {
  'dashboard/overview': LayoutDashboard, 'dashboard/cash-flow': Waves, 'dashboard/tax-calendar': CalendarDays,
  'migration/tally-import': FileInput, 'business-tools/accountant-hub': Contact,
  'reports/ai-analyst': Sparkles,
  'tax/gst-from-books': BookCheck,
  'cashbank/bank-rules': ListChecks,
  'sales/invoice-desk': NotebookPen, 'procurement/bill-approvals': FileCheck2, 'inventory/stock-valuation': Archive, 'reports/live-financials': Gauge,
  'sales/quotations': FileSignature, 'sales/proforma-invoices': FileClock, 'sales/sales-invoices': FileText, 'sales/delivery-challans': Truck, 'sales/receipts': ReceiptText,
  'receivables/money-in-center': Inbox, 'receivables/receivables': HandCoins, 'receivables/payments-received': Wallet, 'receivables/overdue-collections': AlarmClock,
  'receivables/credit-notes': Undo2, 'receivables/sales-returns': RotateCcw, 'receivables/customer-statements': ScrollText, 'receivables/payment-links': Link2,
  'procurement/purchase-center': ShoppingBag, 'procurement/purchase-orders': ClipboardList, 'procurement/goods-receipt': PackageCheck, 'procurement/purchase-invoices': FileInput,
  'procurement/payment-out': SendHorizontal, 'procurement/returns-debit-notes': FileMinus,
  'payables/bills': FileStack, 'payables/payments': Banknote, 'payables/workforce': Users, 'payables/adjustments': SlidersHorizontal, 'payables/bank-release': Landmark,
  'cashbank/bank-accounts': Landmark, 'cashbank/reconciliation': ListChecks, 'cashbank/cash-petty': Coins, 'cashbank/contra': ArrowLeftRight, 'cashbank/cheque-register': BookCheck,
  'cashbank/foreign-currency': Globe2, 'cashbank/bank-feeds': Rss,
  'expenses/expense-center': Gauge, 'expenses/categories': Tags, 'expenses/automated-bills': Repeat, 'expenses/journal-vouchers': NotebookPen, 'expenses/provisions': PiggyBank,
  'expenses/write-offs': Eraser, 'expenses/period-close': Lock,
  'tax/gst-returns': FileCheck2, 'tax/gst-filing-wizard': Wand2, 'tax/gst-reconciliation': GitCompare, 'tax/e-invoicing': QrCode, 'tax/e-way-bills': Route, 'tax/tds': Percent,
  'tax/tcs': Percent, 'tax/tax-payments': Receipt, 'tax/quarterly-compliance': CalendarCheck, 'tax/ca-access': KeyRound,
  'reports/financial-statements': BarChart3, 'reports/general-ledger': BookOpen, 'reports/books': Library, 'reports/gst-reports': PieChart, 'reports/ar-ap': Scale,
  'reports/profitability': TrendingUp, 'reports/period-comparatives': GitCompare, 'reports/budget-vs-actuals': Target, 'reports/cashflow-projection': LineChart, 'reports/report-builder': Blocks,
  'advanced-features/overview': Sparkles,
  'parties/all-parties': Contact, 'parties/customer-ledgers': UserRound, 'parties/supplier-ledgers': Building, 'parties/shared-ledger': Share2, 'parties/statements': FileSpreadsheet, 'parties/reminders': BellRing,
  'inventory/inventory-items': Package, 'inventory/godowns': Warehouse, 'inventory/stock-movement': MoveRight, 'inventory/item-pricing': BadgeIndianRupee,
  'assets/asset-register': Archive, 'assets/depreciation': TrendingDown, 'assets/disposal-revaluation': Trash2,
  'masters/chart-of-accounts': ListTree, 'masters/tax-masters': Calculator, 'masters/cost-centers': Network, 'masters/voucher-types': FileType, 'masters/opening-balances': Scale3d, 'masters/currencies': CurrencyIcon,
  'business-tools/staff-payroll': IdCard, 'business-tools/manage-users': UserCog, 'business-tools/online-orders': ShoppingCart, 'business-tools/sms-marketing': MessageSquare,
  'parties/documents': FolderOpen, 'parties/portal': Globe, 'parties/import': Upload, 'parties/duplicate-merge': Merge, 'parties/gap-analysis': SearchCheck,
  'inventory/reorder-alerts': AlertTriangle, 'inventory/batch-serials': Hash, 'inventory/barcode-labels': Barcode, 'inventory/item-import': Upload, 'inventory/gap-analysis': PackageSearch,
  'storage/client-storage': HardDrive, 'storage/unifiedtree-storage': Cloud,
  'alerts/accountant-alerts': BellRing, 'alerts/compliance-alerts': ShieldAlert, 'alerts/cash-risk-alerts': Flame, 'alerts/ca-access': KeyRound,
  'migration/import': Upload, 'migration/export': Download, 'migration/history': History,
}

/* Counts shown next to a page — things waiting on someone */
const BADGES = {
  'receivables/overdue-collections': 8, 'payables/bills': 4, 'cashbank/bank-rules': 18, 'procurement/purchase-center': 3,
  'inventory/reorder-alerts': 5, 'alerts/accountant-alerts': 3, 'tax/gst-returns': 1,
}

const NAV_WIDTH = 244
const NAV_RAIL_WIDTH = 64

/**
 * Side menu as a tree, like a project explorer: areas are folders that open on
 * click to show their pages. The area you are in opens by itself.
 */
export default function SideNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const can = useCan()
  const navRef = useRef(null)

  const activeCompany = useAppStore(s => s.activeCompany)
  const collapsed = useAppStore(s => s.navCollapsed)
  const favorites = useAppStore(s => s.navFavorites)
  const toggleFavorite = useAppStore(s => s.toggleNavFavorite)
  const navOpen = useAppStore(s => s.navOpen)
  const setNavOpen = useAppStore(s => s.setNavOpen)
  const countryCode = activeCompany?.country || 'IN'

  const sections = useMemo(() => getSectionsForCountry(countryCode, t), [countryCode, t])

  // Categories → areas → pages, keeping only what this person may see
  const tree = useMemo(() => {
    const byId = Object.fromEntries(sections.map(s => [s.id, s]))
    const pageOf = (s, tab) => ({
      key: `${s.id}/${tab.id}`,
      // A one-page section's only tab is named after the section (e.g. "Advanced Features")
      label: s.tabs.length === 1 ? s.label : tab.label,
      icon: PAGE_ICONS[`${s.id}/${tab.id}`] ?? s.icon,
      badge: BADGES[`${s.id}/${tab.id}`],
    })
    const visible = (s, tab) => can('view', s.id) && can.seesTab(s.id, tab.id)
    return TREE.map(cat => ({
      key: cat.key,
      label: t(cat.labelKey),
      areas: cat.areas.map(area => {
        const first = byId[area.sections[0]]
        const pages = [
          ...area.sections.flatMap(id => byId[id] ? byId[id].tabs.filter(tab => visible(byId[id], tab)).map(tab => pageOf(byId[id], tab)) : []),
          ...(area.extra ?? []).map(key => { const [sid, tid] = key.split('/'); const s = byId[sid]; const tab = s?.tabs.find(x => x.id === tid); return tab && visible(s, tab) ? pageOf(s, tab) : null }).filter(Boolean),
        ].filter(p => !(area.exclude ?? []).includes(p.key))
        const label = area.labelKey ? t(area.labelKey, { defaultValue: area.label })
          : area.id === 'tax' && countryCode === 'IN' ? 'GST' : area.id === 'dashboard' ? 'Dashboard' : first?.label
        return { id: area.id, label, icon: first?.icon, pages, badge: pages.reduce((n, p) => n + (p.badge ?? 0), 0) }
      }).filter(a => a.icon && a.pages.length),
    })).filter(cat => cat.areas.length)
  }, [sections, can, countryCode, t])

  const pagesByKey = useMemo(() => Object.fromEntries(tree.flatMap(c => c.areas.flatMap(a => a.pages.map(p => [p.key, { ...p, area: a.label }])))), [tree])
  const favPages = favorites.map(k => pagesByKey[k]).filter(Boolean)

  const [, sectionId = 'dashboard', tabId] = location.pathname.split('/')
  const activeKey = `${sectionId}/${tabId}`
  // An area is open if the person opened it, or — until they close it — while they are inside it
  // The area holding the current page (areas can combine sections)
  const activeArea = tree.flatMap(c => c.areas).find(a => a.pages.some(p => p.key === activeKey))?.id
  const isOpen = id => navOpen[id] ?? id === activeArea

  // Keep the current page visible in the menu
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' })
  }, [activeKey, collapsed])

  function renderPage(page, { showArea = false, key = page.key } = {}) {
    const active = page.key === activeKey
    const fav = favorites.includes(page.key)
    const Icon = page.icon
    return (
      <div key={key} className={cn('group/item mb-px flex items-center rounded-[7px] transition-colors',
        active ? 'bg-[var(--nav-active-bg)] text-white' : 'text-[var(--nav-text)] hover:bg-[var(--nav-2)] hover:text-white')}>
        <button type="button" onClick={() => navigate(`/${page.key}`)} aria-current={active ? 'page' : undefined}
          className="flex min-w-0 flex-1 items-center gap-2.5 border-0 bg-transparent py-[7px] ps-2.5 text-left cursor-pointer" style={{ color: 'inherit' }}>
          <Icon size={16} strokeWidth={1.9} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">
            {page.label}
            {showArea && <span className="ms-1.5 text-[11px] font-normal opacity-50">{page.area}</span>}
          </span>
        </button>
        {page.badge > 0 && (
          <span className="tabular me-2 rounded-[9px] bg-white/[0.14] px-[7px] text-[11px] font-semibold leading-[18px] text-white group-hover/item:hidden">{page.badge}</span>
        )}
        <button type="button" onClick={() => toggleFavorite(page.key)} aria-label={fav ? `Unstar ${page.label}` : `Star ${page.label}`} aria-pressed={fav}
          title={fav ? 'Remove from favourites' : 'Add to favourites'}
          className="me-1 hidden h-6 w-6 shrink-0 items-center justify-center rounded border-0 bg-transparent cursor-pointer hover:bg-white/15 group-hover/item:flex" style={{ color: 'inherit' }}>
          <Star size={12} fill={fav ? 'currentColor' : 'none'} className={fav ? 'text-[var(--warn)]' : 'opacity-70'} />
        </button>
      </div>
    )
  }

  function renderArea(area) {
    const Icon = area.icon
    const inside = area.id === activeArea
    // Rail: one icon per area; it opens the area's first page
    if (collapsed) {
      return (
        <button key={area.id} type="button" onClick={() => navigate(`/${area.pages[0].key}`)} title={area.label} aria-label={area.label}
          aria-current={inside ? 'page' : undefined}
          className={cn('relative mx-auto mb-1 flex h-9 w-10 items-center justify-center rounded-lg border-0 cursor-pointer transition-colors',
            inside ? 'bg-[var(--nav-active-bg)] text-white' : 'bg-transparent text-[var(--nav-text)] hover:bg-[var(--nav-2)] hover:text-white')}>
          <Icon size={17} strokeWidth={inside ? 2.2 : 1.8} />
          {area.badge > 0 && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--warn)]" />}
        </button>
      )
    }
    // An area with a single page is a plain link
    if (area.pages.length === 1) return <div key={area.id}>{renderPage({ ...area.pages[0], label: area.label, icon: Icon })}</div>
    const open = isOpen(area.id)
    return (
      <div key={area.id} className="mb-px">
        <button type="button" onClick={() => setNavOpen(area.id, !open)} aria-expanded={open}
          className={cn('flex w-full items-center gap-2 rounded-[7px] border-0 bg-transparent px-1.5 py-[7px] text-left cursor-pointer transition-colors hover:bg-[var(--nav-2)]',
            inside ? 'text-white' : 'text-[var(--nav-text)] hover:text-white')}>
          <ChevronRight size={13} className={cn('rtl-flip shrink-0 opacity-60 transition-transform duration-150', open && 'rotate-90')} />
          <Icon size={16} strokeWidth={inside ? 2.2 : 1.85} className="shrink-0" />
          <span className={cn('min-w-0 flex-1 truncate text-[13.5px]', inside ? 'font-semibold' : 'font-medium')}>{area.label}</span>
          {!open && area.badge > 0 && <span className="tabular me-1 rounded-[9px] bg-white/[0.14] px-[7px] text-[11px] font-semibold leading-[18px] text-white">{area.badge}</span>}
          {open && <span className="text-[10.5px] opacity-40">{area.pages.length}</span>}
        </button>
        {open && (
          <div className="mb-1 ms-[13px] border-s border-[var(--nav-2)] ps-1.5 pt-px" role="group" aria-label={area.label}>
            {area.pages.map(page => renderPage(page))}
          </div>
        )}
      </div>
    )
  }

  const width = collapsed ? NAV_RAIL_WIDTH : NAV_WIDTH
  return (
    <aside className="flex h-full shrink-0 flex-col overflow-hidden transition-[width] duration-200"
      style={{ width, background: 'var(--nav)' }}>
      {/* Company switcher (logo, company, country) */}
      <div className="shrink-0 px-2.5 pb-1.5 pt-2.5">
        <CompanySwitcher collapsed={collapsed} />
      </div>


      <nav ref={navRef} data-tour="menu" aria-label="Main menu" className="ut-nav-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3">
        {favPages.length > 0 && !collapsed && (
          <div>
            <p className="flex items-center gap-1.5 px-2.5 pb-1.5 pt-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--warn)]">
              <Star size={10} fill="currentColor" /> Favourites
            </p>
            {favPages.map(page => renderPage(page, { showArea: true, key: `fav-${page.key}` }))}
          </div>
        )}
        {tree.map(cat => (
          <div key={cat.key}>
            {collapsed
              ? <div className="mx-3 my-2 h-px bg-white/[0.08]" />
              : <p className="truncate px-2.5 pb-1.5 pt-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--nav-text-2)]">{cat.label}</p>}
            {cat.areas.map(renderArea)}
          </div>
        ))}
      </nav>

      {/* Signed-in person — opens the account panel (profile, administration, theme, log out) */}
      <div className="shrink-0 border-t border-[var(--nav-2)] p-2.5">
        <AccountPanel collapsed={collapsed} navWidth={width} />
      </div>

      <style>{'.ut-nav-scroll{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.14) transparent}'}</style>
    </aside>
  )
}
