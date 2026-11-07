import { useState, useMemo } from 'react'
import { CheckCircle2, MinusCircle, AlertTriangle, Star, ShieldCheck, Globe, Sparkles, Filter, ChevronRight } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import sections from '../../config/sections'
import { SUPPORTED_COUNTRIES } from '../../lib/countryTax'

const BENCHMARK_LAYERS = [
  { id: 'all', label: 'All Layers (Master)' },
  { id: 'ui', label: 'Layer 1: UI & UX' },
  { id: 'tax', label: 'Layer 2: Country Tax & Compliance' },
  { id: 'ledger', label: 'Layer 3: Core Ledger & Accounting' },
  { id: 'ops', label: 'Layer 4: Sales & Purchases (P2P/O2C)' },
  { id: 'banking', label: 'Layer 5: Banking & Cashflow' },
  { id: 'ai', label: 'Layer 6: AI & Advanced Capabilities' },
]

export const MASTER_BENCHMARK_DATA = [
  // LAYER 1: UI & USER EXPERIENCE
  {
    layer: 'ui',
    layerName: 'Layer 1: UI & UX',
    feature: 'Design System & Typography',
    description: 'Modern sans-serif typography, clean visual hierarchy, semantic tokenized CSS variables',
    unifiedTree: 4.9,
    zoho: 4.6,
    quickbooks: 4.5,
    tally: 2.2,
    vyapar: 3.5,
    busy: 2.0,
    highlight: 'UnifiedTree features high-density dashboard, crisp Inter/Geist fonts, and zero visual clutter.',
  },
  {
    layer: 'ui',
    layerName: 'Layer 1: UI & UX',
    feature: 'Theme & Accent Customization',
    description: 'Dark mode, light mode, system sync, and multi-color accent engine (Emerald, Violet, Rose, Blue)',
    unifiedTree: 5.0,
    zoho: 3.8,
    quickbooks: 3.2,
    tally: 1.0,
    vyapar: 2.5,
    busy: 1.0,
    highlight: 'Instant live theme and accent switching across every screen without reload.',
  },
  {
    layer: 'ui',
    layerName: 'Layer 1: UI & UX',
    feature: 'Keyboard-First Speed Navigation',
    description: 'Global Ctrl+K Command Palette, Alt+1-4 quick routes, Alt+N shortcuts for rapid voucher entry',
    unifiedTree: 4.8,
    zoho: 3.5,
    quickbooks: 3.2,
    tally: 5.0,
    vyapar: 2.8,
    busy: 4.5,
    highlight: 'Combines Tally-grade keyboard muscle memory with modern browser speed.',
  },
  {
    layer: 'ui',
    layerName: 'Layer 1: UI & UX',
    feature: 'Responsive Layout & PWA Ready',
    description: 'Desktop, tablet, and mobile adaptive layout with manifest and offline caching support',
    unifiedTree: 4.6,
    zoho: 4.7,
    quickbooks: 4.6,
    tally: 1.5,
    vyapar: 4.8,
    busy: 2.0,
    highlight: 'Single responsive codebase runs natively across modern browsers and mobile PWA.',
  },

  // LAYER 2: COUNTRY TAX & COMPLIANCE
  {
    layer: 'tax',
    layerName: 'Layer 2: Country Tax & Compliance',
    feature: 'Dynamic Multi-Country Switching',
    description: '1-click switching of tax rules, tax IDs, rates, currencies, and statutory return templates',
    unifiedTree: 5.0,
    zoho: 4.2,
    quickbooks: 4.3,
    tally: 1.5,
    vyapar: 1.0,
    busy: 1.2,
    highlight: 'Instant client-side toggle across 8 jurisdictions: India, USA, UK, UAE, Canada, Australia, Germany, Singapore.',
  },
  {
    layer: 'tax',
    layerName: 'Layer 2: Country Tax & Compliance',
    feature: 'India GST & Withholding (TDS/TCS)',
    description: 'GSTR-1, GSTR-3B, GSTR-2B ITC matching, Section 194C/194J TDS, 206C TCS, E-Way Bill & IRN e-Invoicing',
    unifiedTree: 4.8,
    zoho: 4.9,
    quickbooks: 2.5,
    tally: 4.9,
    vyapar: 4.2,
    busy: 4.8,
    highlight: 'Comprehensive India filing wizard with automatic JSON payload validation and ITC auto-reconciliation.',
  },
  {
    layer: 'tax',
    layerName: 'Layer 2: Country Tax & Compliance',
    feature: 'USA State & Local Sales Tax / 1099',
    description: 'Nexus tracking, multi-state rate breakdown, resale exemption certificates, Form 1099-NEC & 1099-MISC',
    unifiedTree: 4.7,
    zoho: 4.5,
    quickbooks: 4.9,
    tally: 1.0,
    vyapar: 1.0,
    busy: 1.0,
    highlight: 'Automatic state sales tax rate calculations and contractor 1099 threshold tracking.',
  },
  {
    layer: 'tax',
    layerName: 'Layer 2: Country Tax & Compliance',
    feature: 'UK HMRC MTD 9-Box VAT Returns',
    description: 'Making Tax Digital (MTD) compliant 9-box VAT summaries, digital links, reverse charge, and CIS',
    unifiedTree: 4.7,
    zoho: 4.8,
    quickbooks: 4.7,
    tally: 1.0,
    vyapar: 1.0,
    busy: 1.0,
    highlight: 'Full HMRC digital return simulator with automated Box 1 to 9 segregation.',
  },
  {
    layer: 'tax',
    layerName: 'Layer 2: Country Tax & Compliance',
    feature: 'UAE FTA VAT 201 & Free Zone Compliance',
    description: 'Federal Tax Authority VAT 201 returns, TRN validation, Emirate-wise sales allocation, and reverse charge',
    unifiedTree: 4.8,
    zoho: 4.7,
    quickbooks: 3.5,
    tally: 3.8,
    vyapar: 2.0,
    busy: 2.5,
    highlight: 'Built-in TRN validation and 7 Emirates tax segregation with FTA standard-rated 5% rules.',
  },

  // LAYER 3: CORE LEDGER & ACCOUNTING
  {
    layer: 'ledger',
    layerName: 'Layer 3: Core Ledger & Accounting',
    feature: 'Double-Entry General Ledger & Journals',
    description: 'Real-time debits and credits, journal vouchers, compound entries, narration audit, and account drill-down',
    unifiedTree: 4.8,
    zoho: 4.7,
    quickbooks: 4.6,
    tally: 5.0,
    vyapar: 2.8,
    busy: 4.8,
    highlight: 'Strict double-entry balancing with automatic posting from billing, procurement, and banking.',
  },
  {
    layer: 'ledger',
    layerName: 'Layer 3: Core Ledger & Accounting',
    feature: 'Multi-Currency & Forex Revaluation',
    description: 'Base currency, transaction currency, realized and unrealized forex gain/loss calculations',
    unifiedTree: 4.6,
    zoho: 4.7,
    quickbooks: 4.6,
    tally: 4.2,
    vyapar: 1.5,
    busy: 3.5,
    highlight: 'Dynamic conversion rates with automated ledger adjustment vouchers for foreign currency invoices.',
  },
  {
    layer: 'ledger',
    layerName: 'Layer 3: Core Ledger & Accounting',
    feature: 'Trial Balance & Financial Statements',
    description: 'Instant multi-column Trial Balance, Profit & Loss with gross/operating margins, and categorized Balance Sheet',
    unifiedTree: 4.8,
    zoho: 4.8,
    quickbooks: 4.7,
    tally: 5.0,
    vyapar: 3.2,
    busy: 4.7,
    highlight: 'Zero-latency dynamic aggregation with drilldown from line items directly to root vouchers.',
  },

  // LAYER 4: SALES & PROCURE-TO-PAY (O2C & P2P)
  {
    layer: 'ops',
    layerName: 'Layer 4: Sales & Purchases',
    feature: 'Complete Order-to-Cash Workflow',
    description: 'Quotations/Estimates → Proforma Invoices → Tax Invoices → Delivery Challans → Receipts & Credit Notes',
    unifiedTree: 4.8,
    zoho: 4.9,
    quickbooks: 4.8,
    tally: 4.7,
    vyapar: 4.5,
    busy: 4.5,
    highlight: 'One-click document lifecycle conversion with embedded live invoice previews and E-Way Bill sidebars.',
  },
  {
    layer: 'ops',
    layerName: 'Layer 4: Sales & Purchases',
    feature: 'Procure-to-Pay & 3-Way Matching',
    description: 'Purchase Orders → Goods Receipt Notes (GRN) → Supplier Bills → 3-Way Match & Payment Out',
    unifiedTree: 4.7,
    zoho: 4.8,
    quickbooks: 4.6,
    tally: 4.6,
    vyapar: 3.2,
    busy: 4.2,
    highlight: 'Automated 3-way discrepancy checks to safeguard Input Tax Credits and prevent duplicate vendor payments.',
  },
  {
    layer: 'ops',
    layerName: 'Layer 4: Sales & Purchases',
    feature: 'Bill-by-Bill Aging & Smart Reminders',
    description: 'FIFO and selective bill allocation, 0-30/31-60/61-90/90+ day aging, automated WhatsApp/Email reminders',
    unifiedTree: 4.7,
    zoho: 4.8,
    quickbooks: 4.6,
    tally: 4.9,
    vyapar: 4.9,
    busy: 4.8,
    highlight: 'Smart reminder templates with 1-click WhatsApp and email dispatch plus promise-to-pay logging.',
  },

  // LAYER 5: BANKING & CASHFLOW
  {
    layer: 'banking',
    layerName: 'Layer 5: Banking & Cashflow',
    feature: 'Bank Feeds & Statement Reconciliation',
    description: 'Bank CSV/OFX/Excel upload, AI rule-based matching, unmatched transaction queue, and cleared date tracking',
    unifiedTree: 4.7,
    zoho: 4.9,
    quickbooks: 4.9,
    tally: 3.5,
    vyapar: 2.5,
    busy: 3.0,
    highlight: 'Rule-based matching engine pairs banking debits/credits to sales receipts and vendor disbursements.',
  },
  {
    layer: 'banking',
    layerName: 'Layer 5: Banking & Cashflow',
    feature: 'Contra Transfers & Petty Cash Vouchers',
    description: 'Inter-account transfers (Bank-to-Bank, Bank-to-Cash), petty cash book tracking, and cash limit alarms',
    unifiedTree: 4.7,
    zoho: 4.6,
    quickbooks: 4.6,
    tally: 4.9,
    vyapar: 3.6,
    busy: 4.5,
    highlight: 'Frictionless Contra entry builder with balance safeguards and dual-signoff maker-checker options.',
  },

  // LAYER 6: AI & ADVANCED CAPABILITIES
  {
    layer: 'ai',
    layerName: 'Layer 6: AI & Advanced Capabilities',
    feature: 'Live Statutory Compliance Countdown',
    description: 'Real-time ticking countdown to active country statutory deadlines (GSTR-1, Sales Tax, VAT 201, MTD)',
    unifiedTree: 5.0,
    zoho: 3.5,
    quickbooks: 3.2,
    tally: 1.0,
    vyapar: 2.0,
    busy: 1.0,
    highlight: 'Industry-first live countdown banner that dynamically recalculates per selected country jurisdiction.',
  },
  {
    layer: 'ai',
    layerName: 'Layer 6: AI & Advanced Capabilities',
    feature: 'Ask AI Copilot & Anomaly Detection',
    description: 'In-context conversational accounting assistant, tax calculation checks, and suspicious transaction warnings',
    unifiedTree: 4.9,
    zoho: 3.9,
    quickbooks: 3.8,
    tally: 1.0,
    vyapar: 1.0,
    busy: 1.0,
    highlight: 'Floating AI copilot analyzes active screen, draft vouchers, and statutory tax positions on demand.',
  },
  {
    layer: 'ai',
    layerName: 'Layer 6: AI & Advanced Capabilities',
    feature: 'Multi-User RBAC & Maker-Checker Audit',
    description: 'Role-based access matrix (Owner, Accountant, Sales, Auditor), voucher approval workflow, and immutable logs',
    unifiedTree: 4.8,
    zoho: 4.8,
    quickbooks: 4.6,
    tally: 4.2,
    vyapar: 2.2,
    busy: 3.8,
    highlight: 'Multi-role permission matrix with maker-checker approvals on payment disbursements and journal adjustments.',
  },
]

export const COUNTRY_BENCHMARK_MATRIX = [
  { country: 'India (IN)', taxSystem: 'GST (CGST/SGST/IGST)', ut: 'Full (4.9)', tally: 'Full (4.9)', zoho: 'Full (4.9)', qbo: 'Partial (2.5)', vyapar: 'Full (4.2)', busy: 'Full (4.8)' },
  { country: 'United States (US)', taxSystem: 'Sales Tax & 1099', ut: 'Full (4.7)', tally: 'None (1.0)', zoho: 'Full (4.5)', qbo: 'Full (4.9)', vyapar: 'None (1.0)', busy: 'None (1.0)' },
  { country: 'United Kingdom (GB)', taxSystem: 'HMRC MTD 9-Box VAT', ut: 'Full (4.7)', tally: 'None (1.0)', zoho: 'Full (4.8)', qbo: 'Full (4.7)', vyapar: 'None (1.0)', busy: 'None (1.0)' },
  { country: 'United Arab Emirates (AE)', taxSystem: 'FTA VAT 201 (5%)', ut: 'Full (4.8)', tally: 'Partial (3.8)', zoho: 'Full (4.7)', qbo: 'Partial (3.5)', vyapar: 'Basic (2.0)', busy: 'Basic (2.5)' },
  { country: 'Canada (CA)', taxSystem: 'GST / HST (5%-15%)', ut: 'Full (4.6)', tally: 'None (1.0)', zoho: 'Full (4.5)', qbo: 'Full (4.7)', vyapar: 'None (1.0)', busy: 'None (1.0)' },
  { country: 'Australia (AU)', taxSystem: 'BAS & GST (10%)', ut: 'Full (4.6)', tally: 'None (1.0)', zoho: 'Full (4.6)', qbo: 'Full (4.7)', vyapar: 'None (1.0)', busy: 'None (1.0)' },
  { country: 'Germany (DE)', taxSystem: 'USt / ELSTER (19%)', ut: 'Full (4.5)', tally: 'None (1.0)', zoho: 'Full (4.4)', qbo: 'Partial (3.8)', vyapar: 'None (1.0)', busy: 'None (1.0)' },
  { country: 'Singapore (SG)', taxSystem: 'IRAS GST (9%)', ut: 'Full (4.6)', tally: 'None (1.0)', zoho: 'Full (4.6)', qbo: 'Full (4.6)', vyapar: 'None (1.0)', busy: 'None (1.0)' },
]

function StarRating({ score }) {
  const rounded = Number(score).toFixed(1)
  const isHigh = score >= 4.5
  return (
    <div className="inline-flex items-center gap-1 font-mono text-xs">
      <span className={`font-bold ${isHigh ? 'text-[var(--primary)]' : score >= 3.5 ? 'text-[var(--text)]' : 'text-[var(--muted)]'}`}>
        {rounded}
      </span>
      <Star size={12} className={isHigh ? 'fill-[var(--primary)] text-[var(--primary)]' : score >= 3.5 ? 'fill-[var(--warn)] text-[var(--warn)]' : 'text-[var(--faint)]'} />
    </div>
  )
}

export default function CompetitorGap() {
  const [activeTab, setActiveTab] = useState('master') // 'master' | 'country' | 'breakdown'
  const [selectedLayer, setSelectedLayer] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredBenchmark = useMemo(() => {
    return MASTER_BENCHMARK_DATA.filter(item => {
      const matchLayer = selectedLayer === 'all' || item.layer === selectedLayer
      const matchSearch = !searchTerm || item.feature.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase())
      return matchLayer && matchSearch
    })
  }, [selectedLayer, searchTerm])

  const overallScores = useMemo(() => {
    const sum = { ut: 0, zoho: 0, qbo: 0, tally: 0, vyapar: 0, busy: 0 }
    MASTER_BENCHMARK_DATA.forEach(row => {
      sum.ut += row.unifiedTree
      sum.zoho += row.zoho
      sum.qbo += row.quickbooks
      sum.tally += row.tally
      sum.vyapar += row.vyapar
      sum.busy += row.busy
    })
    const count = MASTER_BENCHMARK_DATA.length
    return {
      ut: (sum.ut / count).toFixed(2),
      zoho: (sum.zoho / count).toFixed(2),
      qbo: (sum.qbo / count).toFixed(2),
      tally: (sum.tally / count).toFixed(2),
      busy: (sum.busy / count).toFixed(2),
      vyapar: (sum.vyapar / count).toFixed(2),
    }
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Benchmarking & Competitor Matrix"
        subtitle="Comprehensive rating out of 5 across all 6 architectural layers and international tax jurisdictions"
        breadcrumb={['Strategic Analysis', 'Competitor Comparison']}
      />

      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border-2 border-[var(--primary)] bg-[var(--surface)] p-3.5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">UnifiedTree</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[var(--text)]">{overallScores.ut}</span>
            <span className="text-xs font-semibold text-[var(--muted)]">/ 5.0</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-[var(--pos)]">★ #1 Ranked Architecture</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Zoho Books</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[var(--text)]">{overallScores.zoho}</span>
            <span className="text-xs font-semibold text-[var(--muted)]">/ 5.0</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted)]">Established Cloud Suite</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">QuickBooks</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[var(--text)]">{overallScores.qbo}</span>
            <span className="text-xs font-semibold text-[var(--muted)]">/ 5.0</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted)]">Global Standard</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">TallyPrime</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[var(--text)]">{overallScores.tally}</span>
            <span className="text-xs font-semibold text-[var(--muted)]">/ 5.0</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted)]">Desktop Incumbent</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">BUSY</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[var(--text)]">{overallScores.busy}</span>
            <span className="text-xs font-semibold text-[var(--muted)]">/ 5.0</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted)]">India Desktop ERP</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Vyapar</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[var(--text)]">{overallScores.vyapar}</span>
            <span className="text-xs font-semibold text-[var(--muted)]">/ 5.0</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted)]">SMB Mobile Billing</p>
        </div>
      </div>

      {/* Main View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('master')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'master'
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-3)]'
            }`}
          >
            All-In-One Benchmark Table (Rated /5)
          </button>
          <button
            onClick={() => setActiveTab('country')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'country'
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-3)]'
            }`}
          >
            Country Taxation & Statutory Matrix
          </button>
        </div>

        {activeTab === 'master' && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--text)] outline-none focus:border-[var(--primary)]"
            />
            <select
              value={selectedLayer}
              onChange={e => setSelectedLayer(e.target.value)}
              className="h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs font-semibold text-[var(--text)] outline-none focus:border-[var(--primary)]"
            >
              {BENCHMARK_LAYERS.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeTab === 'master' ? (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Capability / Feature</th>
                <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--primary)]/5">UnifiedTree</th>
                <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Zoho Books</th>
                <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">QuickBooks</th>
                <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">TallyPrime</th>
                <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">BUSY</th>
                <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Vyapar</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Architecture Advantage</th>
              </tr>
            </thead>
            <tbody>
              {filteredBenchmark.map((row, idx) => (
                <tr key={row.feature} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/60 transition-colors">
                  <td className="px-4 py-3 align-top max-w-[240px]">
                    <span className="block text-xs font-bold uppercase tracking-wider text-[var(--primary)] opacity-80">{row.layerName}</span>
                    <p className="font-semibold text-[var(--text)]">{row.feature}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)] leading-relaxed">{row.description}</p>
                  </td>
                  <td className="px-3 py-3 align-top bg-[var(--primary)]/5">
                    <StarRating score={row.unifiedTree} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <StarRating score={row.zoho} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <StarRating score={row.quickbooks} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <StarRating score={row.tally} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <StarRating score={row.busy} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <StarRating score={row.vyapar} />
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-[var(--text)] max-w-[280px]">
                    <p className="font-medium">{row.highlight}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="text-sm font-bold text-[var(--text)]">Multi-Country Statutory Tax Matrix</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              How UnifiedTree compares against global competitors when operating under localized tax compliance regimes.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Country / Jurisdiction</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Statutory System</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--primary)]/5">UnifiedTree</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Zoho Books</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">QuickBooks</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">TallyPrime</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">BUSY</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Vyapar</th>
                </tr>
              </thead>
              <tbody>
                {COUNTRY_BENCHMARK_MATRIX.map((c) => (
                  <tr key={c.country} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/60">
                    <td className="px-4 py-3 font-semibold text-[var(--text)]">{c.country}</td>
                    <td className="px-4 py-3 text-xs font-mono text-[var(--muted)]">{c.taxSystem}</td>
                    <td className="px-3 py-3 font-bold text-[var(--primary)] bg-[var(--primary)]/5">{c.ut}</td>
                    <td className="px-3 py-3 text-[var(--text)]">{c.zoho}</td>
                    <td className="px-3 py-3 text-[var(--text)]">{c.qbo}</td>
                    <td className="px-3 py-3 text-[var(--muted)]">{c.tally}</td>
                    <td className="px-3 py-3 text-[var(--muted)]">{c.busy}</td>
                    <td className="px-3 py-3 text-[var(--muted)]">{c.vyapar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
