# UnifiedTree — Competitive Roadmap
**Date:** 2026-05-28  
**Goal:** Stay ahead of Tally Prime, Zoho Books, Vyapar, MyBillBook  
**Principle:** Double-down on AI + Modern UX. Plug daily blockers. Never add complexity without hiding it.

---

## Guiding Rule

> Competitors add features. UnifiedTree makes features disappear.  
> Every action should feel like it already knew what you needed.

**Simple UI = progressive disclosure.**  
Power features exist but reveal only on: hover / toggle / row-select / focus.

---

## Phase 1 — Daily Workflow Blockers ✅
*Target: Week 1–2*

These are gaps users hit every session. Fix first.

| # | Feature | File(s) | Status |
|---|---|---|---|
| 1.1 | **Table Running Totals** — sticky footer row showing column sums in all data tables | `src/components/ui/DataTable.jsx` | ✅ |
| 1.2 | **Quick Create FAB** — floating "+" speed-dial, expands to: New Invoice, New Expense, Record Receipt, New Payment | `src/components/ui/QuickCreateFAB.jsx`, `src/components/layout/AppShell.jsx` | ✅ |
| 1.3 | **Bulk Actions** — checkbox column in tables + floating action toolbar when rows selected (Export, Delete, Mark Paid, Send) | `src/components/ui/DataTable.jsx` | ✅ |
| 1.4 | **Overdue Row Styling** — conditional red-tint row background when due date is past | `src/components/ui/DataTable.jsx` | ✅ |

**UI rule:** None add clutter. Totals are passive. FAB is 1 button. Bulk bar only when rows selected. Row colors = data.

---

## Phase 2 — Competitive Parity ✅
*Target: Week 3–4*

Features users expect from any modern accounting tool.

| # | Feature | File(s) | Status |
|---|---|---|---|
| 2.1 | **WhatsApp Share** — share button on invoice → bottom sheet with WhatsApp / Email / Copy Link / Download PDF | `src/components/ui/ShareSheet.jsx` | ✅ |
| 2.2 | **Recurring Transactions** — "Make Recurring" toggle on invoice/bill create (collapsed by default, reveals schedule picker) | `src/components/ui/RecurringToggle.jsx` | ✅ |
| 2.3 | **Persistent Filters** — save last filter state in localStorage per section, restore on return | `src/hooks/usePersistentFilters.js` | ✅ |
| 2.4 | **PDF Invoice Preview** — modal preview before download/share | `src/components/ui/InvoicePreview.jsx` | ✅ |

---

## Phase 3 — Exclusive Features Nobody Has ✅
*Target: Month 2*

| # | Feature | File(s) | Status |
|---|---|---|---|
| 3.1 | **Dark Mode** — system-preference aware, toggle in TabPanel; first accounting app in India with proper dark mode | `src/index.css`, `src/hooks/useTheme.js`, `src/components/layout/TabPanel.jsx` | ✅ |
| 3.2 | **AI Transaction Explain** — click any transaction row → AI explains it in plain English in a slide-in panel | `src/components/ai/TransactionExplain.jsx` — wired in `DashboardOverview` | ✅ |
| 3.3 | **Smart Duplicate Detector** — real-time inline warning on invoice entry if party+amount looks like duplicate | `src/components/ui/DuplicateWarning.jsx` — wired in `QuickInvoiceModal` | ✅ |
| 3.4 | **Voice Amount Entry** — mic icon on amount fields, speak "twelve lakh fifty thousand" → parsed to number | `src/components/ui/VoiceInput.jsx` — wired in `QuickInvoiceModal` | ✅ |

---

## Phase 4 — Platform Moat
*Target: Month 3*

| # | Feature | File(s) | Status |
|---|---|---|---|
| 4.1 | **GST Portal Push** — file directly from UnifiedTree via GSTN API integration | `src/features/tax/GstFilingWizard.jsx` | ⬜ |
| 4.2 | **Bank Statement AI Parse** — upload any bank PDF → AI auto-reconciles transactions | `src/features/cashbank/BankStatementImport.jsx` | ⬜ |
| 4.3 | **CA Collaboration Mode** — share read-only + annotate access with chartered accountant | `src/features/business-tools/CollaborationMode.jsx` | ⬜ |
| 4.4 | **Mobile PWA** — installable on phone, offline-capable via service worker | `public/sw.js`, `vite.config.js` | ⬜ |

---

## Phase 5 — Make It Real (Prototype → Product) ⬜
*Target: Month 4+ — highest priority despite later number*

**Reality check (2026-05-29):** Phases 1–4 ship UI + UX. But all data is mock (`src/data/services/*.js` are static arrays), AI is simulated, and there is no backend, persistence, auth, or live government/bank integration. Competitors win on "it actually saves data securely." Close this before further UX polish.

### P0 — Turn prototype into product

| # | Feature | Notes |
|---|---|---|
| 5.1 | **Backend + database** | Replace mock `*Service.js` arrays with real API + persistent DB. Nothing saves today. |
| 5.2 | **Auth + RBAC + multi-company** | Zero security currently. Table stakes for accounting. |
| 5.3 | **Audit trail** | Immutable change log — compliance + trust requirement. |

### P1 — Make AI / compliance real (current differentiators are mocked)

| # | Feature | Notes |
|---|---|---|
| 5.4 | **Wire AI to live LLM API** | Insights / explain / duplicate-detect are hardcoded. Real value only when computed from user data. |
| 5.5 | **Real GSTN filing + e-invoice IRN + e-way bill API** | `GstFilingWizard.jsx` is UI only; needs actual government API push. |
| 5.6 | **Real bank-statement parse / reconciliation** | OCR/parse pipeline behind existing `BankStatementImport.jsx`. |

### P2 — Adoption blockers vs Indian SMB competitors

| # | Feature | Notes |
|---|---|---|
| 5.7 | **Native mobile app** | Vyapar / MyBillBook are mobile-first — SMB battlefield. PWA alone loses here. |
| 5.8 | **Hindi + regional languages** | Reverses earlier "What NOT to Build" call — real onboarding blocker for Vyapar's segment. |
| 5.9 | **Tally / Excel import that actually works** | Migration = #1 switching cost. Make it bulletproof. |
| 5.10 | **Integrations** | Payment gateways, e-commerce, bank feeds — Zoho's moat. |

**Rule:** UX/AI lead means nothing until the app persists real data securely. Ship P0 first.

---

## Competitive Reality vs Marketing Score

The table above ("Competitive Score After All Phases") reflects UI capability. Substance gaps as of 2026-05-29:

| Axis | UnifiedTree | Tally | Zoho | Vyapar |
|---|---|---|---|---|
| Real backend / DB / auth | ❌ **missing** | ✅ local | ✅ cloud | ✅ |
| Multi-user / RBAC | ❌ | ⚠️ | ✅ | ⚠️ |
| Real GST filing (GSTN API) | ❌ UI only | ✅ | ✅ | ✅ |
| Live bank feed / recon | ❌ UI only | ⚠️ | ✅ | ⚠️ |
| Integrations ecosystem | ❌ | ⚠️ | ✅ **moat** | ⚠️ |
| Offline | ❌ cloud-only | ✅ | ❌ | ✅ |
| Native mobile app | ⚠️ PWA only | ❌ | ✅ | ✅ **core** |
| Hindi / regional language | ❌ | ✅ | ✅ | ✅ |
| Install base / trust | ❌ new | ✅ huge | ✅ large | ✅ large SMB |

---

## What NOT to Build

| Feature | Reason |
|---|---|
| Client Portal | Complex, low SMB usage, UI bloat |
| Offline Mode (full) | Cloud-first is fine for target segment |
| Live Bank Feed | API costs + compliance complexity |

---

## UI Simplicity Rules (apply to every feature forever)

```
1. Default state shows nothing extra
2. Feature reveals on: hover / toggle / row select / focus
3. No new top-level nav items without user value >8/10
4. Every panel/modal closeable with Esc
5. Mobile: feature works or hides cleanly — never breaks layout
6. Max 1 new icon in any toolbar per feature
7. New feature must not increase page load time by >50ms
```

---

## Competitive Score After All Phases

| Feature | UnifiedTree | Tally | Zoho | Vyapar |
|---|---|---|---|---|
| Modern UI | ✅ **Best** | ❌ | ✅ | ✅ |
| AI (Insights + NLP + Explain) | ✅ **Best by far** | ❌ | ⚠️ | ❌ |
| Command Palette + AI Search | ✅ **Only one** | ❌ | ❌ | ❌ |
| Dark Mode | ✅ **Only one** | ❌ | ❌ | ❌ |
| GST Filing | ✅ | ✅ | ✅ | ✅ |
| Quick Create FAB | ✅ | ❌ | ✅ | ✅ |
| Mobile PWA | ✅ | ❌ | ✅ | ✅ |
| Bulk Actions | ✅ | ✅ | ✅ | ⚠️ |
| Table Running Totals | ✅ | ✅ | ✅ | ✅ |
| WhatsApp Share | ✅ | ❌ | ⚠️ | ✅ |
| Voice Amount Entry | ✅ **Only one** | ❌ | ❌ | ❌ |
| Financial Health Score | ✅ **Only one** | ❌ | ❌ | ❌ |
| Live Compliance Countdown | ✅ **Only one** | ❌ | ❌ | ❌ |
| AI Transaction Explain | ✅ **Only one** | ❌ | ❌ | ❌ |

---

## Progress Log

| Date | Phase | Item | Notes |
|---|---|---|---|
| 2026-05-28 | Pre-phase | Financial Health Score | Built — dashboard widget |
| 2026-05-28 | Pre-phase | Live Compliance Countdown | Built — real-time ticking |
| 2026-05-28 | Pre-phase | AI NLP Command Palette | Built — query mode in Ctrl+K |
| 2026-05-28 | — | Color palette updated | Teal green primary #0F6E56 |
| 2026-05-28 | Phase 1 | All 4 items | DataTable totals, FAB, bulk actions, overdue styling |
| 2026-05-28 | Phase 2 | All 4 items | ShareSheet, RecurringToggle, PersistentFilters, InvoicePreview |
| 2026-05-28 | Phase 3 | 3.1 Dark Mode | CSS tokens + anti-flash + useTheme hook + TabPanel toggle |
| 2026-05-28 | Phase 3 | 3.2 AI Explain | TransactionExplain panel + DashboardOverview row click wiring |
| 2026-05-28 | Phase 3 | 3.3 Duplicate Detector | DuplicateWarning — token similarity + 2% amount tolerance |
| 2026-05-28 | Phase 3 | 3.4 Voice Amount | VoiceInput — Web Speech API + Indian number-words parser |
| 2026-05-28 | Phase 3 | Integration | QuickInvoiceModal showcases 3.3+3.4; FAB "New Invoice" opens it |
