/**
 * SINGLE SOURCE OF TRUTH for navigation.
 * TopNav, TabPanel, SideNav and router.jsx all read from here.
 *
 * Rules:
 *  - Never change `id` — router keys depend on it.
 *  - Change `label` freely — it's display-only.
 *  - `group` controls sidebar grouping. Values:
 *      'main'     — always visible at top (Dashboard only)
 *      'daily'    — day-to-day work (Sales, Expenses, etc.)
 *      'finance'  — Tax, Reports
 *      'advanced' — collapsed by default (Setup, Assets, Tools, Storage, Alerts)
 */
import {
  LayoutDashboard, BookOpen, Users, FileText, Receipt,
  Landmark, BookMarked, Package, Calculator, BarChart3,
  HardDrive, BellRing, ShoppingCart, ClipboardList, BriefcaseBusiness,
  ArrowRightLeft, Wrench, Sparkles,
} from 'lucide-react'
import { COUNTRY_BY_CODE } from '../lib/countryTax.js'

const sections = [
  // ── MAIN ──────────────────────────────────────────────────────────────────
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    group: 'main',
    tabs: [
      { id: 'overview',      label: 'Overview'    },
      { id: 'cash-flow',     label: 'Cash Flow'   },
      { id: 'tax-calendar',  label: 'Tax Calendar' },
    ],
  },

  // ── DAILY ─────────────────────────────────────────────────────────────────
  {
    id: 'sales',
    label: 'Sales',
    icon: ShoppingCart,
    group: 'daily',
    tabs: [
      { id: 'quotations',         label: 'Quotations'        },
      { id: 'proforma-invoices',  label: 'PI'                },
      { id: 'sales-invoices',     label: 'Invoice'           },
      { id: 'invoice-desk',       label: 'Invoice Desk'      },
      { id: 'delivery-challans',  label: 'Delivery Challan'  },
    ],
  },
  {
    id: 'receivables',
    label: 'Money In',
    icon: FileText,
    group: 'daily',
    tabs: [
      { id: 'money-in-center',     label: 'Money In Center'        },
      { id: 'receivables',         label: 'Receivables'            },
      { id: 'payments-received',   label: 'Payments Received'      },
      { id: 'overdue-collections', label: 'Collections & Reminders' },
      { id: 'credit-notes',        label: 'Credit Notes & Refunds' },
      { id: 'sales-returns',       label: 'Sales Returns'          },
      { id: 'payment-links',       label: 'Payment Links'          },
    ],
  },
  {
    id: 'procurement',
    label: 'Purchases',
    icon: ClipboardList,
    group: 'daily',
    tabs: [
      { id: 'purchase-center',      label: 'Purchase Center' },
      { id: 'purchase-orders',      label: 'Purchase Orders' },
      { id: 'goods-receipt',        label: 'Goods Receipt'   },
      { id: 'purchase-invoices',    label: 'Purchase Invoices' },
      { id: 'bill-approvals',     label: 'Bill Approvals'     },
      { id: 'returns-debit-notes',  label: 'Returns & Debit Notes' },
    ],
  },
  {
    id: 'payables',
    label: 'Money Out',
    icon: Receipt,
    group: 'daily',
    tabs: [
      { id: 'bills',        label: 'Pay Center'        },
      { id: 'payments',     label: 'Supplier Payments' },
      { id: 'workforce',    label: 'Workforce'         },
      { id: 'adjustments',  label: 'Adjustments'       },
      { id: 'bank-release', label: 'Bank Release'      },
    ],
  },
  {
    id: 'cashbank',
    label: 'Cash & Bank',
    icon: Landmark,
    group: 'daily',
    tabs: [
      { id: 'bank-accounts',   label: 'My Accounts'         },
      { id: 'cash-petty',      label: 'Petty Cash'          },
      { id: 'contra',          label: 'Between Accounts'    },
      { id: 'cheque-register', label: 'Cheques'             },
      { id: 'foreign-currency', label: 'Foreign Currency'    },
      { id: 'bank-feeds',       label: 'Bank Feeds'          },
      { id: 'bank-rules',       label: 'Rules & Reconciliation' },
    ],
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: BookMarked,
    group: 'daily',
    tabs: [
      { id: 'expense-center',   label: 'All Expenses'        },
      { id: 'categories',       label: 'Expense Types'       },
      { id: 'automated-bills',  label: 'Recurring Expenses'  },
      { id: 'journal-vouchers', label: 'Manual Entries'      },
      { id: 'provisions',       label: 'Accruals'            },
      { id: 'write-offs',       label: 'Write-offs'          },
      { id: 'period-close',     label: 'Month-End'           },
    ],
  },

  // ── FINANCE ───────────────────────────────────────────────────────────────
  {
    id: 'tax',
    label: 'Tax',
    icon: Calculator,
    group: 'finance',
    tabs: [
      { id: 'gst-returns',          label: 'GST Filing'          },
      { id: 'gst-from-books',       label: 'GST from Books'       },
      { id: 'gst-filing-wizard',    label: '⚡ File GSTR-3B'     },
      { id: 'gst-reconciliation',   label: 'GST Matching'        },
      { id: 'e-invoicing',          label: 'E-Invoices'          },
      { id: 'e-way-bills',          label: 'E-Way Bills'         },
      { id: 'tds',                  label: 'TDS'                 },
      { id: 'tcs',                  label: 'TCS'                 },
      { id: 'tax-payments',         label: 'Pay Tax'             },
      { id: 'quarterly-compliance', label: 'Compliance Calendar' },
      { id: 'ca-access',            label: 'CA Temporary Access' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    group: 'finance',
    tabs: [
      { id: 'financial-statements', label: 'Financial Reports'    },
      { id: 'live-financials',      label: 'Live Financials'     },
      { id: 'ai-analyst',           label: 'AI Analyst'          },
      { id: 'general-ledger',       label: 'General Ledger'       },
      { id: 'books',                label: 'Transaction Books'    },
      { id: 'gst-reports',          label: 'GST Reports'         },
      { id: 'ar-ap',                label: 'Receivables vs Payables' },
      { id: 'profitability',        label: 'Profitability'        },
      { id: 'period-comparatives',  label: 'Year Comparison'     },
      { id: 'budget-vs-actuals',    label: 'Budget Tracker'      },
      { id: 'cashflow-projection',  label: 'Cash Forecast'       },
      { id: 'report-builder',       label: 'Custom Reports'      },
    ],
  },
  {
    id: 'advanced-features',
    label: 'Advanced Features',
    icon: Sparkles,
    group: 'advanced',
    tabs: [
      { id: 'overview', label: 'Overview' },
    ],
  },

  // ── ADVANCED (collapsed by default in sidebar) ─────────────────────────────
  {
    id: 'parties',
    label: 'Customers & Suppliers',
    icon: Users,
    group: 'advanced',
    tabs: [
      { id: 'all-parties',      label: 'All Parties'       },
      { id: 'customer-ledgers', label: 'Customers'         },
      { id: 'supplier-ledgers', label: 'Suppliers'         },
      { id: 'shared-ledger',    label: 'Shared Ledger'     },
      { id: 'statements',       label: 'Statements'        },
      { id: 'documents',        label: 'Party Documents'   },
      { id: 'portal',           label: 'Party Portal'      },
      { id: 'import',           label: 'Party Import'      },
      { id: 'duplicate-merge',  label: 'Duplicate Merge'   },
      { id: 'gap-analysis',     label: 'Gap Analysis'      },
    ],
  },
  {
    id: 'inventory',
    label: 'Items',
    icon: Package,
    group: 'advanced',
    tabs: [
      { id: 'inventory-items', label: 'Items'              },
      { id: 'godowns',         label: 'Warehouses'         },
      { id: 'stock-movement',  label: 'Stock Movement'     },
      { id: 'stock-valuation', label: 'Stock Valuation'    },
      { id: 'item-pricing',    label: 'Pricing'            },
      { id: 'reorder-alerts',  label: 'Reorder Alerts'     },
      { id: 'batch-serials',   label: 'Batch & Serial'     },
      { id: 'barcode-labels',  label: 'Barcode Labels'     },
      { id: 'item-import',     label: 'Item Import'        },
      { id: 'gap-analysis',    label: 'Gap Analysis'       },
    ],
  },
  {
    id: 'assets',
    label: 'Fixed Assets',
    icon: Package,
    group: 'advanced',
    tabs: [
      { id: 'asset-register',       label: 'Asset List'          },
      { id: 'depreciation',         label: 'Depreciation'        },
      { id: 'disposal-revaluation', label: 'Sell or Revalue'     },
    ],
  },
  {
    id: 'masters',
    label: 'Setup & Configuration',
    icon: BookOpen,
    group: 'advanced',
    tabs: [
      { id: 'chart-of-accounts', label: 'Accounts List'      },
      { id: 'tax-masters',       label: 'Tax Rates'          },
      { id: 'cost-centers',      label: 'Cost Centers'       },
      { id: 'voucher-types',     label: 'Transaction Types'  },
      { id: 'opening-balances',  label: 'Starting Balances'  },
      { id: 'currencies',        label: 'Currencies'         },
    ],
  },
  {
    id: 'business-tools',
    label: 'Team & Tools',
    icon: BriefcaseBusiness,
    group: 'advanced',
    tabs: [
      { id: 'staff-payroll', label: 'Payroll'        },
      { id: 'manage-users',  label: 'User Access'    },
      { id: 'online-orders', label: 'Online Orders'  },
      { id: 'sms-marketing', label: 'SMS Marketing'  },
      { id: 'accountant-hub', label: 'Accountants & Support' },
    ],
  },
  {
    id: 'storage',
    label: 'Documents',
    icon: HardDrive,
    group: 'advanced',
    tabs: [
      { id: 'client-storage',      label: 'Client Files'    },
      { id: 'unifiedtree-storage', label: 'Cloud Storage'   },
    ],
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: BellRing,
    group: 'advanced',
    tabs: [
      { id: 'accountant-alerts', label: 'Accountant Alerts'  },
      { id: 'compliance-alerts', label: 'Compliance Alerts'  },
      { id: 'cash-risk-alerts',  label: 'Cash & Risk Alerts' },
    ],
  },
  {
    id: 'migration',
    label: 'Data Migration',
    icon: ArrowRightLeft,
    group: 'advanced',
    tabs: [
      { id: 'tally-import', label: 'Import from Tally & Zoho' },
      { id: 'import', label: 'Import Data'    },
      { id: 'export', label: 'Export Data'    },
      { id: 'history', label: 'Import History' },
    ],
  },
]

export default sections

/** Quick lookup by section id */
export const sectionById = Object.fromEntries(sections.map(s => [s.id, s]))

/**
 * Country-localized navigation.
 *  - `labels`: tab/section ids renamed for the jurisdiction (Sales Tax vs VAT vs GST)
 *  - `hidden`: `${sectionId}/${tabId}` keys that do not apply in that country
 *    (e.g. E-Way Bills exist only in India, the UAE has no withholding tax)
 */
const COUNTRY_NAV = {
  US: {
    labels: {
      tax: 'Sales Tax',
      'gst-returns': 'Sales Tax Returns',
      'gst-filing-wizard': '⚡ File Sales Tax',
      'gst-reconciliation': 'Use Tax Matching',
      'e-invoicing': 'E-Invoices',
      tds: '1099 & Backup Withholding',
      tcs: 'Exemption Certificates',
      'ca-access': 'Accountant Access',
      'gst-reports': 'Sales Tax Reports',
    },
    hidden: ['tax/e-way-bills'],
  },
  GB: {
    labels: {
      tax: 'VAT',
      'gst-returns': 'VAT Returns (MTD)',
      'gst-filing-wizard': '⚡ Submit VAT to HMRC',
      'gst-reconciliation': 'Input VAT Matching',
      'e-invoicing': 'E-Invoicing (Peppol)',
      tds: 'CIS Deductions',
      tcs: 'Domestic Reverse Charge',
      'ca-access': 'Accountant Access',
      'gst-reports': 'VAT Reports',
    },
    hidden: ['tax/e-way-bills'],
  },
  AE: {
    labels: {
      tax: 'VAT',
      'gst-returns': 'VAT 201 Returns',
      'gst-filing-wizard': '⚡ File VAT 201',
      'gst-reconciliation': 'Input VAT Matching',
      'e-invoicing': 'FTA E-Invoicing',
      tcs: 'Reverse Charge',
      'ca-access': 'Tax Agent Access',
      'gst-reports': 'VAT Reports',
    },
    hidden: ['tax/e-way-bills', 'tax/tds'],
  },
  CA: {
    labels: {
      tax: 'GST/HST',
      'gst-returns': 'GST/HST Returns',
      'gst-filing-wizard': '⚡ File GST/HST',
      'gst-reconciliation': 'ITC Matching',
      'e-invoicing': 'E-Invoices',
      tds: 'T4A & Non-resident',
      tcs: 'Provincial Sales Tax',
      'ca-access': 'Accountant Access',
      'gst-reports': 'GST/HST Reports',
    },
    hidden: ['tax/e-way-bills'],
  },
  AU: {
    labels: {
      tax: 'GST & BAS',
      'gst-returns': 'BAS Statements',
      'gst-filing-wizard': '⚡ Lodge BAS',
      'gst-reconciliation': 'GST Credit Matching',
      'e-invoicing': 'Peppol E-Invoices',
      tds: 'PAYG Withholding',
      tcs: 'No-ABN Withholding',
      'ca-access': 'Tax Agent Access',
      'gst-reports': 'BAS & GST Reports',
    },
    hidden: ['tax/e-way-bills'],
  },
  DE: {
    labels: {
      tax: 'USt / VAT',
      'gst-returns': 'USt-Voranmeldung',
      'gst-filing-wizard': '⚡ ELSTER Submission',
      'gst-reconciliation': 'Vorsteuer-Abgleich',
      'e-invoicing': 'XRechnung / ZUGFeRD',
      tds: 'Bauabzugsteuer',
      tcs: '§ 13b Reverse Charge',
      'ca-access': 'Steuerberater Access',
      'gst-reports': 'USt-Berichte',
    },
    hidden: ['tax/e-way-bills'],
  },
  SG: {
    labels: {
      tax: 'GST',
      'gst-returns': 'GST F5 Returns',
      'gst-filing-wizard': '⚡ File GST F5',
      'gst-reconciliation': 'Input Tax Matching',
      'e-invoicing': 'InvoiceNow',
      tds: 'Withholding Tax',
      tcs: 'Reverse Charge',
      'ca-access': 'Tax Agent Access',
      'gst-reports': 'GST Reports',
    },
    hidden: ['tax/e-way-bills'],
  },
}

/**
 * Tax menu for a country: hand-tuned for the 25 full profiles, generated from
 * the country's tax name for every other country (e.g. "IVA Returns", "KDV Returns").
 */
/* Pages that only exist for Indian companies */
const INDIA_ONLY = ['tax/gst-from-books']

function navFor(code) {
  const nav = navForBase(code)
  return code === 'IN' ? nav : { ...nav, hidden: [...(nav.hidden ?? []), ...INDIA_ONLY] }
}

function navForBase(code) {
  if (code === 'IN') return { labels: {}, hidden: [] }
  if (COUNTRY_NAV[code]) return COUNTRY_NAV[code]
  const config = COUNTRY_BY_CODE[code]
  if (config?.nav) return { ...config.nav, labels: { 'ca-access': 'Accountant Access', ...config.nav.labels } }
  if (!config) return { labels: {}, hidden: [] }
  const name = config.taxShortName || config.taxSystem
  if (config.taxSystem === 'None') {
    return {
      labels: { tax: 'Tax', 'quarterly-compliance': 'Compliance Calendar', 'tax-payments': 'Tax Payments', 'ca-access': 'Accountant Access', 'gst-reports': 'Tax Reports' },
      hidden: ['tax/gst-returns', 'tax/gst-filing-wizard', 'tax/gst-reconciliation', 'tax/e-invoicing', 'tax/e-way-bills', 'tax/tds', 'tax/tcs'],
    }
  }
  return {
    labels: {
      tax: name, 'gst-returns': `${name} Returns`, 'gst-filing-wizard': `⚡ File ${name} Return`,
      'gst-reconciliation': `Input ${name} Matching`, 'e-invoicing': config.eInvoicingName || 'E-Invoices',
      'ca-access': 'Accountant Access', 'gst-reports': `${name} Reports`,
    },
    hidden: ['tax/e-way-bills', 'tax/tds', 'tax/tcs', ...(config.eInvoicingName ? [] : ['tax/e-invoicing'])],
  }
}

export function isTabAvailable(countryCode, sectionId, tabId) {
  const nav = navFor((countryCode || 'IN').toUpperCase())
  return !nav.hidden.includes(`${sectionId}/${tabId}`)
}

/**
 * Returns country-localized navigation (labels + only the tabs that apply).
 * Pass i18next's `t` to translate labels into the interface language.
 * Jurisdiction-specific names (e.g. "VAT Returns (MTD)", "USt-Voranmeldung")
 * take priority because they are the official names of those filings.
 */
export function getSectionsForCountry(countryCode = 'IN', t) {
  const code = (countryCode || 'IN').toUpperCase()
  const nav = navFor(code)
  const tr = (key, fallback) => (t ? t(key, { defaultValue: fallback }) : fallback)

  return sections.map((section) => {
    const tabs = section.tabs
      .filter(tab => !nav.hidden.includes(`${section.id}/${tab.id}`))
      .map((tab) => ({ ...tab, label: nav.labels[tab.id] || tr(`nav.tabs.${section.id}.${tab.id}`, tab.label) }))
    return {
      ...section,
      label: nav.labels[section.id] || tr(`nav.sections.${section.id}`, section.label),
      tabs,
    }
  })
}
