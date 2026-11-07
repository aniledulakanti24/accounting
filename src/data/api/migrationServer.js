/**
 * Switching in, and getting help (mock backend).
 *
 *  - Tally XML import: ledgers (with their Tally group), opening balances and vouchers.
 *    Tally signs amounts with negative = debit. Every import can be previewed (dry run) first.
 *  - Zoho Books / QuickBooks invoice CSV import.
 *  - Accountant invites, a certified-partner directory, support tickets with response targets, help search.
 */
import { round2 } from '../../lib/fx.js'
import { postJournal, seedLedger, ensureLedger } from './ledgerServer.js'
import { ensureBooks, createInvoice } from './booksServer.js'
import { parseDate } from './bankRulesServer.js'

class MigrationError extends Error { constructor(m, d) { super(m); this.status = 422; this.details = d } }
const fail = (m, d) => { throw new MigrationError(m, d) }
const today = () => new Date().toISOString().slice(0, 10)

/* ── Tally XML ── */
const decode = s => String(s ?? '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").trim()
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i')); return m ? decode(m[1]) : null }
const blocks = (xml, name) => [...xml.matchAll(new RegExp(`<${name}\\b([^>]*)>([\\s\\S]*?)</${name}>`, 'gi'))].map(m => ({ attrs: m[1], body: m[2] }))
const attr = (attrs, name) => { const m = attrs.match(new RegExp(`${name}="([^"]*)"`, 'i')); return m ? decode(m[1]) : null }

// Tally's primary groups → our chart (party groups become customers/suppliers)
const GROUP_MAP = [
  [/sundry debtors/i, { party: 'customer', account: 'Accounts Receivable' }],
  [/sundry creditors/i, { party: 'supplier', account: 'Accounts Payable' }],
  [/bank (accounts|od)/i, { account: 'Bank' }],
  [/cash-in-hand/i, { account: 'Cash' }],
  [/sales accounts/i, { account: 'Sales' }],
  [/purchase accounts/i, { account: 'Purchases' }],
  [/stock-in-hand/i, { account: 'Inventory' }],
  [/capital account|reserves/i, { account: "Owner's Equity" }],
  [/(direct|indirect) expenses/i, { account: 'Operating Expenses' }],
  [/(direct|indirect) incomes/i, { account: 'Sales' }],
]
function mapLedger(name, group) {
  if (/duties & taxes/i.test(group || '')) return { account: /input/i.test(name) ? 'Input Tax Recoverable' : /tds/i.test(name) ? 'Withholding Tax Payable' : 'Output Tax Payable' }
  for (const [re, m] of GROUP_MAP) if (re.test(group || '')) return m
  return null
}

export function parseTallyXml(xml) {
  if (!/<ENVELOPE/i.test(xml || '')) fail('This does not look like a Tally XML export (no <ENVELOPE>). In Tally: Gateway → Export → Masters/Vouchers → XML.')
  const ledgers = blocks(xml, 'LEDGER').map(b => {
    const name = attr(b.attrs, 'NAME') || tag(b.body, 'NAME')
    const group = tag(b.body, 'PARENT')
    const opening = Number(tag(b.body, 'OPENINGBALANCE') || 0)
    return { name, group, opening, gstin: tag(b.body, 'PARTYGSTIN') || tag(b.body, 'GSTIN'), state: tag(b.body, 'LEDSTATENAME'), mapped: mapLedger(name, group) }
  })
  const vouchers = blocks(xml, 'VOUCHER').map(b => {
    const raw = tag(b.body, 'DATE') || ''
    const date = /^\d{8}$/.test(raw) ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : parseDate(raw)
    const entries = [...blocks(b.body, 'ALLLEDGERENTRIES.LIST'), ...blocks(b.body, 'LEDGERENTRIES.LIST')]
      .map(e => ({ ledger: tag(e.body, 'LEDGERNAME'), amount: Number(tag(e.body, 'AMOUNT') || 0) }))
    return { type: attr(b.attrs, 'VCHTYPE') || tag(b.body, 'VOUCHERTYPENAME'), number: tag(b.body, 'VOUCHERNUMBER'), date, narration: tag(b.body, 'NARRATION') || '', entries }
  })
  return { ledgers, vouchers }
}

/** Preview or run a Tally import. Nothing is written when dryRun is true. */
export function importTally(ctx, xml, { dryRun = true } = {}) {
  const { db, company } = ctx
  const books = ensureBooks(db, company)
  seedLedger(db)
  const { ledgers, vouchers } = parseTallyXml(xml)
  const byName = Object.fromEntries(ledgers.map(l => [l.name, l]))
  const issues = []
  const unmapped = ledgers.filter(l => !l.mapped)
  unmapped.forEach(l => issues.push({ level: 'warn', message: `Ledger "${l.name}" (group ${l.group || 'none'}) has no match — it will be posted to Operating Expenses` }))
  const accountFor = name => byName[name]?.mapped?.account ?? 'Operating Expenses'
  // Opening balances: Tally negative = debit
  const openLines = ledgers.filter(l => l.opening).map(l => (l.opening < 0 ? { account: accountFor(l.name), debit: round2(-l.opening) } : { account: accountFor(l.name), credit: round2(l.opening) }))
  const dr = round2(openLines.reduce((s, l) => s + (l.debit || 0), 0)); const cr = round2(openLines.reduce((s, l) => s + (l.credit || 0), 0))
  if (dr !== cr) {
    issues.push({ level: 'info', message: `Opening balances differ by ${round2(Math.abs(dr - cr))} — the difference goes to Owner's Equity, as Tally's "Difference in opening balances"` })
    openLines.push(dr > cr ? { account: "Owner's Equity", credit: round2(dr - cr) } : { account: "Owner's Equity", debit: round2(cr - dr) })
  }
  const journals = vouchers.map((v, i) => {
    if (!v.date) { issues.push({ level: 'error', message: `Voucher ${v.number || i + 1}: date not recognised — skipped` }); return null }
    const lines = v.entries.filter(e => e.amount).map(e => (e.amount < 0 ? { account: accountFor(e.ledger), debit: round2(-e.amount) } : { account: accountFor(e.ledger), credit: round2(e.amount) }))
    const d = round2(lines.reduce((s, l) => s + (l.debit || 0), 0)); const c = round2(lines.reduce((s, l) => s + (l.credit || 0), 0))
    if (d !== c || lines.length < 2) { issues.push({ level: 'error', message: `Voucher ${v.number || i + 1} does not balance (Dr ${d} / Cr ${c}) — skipped` }); return null }
    return { date: v.date, memo: `Tally ${v.type} ${v.number ?? ''} ${v.narration}`.trim(), lines, reference: `TALLY-${v.type}-${v.number ?? i + 1}` }
  }).filter(Boolean)
  const lockedThrough = ensureLedger(db).lockedThrough
  const blocked = lockedThrough ? journals.filter(j => j.date <= lockedThrough) : []
  if (blocked.length) issues.push({ level: 'error', message: `${blocked.length} voucher(s) fall in the closed period (through ${lockedThrough}) and will be skipped` })
  const partiesNew = ledgers.filter(l => l.mapped?.party && !books.parties.some(p => p.name === l.name))
  const preview = { ledgers: ledgers.length, parties: partiesNew.length, openingLines: openLines.length, vouchers: journals.length - blocked.length, issues, mapping: ledgers.map(l => ({ name: l.name, group: l.group, to: l.mapped?.party ? `${l.mapped.party} → ${l.mapped.account}` : l.mapped?.account ?? 'Operating Expenses (unmatched)' })) }
  if (dryRun) return { dryRun: true, ...preview }
  for (const l of partiesNew) books.parties.push({ id: `PTY-T${books.parties.length + 1}`, name: l.name, type: l.mapped.party, gstin: l.gstin || null, state: l.gstin ? l.gstin.slice(0, 2) : null, terms: 30, creditLimit: 0 })
  const posted = []
  if (openLines.length >= 2) posted.push(postJournal(db, { date: journals[0]?.date ? journals.map(j => j.date).sort()[0] : today(), memo: 'Opening balances imported from Tally', source: 'migration', lines: openLines }).id)
  for (const j of journals.filter(x => !blocked.includes(x))) posted.push(postJournal(db, { ...j, source: 'migration' }).id)
  logImport(db, { source: 'Tally XML', created: `${partiesNew.length} parties, ${posted.length} journals` })
  return { dryRun: false, ...preview, posted }
}

/* ── Zoho Books / QuickBooks invoice CSV ── */
export function importInvoiceCsv(ctx, csv, { dryRun = true, source = 'Zoho Books' } = {}) {
  const books = ensureBooks(ctx.db, ctx.company)
  const lines = String(csv || '').split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) fail('The file needs a header row and at least one invoice line')
  const head = lines[0].split(',').map(h => h.trim().toLowerCase())
  const col = (...n) => head.findIndex(h => n.some(x => h.includes(x)))
  const c = { no: col('invoice number', 'invoice no', 'invoice#', 'num'), date: col('invoice date', 'date'), cust: col('customer'), item: col('item', 'product', 'description'), qty: col('quantity', 'qty'), rate: col('price', 'rate'), tax: col('tax') }
  if ([c.no, c.date, c.cust, c.qty, c.rate].some(i => i < 0)) fail('Columns needed: Invoice Number, Invoice Date, Customer Name, Quantity, Item Price (Tax % optional)')
  const groups = {}
  const issues = []
  lines.slice(1).forEach((l, n) => {
    const v = l.split(',').map(x => x.trim())
    const date = parseDate(v[c.date])
    if (!date) { issues.push({ level: 'error', message: `Line ${n + 2}: date not recognised` }); return }
    const g = groups[v[c.no]] ??= { number: v[c.no], date, customer: v[c.cust], lines: [] }
    g.lines.push({ description: v[c.item] || 'Imported item', qty: Number(v[c.qty]) || 1, rate: Number(v[c.rate]) || 0, taxRate: c.tax >= 0 ? Number(String(v[c.tax]).replace('%', '')) || 0 : 0 })
  })
  const invoices = Object.values(groups)
  const newCustomers = [...new Set(invoices.map(i => i.customer))].filter(n => !books.parties.some(p => p.name === n))
  const preview = { invoices: invoices.length, newCustomers: newCustomers.length, total: round2(invoices.reduce((s, i) => s + i.lines.reduce((t, l) => t + l.qty * l.rate * (1 + l.taxRate / 100), 0), 0)), issues }
  if (dryRun) return { dryRun: true, ...preview }
  newCustomers.forEach(name => books.parties.push({ id: `PTY-Z${books.parties.length + 1}`, name, type: 'customer', gstin: null, state: null, terms: 30, creditLimit: 0 }))
  const created = invoices.map(i => createInvoice(ctx, { partyId: books.parties.find(p => p.name === i.customer).id, date: i.date, lines: i.lines, overrideCreditLimit: true }).number)
  logImport(ctx.db, { source: `${source} CSV`, created: `${newCustomers.length} customers, ${created.length} invoices` })
  return { dryRun: false, ...preview, created }
}

function logImport(db, entry) {
  db.imports ??= []
  db.imports.unshift({ id: `IMP-${db.imports.length + 1}`, at: new Date().toISOString(), ...entry })
}

/* ── Accountants, partners, support, help ── */
export const PARTNERS = [
  { name: 'Mehta & Rao Chartered Accountants', city: 'Mumbai', country: 'IN', certified: 'Gold', languages: ['English', 'Hindi', 'Marathi'], focus: ['GST', 'Audit', 'Tally migration'], rating: 4.9, clients: 140 },
  { name: 'Kulkarni Tax Advisors', city: 'Pune', country: 'IN', certified: 'Silver', languages: ['English', 'Marathi'], focus: ['GST returns', 'TDS'], rating: 4.7, clients: 85 },
  { name: 'Bengaluru Ledger Partners', city: 'Bengaluru', country: 'IN', certified: 'Gold', languages: ['English', 'Kannada', 'Tamil'], focus: ['Startups', 'Payroll', 'E-invoicing'], rating: 4.8, clients: 210 },
  { name: 'Capital Books LLP', city: 'New Delhi', country: 'IN', certified: 'Silver', languages: ['English', 'Hindi', 'Punjabi'], focus: ['Exports', 'Multi-currency'], rating: 4.6, clients: 95 },
  { name: 'Thames Bookkeeping Co.', city: 'London', country: 'GB', certified: 'Gold', languages: ['English'], focus: ['MTD VAT', 'Payroll'], rating: 4.8, clients: 160 },
  { name: 'Gulf Compliance Partners', city: 'Dubai', country: 'AE', certified: 'Gold', languages: ['English', 'Arabic'], focus: ['UAE VAT', 'Corporate tax'], rating: 4.7, clients: 120 },
  { name: 'Lion City Accounting', city: 'Singapore', country: 'SG', certified: 'Silver', languages: ['English', 'Mandarin'], focus: ['GST (SG)', 'Xero migration'], rating: 4.6, clients: 70 },
  { name: 'Hudson Small Business CPAs', city: 'New York', country: 'US', certified: 'Gold', languages: ['English', 'Spanish'], focus: ['Sales tax', '1099s', 'QuickBooks migration'], rating: 4.8, clients: 230 },
]
const SLA_HOURS = { urgent: 1, high: 4, normal: 24, low: 72 }

export const HELP = [
  ['Switch from Tally in an afternoon', 'Export masters and vouchers as XML from Tally (Gateway → Export), upload it in Data Migration → Import from Tally, check the preview, then import.', 'migration'],
  ['Raise your first GST invoice', 'Go to Sales → Invoice Desk, choose the customer and items. Tax splits into CGST+SGST or IGST from the customer state automatically.', 'sales'],
  ['File GSTR-1 and GSTR-3B', 'Tax → GST from Books builds both returns from your invoices and bills. Download the GSTR-1 JSON and upload it on the GST portal.', 'tax'],
  ['Why is some input credit held back?', 'Credit is only eligible when your supplier reported the invoice in GSTR-2B. Check Tax → GST from Books → GSTR-2B match.', 'tax'],
  ['Generate an e-invoice (IRN)', 'Open GST from Books → e-Invoice & e-Way and press Generate on a B2B invoice. An IRN can be cancelled within 24 hours.', 'tax'],
  ['Reconcile the bank in minutes', 'Upload a CSV statement in Cash & Bank → Rules & Reconciliation, apply rules, then match the rest to invoices and bills.', 'cashbank'],
  ['Turn on two-factor sign-in', 'Settings → Backup & Security → Set up two-factor sign-in, scan the QR code with your authenticator app and enter the code.', 'security'],
  ['Restore a backup', 'Only a Super Admin can restore. A safety copy of the current data is taken first, so a restore can be undone.', 'security'],
  ['Give your accountant access', 'Team & Tools → Accountants & Support → invite them; they get the CA / Auditor role, which can view everything and file returns.', 'team'],
  ['Approve large supplier bills', 'Bills over the approval limit wait in Purchases → Bill Approvals for a second person.', 'procurement'],
  ['Value stock with FIFO or average cost', 'Each item has its own costing method; see Items → Stock Valuation for value, batches and expiry.', 'inventory'],
  ['Connect Shopify, Razorpay or your CRM', 'Settings → App marketplace → Connect, allow the permissions, then Sync now.', 'apps'],
].map(([title, body, area], i) => ({ id: `KB-${100 + i}`, title, body, area }))

export function registerMigrationRoutes(route, { ok, badRequest, notFound }) {
  const g = h => ctx => { try { return h(ctx) } catch (e) { if (e instanceof MigrationError || e.status === 422) badRequest(e.message, e.details); throw e } }
  route('POST', '/migration/tally', g(ctx => {
    const r = importTally(ctx, ctx.body?.xml, { dryRun: ctx.body?.dryRun !== false })
    if (!r.dryRun) ctx.save()
    return ok({ ...r, ...(r.dryRun ? {} : { auditSummary: `Imported from Tally: ${r.parties} parties, ${r.posted.length} journals` }) }, r.dryRun ? 200 : 201)
  }), { summary: 'Preview (default) or import a Tally XML export' })
  route('POST', '/migration/invoices-csv', g(ctx => {
    const r = importInvoiceCsv(ctx, ctx.body?.csv, { dryRun: ctx.body?.dryRun !== false, source: ctx.body?.source || 'Zoho Books' })
    if (!r.dryRun) ctx.save()
    return ok({ ...r, ...(r.dryRun ? {} : { auditSummary: `Imported ${r.created.length} invoices from CSV` }) }, r.dryRun ? 200 : 201)
  }), { summary: 'Preview (default) or import invoices from a Zoho Books / QuickBooks CSV' })
  route('GET', '/migration/history', ({ db }) => ok(db.imports ?? []), { summary: 'Import history' })

  route('GET', '/accountants', ({ db }) => ok(db.accountants ?? []), { summary: 'Accountants invited to this company' })
  route('POST', '/accountants', ({ db, body, user, save }) => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body?.email || '')) badRequest('Enter a valid email address')
    db.accountants ??= []
    if (db.accountants.some(a => a.email === body.email && a.status !== 'revoked')) badRequest('This accountant already has access or a pending invite')
    const a = { id: `ACC-${db.accountants.length + 1}`, name: body.name || body.email.split('@')[0], email: body.email, firm: body.firm || '', role: 'CA / Auditor', status: 'invited',
      invitedBy: user?.name, invitedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), link: `https://app.unifiedtree.example/join/${Math.random().toString(36).slice(2, 12)}` }
    db.accountants.push(a); save()
    return ok({ ...a, auditSummary: `Invited accountant ${a.email} (CA / Auditor)` }, 201)
  }, { summary: 'Invite an accountant (CA / Auditor role, link valid 7 days)' })
  route('DELETE', '/accountants/:id', ({ db, params, save }) => {
    const a = (db.accountants ?? []).find(x => x.id === params.id) || notFound('Accountant')
    a.status = 'revoked'; save()
    return ok({ ...a, auditSummary: `Revoked access for ${a.email}` })
  }, { summary: 'Revoke an accountant’s access' })

  route('GET', '/partners', ({ query, company }) => {
    const q = String(query.q || '').toLowerCase()
    const list = PARTNERS.filter(p => !q || [p.name, p.city, ...p.focus, ...p.languages].some(x => x.toLowerCase().includes(q)))
    return ok(list.sort((a, b) => (b.country === company.country) - (a.country === company.country) || b.rating - a.rating))
  }, { summary: 'Certified partner directory (your country first)' })

  route('GET', '/support/tickets', ({ db }) => ok(db.tickets ?? []), { summary: 'Your support tickets' })
  route('POST', '/support/tickets', ({ db, body, user, save }) => {
    if (!body?.subject?.trim() || !body?.message?.trim()) badRequest('Add a subject and describe the problem')
    const priority = SLA_HOURS[body.priority] ? body.priority : 'normal'
    db.tickets ??= []
    const t = { id: `TKT-${String(1000 + db.tickets.length + 1)}`, subject: body.subject.trim(), message: body.message.trim(), priority, status: 'open', openedBy: user?.name, openedAt: new Date().toISOString(),
      respondBy: new Date(Date.now() + SLA_HOURS[priority] * 3600000).toISOString(),
      replies: [{ from: 'UnifiedTree Support', at: new Date().toISOString(), text: `Thanks — ticket received. A specialist will reply within ${SLA_HOURS[priority]} hour(s).` }],
      suggested: HELP.filter(h => body.subject.toLowerCase().split(/\W+/).some(w => w.length > 3 && (h.title + h.body).toLowerCase().includes(w))).slice(0, 2).map(h => h.id) }
    db.tickets.unshift(t); save()
    return ok({ ...t, auditSummary: `Support ticket ${t.id} opened (${priority})` }, 201)
  }, { summary: 'Open a support ticket (response target by priority)' })

  route('GET', '/help/articles', ({ query }) => {
    const words = String(query.q || '').toLowerCase().split(/\W+/).filter(w => w.length > 1)
    const scored = HELP.map(h => ({ ...h, score: words.reduce((s, w) => s + (h.title.toLowerCase().includes(w) ? 3 : 0) + (h.body.toLowerCase().includes(w) ? 1 : 0), 0) }))
    return ok((words.length ? scored.filter(h => h.score > 0).sort((a, b) => b.score - a.score) : scored).slice(0, 8))
  }, { summary: 'Search help articles' })
}

export const SAMPLE_TALLY_XML = `<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC><REQUESTDATA>
<TALLYMESSAGE><LEDGER NAME="HDFC Bank Current"><PARENT>Bank Accounts</PARENT><OPENINGBALANCE>-850000</OPENINGBALANCE></LEDGER></TALLYMESSAGE>
<TALLYMESSAGE><LEDGER NAME="Proprietor Capital"><PARENT>Capital Account</PARENT><OPENINGBALANCE>1000000</OPENINGBALANCE></LEDGER></TALLYMESSAGE>
<TALLYMESSAGE><LEDGER NAME="Sharma Traders"><PARENT>Sundry Debtors</PARENT><PARTYGSTIN>27AAPFS1234Q1Z5</PARTYGSTIN><OPENINGBALANCE>-150000</OPENINGBALANCE></LEDGER></TALLYMESSAGE>
<TALLYMESSAGE><LEDGER NAME="Gupta Suppliers"><PARENT>Sundry Creditors</PARENT><OPENINGBALANCE>0</OPENINGBALANCE></LEDGER></TALLYMESSAGE>
<TALLYMESSAGE><LEDGER NAME="Sales @18%"><PARENT>Sales Accounts</PARENT></LEDGER></TALLYMESSAGE>
<TALLYMESSAGE><LEDGER NAME="Output CGST"><PARENT>Duties &amp; Taxes</PARENT></LEDGER></TALLYMESSAGE>
<TALLYMESSAGE><LEDGER NAME="Output SGST"><PARENT>Duties &amp; Taxes</PARENT></LEDGER></TALLYMESSAGE>
<TALLYMESSAGE><LEDGER NAME="Office Rent"><PARENT>Indirect Expenses</PARENT></LEDGER></TALLYMESSAGE>
<TALLYMESSAGE><VOUCHER VCHTYPE="Sales"><DATE>20261020</DATE><VOUCHERNUMBER>S-101</VOUCHERNUMBER><NARRATION>Goods sold</NARRATION>
<ALLLEDGERENTRIES.LIST><LEDGERNAME>Sharma Traders</LEDGERNAME><AMOUNT>-59000</AMOUNT></ALLLEDGERENTRIES.LIST>
<ALLLEDGERENTRIES.LIST><LEDGERNAME>Sales @18%</LEDGERNAME><AMOUNT>50000</AMOUNT></ALLLEDGERENTRIES.LIST>
<ALLLEDGERENTRIES.LIST><LEDGERNAME>Output CGST</LEDGERNAME><AMOUNT>4500</AMOUNT></ALLLEDGERENTRIES.LIST>
<ALLLEDGERENTRIES.LIST><LEDGERNAME>Output SGST</LEDGERNAME><AMOUNT>4500</AMOUNT></ALLLEDGERENTRIES.LIST></VOUCHER></TALLYMESSAGE>
<TALLYMESSAGE><VOUCHER VCHTYPE="Payment"><DATE>20261025</DATE><VOUCHERNUMBER>P-17</VOUCHERNUMBER><NARRATION>Rent for October</NARRATION>
<ALLLEDGERENTRIES.LIST><LEDGERNAME>Office Rent</LEDGERNAME><AMOUNT>-45000</AMOUNT></ALLLEDGERENTRIES.LIST>
<ALLLEDGERENTRIES.LIST><LEDGERNAME>HDFC Bank Current</LEDGERNAME><AMOUNT>45000</AMOUNT></ALLLEDGERENTRIES.LIST></VOUCHER></TALLYMESSAGE>
</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`
