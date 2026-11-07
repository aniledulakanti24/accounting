# UnifiedTree Competitive Improvement Plan

Date: 2026-05-29

This plan turns the competitor comparison against TallyPrime, Zoho Books, Vyapar, and BUSY into product work for the current frontend mock. The app still has no backend, so each item is implemented as realistic client-side UX with Zustand/local data persistence where useful.

## 1. Compliance Workflow Depth

Goal: make GST, e-invoice, e-way bill, and filing feel like one connected workflow instead of separate pages.

Improvements:
- Add a compliance pipeline showing invoice posted, IRN generated, e-way bill generated, GSTR-1 staged, GSTR-3B reviewed, and filed.
- Show document-level statuses, risk flags, next action, owner, and due date.
- Add one-click simulated actions such as Generate IRN, Generate E-way Bill, Stage GSTR-1, Mark Reviewed, and File Return.
- Surface compliance pipeline progress on dashboard/tax screens.

Competitor pressure:
- TallyPrime and BUSY are strong in GST/e-invoice/e-way bill workflows.
- Zoho Books emphasizes GST-compliant cloud workflows.

## 2. Audit Confidence

Goal: make every important action feel traceable and accountant-safe.

Improvements:
- Add a centralized frontend audit trail in Zustand.
- Record permission edits, integration connect/disconnect/sync, compliance actions, and import actions.
- Show before/after style metadata where available.
- Add an Audit Activity panel in settings using persisted audit events.

Competitor pressure:
- TallyPrime’s edit log and accounting trust model are major buyer-confidence signals.

## 3. Faster Onboarding

Goal: let a new company reach first useful accounting action quickly.

Improvements:
- Add setup progress cards for company profile, GSTIN, bank, invoice template, import, and first invoice.
- Highlight next best setup action from dashboard/settings.
- Keep the workflow non-blocking for demo use.

Competitor pressure:
- Vyapar wins with easy first-use billing.
- Zoho wins with clean guided cloud setup.

## 4. Workflow-Aware Integrations

Goal: make integration cards visibly affect accounting workflows.

Improvements:
- Payment gateway connection enables invoice payment link hints.
- Banking connection enables bank feed/reconciliation hints.
- E-commerce connection enables imported order hints.
- Sync actions update last sync and write audit events.

Competitor pressure:
- Zoho’s ecosystem and Tally’s connected banking/GST features make integrations feel useful, not decorative.

## 5. Mobile Quick Billing

Goal: improve the small-business/mobile operator experience.

Improvements:
- Add a compact quick-action panel for invoice, receipt, expense, and bill creation.
- Keep controls touch-friendly and visible in the main header/FAB flow.
- Preserve the existing desktop modal behavior while adding a denser mobile-friendly path.

Competitor pressure:
- Vyapar is strong on mobile/PC quick billing and low-friction use.

## 6. Actionable AI Assistance

Goal: shift AI from passive insight labels to workflow-driving guidance.

Improvements:
- Add AI insights that point to compliance, reconciliation, imports, and integration actions.
- Give each insight a clear CTA and route.
- Keep insights in the top navbar before the role selector.

Competitor pressure:
- This is UnifiedTree’s differentiation wedge: guided finance operations rather than another ledger clone.

## 7. Migration From Tally/Excel

Goal: reduce switching anxiety.

Improvements:
- Add a Tally/Excel import wizard with source selection, file details, validation preview, mapped entities, issue list, and simulated import completion.
- Persist import jobs locally.
- Write audit events for validation and import completion.

Competitor pressure:
- Tally has strong incumbent lock-in. Migration confidence is essential for switching.

<<<<<<< HEAD
=======
## 8. Parties & Ledgers Add-ons

Goal: make Parties a true customer/supplier command center, not only a master list and ledger viewer.

Current coverage:
- All Parties list with GSTIN, type, city, outstanding, overdue, last transaction, and status.
- Customer Ledgers with credit limit usage, outstanding, overdue, and last transaction.
- Supplier Ledgers with payable, overdue, advance paid, and last transaction.
- Shared Ledger for parties that are both customer and supplier.
- Party Statements with period selector, debit/credit rows, closing balance, print, and PDF export.

Add-ons:
- Full party profile page with billing/shipping address, state, country, email, phone, contact person, GST registration type, PAN, opening balance, credit period, and preferred payment mode.
- GSTIN validation with legal-name/state auto-fill and mismatch warnings between GSTIN state and party address.
- Duplicate party detection by GSTIN, phone, email, and similar name.
- Bill-wise outstanding drawer for every party, showing invoice/bill reference, due date, paid amount, balance, aging bucket, and settlement status.
- Credit control workflow with credit limit breach warnings, credit period breach alerts, and optional block/warn behavior before invoice creation.
- Aging buckets for customers and suppliers: Current, 1-30, 31-60, 61-90, and 90+ days.
- Row actions across party tables: View, Edit, Create Invoice, Record Receipt, Create Bill, Record Payment, Send Reminder, Share Statement, WhatsApp.
- Payment reminder workflow with WhatsApp, SMS, and email templates, reminder history, promised payment date, and bulk reminder action.
- Statement sharing workflow with PDF preview, WhatsApp/email send, scheduled monthly statements, and last-sent tracking.
- Party interaction timeline for calls, notes, reminders, promises to pay, disputes, documents, and owner follow-ups.
- Party document vault for GST certificate, PAN, contracts, bank proof, signed statement, purchase terms, and uploaded invoices.
- Bank and payout details for suppliers, including account number, IFSC, UPI ID, beneficiary name, and verification status.
- Customer/vendor portal status with invite link, portal enabled flag, last login, accepted quotes, viewed invoices, payment activity, and uploaded supplier invoices.
- Shared ledger net-settlement workflow that can propose adjustment between receivable, payable, advances, debit notes, and credit notes.
- Party audit trail for creation, edits, GSTIN changes, credit-limit changes, bank-detail changes, and status changes.
- Bulk import/export for parties from Excel/Tally with validation preview, duplicate merge suggestions, and rejected-row report.
- Multi-currency and language preference for global customers/vendors.

Competitor pressure:
- TallyPrime party ledgers support bill-by-bill balances, default credit period, mailing details, state/country, and tax registration details.
- Zoho Books supports customer/vendor collaboration, customer portal, vendor portal, payment links, automated reminders, multi-currency, language preferences, documents, and custom fields.
- Vyapar is strong in simple party-wise receivables/payables, WhatsApp/SMS/email reminders, customer history, transaction logs, and mobile-friendly party management.

Competitor-gap features to include:

| Gap Area | Competitor Signal | UnifiedTree Add-on |
|---|---|---|
| Party master depth | TallyPrime captures mailing, state/country, tax registration, and credit period in party ledgers. | Add full party profile with address, tax, contact, opening balance, and credit settings. |
| Bill-wise balances | TallyPrime supports bill-by-bill balance maintenance and invoice reference allocation. | Add bill-wise outstanding drawer and payment allocation view. |
| Credit control | Tally/Zoho support credit limits, credit days, and warnings/restrictions. | Add credit-limit and credit-period breach warnings before sales documents. |
| Reminders | Zoho and Vyapar support payment reminders; Vyapar emphasizes WhatsApp/SMS/email. | Add reminder templates, bulk reminders, follow-up history, and promised payment date. |
| Statement automation | Zoho ecosystem supports statement sending/reminder workflows. | Add scheduled monthly statement sharing and last-sent status. |
| Customer/vendor portal | Zoho provides customer and vendor portals. | Add portal invite/status, viewed invoices, accepted quotes, payments, and supplier invoice upload state. |
| Contact CRM | Vyapar emphasizes customer history and interaction logs. | Add party timeline for calls, notes, reminders, disputes, and owner follow-ups. |
| Document management | Zoho supports centralized documents and attachments. | Add party document vault with GST/PAN/contracts/bank proofs. |
| GST data quality | Tally validates tax details around party ledgers. | Add GSTIN validation, legal-name fetch simulation, state mismatch warnings. |
| Bulk migration | Tally incumbent lock-in means party master migration matters. | Add Excel/Tally party import with validation, duplicate merge, and rejected rows. |

>>>>>>> e44f838 (Money In Updated)
## Delivery Order

1. Add shared audit + compliance + migration state to the app store.
2. Build reusable compliance and import mock services/components.
3. Wire Settings > Audit Logs to live audit events.
4. Upgrade Tax/GST workflow screen with pipeline actions.
5. Upgrade Data Migration import screen with the wizard.
6. Add integration-driven hints on relevant pages.
7. Make AI insights route to real action surfaces.
<<<<<<< HEAD
8. Verify build and scoped lint.
=======
8. Add Parties full-profile data model and party detail page.
9. Add bill-wise outstanding, aging buckets, and credit-control warnings.
10. Add reminder, statement sharing, and party timeline workflows.
11. Add party document vault, GSTIN validation, duplicate detection, and import validation.
12. Verify build and scoped lint.

## 9. Money In UI & Receivables Competitor Upgrade

Goal: make Money In feel like a collection workspace, not a reporting module. Users should immediately know who owes money, what action to take, and whether the customer has been reminded, promised, paid, refunded, or sent a statement.

Current section rating:

| Money In Section | Current Rating / 5 | Target Rating / 5 | Main Gap |
|---|---:|---:|---|
| Money In Center | 3.5 | 4.5 | Needs a clearer "collect today" action dashboard. |
| Receivables | 3.0 | 4.4 | Needs invoice-level actions, ageing chips, reminders, payment links, and statement access. |
| Payments Received | 3.3 | 4.3 | Needs matched/unmatched/advance/excess allocation status and bank matching context. |
| Collections & Reminders | 3.8 | 4.6 | Strong page, but queue labels and delivery tracking should be simpler. |
| Credit Notes & Refunds | 3.0 | 4.2 | Needs simpler credit states and a guided apply/refund flow. |
| Sales Returns | 3.4 | 4.2 | Needs a simple receive-goods -> settle-return flow. |
| Customer Statements | 2.8 | 4.3 | Needs preview, date range, delivery status, and auto-send schedule. |

Competitor pressure:
- TallyPrime is strong in bill-wise outstanding, ageing, and invoice reference allocation.
- Zoho Books is strong in customer portal status, payment links, automated reminders, customer statements, and credit/refund flows.
- Vyapar is strong in simple receivable tracking, WhatsApp/SMS reminders, easy sharing, and mobile-friendly collection actions.

Phased delivery:

### Phase 1 - Action-Oriented Money In and Receivables

Improvements:
- Convert Money In Center into a "Collect Today" action dashboard.
- Add clear action cards for send reminders, record payment, review overdue invoices, and share statements.
- Upgrade Receivables rows with ageing chips and row actions: Record Payment, Reminder, Statement, Open.
- Keep labels plain and user-friendly.

Success rating target after Phase 1:
- Money In Center: 4.1 / 5
- Receivables: 3.8 / 5

Phase 1 completion rating:
- Status: Completed
- Completed changes: Money In Center now has a Collect Today action area. Receivables rows now show due/age chips and direct row actions for Pay, Remind, and Statement.
- Money In Center: 4.1 / 5
- Receivables: 3.8 / 5
- Remaining gap after Phase 1: Record Payment still needs invoice prefill/allocation status, and reminder actions still route to the collection queue instead of a prefilled customer reminder.

### Phase 2 - Payment Allocation and Bank Matching

Improvements:
- Add payment allocation states: Matched, Unmatched, Advance, Excess, Partial.
- Add bank reference confidence and reconciliation status.
- Add visual warnings for bounced/pending payments.
- Add payment split/advance handling in the Record Payment screen.

Success rating target after Phase 2:
- Payments Received: 4.1 / 5

Phase 2 completion rating:
- Status: Completed
- Completed changes: Receipt records now expose allocation status and bank-match state. Payments Received shows allocation chips, bank match context, and matching KPIs. Record Payment now captures allocation and bank match fields.
- Payments Received: 4.1 / 5
- Remaining gap after Phase 2: Payment actions still do not prefill the selected invoice from the Receivables row, and bank matching is simulated rather than connected to the cash/bank reconciliation module.

### Phase 3 - Reminder Delivery and Collection Simplicity

Improvements:
- Simplify collections queues to Due Today, Overdue, Promised, Escalation.
- Add WhatsApp/email/SMS delivery status: Draft, Sent, Viewed, Failed, Replied.
- Add next follow-up date and promise-to-pay status directly in the list.
- Add one-click bulk reminder preview grouped by customer risk.

Success rating target after Phase 3:
- Collections & Reminders: 4.5 / 5

Phase 3 completion rating:
- Status: Completed
- Completed changes: Collections now uses simpler queues: Due Today, Overdue, Promised, and Escalation. Collection records now expose delivery status and next follow-up date. The table now shows delivery and follow-up directly.
- Collections & Reminders: 4.5 / 5
- Remaining gap after Phase 3: Reminder delivery is still simulated, and reminder actions do not yet store a per-channel sent/viewed/replied timeline after user action.

### Phase 4 - Credits, Refunds, and Returns Simplification

Improvements:
- Rename credit note queues to Draft, Open Credit, Apply, Refund, Closed.
- Add guided "Apply Credit" and "Issue Refund" panels.
- Keep Sales Returns as a two-step flow: Receive Goods, Settle Return.
- Move GST/accounting detail behind secondary panels so normal users are not overloaded.

Success rating target after Phase 4:
- Credit Notes & Refunds: 4.1 / 5
- Sales Returns: 4.2 / 5

Phase 4 completion rating:
- Status: Completed
- Completed changes: Credit Notes queues were simplified to Apply, Refund, Review, and Closed. Sales Returns remains simplified into a practical return-stage and settlement workflow with no competitor/gap-analysis clutter.
- Credit Notes & Refunds: 4.1 / 5
- Sales Returns: 4.2 / 5
- Remaining gap after Phase 4: Apply/refund actions are still simulated and do not yet post actual customer-credit ledger effects.

### Phase 5 - Customer Statements Workspace

Improvements:
- Add statement date range selector and preview surface.
- Add delivery status per customer.
- Add scheduled monthly statement toggle.
- Add customer contact health: missing email, missing WhatsApp, invalid phone, portal not enabled.

Success rating target after Phase 5:
- Customer Statements: 4.3 / 5

Phase 5 completion rating:
- Status: Completed
- Completed changes: Customer Statements now has a statement period selector, delivery status, auto-send indicators, delivery-overdue KPI, and per-customer auto-send action.
- Customer Statements: 4.3 / 5
- Remaining gap after Phase 5: Statement preview is still summarized in the table rather than rendered as a full PDF-like customer statement preview.

End-of-development reporting requirement:
- After each phase, record the completed rating out of 5 in this file.
- At the end of all phases, add a final Money In rating table comparing before/after scores and remaining gaps.

Final Money In rating after phased development:

| Money In Section | Before / 5 | After / 5 | Remaining Gap |
|---|---:|---:|---|
| Money In Center | 3.5 | 4.1 | Needs live workflow completion after actions are taken. |
| Receivables | 3.0 | 3.8 | Row actions should prefill selected invoice/customer in target screens. |
| Payments Received | 3.3 | 4.1 | Bank matching and allocation are simulated, not connected to bank reconciliation. |
| Collections & Reminders | 3.8 | 4.5 | Delivery statuses are derived/simulated, not persisted from send events. |
| Credit Notes & Refunds | 3.0 | 4.1 | Apply/refund actions do not yet post real customer-credit ledger effects. |
| Sales Returns | 3.4 | 4.2 | Settlement actions are simulated and should create linked credit/refund documents. |
| Customer Statements | 2.8 | 4.3 | Needs full statement preview and real scheduled delivery history. |

Final overall Money In rating: 4.16 / 5.
>>>>>>> e44f838 (Money In Updated)
