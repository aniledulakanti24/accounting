/**
 * aiContextService — section-aware AI insights and chat responses.
 * All data is mock; replace with real API calls when backend is ready.
 */

/* ── Per-section insight strips ─────────────────────────────────────── */
export const SECTION_INSIGHTS = {
  dashboard: [
    { type: 'warn',    icon: '📉', text: 'Cash flow turns negative in ~90 days at current burn rate. Consider chasing 3 large debtors.', href: '/dashboard/cash-flow',        cta: 'View Forecast' },
    { type: 'info',    icon: '📬', text: 'Infosys BPO Ltd has 3 unpaid invoices totalling ₹28.5L overdue by 30+ days — follow up now.', href: '/receivables/overdue-collections', cta: 'View Collections' },
    { type: 'success', icon: '🎯', text: 'Profit up 18.7% YoY — Q3 services revenue is the strongest quarter this fiscal year.',          href: null,                          cta: null            },
  ],
  sales: [
    { type: 'warn',    icon: '⏰', text: '4 invoices overdue 30+ days — ₹12.4L at risk. Send reminders before month-end.',               href: '/receivables/overdue-collections', cta: 'Overdue Tracker' },
    { type: 'info',    icon: '🤝', text: 'Tech Mahindra pays 12 days early on average — good candidate for early-payment discount offer.', href: null,                          cta: null              },
    { type: 'success', icon: '📈', text: 'Invoice approval-to-payment cycle improved by 8% this month vs last month.',                    href: null,                          cta: null              },
  ],
  receivables: [
    { type: 'warn',    icon: '💸', text: '₹78.9L outstanding across 23 invoices — 5 exceed 60 days. High collection risk.',               href: '/receivables/overdue-collections', cta: 'Overdue Tracker' },
    { type: 'info',    icon: '🔮', text: "Wipro Digital's payment pattern predicts INV-0839 will clear by 25 Dec — no action needed.",    href: null,                          cta: null              },
    { type: 'info',    icon: '📧', text: 'Auto-send reminder email to 4 customers? AI drafted messages are ready.',                       href: '/receivables/overdue-collections', cta: 'View Follow-ups' },
  ],
  procurement: [
    { type: 'warn',    icon: '⚠️', text: 'Potential duplicate PO detected — PO-2024-0121 matches PO-2024-0118 (same vendor, amount).',   href: null,                          cta: null              },
    { type: 'info',    icon: '🔁', text: 'AWS and Zoho bills repeat monthly — set up recurring bills to save time.',                      href: '/expenses/automated-bills',   cta: 'Recurring Bills' },
    { type: 'success', icon: '✅', text: 'Purchase approval rate 96% this month — lowest rejection rate this fiscal year.',               href: null,                          cta: null              },
  ],
  payables: [
    { type: 'warn',    icon: '📅', text: 'Office Rent (₹75K) and AWS (₹12.5K) due in 5 days — verify sufficient cash balance.',          href: '/cashbank/bank-accounts',     cta: 'Check Balance'   },
    { type: 'info',    icon: '💡', text: 'Paying Freshworks 3 days early earns a 1.5% discount — saves ₹675 on this bill.',              href: null,                          cta: null              },
    { type: 'info',    icon: '🏦', text: 'HDFC Current A/c balance sufficient for all bills due this week. No action needed.',            href: null,                          cta: null              },
  ],
  cashbank: [
    { type: 'warn',    icon: '📉', text: 'HDFC Current balance down 15% month-on-month — review large outgoing transfers.',               href: null,                          cta: null              },
    { type: 'info',    icon: '🔍', text: '8 transactions unreconciled in bank statement — import latest statement to fix.',               href: '/cashbank/bank-rules',    cta: 'Reconcile Now'   },
    { type: 'success', icon: '✅', text: 'Kotak Savings account reconciled and up to date. No outstanding items.',                        href: null,                          cta: null              },
  ],
  expenses: [
    { type: 'warn',    icon: '✈️', text: 'Travel expenses 43% over budget this month — 3 items pending approval.',                       href: null,                          cta: null              },
    { type: 'info',    icon: '🏷️', text: 'AWS India expense labelled "Other" — AI suggests category: Cloud & Hosting.',                 href: null,                          cta: null              },
    { type: 'success', icon: '👍', text: 'Office supplies spend down 12% vs last month — good cost control.',                             href: null,                          cta: null              },
  ],
  tax: [
    { type: 'warn',    icon: '🏛️', text: 'GSTR-1 due in 12 days. 4 B2B invoices not yet filed — file now to avoid late fee.',           href: '/tax/gst-returns',            cta: 'File GSTR-1'     },
    { type: 'warn',    icon: '📋', text: 'TDS on AWS India (26Q) deducted but challan not uploaded for Q3.',                             href: '/tax/tds',                    cta: 'TDS Filing'      },
    { type: 'info',    icon: '💰', text: 'ITC available ₹2.1L from GSTR-2B — match with purchase register before filing.',              href: '/tax/gst-reconciliation',     cta: 'GST Matching'    },
  ],
  reports: [
    { type: 'success', icon: '📊', text: 'Net profit margin 22.4% — above industry average of 18% for IT services sector.',             href: null,                          cta: null              },
    { type: 'info',    icon: '🔎', text: 'December revenue spike (₹94L) — one-time project or recurring? Verify for accurate forecast.', href: '/reports/financial-statements', cta: 'View P&L'      },
    { type: 'info',    icon: '📆', text: 'Budget vs Actuals: 3 cost centres over budget — click to see which ones.',                     href: '/reports/budget-vs-actuals',  cta: 'Budget Tracker'  },
  ],
  parties: [
    { type: 'info',    icon: '📈', text: 'Infosys BPO credit utilisation at 94% — consider revising credit limit upward.',              href: null,                          cta: null              },
    { type: 'warn',    icon: '⚠️', text: '2 suppliers missing GSTIN — required for Input Tax Credit eligibility.',                       href: null,                          cta: null              },
    { type: 'success', icon: '🌟', text: 'Wipro Digital: 92% on-time payment history. Excellent partner relationship.',                  href: null,                          cta: null              },
  ],
  inventory: [
    { type: 'warn',    icon: '📦', text: '3 items below reorder level: Printer Paper, Toner Cartridge, Ethernet Cable.',                 href: null,                          cta: null              },
    { type: 'warn',    icon: '🐌', text: 'Laptops stagnant for 45 days — possible overstock. Consider promotion or return to vendor.',    href: null,                          cta: null              },
    { type: 'success', icon: '✅', text: 'Stock accuracy 98.4% — excellent inventory management this month.',                            href: null,                          cta: null              },
  ],
  assets: [
    { type: 'info',    icon: '📅', text: 'December depreciation not yet posted — run month-end depreciation before closing.',            href: '/assets/depreciation',        cta: 'Run Depreciation' },
    { type: 'success', icon: '✅', text: 'No assets due for renewal or insurance this quarter.',                                          href: null,                          cta: null              },
  ],
  'business-tools': [
    { type: 'info',    icon: '👥', text: 'Payroll for January ready to process — 12 employees, total payout ₹8.4L.',                    href: '/business-tools/staff-payroll', cta: 'Process Payroll' },
    { type: 'warn',    icon: '🔒', text: '2 user accounts have not logged in for 60+ days — consider deactivating for security.',       href: '/business-tools/manage-users', cta: 'Manage Users'    },
  ],
  storage: [
    { type: 'info',    icon: '☁️', text: 'Cloud storage 68% used (34 GB of 50 GB). Consider archiving old documents.',                  href: null,                          cta: null              },
    { type: 'success', icon: '✅', text: 'All client files backed up. Last backup: today at 3:00 AM.',                                   href: null,                          cta: null              },
  ],
  migration: [
    { type: 'info',    icon: '🤖', text: 'AI can auto-map up to 90% of fields from Tally or Zoho exports — reduces mapping effort.',    href: null,                          cta: null              },
    { type: 'success', icon: '✅', text: 'Last import: 142 parties from Tally Prime — 0 errors, 0 duplicates found.',                   href: null,                          cta: null              },
  ],
  alerts: [
    { type: 'warn',    icon: '🚨', text: '3 critical alerts require action today — GST, TDS, and overdue collections.',                  href: '/alerts/accountant-alerts',   cta: 'View Alerts'     },
    { type: 'info',    icon: '🤖', text: 'AI triaged 18 alerts this week — 12 resolved automatically, 6 need your attention.',          href: null,                          cta: null              },
  ],
  masters: [
    { type: 'info',    icon: '🗂️', text: '4 ledger accounts have no group assigned — AI can suggest groups based on account names.',    href: null,                          cta: null              },
    { type: 'success', icon: '✅', text: 'Chart of accounts structure looks clean. No orphaned or duplicate accounts detected.',         href: null,                          cta: null              },
  ],
}

/* ── Per-section quick prompts ───────────────────────────────────────── */
export const QUICK_PROMPTS = {
  dashboard: [
    'Why is my cash balance dropping?',
    'Who are my top debtors right now?',
    'When will I run out of cash?',
    'What should I focus on today?',
    'Summarise this month in one paragraph',
  ],
  sales: [
    'Which invoices are likely to be paid late?',
    'Who are my best customers this year?',
    'Find suspicious or duplicate invoices',
    'Suggest a follow-up strategy for overdue customers',
    'What is my average invoice value this month?',
  ],
  receivables: [
    'Which overdue invoices should I follow up on first?',
    'Draft a payment reminder for Infosys BPO',
    'What is my average collection period?',
    'Predict next month\'s collections',
    'Show customers likely to default',
  ],
  procurement: [
    'Are there any duplicate purchase orders?',
    'Which vendors should I prioritise for payment?',
    'Analyse my top 5 suppliers by spend',
    'Identify recurring vendor payments',
    'Flag unusually high purchase amounts',
  ],
  payables: [
    'Which bills should I pay first?',
    'Can I delay any payments without penalty?',
    'What is my total cash outflow next 7 days?',
    'Alert me if I miss a due date',
    'Optimise payment timing for cash flow',
  ],
  cashbank: [
    'Why is my HDFC balance falling?',
    'Show unreconciled transactions',
    'Predict bank balance in 30 days',
    'Flag any unusual or large transactions',
    'Which account has the most idle cash?',
  ],
  expenses: [
    'Which expense category is over budget?',
    'Auto-categorise all uncategorised expenses',
    'Find duplicate expense claims',
    'Compare this month vs last month expenses',
    'Which employee has the highest expenses?',
  ],
  tax: [
    'What GST do I need to file this month?',
    'Check for GSTR-2B mismatches',
    'What TDS have I deducted but not deposited?',
    'Calculate my advance tax for Q3',
    'Is my e-invoice compliance up to date?',
  ],
  reports: [
    'Summarise P&L in plain English',
    'Why is profit different from last year?',
    'Which cost centre is most profitable?',
    'Compare Q3 with Q2 performance',
    'Generate a board-ready summary',
  ],
  parties: [
    'Who are my highest-value customers?',
    'Which suppliers give best credit terms?',
    'Flag parties with missing GSTIN',
    'Score customers by payment reliability',
    'Show parties with no activity in 6 months',
  ],
  inventory: [
    'Which items need reordering now?',
    'Find slow-moving or dead stock',
    'Predict stock-out dates for fast movers',
    'Optimise reorder quantities',
    'Which warehouse has excess stock?',
  ],
  assets: [
    'Show assets due for renewal this quarter',
    'Calculate depreciation for this month',
    'Which assets are fully depreciated?',
    'Flag assets not verified in 12 months',
    'Summarise asset register for audit',
  ],
  'business-tools': [
    'Process payroll for this month',
    'Show users with no recent activity',
    'Analyse online order trends',
    'Which staff member has highest overtime?',
    'Generate payslips for all employees',
  ],
  storage: [
    'Find duplicate or large files',
    'Which client folder is using most space?',
    'List files not accessed in 6 months',
    'Suggest files safe to archive',
    'Verify all compliance documents are present',
  ],
  migration: [
    'Auto-map my Tally XML fields',
    'Detect duplicates in the imported data',
    'Explain what data will be migrated',
    'What data format does Zoho Books export?',
    'How long will a full Tally migration take?',
  ],
  alerts: [
    'Summarise today\'s critical alerts',
    'Which alerts can be auto-resolved?',
    'Set up custom alert thresholds',
    'Why am I getting this GST alert?',
    'Mark all low-priority alerts as read',
  ],
  masters: [
    'Suggest groups for uncategorised ledgers',
    'Check for duplicate accounts',
    'Validate chart of accounts structure',
    'What tax rates apply to my business?',
    'Suggest standard cost centres for my industry',
  ],
}

/* ── Mock chat response generator ───────────────────────────────────── */
const CANNED = {
  'Why is my cash balance dropping?':
    `**Cash Balance Analysis**\n\nYour cash has dropped ₹8.2L in the last 30 days. Key outflows:\n\n• ₹3.1L — Vendor payments (Reliance, AWS)\n• ₹2.4L — Advance payroll disbursement\n• ₹1.8L — Tax payments (GST Q3)\n\nRevenue collection is lagging. **Infosys BPO owes ₹28.5L** — chasing this alone would stabilise your balance.\n\n**Recommendation:** Follow up with top 3 debtors this week and defer non-critical vendor payments by 7 days.`,

  'Who are my top debtors right now?':
    `**Top Outstanding Debtors (Dec 2024)**\n\n1. Infosys BPO Ltd — **₹28.5L** (45 days overdue)\n2. Tech Mahindra — **₹19.2L** (due in 8 days)\n3. Wipro Digital — **₹15.4L** (due in 12 days)\n4. HCL Services — **₹9.8L** (14 days overdue)\n5. Tata Consultancy — **₹6.2L** (due today)\n\n**Total: ₹79.1L outstanding.** I recommend prioritising Infosys and HCL as they are overdue.`,

  'Which invoices are likely to be paid late?':
    `**Late Payment Predictions**\n\nBased on historical payment behaviour:\n\n🔴 **High risk (>70% likely late)**\n• INV-2024-0842 — Infosys BPO — ₹8.5L (already 8 days late)\n• INV-2024-0844 — HCL Services — ₹3.2L (due tomorrow)\n\n🟡 **Medium risk (40-70%)**\n• INV-2024-0850 — New customer — ₹1.8L\n\n🟢 **Low risk — likely on time**\n• All other open invoices\n\nI can draft reminder emails for high-risk customers. Would you like me to?`,

  'What GST do I need to file this month?':
    `**GST Filing Summary — January 2025**\n\n**GSTR-1** (Sales return)\n• Due: 11 Jan 2025 (12 days away)\n• B2B invoices: 18 (4 not yet uploaded)\n• B2C sales: ₹4.2L\n\n**GSTR-3B** (Monthly return)\n• Due: 20 Jan 2025\n• Net GST liability: ~₹8.9L\n• ITC available: ₹2.1L\n• **Cash to pay: ₹6.8L**\n\n**Action items:**\n1. Upload 4 pending B2B invoices to GSTR-1\n2. Match GSTR-2B ITC before 3B filing\n3. Arrange ₹6.8L in Electronic Cash Ledger`,

  'Summarise P&L in plain English':
    `**Profit & Loss — Apr–Dec 2024 (Plain English)**\n\nYour business earned **₹9.4Cr in revenue** this year so far — up 22% from last year. The biggest earners were IT services (68%) and consulting (21%).\n\nYou spent **₹8.85Cr** running the business — salaries are the biggest cost (₹4.2Cr), followed by AWS/cloud infra (₹1.1Cr) and office expenses (₹65L).\n\n**Net profit: ₹54.2L** — a 22.4% margin, which is above industry average.\n\n⚠️ Watch out: Travel and entertainment spend is up 43% vs budget. That needs attention in Q4.`,
}

const GENERIC_RESPONSES = [
  `Based on your current financial data, I can see several patterns worth noting. Let me analyse the specifics and give you actionable insights.\n\n**Key Finding:** Your data shows a healthy overall position, but there are 2-3 areas that need attention this week. Shall I break each one down?`,
  `I've reviewed the relevant transactions and records. Here's what stands out:\n\nYour numbers are largely on track, though I spotted a few anomalies that may need your review. I can drill into any specific area — just ask.`,
  `**Quick Analysis**\n\nLooking at your recent activity, the trends suggest you're performing well compared to last period. However, there are some items worth actioning before month-end.\n\nWould you like me to prioritise what needs immediate attention vs what can wait?`,
]

let _genericIndex = 0

export function getMockAIResponse(question) {
  return new Promise((resolve) => {
    const delay = 900 + Math.random() * 800
    setTimeout(() => {
      const canned = CANNED[question]
      if (canned) { resolve(canned); return }
      resolve(GENERIC_RESPONSES[_genericIndex++ % GENERIC_RESPONSES.length])
    }, delay)
  })
}

export function getSectionInsights(sectionId) {
  return SECTION_INSIGHTS[sectionId] ?? SECTION_INSIGHTS.dashboard
}

export function getSectionPrompts(sectionId) {
  return QUICK_PROMPTS[sectionId] ?? QUICK_PROMPTS.dashboard
}
