# UnifiedTree Accounting — Gap Analysis
> Reference: MyBillBook, Tally Prime, Vyapar, Zoho Books (India)  
> Date: May 2026 | Status: Pre-production

---

## Executive Summary

The current build covers **navigation shell + read-only data tables** for ~12 of 17 sections.  
**Critical gap:** The application has **zero data-entry forms**. Accountants cannot create, edit, or post any document. Every "New Invoice / New Receipt / New Quote" button is a dead end.  
Beyond that, 9 full sections render only `<PlaceholderPage />`.

---

## 1. Sections Fully Implemented (Read-Only Tables Only)

| Section | Tabs | Status |
|---|---|---|
| Dashboard | Overview, Cash Flow, Tax Calendar | ✅ Full UI |
| Masters | Chart of Accounts, Tax Masters, Cost Centers, Voucher Types, Opening Balances, Currencies | ✅ Read-only |
| Parties & Ledgers | All Parties, Customer Ledgers, Supplier Ledgers, Shared Ledger, Statements | ✅ Read-only |
| Items & Inventory | Inventory Items, Godowns, Stock Movement, Item Pricing | ✅ Read-only |
| Sales Operations | Sales Invoices, Quotations & Proforma, Delivery Challans, POS Billing | ✅ Read-only |
| Receivables | Invoices, Receipts, Credit Notes, Sales Returns, Ageing, Collections | ✅ Read-only |
| Settings | Company Profile, Configuration, Fiscal Periods, Roles, Integrations, Notifications, Audit Logs | ✅ UI done |

---

## 2. Sections That Are Placeholders (Nothing Built)

| Section | Tabs | Priority |
|---|---|---|
| **Purchase Operations** | Purchase Invoices, Payment Out, Purchase Returns, Debit Notes, Purchase Orders, Supplier Bills | 🔴 Critical |
| **Payables** | Bills, Payments, Payroll Requests, Debit Notes, Purchase Returns, Ageing, Supplier Advances | 🔴 Critical |
| **Cash & Bank** | Bank Accounts, Reconciliation, Cash & Petty Cash, Contra, Cheque Register | 🔴 Critical |
| **Expenses & Journals** | Expense Center, Categories, Automated Bills, Journal Vouchers, Provisions, Write-offs, Period Close | 🔴 Critical |
| **Tax Center** | GST Returns, GST Reconciliation, E-Invoicing, E-Way Bills, TDS, TCS, Tax Payments, Quarterly Compliance, CA Access | 🔴 Critical |
| **Reports & Analytics** | Financial Statements, Books, GST Reports, AR & AP, Profitability, Period Comparatives, Budget vs Actuals, Cash-Flow Projection, Report Builder | 🔴 Critical |
| **Fixed Assets** | Asset Register, Depreciation, Disposal & Revaluation | 🟡 High |
| **Business Tools** | Staff Attendance & Payroll, Manage Users, Online Orders, SMS Marketing | 🟡 High |
| **Alerts** | Accountant Alerts, Compliance Alerts, Cash & Risk Alerts, CA Temporary Access | 🟡 High |
| **Storage** | Client Storage, UnifiedTree Storage | 🟢 Medium |

---

## 3. Cross-Cutting Missing Features (Affect All Sections)

### 3A. 🔴 BLOCKER — No Data Entry Forms Anywhere
Every implemented page is a **read-only table**. None of the following exist:

| Form | Required For |
|---|---|
| New Sales Invoice form | Billing customers |
| New Purchase Invoice form | Recording vendor bills |
| New Receipt form | Recording customer payments |
| New Payment form | Paying vendors |
| New Journal Voucher form | Manual accounting entries |
| New Quotation / Proforma form | Pre-sales documents |
| New Credit Note / Debit Note form | Adjustments |
| New Delivery Challan form | Dispatch |
| New Purchase Order form | Procurement |
| New Expense form | Expense recording |
| New Party (Customer/Supplier) form | Master data creation |
| New Item form | Inventory master creation |
| New Bank Account form | Cash & bank setup |

> **Industry standard (Tally/Zoho/Vyapar):** A voucher entry screen is the primary daily workflow for any accountant. Without it, the software is unusable for actual work.

---

### 3B. 🔴 BLOCKER — No Invoice PDF / Print / Share

All competitors provide:
- PDF preview of invoice before sending
- Print-ready layout (A4 / A5 / thermal)
- Share via **WhatsApp, Email, SMS** directly from the invoice
- Download as PDF button per invoice row
- Company logo + GST QR code on invoice
- Multiple invoice templates/themes

**Currently:** Export button exists in headers but no per-document actions work.

---

### 3C. 🔴 BLOCKER — No GST Compliance Workflows

| Missing Feature | Tally | Vyapar | Zoho | UnifiedTree |
|---|---|---|---|---|
| GSTR-1 auto-populate from invoices | ✅ | ✅ | ✅ | ❌ Placeholder |
| GSTR-3B computation | ✅ | ✅ | ✅ | ❌ Placeholder |
| GSTR-2A/2B ITC reconciliation | ✅ | ✅ | ✅ | ❌ Placeholder |
| GSTR-9 (Annual Return) | ✅ | ❌ | ✅ | ❌ |
| E-Invoice (IRN / QR generation) | ✅ | ❌ | ✅ | ❌ Placeholder |
| E-Way Bill generation | ✅ | ❌ | ✅ | ❌ Placeholder |
| HSN/SAC summary report | ✅ | ✅ | ✅ | ❌ |
| GST payment challan (PMT-06) | ✅ | ❌ | ✅ | ❌ |

> GST compliance is the **#1 daily need** of Indian accountants. This is entirely placeholder.

---

### 3D. 🔴 BLOCKER — No Financial Statements

| Report | Status |
|---|---|
| Trial Balance | ❌ Missing |
| Profit & Loss Statement (Vertical / Horizontal) | ❌ Missing |
| Balance Sheet (Schedule VI) | ❌ Missing |
| Cash Flow Statement | ⚠️ Partial (dashboard chart, not a formal report) |
| Day Book | ❌ Missing |
| Ledger Account (full register) | ⚠️ Partial (Statements tab shows one party) |
| Purchase Register | ❌ Missing |
| Sales Register | ❌ Missing |

> Every accountant checks Trial Balance and P&L daily. These are mandatory.

---

### 3E. 🔴 BLOCKER — No Bank Reconciliation UI

Competitors provide:
- Import bank statement (CSV/Excel/OFX)
- Auto-match statement lines to ledger entries
- Manual match/unmatch
- Show unreconciled items on both sides
- Mark as reconciled with confirmation

**Currently:** Reconciliation tab → `<PlaceholderPage />`

---

### 3F. 🟡 HIGH — Missing Inventory Features

| Feature | Tally | Vyapar | UnifiedTree |
|---|---|---|---|
| Batch / Lot number tracking | ✅ | ✅ | ❌ |
| Expiry date tracking | ✅ | ✅ | ❌ |
| Serial number tracking | ✅ | ❌ | ❌ |
| Stock valuation (FIFO / Weighted Avg) | ✅ | ✅ | ❌ |
| Reorder level auto-alert | ✅ | ✅ | ⚠️ Low-stock shown in table, no alert |
| Manufacturing / BOM | ✅ | ❌ | ❌ |
| Stock transfer between godowns | ✅ | ✅ | ⚠️ Transfer shown in read-only table |
| Item-wise profitability | ✅ | ✅ | ❌ |
| Barcode scan on POS | ✅ | ✅ | ❌ |

---

### 3G. 🟡 HIGH — Missing TDS / TCS Workflows

| Feature | Status |
|---|---|
| TDS deduction on vendor payment | ❌ Placeholder |
| TDS certificate (Form 16A) generation | ❌ |
| 26AS reconciliation | ❌ |
| TDS return (24Q / 26Q) | ❌ |
| TCS collection on sales | ❌ Placeholder |
| Challan 281 payment tracking | ❌ |

---

### 3H. 🟡 HIGH — Missing Payment & Collection Automation

| Feature | Competitors | UnifiedTree |
|---|---|---|
| Automated payment reminders (email/WhatsApp/SMS) | ✅ | ❌ |
| Payment link generation (Razorpay/PayU) | ✅ Zoho/Vyapar | ❌ |
| Bulk reminder send | ✅ | ❌ |
| Cheque printing | ✅ Tally | ❌ |
| Post-dated cheque register | ✅ Tally | ❌ |
| Bank NEFT/RTGS batch file export | ✅ Tally/Zoho | ❌ |

---

### 3I. 🟡 HIGH — Missing Fixed Asset Features

| Feature | Status |
|---|---|
| Asset register with purchase value | ❌ Placeholder |
| Depreciation (SLM / WDV) auto-calculation | ❌ Placeholder |
| Schedule II (Companies Act) compliance | ❌ |
| Asset disposal with gain/loss | ❌ Placeholder |
| Asset revaluation | ❌ Placeholder |

---

### 3J. 🟢 MEDIUM — UX / Workflow Gaps

| Feature | Impact |
|---|---|
| Global search (Cmd+K / Ctrl+K) | Accountants navigate by typing ref numbers |
| Keyboard shortcuts for common actions | Tally keyboard-first workflow is industry norm |
| Notification badge on nav items | Alerts are hidden behind tab clicks |
| Document-level comments / notes | Audit trail per voucher |
| File attachment per voucher | Attach invoice scans, receipts |
| Bulk actions on tables (select + bulk-post) | Multi-entry workflows |
| Import via CSV/Excel | Opening balances, party list, item list |
| Mobile-responsive layout | Field sales, POS use |
| Dark mode | Already has theme vars but no toggle UI |
| Recent documents quick-access | Dashboard widget |

---

## 4. Implementation Roadmap

### Phase 1 — Data Entry Forms (Unblocks All Usage) `~3-4 weeks`

Build a **reusable `<DocumentForm />`** modal/drawer pattern, then apply to:

```
Priority order:
1. New Sales Invoice form    → SalesInvoices.jsx + salesService.js
2. New Receipt form          → Receipts.jsx
3. New Party form            → AllParties.jsx
4. New Item form             → InventoryItems.jsx
5. New Purchase Invoice form → PurchaseInvoices.jsx (new file)
6. New Payment form          → Payables section
7. New Journal Voucher form  → Expenses section
8. New Quotation form        → Quotations.jsx
9. New Expense form          → Expenses section
10. New Credit/Debit Note    → Receivables/Payables
```

**Form architecture:**
```
src/components/forms/
  DocumentForm.jsx         ← modal/drawer shell with save/cancel
  LineItemTable.jsx        ← add/remove/edit invoice line items
  PartySelector.jsx        ← searchable party dropdown
  ItemSelector.jsx         ← searchable item dropdown with auto-fill price+tax
  TaxSummaryPanel.jsx      ← auto-computed CGST/SGST/IGST/TDS breakdown
  AmountWords.jsx          ← Indian rupees in words (₹1,20,000 → "One Lakh Twenty Thousand")
```

---

### Phase 2 — Placeholder Sections `~3-4 weeks`

Build pages (read-only tables first, same pattern as Receivables):

```
Week 1: Purchase Operations (6 tabs) + purchaseService.js
Week 2: Payables (7 tabs) + payablesService.js
Week 3: Cash & Bank (5 tabs) + cashBankService.js
Week 4: Expenses & Journals (7 tabs) + expensesService.js
```

---

### Phase 3 — Tax & Compliance Center `~2-3 weeks`

```
1. GST Returns tab
   - GSTR-1: table of outward supplies grouped by rate
   - GSTR-3B: computed summary card with liability vs ITC
   - GSTR-2B: purchase-side ITC table with match/mismatch flags
   - File/Download buttons (link to GST portal)

2. E-Invoicing tab
   - IRN status per invoice (Pending / Generated / Cancelled)
   - QR code preview per invoice
   - Bulk IRN generation button

3. E-Way Bill tab
   - EWB number, validity, vehicle details table
   - Generate / Cancel / Extend actions

4. TDS tab
   - Deductions table with section codes (194C, 194J, etc.)
   - Challan 281 payment status
   - Certificate generation (Form 16A)

5. TCS tab
   - Collections, rate, challan

6. Tax Payments tab
   - GST PMT-06 challan tracking
   - TDS Challan 281 tracking
```

---

### Phase 4 — Reports & Analytics `~2 weeks`

```
src/features/reports/
  TrialBalance.jsx          ← Dr/Cr two-column with group totals
  ProfitLoss.jsx            ← Vertical P&L (Income - Expenses = Net Profit)
  BalanceSheet.jsx          ← Schedule VI format (Assets = Liabilities + Equity)
  DayBook.jsx               ← All vouchers for selected date, chronological
  SalesRegister.jsx         ← All SI with GST breakup, party-wise
  PurchaseRegister.jsx      ← All PI with GST, supplier-wise
  GSTReports.jsx            ← GSTR-1/3B formatted for filing
  ARAging.jsx               ← Already in Receivables — link here
  CashFlowStatement.jsx     ← Formal Ind AS cash flow (Operating/Investing/Financing)
  BudgetVsActuals.jsx       ← Cost center budget comparison
```

---

### Phase 5 — Invoice PDF & Sharing `~1-2 weeks`

```
src/lib/invoicePDF.js       ← generate PDF using @react-pdf/renderer or jsPDF
src/components/InvoicePreview.jsx   ← A4 template with:
    - Company header (logo, GSTIN, address)
    - Customer details
    - Line items table
    - Tax summary (CGST/SGST/IGST)
    - Amount in words
    - GST QR code (mandatory for e-invoicing)
    - Payment terms + bank details
    - Terms & conditions footer
```

**Share actions:** Download PDF | Print | Send Email | Copy WhatsApp link

---

### Phase 6 — Bank Reconciliation `~1 week`

```
src/features/cashbank/Reconciliation.jsx
  - CSV import via drag-drop
  - Statement lines table (left) vs Ledger entries (right)
  - Auto-match by amount + date proximity
  - Manual match click
  - Unreconciled summary strip
  - Close period button
```

---

### Phase 7 — Global Search + Keyboard Nav `~3 days`

```
src/components/ui/CommandPalette.jsx
  - Trigger: Ctrl+K / Cmd+K
  - Search across: parties, invoices, items, ledgers
  - Recent items
  - Quick actions: "New Invoice", "Record Payment"
  - Navigate to any section/tab
```

---

## 5. Priority Summary

| # | What | Why | Effort |
|---|---|---|---|
| 1 | **Data entry forms** | App is read-only — unusable without | 3-4 wks |
| 2 | **Placeholder sections** (Purchase, Payables, Cash, Expenses) | Core accounting loop broken | 3-4 wks |
| 3 | **Financial Reports** (Trial Balance, P&L, Balance Sheet) | Accountants check these daily | 2 wks |
| 4 | **GST Compliance** (GSTR-1, 3B, E-Invoice, E-Way) | Mandatory for Indian business | 2-3 wks |
| 5 | **Invoice PDF + Share** | Can't send invoice to customer | 1-2 wks |
| 6 | **Bank Reconciliation** | Core month-end task | 1 wk |
| 7 | **TDS / TCS workflows** | Mandatory for companies | 1 wk |
| 8 | **Fixed Assets** | Depreciation is monthly close task | 1 wk |
| 9 | **Global Search (Ctrl+K)** | Accountant productivity essential | 3 days |
| 10 | **Payment reminders** | Cash flow management | 3 days |

---

## 6. Features Present in Competitors NOT Needed for v1

The following are competitor features that are **out of scope** for initial accounting software:

- Manufacturing / BOM (Tally Advanced only)
- Online store / e-commerce (Vyapar specific)
- Barcode scan hardware integration
- Franchise / multi-branch consolidation
- Loan account tracking
- Cheque printing (physical hardware dependency)

---

*Generated: May 2026 | UnifiedTree Accounting Gap Analysis*
