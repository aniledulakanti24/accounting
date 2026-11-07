/**
 * Books engine for the mock backend — the documents a business works with every day,
 * each one posting real double-entry journals to the ledger:
 *
 *  - Sales invoices   Dr Receivables · Cr Sales · Cr Output tax  (+ Dr COGS · Cr Inventory at FIFO/average cost)
 *  - Supplier bills   Dr Inventory/Purchases · Dr Input tax · Cr Payables (maker-checker above a limit)
 *  - Receipts/payments allocated oldest-first against open documents
 *  - Credit notes, recurring invoices, credit limits, stock batches with expiry, bills of materials
 *  - Statements (P&L, balance sheet, cash flow) and ageing are built from the ledger, never typed in
 */
import { round2 } from '../../lib/fx.js'
import { postJournal, seedLedger, ensureLedger, CHART } from './ledgerServer.js'

const iso = d => d.toISOString().slice(0, 10)
const addDays = (date, n) => { const d = new Date(`${date}T00:00:00`); d.setDate(d.getDate() + n); return iso(d) }
const daysBetween = (a, b) => Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 86400000)
const today = () => iso(new Date())

class BooksError extends Error {
  constructor(message, details) { super(message); this.status = 422; this.details = details }
}
const fail = (message, details) => { throw new BooksError(message, details) }

/* ── Tax: India splits GST into CGST+SGST (same state) or IGST (other state); elsewhere one VAT/GST line ── */
export function homeStateOf(company) {
  const id = company?.taxId || company?.gstin || ''
  return /^\d{2}/.test(id) ? id.slice(0, 2) : null
}

export function taxLine({ taxable, rate, country, homeState, partyState }) {
  const tax = round2(taxable * rate / 100)
  if (country !== 'IN') return { taxable, rate, tax, cgst: 0, sgst: 0, igst: 0, vat: tax }
  const intra = !partyState || partyState === homeState
  const half = round2(tax / 2)
  return intra
    ? { taxable, rate, tax: round2(half * 2), cgst: half, sgst: half, igst: 0, vat: 0 }
    : { taxable, rate, tax, cgst: 0, sgst: 0, igst: tax, vat: 0 }
}

/* ── Stock: FIFO (earliest expiry first when batches expire) or weighted average ── */
export function stockOf(item) {
  const qty = round2((item.layers ?? []).reduce((s, l) => s + l.qty, 0))
  const value = round2((item.layers ?? []).reduce((s, l) => s + l.qty * l.unitCost, 0))
  return { qty, value, avgCost: qty > 0 ? round2(value / qty) : 0 }
}

export function consumeStock(item, qty) {
  const { qty: onHand, value } = stockOf(item)
  if (qty > onHand + 1e-9) fail(`Not enough stock of ${item.name}: ${onHand} ${item.unit} on hand, ${qty} needed`, { itemId: item.id, onHand, needed: qty })
  if (item.costMethod === 'WAVG') {
    const avg = onHand > 0 ? value / onHand : 0
    const ratio = (onHand - qty) / onHand
    item.layers = item.layers.map(l => ({ ...l, qty: round2(l.qty * ratio) })).filter(l => l.qty > 0)
    return round2(avg * qty)
  }
  // FIFO — expiring batches go first, then oldest receipts
  const order = [...item.layers].sort((a, b) => (a.expiry || '9999').localeCompare(b.expiry || '9999') || a.date.localeCompare(b.date))
  let left = qty
  let cost = 0
  for (const layer of order) {
    if (left <= 0) break
    const take = Math.min(layer.qty, left)
    cost += take * layer.unitCost
    layer.qty = round2(layer.qty - take)
    left = round2(left - take)
  }
  item.layers = item.layers.filter(l => l.qty > 0)
  return round2(cost)
}

const stockAccount = item => (item.kind === 'finished' ? 'Finished Goods' : 'Inventory')

/* ── Store and demo seed ── */
export function ensureBooks(db, company) {
  db.books ??= {
    seq: {}, parties: [], items: [], invoices: [], bills: [], payments: [], creditNotes: [], recurring: [], boms: [],
    settings: { billApprovalLimit: 500000, invoicePrefix: 'UT' },
  }
  if (!db.books.seeded) seedBooks(db, company)
  return db.books
}

function nextId(books, kind, prefix, width = 4) {
  books.seq[kind] = (books.seq[kind] ?? 0) + 1
  return `${prefix}-${String(books.seq[kind]).padStart(width, '0')}`
}

function fyCode(date, country) {
  const d = new Date(`${date}T00:00:00`)
  if (country !== 'IN') return String(d.getFullYear())
  const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`
}

function seedBooks(db, company) {
  const books = db.books
  books.seeded = true
  seedLedger(db)
  const country = company?.country || 'IN'
  const home = homeStateOf(company) || '27'
  const inIndia = country === 'IN'
  const parties = [
    { name: 'Infosys BPO Ltd', type: 'customer', state: home, gstin: inIndia ? `${home}AAACI4798L1ZB` : null, terms: 30, creditLimit: 5000000 },
    { name: 'Wipro Digital Ltd', type: 'customer', state: '29', gstin: inIndia ? '29AAACW0387R1Z0' : null, terms: 45, creditLimit: 2500000 },
    { name: 'Tech Mahindra Ltd', type: 'customer', state: '07', gstin: inIndia ? '07AAACT2803M1ZC' : null, terms: 30, creditLimit: 400000 },
    { name: 'Walk-in Customer', type: 'customer', state: home, gstin: null, terms: 0, creditLimit: 0 },
    { name: 'Dell Technologies', type: 'supplier', state: '29', gstin: inIndia ? '29AAACD5765F1ZQ' : null, terms: 30 },
    { name: 'Office Supplies Co', type: 'supplier', state: home, gstin: inIndia ? `${home}AAFCO1234K1Z9` : null, terms: 15 },
    { name: 'Amazon Web Services', type: 'supplier', state: '29', gstin: inIndia ? '29AAICA3918J1ZE' : null, terms: 7 },
  ]
  parties.forEach(p => books.parties.push({ id: nextId(books, 'party', 'PTY', 3), ...p }))
  const items = [
    { sku: 'LAP-5440', name: 'Laptop – Dell 5440', hsn: '84713010', unit: 'pcs', salePrice: 72000, taxRate: 18, type: 'goods', costMethod: 'FIFO', reorderLevel: 5 },
    { sku: 'MON-24', name: '24" Monitor', hsn: '85285200', unit: 'pcs', salePrice: 14500, taxRate: 18, type: 'goods', costMethod: 'WAVG', reorderLevel: 8 },
    { sku: 'CBL-HDMI', name: 'HDMI Cable 2m', hsn: '85444299', unit: 'pcs', salePrice: 450, taxRate: 18, type: 'goods', costMethod: 'FIFO', reorderLevel: 50 },
    { sku: 'SAN-500', name: 'Hand Sanitiser 500ml', hsn: '38089400', unit: 'btl', salePrice: 220, taxRate: 18, type: 'goods', costMethod: 'FIFO', reorderLevel: 40 },
    { sku: 'WS-KIT', name: 'Workstation Kit (assembled)', hsn: '84713010', unit: 'kit', salePrice: 92000, taxRate: 18, type: 'goods', costMethod: 'FIFO', reorderLevel: 2, kind: 'finished' },
    { sku: 'SVC-CONS', name: 'Cloud Consulting (hour)', hsn: '998314', unit: 'hr', salePrice: 5000, taxRate: 18, type: 'service' },
  ]
  items.forEach(it => books.items.push({ id: nextId(books, 'item', 'ITM', 3), layers: [], kind: 'stock', ...it }))
  const P = name => books.parties.find(p => p.name === name).id
  const I = sku => books.items.find(i => i.sku === sku).id
  const day = n => addDays(today(), -n)
  const ctx = { db, company }
  // Stock in (bills), then sales, receipts and a payment — every one posts to the ledger
  createBill(ctx, { partyId: P('Dell Technologies'), date: day(58), lines: [{ itemId: I('LAP-5440'), qty: 20, rate: 52000 }, { itemId: I('MON-24'), qty: 30, rate: 9800 }] }, { system: true })
  createBill(ctx, { partyId: P('Dell Technologies'), date: day(30), lines: [{ itemId: I('LAP-5440'), qty: 10, rate: 54000 }, { itemId: I('MON-24'), qty: 10, rate: 10400 }] }, { system: true })
  createBill(ctx, { partyId: P('Office Supplies Co'), date: day(40), lines: [
    { itemId: I('CBL-HDMI'), qty: 200, rate: 180 },
    { itemId: I('SAN-500'), qty: 60, rate: 95, batch: 'B-2409', expiry: addDays(today(), 20) },
    { itemId: I('SAN-500'), qty: 80, rate: 105, batch: 'B-2501', expiry: addDays(today(), 200) },
  ] }, { system: true })
  createBill(ctx, { partyId: P('Amazon Web Services'), date: day(12), lines: [{ description: 'Cloud hosting — monthly', qty: 1, rate: 85000, taxRate: 18 }] }, { system: true })
  const inv1 = createInvoice(ctx, { partyId: P('Infosys BPO Ltd'), date: day(50), lines: [{ itemId: I('LAP-5440'), qty: 8 }, { itemId: I('MON-24'), qty: 8 }, { itemId: I('SVC-CONS'), qty: 40 }] })
  createInvoice(ctx, { partyId: P('Wipro Digital Ltd'), date: day(36), lines: [{ itemId: I('LAP-5440'), qty: 6 }, { itemId: I('CBL-HDMI'), qty: 30 }] })
  createInvoice(ctx, { partyId: P('Tech Mahindra Ltd'), date: day(20), lines: [{ itemId: I('MON-24'), qty: 12 }, { itemId: I('SVC-CONS'), qty: 12 }] })
  createInvoice(ctx, { partyId: P('Walk-in Customer'), date: day(4), lines: [{ itemId: I('SAN-500'), qty: 25 }, { itemId: I('CBL-HDMI'), qty: 10 }] })
  recordPayment(ctx, { type: 'receipt', partyId: P('Infosys BPO Ltd'), date: day(18), amount: inv1.total, account: 'Bank' })
  recordPayment(ctx, { type: 'payment', partyId: P('Dell Technologies'), date: day(25), amount: 600000, account: 'Bank' })
  books.boms.push({ id: nextId(books, 'bom', 'BOM', 3), productId: I('WS-KIT'), outputQty: 1, components: [
    { itemId: I('LAP-5440'), qty: 1 }, { itemId: I('MON-24'), qty: 2 }, { itemId: I('CBL-HDMI'), qty: 2 },
  ] })
  books.recurring.push({ id: nextId(books, 'rec', 'REC', 3), partyId: P('Tech Mahindra Ltd'), every: 'monthly', nextDate: addDays(today(), 3), active: true,
    lines: [{ itemId: I('SVC-CONS'), qty: 20 }], memo: 'Monthly support retainer' })
}

/* ── Documents ── */
function partyOr404(books, id, type) {
  const p = books.parties.find(x => x.id === id)
  if (!p) fail('Choose a customer or supplier that exists')
  if (type && p.type !== type) fail(`${p.name} is a ${p.type}, not a ${type}`)
  return p
}

function buildLines(books, rawLines, { company, party, side }) {
  if (!Array.isArray(rawLines) || !rawLines.length) fail('Add at least one line')
  const home = homeStateOf(company)
  return rawLines.map((l, i) => {
    const item = l.itemId ? books.items.find(x => x.id === l.itemId) : null
    if (l.itemId && !item) fail(`Line ${i + 1}: unknown item`)
    const qty = Number(l.qty)
    if (!(qty > 0)) fail(`Line ${i + 1}: quantity must be more than 0`)
    const rate = round2(Number(l.rate ?? (side === 'sale' ? item?.salePrice : undefined)))
    if (!(rate >= 0) || Number.isNaN(rate)) fail(`Line ${i + 1}: enter a rate`)
    const discount = Math.min(100, Math.max(0, Number(l.discount) || 0))
    const taxable = round2(qty * rate * (1 - discount / 100))
    const t = taxLine({ taxable, rate: Number(l.taxRate ?? item?.taxRate ?? 0), country: company?.country || 'IN', homeState: home, partyState: party.state })
    return {
      itemId: item?.id ?? null, description: l.description || item?.name || 'Item', hsn: l.hsn || item?.hsn || '', unit: item?.unit || 'nos',
      qty, rate, discount, batch: l.batch ?? null, expiry: l.expiry ?? null, ...t, taxRate: t.rate, total: round2(taxable + t.tax),
    }
  })
}

const sumBy = (lines, k) => round2(lines.reduce((s, l) => s + (l[k] || 0), 0))

export function outstandingFor(books, partyId) {
  const inv = books.invoices.filter(d => d.partyId === partyId && d.status !== 'void')
  return round2(inv.reduce((s, d) => s + d.balance, 0))
}

export function createInvoice({ db, company }, body, { user } = {}) {
  const books = db.books
  const party = partyOr404(books, body.partyId, 'customer')
  const date = body.date || today()
  const lines = buildLines(books, body.lines, { company, party, side: 'sale' })
  const fxRate = body.currency && body.currency !== body.baseCurrency ? Number(body.fxRate) : 1
  if (!(fxRate > 0)) fail('Enter the exchange rate for a foreign-currency invoice')
  const subtotal = sumBy(lines, 'taxable')
  const tax = sumBy(lines, 'tax')
  const total = round2(subtotal + tax)
  const totalBase = round2(total * fxRate)
  // Credit limit — blocks the sale unless someone with authority overrides it
  if (party.creditLimit > 0) {
    const outstanding = outstandingFor(books, party.id)
    if (outstanding + totalBase > party.creditLimit && !body.overrideCreditLimit) {
      fail(`${party.name} would exceed their credit limit (${party.creditLimit}). Outstanding ${outstanding} + this invoice ${totalBase}.`, { code: 'CREDIT_LIMIT', outstanding, limit: party.creditLimit })
    }
  }
  // Cost of goods sold, valued at each item's costing method
  let cogsByAccount = {}
  const costed = lines.map(l => {
    const item = l.itemId && books.items.find(x => x.id === l.itemId)
    if (!item || item.type === 'service') return l
    const cost = consumeStock(item, l.qty)
    cogsByAccount = { ...cogsByAccount, [stockAccount(item)]: round2((cogsByAccount[stockAccount(item)] || 0) + cost) }
    return { ...l, cost }
  })
  const id = nextId(books, 'inv', 'SI')
  const number = `${books.settings.invoicePrefix}/${fyCode(date, company?.country)}/${String(books.seq.inv).padStart(4, '0')}`
  const cogs = round2(Object.values(cogsByAccount).reduce((s, v) => s + v, 0))
  const fx = fxRate !== 1
  const journal = postJournal(db, {
    date, memo: `Invoice ${number} — ${party.name}`, source: 'sales', reference: id,
    lines: [
      { account: fx ? 'Accounts Receivable (FX)' : 'Accounts Receivable', debit: totalBase },
      { account: 'Sales', credit: round2(subtotal * fxRate) },
      { account: 'Output Tax Payable', credit: round2(totalBase - round2(subtotal * fxRate)) },
      ...(cogs > 0 ? [{ account: 'Cost of Goods Sold', debit: cogs }, ...Object.entries(cogsByAccount).map(([account, v]) => ({ account, credit: v }))] : []),
    ],
  })
  const inv = {
    id, number, partyId: party.id, partyName: party.name, partyGstin: party.gstin, placeOfSupply: party.state,
    date, dueDate: addDays(date, party.terms ?? 30), currency: body.currency || null, fxRate, lines: costed,
    subtotal, tax, cgst: sumBy(lines, 'cgst'), sgst: sumBy(lines, 'sgst'), igst: sumBy(lines, 'igst'), total, totalBase,
    cogs, paid: 0, balance: totalBase, status: 'open', journalId: journal.id, recurringId: body.recurringId ?? null,
    createdBy: user?.id ?? 'system', creditOverride: !!body.overrideCreditLimit,
  }
  books.invoices.push(inv)
  return inv
}

export function createBill({ db, company }, body, { user, system } = {}) {
  const books = db.books
  const party = partyOr404(books, body.partyId, 'supplier')
  const date = body.date || today()
  const lines = buildLines(books, body.lines, { company, party, side: 'purchase' })
  const subtotal = sumBy(lines, 'taxable')
  const tax = sumBy(lines, 'tax')
  const total = round2(subtotal + tax)
  const bill = {
    id: nextId(books, 'bill', 'PB'), supplierRef: body.supplierRef || `${party.name.split(' ')[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    partyId: party.id, partyName: party.name, partyGstin: party.gstin, date, dueDate: addDays(date, party.terms ?? 30), lines,
    subtotal, tax, cgst: sumBy(lines, 'cgst'), sgst: sumBy(lines, 'sgst'), igst: sumBy(lines, 'igst'), total,
    paid: 0, balance: total, status: 'open', createdBy: user?.id ?? 'system', approvedBy: null, journalId: null,
  }
  // Maker-checker: large bills wait for a second person before they hit the books
  if (!system && total > books.settings.billApprovalLimit) {
    bill.status = 'pending_approval'
    books.bills.push(bill)
    return bill
  }
  postBill(db, bill)
  books.bills.push(bill)
  return bill
}

function postBill(db, bill) {
  const books = db.books
  const byAccount = {}
  for (const l of bill.lines) {
    const item = l.itemId && books.items.find(x => x.id === l.itemId)
    const account = item && item.type !== 'service' ? stockAccount(item) : 'Purchases'
    byAccount[account] = round2((byAccount[account] || 0) + l.taxable)
    if (item && item.type !== 'service') {
      item.layers.push({ qty: l.qty, unitCost: round2(l.taxable / l.qty), date: bill.date, batch: l.batch, expiry: l.expiry, source: bill.id })
    }
  }
  const journal = postJournal(db, {
    date: bill.date, memo: `Bill ${bill.supplierRef} — ${bill.partyName}`, source: 'purchases', reference: bill.id,
    lines: [
      ...Object.entries(byAccount).map(([account, v]) => ({ account, debit: v })),
      { account: 'Input Tax Recoverable', debit: bill.tax },
      { account: 'Accounts Payable', credit: bill.total },
    ],
  })
  bill.journalId = journal.id
  bill.status = 'open'
}

export function approveBill(db, billId, user) {
  const bill = db.books.bills.find(b => b.id === billId)
  if (!bill) fail('Bill not found')
  if (bill.status !== 'pending_approval') fail('This bill is not waiting for approval')
  if (user && bill.createdBy === user.id) fail('The person who entered a bill cannot also approve it')
  postBill(db, bill)
  bill.approvedBy = user?.id ?? 'system'
  return bill
}

function receiptCredits(books, allocations, unallocated) {
  const byAccount = {}
  for (const a of allocations) {
    const inv = books.invoices.find(i => i.id === a.docId)
    const acct = inv && inv.fxRate !== 1 ? 'Accounts Receivable (FX)' : 'Accounts Receivable'
    byAccount[acct] = round2((byAccount[acct] || 0) + a.amount)
  }
  // Money received beyond open invoices sits as a customer credit on the receivable account
  if (unallocated > 0) byAccount['Accounts Receivable'] = round2((byAccount['Accounts Receivable'] || 0) + unallocated)
  return Object.entries(byAccount).map(([account, credit]) => ({ account, credit }))
}

export function recordPayment({ db }, body, { user } = {}) {
  const books = db.books
  const receipt = body.type === 'receipt'
  const party = partyOr404(books, body.partyId, receipt ? 'customer' : 'supplier')
  const amount = round2(Number(body.amount))
  if (!(amount > 0)) fail('Enter an amount greater than 0')
  const account = body.account === 'Cash' ? 'Cash' : 'Bank'
  const docs = (receipt ? books.invoices : books.bills)
    .filter(d => d.partyId === party.id && d.balance > 0 && d.status === 'open')
    .sort((a, b) => a.date.localeCompare(b.date))
  // Allocate as asked, otherwise oldest first
  const plan = body.allocations?.length ? body.allocations : []
  let left = amount
  const allocations = []
  const apply = (doc, want) => {
    const amt = round2(Math.min(want, doc.balance, left))
    if (amt <= 0) return
    doc.paid = round2(doc.paid + amt)
    doc.balance = round2(doc.balance - amt)
    if (doc.balance <= 0) doc.status = 'paid'
    left = round2(left - amt)
    allocations.push({ docId: doc.id, amount: amt })
  }
  if (plan.length) plan.forEach(a => { const d = docs.find(x => x.id === a.docId); if (!d) fail(`Document ${a.docId} is not open for ${party.name}`); apply(d, Number(a.amount)) })
  else docs.forEach(d => apply(d, d.balance))
  const date = body.date || today()
  const id = nextId(books, receipt ? 'rcpt' : 'pay', receipt ? 'RCT' : 'PAY')
  const journal = postJournal(db, {
    date, memo: `${receipt ? 'Receipt from' : 'Payment to'} ${party.name}`, source: receipt ? 'receipt' : 'payment', reference: id,
    // Each allocation clears the receivable account its invoice was posted to (home or foreign-currency)
    lines: receipt
      ? [{ account, debit: amount }, ...receiptCredits(books, allocations, left)]
      : [{ account: 'Accounts Payable', debit: amount }, { account, credit: amount }],
  })
  const payment = { id, type: receipt ? 'receipt' : 'payment', partyId: party.id, partyName: party.name, date, amount, account, allocations, unallocated: left, journalId: journal.id, createdBy: user?.id ?? 'system' }
  books.payments.push(payment)
  return payment
}

export function createCreditNote({ db }, invoiceId, body = {}) {
  const books = db.books
  const inv = books.invoices.find(i => i.id === invoiceId)
  if (!inv) fail('Invoice not found')
  const share = body.fraction != null ? Math.min(1, Math.max(0, Number(body.fraction))) : 1
  if (!(share > 0)) fail('Credit at least part of the invoice')
  const already = books.creditNotes.filter(c => c.invoiceId === inv.id).reduce((s, c) => s + c.share, 0)
  if (already + share > 1 + 1e-9) fail('This invoice has already been credited in full')
  const taxable = round2(inv.subtotal * inv.fxRate * share)
  const total = round2(inv.totalBase * share)
  const tax = round2(total - taxable)
  // Goods come back into stock at the cost they left at
  const restock = round2(inv.cogs * share)
  inv.lines.filter(l => l.cost).forEach(l => {
    const item = books.items.find(x => x.id === l.itemId)
    item.layers.push({ qty: round2(l.qty * share), unitCost: round2(l.cost / l.qty), date: body.date || today(), source: `CN for ${inv.number}` })
  })
  const id = nextId(books, 'cn', 'CN')
  const journal = postJournal(db, {
    date: body.date || today(), memo: `Credit note ${id} against ${inv.number}`, source: 'credit-note', reference: id,
    lines: [
      { account: 'Sales Returns', debit: taxable }, ...(tax > 0 ? [{ account: 'Output Tax Payable', debit: tax }] : []),
      { account: 'Accounts Receivable', credit: total },
      ...(restock > 0 ? [{ account: 'Inventory', debit: restock }, { account: 'Cost of Goods Sold', credit: restock }] : []),
    ],
  })
  const reduce = Math.min(total, inv.balance)
  inv.balance = round2(inv.balance - reduce)
  if (inv.balance <= 0) inv.status = 'paid'
  const note = { id, invoiceId: inv.id, invoiceNumber: inv.number, partyName: inv.partyName, date: body.date || today(), share, taxable, tax, total, reason: body.reason || 'Goods returned', journalId: journal.id }
  books.creditNotes.push(note)
  return note
}

export function runRecurring(ctx, asOf = today()) {
  const books = ctx.db.books
  const created = []
  for (const r of books.recurring.filter(x => x.active)) {
    let guard = 0
    while (r.nextDate <= asOf && guard++ < 24) {
      created.push(createInvoice(ctx, { partyId: r.partyId, date: r.nextDate, lines: r.lines, recurringId: r.id, overrideCreditLimit: true }))
      const d = new Date(`${r.nextDate}T00:00:00`)
      if (r.every === 'weekly') d.setDate(d.getDate() + 7)
      else d.setMonth(d.getMonth() + (r.every === 'quarterly' ? 3 : 1))
      r.nextDate = iso(d)
    }
  }
  return created
}

export function buildFromBom({ db }, bomId, { qty = 1, date = today() } = {}) {
  const books = db.books
  const bom = books.boms.find(b => b.id === bomId)
  if (!bom) fail('Bill of materials not found')
  const runs = Number(qty)
  if (!(runs > 0)) fail('Build at least 1')
  // Check every component first so a build never half-happens
  for (const c of bom.components) {
    const item = books.items.find(i => i.id === c.itemId)
    const need = c.qty * runs
    if (stockOf(item).qty < need) fail(`Not enough ${item.name} to build: need ${need}, have ${stockOf(item).qty}`)
  }
  let cost = 0
  const byAccount = {}
  for (const c of bom.components) {
    const item = books.items.find(i => i.id === c.itemId)
    const v = consumeStock(item, c.qty * runs)
    cost += v
    byAccount[stockAccount(item)] = round2((byAccount[stockAccount(item)] || 0) + v)
  }
  const product = books.items.find(i => i.id === bom.productId)
  const made = bom.outputQty * runs
  product.layers.push({ qty: made, unitCost: round2(cost / made), date, source: `Build ${bom.id}` })
  const journal = postJournal(db, {
    date, memo: `Assembled ${made} × ${product.name}`, source: 'manufacturing', reference: bom.id,
    lines: [{ account: stockAccount(product), debit: round2(cost) }, ...Object.entries(byAccount).map(([account, v]) => ({ account, credit: v }))],
  })
  return { productId: product.id, made, unitCost: round2(cost / made), totalCost: round2(cost), journalId: journal.id }
}

export function adjustStock({ db }, { itemId, qty, reason = 'Stock count', date = today() }) {
  const item = db.books.items.find(i => i.id === itemId)
  if (!item || item.type === 'service') fail('Choose a stocked item')
  const delta = Number(qty)
  if (!delta) fail('Enter a quantity to add (+) or remove (−)')
  let value
  if (delta < 0) value = consumeStock(item, -delta)
  else { value = round2(delta * (stockOf(item).avgCost || item.salePrice * 0.6)); item.layers.push({ qty: delta, unitCost: round2(value / delta), date, source: 'Adjustment' }) }
  const journal = postJournal(db, {
    date, memo: `Stock adjustment — ${item.name} (${reason})`, source: 'adjustment', reference: item.id,
    lines: delta < 0
      ? [{ account: 'Inventory Adjustments', debit: value }, { account: stockAccount(item), credit: value }]
      : [{ account: stockAccount(item), debit: value }, { account: 'Inventory Adjustments', credit: value }],
  })
  return { itemId, delta, value, journalId: journal.id, stock: stockOf(item) }
}

/* ── Statements built from the ledger ── */
const typeOf = code => CHART.find(a => a.code === code)?.type

function balancesBetween(db, from, to) {
  const totals = new Map()
  for (const j of ensureLedger(db).journals) {
    if ((from && j.date < from) || (to && j.date > to)) continue
    for (const l of j.lines) {
      const t = totals.get(l.account) || { code: l.account, name: l.accountName, type: typeOf(l.account), debit: 0, credit: 0 }
      t.debit = round2(t.debit + l.debit); t.credit = round2(t.credit + l.credit)
      totals.set(l.account, t)
    }
  }
  return [...totals.values()].map(a => ({ ...a, net: ['asset', 'expense'].includes(a.type) ? round2(a.debit - a.credit) : round2(a.credit - a.debit) }))
}

export function profitAndLoss(db, { from, to } = {}) {
  const rows = balancesBetween(db, from, to)
  const pick = (type, test = () => true) => rows.filter(r => r.type === type && test(r) && r.net !== 0).map(r => ({ code: r.code, name: r.name, amount: r.net }))
  const income = pick('income')
  const cogs = pick('expense', r => ['5000', '5010', '5020'].includes(r.code))
  const expenses = pick('expense', r => !['5000', '5010', '5020'].includes(r.code))
  const revenue = round2(income.reduce((s, r) => s + r.amount, 0))
  const costOfSales = round2(cogs.reduce((s, r) => s + r.amount, 0))
  const opex = round2(expenses.reduce((s, r) => s + r.amount, 0))
  const grossProfit = round2(revenue - costOfSales)
  const netProfit = round2(grossProfit - opex)
  return { from: from ?? null, to: to ?? null, income, costOfSales: cogs, expenses, revenue, costOfSalesTotal: costOfSales, grossProfit, opex, netProfit,
    grossMargin: revenue ? round2(grossProfit / revenue * 100) : 0, netMargin: revenue ? round2(netProfit / revenue * 100) : 0 }
}

export function balanceSheet(db, asOf) {
  const rows = balancesBetween(db, null, asOf)
  const group = type => rows.filter(r => r.type === type && r.net !== 0).map(r => ({ code: r.code, name: r.name, amount: r.net }))
  const assets = group('asset'); const liabilities = group('liability'); const equity = group('equity')
  const earnings = round2(rows.filter(r => r.type === 'income').reduce((s, r) => s + r.net, 0) - rows.filter(r => r.type === 'expense').reduce((s, r) => s + r.net, 0))
  equity.push({ code: 'CYE', name: 'Profit to date (unclosed)', amount: earnings })
  const total = list => round2(list.reduce((s, r) => s + r.amount, 0))
  const totalAssets = total(assets); const totalLiabilities = total(liabilities); const totalEquity = total(equity)
  return { asOf: asOf ?? today(), assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, balanced: round2(totalAssets - totalLiabilities - totalEquity) === 0 }
}

/** Direct-method cash flow: every Bank/Cash movement, classified by what was on the other side. */
export function cashFlow(db, { from, to } = {}) {
  const cashCodes = new Set(['1000', '1010'])
  const sections = { operating: 0, investing: 0, financing: 0 }
  const detail = {}
  let opening = 0
  for (const j of ensureLedger(db).journals) {
    const cashNet = round2(j.lines.filter(l => cashCodes.has(l.account)).reduce((s, l) => s + l.debit - l.credit, 0))
    if (!cashNet) continue
    if (from && j.date < from) { opening = round2(opening + cashNet); continue }
    if (to && j.date > to) continue
    const others = j.lines.filter(l => !cashCodes.has(l.account))
    const kind = others.some(l => typeOf(l.account) === 'equity') ? 'financing' : others.some(l => l.accountName === 'Fixed Assets') ? 'investing' : 'operating'
    sections[kind] = round2(sections[kind] + cashNet)
    const label = j.source === 'receipt' ? 'Received from customers' : j.source === 'payment' ? 'Paid to suppliers' : j.source === 'opening' ? 'Capital introduced' : j.source === 'bank' ? 'Bank charges & expenses' : 'Other'
    detail[label] = round2((detail[label] || 0) + cashNet)
  }
  const net = round2(sections.operating + sections.investing + sections.financing)
  return { from: from ?? null, to: to ?? null, opening, ...sections, net, closing: round2(opening + net), detail: Object.entries(detail).map(([label, amount]) => ({ label, amount })) }
}

export function ageing(books, type = 'receivable', asOf = today()) {
  const docs = (type === 'payable' ? books.bills : books.invoices).filter(d => d.balance > 0 && d.status === 'open')
  const buckets = [['Not due', -Infinity, 0], ['1–30 days', 1, 30], ['31–60 days', 31, 60], ['61–90 days', 61, 90], ['90+ days', 91, Infinity]]
  const rows = docs.map(d => ({ id: d.id, number: d.number || d.supplierRef, party: d.partyName, dueDate: d.dueDate, balance: d.balance, daysOverdue: Math.max(0, daysBetween(d.dueDate, asOf)) }))
  return {
    type, asOf, total: round2(rows.reduce((s, r) => s + r.balance, 0)),
    buckets: buckets.map(([label, lo, hi]) => {
      const inB = rows.filter(r => { const od = daysBetween(r.dueDate, asOf); return od >= lo && od <= hi })
      return { label, amount: round2(inB.reduce((s, r) => s + r.balance, 0)), count: inB.length }
    }),
    documents: rows.sort((a, b) => b.daysOverdue - a.daysOverdue),
  }
}

export function stockReport(books, asOf = today()) {
  const items = books.items.filter(i => i.type !== 'service').map(i => {
    const s = stockOf(i)
    const batches = (i.layers ?? []).filter(l => l.batch).map(l => ({ batch: l.batch, qty: l.qty, expiry: l.expiry, daysToExpiry: l.expiry ? daysBetween(asOf, l.expiry) : null }))
    return { id: i.id, sku: i.sku, name: i.name, hsn: i.hsn, unit: i.unit, costMethod: i.costMethod, kind: i.kind, ...s, reorderLevel: i.reorderLevel, low: s.qty <= (i.reorderLevel ?? 0), batches,
      expiringSoon: batches.filter(b => b.daysToExpiry != null && b.daysToExpiry <= 30).length }
  })
  return { asOf, items, totalValue: round2(items.reduce((s, i) => s + i.value, 0)), lowStock: items.filter(i => i.low).length, expiringBatches: items.reduce((s, i) => s + i.expiringSoon, 0) }
}

export function booksSummary(db, books) {
  const fyStart = (() => { const d = new Date(); const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1; return `${y}-04-01` })()
  const pnl = profitAndLoss(db, { from: fyStart })
  const bs = balanceSheet(db)
  const ar = ageing(books, 'receivable'); const ap = ageing(books, 'payable')
  const cash = round2(bs.assets.filter(a => ['1000', '1010'].includes(a.code)).reduce((s, a) => s + a.amount, 0))
  return {
    receivables: ar.total, overdueInvoices: ar.documents.filter(d => d.daysOverdue > 0).length, overdueReceivables: round2(ar.documents.filter(d => d.daysOverdue > 0).reduce((s, d) => s + d.balance, 0)),
    payables: ap.total, billsDueThisWeek: ap.documents.filter(d => daysBetween(today(), d.dueDate) <= 7).length,
    cash, revenueFy: pnl.revenue, netProfitFy: pnl.netProfit, grossMargin: pnl.grossMargin,
    stockValue: stockReport(books).totalValue, lowStock: stockReport(books).lowStock,
    pendingApprovals: books.bills.filter(b => b.status === 'pending_approval').length,
    documents: { invoices: books.invoices.length, bills: books.bills.length, payments: books.payments.length },
  }
}

/* ── Routes ── */
export function registerBooksRoutes(route, { ok, notFound, badRequest }) {
  const b = handler => ctx => { ensureBooks(ctx.db, ctx.company); return handler(ctx, ctx.db.books) }
  const guard = fn => { try { return fn() } catch (e) { if (e instanceof BooksError) badRequest(e.message, e.details); throw e } }

  route('GET', '/books/summary', b(({ db }, books) => ok(booksSummary(db, books))), { summary: 'Headline numbers for the dashboard, from the books' })
  route('GET', '/books/parties', b((_, books) => ok(books.parties.map(p => ({ ...p, outstanding: p.type === 'customer' ? outstandingFor(books, p.id) : round2(books.bills.filter(x => x.partyId === p.id).reduce((s, x) => s + x.balance, 0)) })))), { summary: 'Customers and suppliers with balances' })
  route('POST', '/books/parties', b(({ body, save }, books) => {
    if (!body?.name?.trim()) badRequest('Enter a name')
    if (!['customer', 'supplier'].includes(body.type)) badRequest('Type must be customer or supplier')
    if (body.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(body.gstin)) badRequest('That GSTIN is not in the right format')
    const party = { id: nextId(books, 'party', 'PTY', 3), name: body.name.trim(), type: body.type, gstin: body.gstin || null, state: body.gstin ? body.gstin.slice(0, 2) : body.state || null, terms: Number(body.terms ?? 30), creditLimit: Number(body.creditLimit || 0) }
    books.parties.push(party); save()
    return ok({ ...party, auditSummary: `Added ${party.type} ${party.name}` }, 201)
  }), { summary: 'Add a customer or supplier' })
  route('PATCH', '/books/parties/:id', b(({ params, body, save }, books) => {
    const p = books.parties.find(x => x.id === params.id) || notFound('Party')
    if (body?.creditLimit != null) p.creditLimit = Math.max(0, Number(body.creditLimit))
    if (body?.terms != null) p.terms = Math.max(0, Number(body.terms))
    save()
    return ok({ ...p, auditSummary: `Updated ${p.name}` })
  }), { summary: 'Change credit limit or payment terms' })

  route('GET', '/books/items', b((_, books) => ok(books.items.map(i => ({ ...i, stock: stockOf(i) })))), { summary: 'Items with stock on hand' })
  route('GET', '/books/invoices', b((_, books) => ok([...books.invoices].reverse())), { summary: 'Sales invoices' })
  route('POST', '/books/invoices', b((ctx) => {
    if (ctx.body?.overrideCreditLimit && !['Super Admin', 'Finance Lead'].includes(ctx.user?.role)) badRequest('Only a Finance Lead or Super Admin can override a credit limit')
    const inv = guard(() => createInvoice(ctx, ctx.body || {}, { user: ctx.user }))
    ctx.save()
    return ok({ ...inv, auditSummary: `Invoice ${inv.number} raised for ${inv.partyName} (${inv.total})` }, 201)
  }), { summary: 'Raise a sales invoice (posts sales, tax and cost of goods sold)' })
  route('POST', '/books/invoices/:id/credit-note', b((ctx) => {
    const note = guard(() => createCreditNote(ctx, ctx.params.id, ctx.body || {}))
    ctx.save()
    return ok({ ...note, auditSummary: `Credit note ${note.id} against ${note.invoiceNumber}` }, 201)
  }), { summary: 'Credit all or part of an invoice (restocks goods at cost)' })
  route('GET', '/books/credit-notes', b((_, books) => ok([...books.creditNotes].reverse())), { summary: 'Credit notes' })

  route('GET', '/books/bills', b((_, books) => ok([...books.bills].reverse())), { summary: 'Supplier bills' })
  route('POST', '/books/bills', b((ctx) => {
    const bill = guard(() => createBill(ctx, ctx.body || {}, { user: ctx.user }))
    ctx.save()
    return ok({ ...bill, auditSummary: bill.status === 'pending_approval' ? `Bill ${bill.id} sent for approval (${bill.total})` : `Bill ${bill.id} recorded (${bill.total})` }, 201)
  }), { summary: 'Record a supplier bill (large bills wait for approval)' })
  route('POST', '/books/bills/:id/approve', b((ctx) => {
    const bill = guard(() => approveBill(ctx.db, ctx.params.id, ctx.user))
    ctx.save()
    return ok({ ...bill, auditSummary: `Bill ${bill.id} approved and posted` })
  }), { summary: 'Approve a bill entered by someone else (maker-checker)' })

  route('GET', '/books/payments', b((_, books) => ok([...books.payments].reverse())), { summary: 'Receipts and payments' })
  route('POST', '/books/payments', b((ctx) => {
    const p = guard(() => recordPayment(ctx, ctx.body || {}, { user: ctx.user }))
    ctx.save()
    return ok({ ...p, auditSummary: `${p.type === 'receipt' ? 'Receipt' : 'Payment'} ${p.id} ${p.amount} — ${p.partyName}` }, 201)
  }), { summary: 'Record a receipt or payment, allocated oldest-first' })

  route('GET', '/books/recurring', b((_, books) => ok(books.recurring)), { summary: 'Recurring invoice schedules' })
  route('POST', '/books/recurring', b(({ body, save }, books) => {
    partyOr404Safe(books, body?.partyId, badRequest)
    if (!['weekly', 'monthly', 'quarterly'].includes(body?.every)) badRequest('Repeat weekly, monthly or quarterly')
    if (!body?.lines?.length) badRequest('Add at least one line')
    const r = { id: nextId(books, 'rec', 'REC', 3), partyId: body.partyId, every: body.every, nextDate: body.nextDate || today(), lines: body.lines, memo: body.memo || '', active: true }
    books.recurring.push(r); save()
    return ok({ ...r, auditSummary: `Recurring schedule ${r.id} created` }, 201)
  }), { summary: 'Create a recurring invoice schedule' })
  route('POST', '/books/recurring/run', b((ctx) => {
    const created = guard(() => runRecurring(ctx, ctx.body?.asOf))
    ctx.save()
    return ok({ created: created.map(i => ({ id: i.id, number: i.number, total: i.total })), auditSummary: `Recurring run raised ${created.length} invoice(s)` })
  }), { summary: 'Raise every recurring invoice that is due' })

  route('GET', '/books/stock', b(({ query }, books) => ok(stockReport(books, query.asOf))), { summary: 'Stock valuation, batches and expiry' })
  route('POST', '/books/stock/adjust', b((ctx) => {
    const r = guard(() => adjustStock(ctx, ctx.body || {}))
    ctx.save()
    return ok({ ...r, auditSummary: `Stock adjusted by ${r.delta}` })
  }), { summary: 'Adjust stock after a count (posts the difference)' })
  route('GET', '/books/boms', b((_, books) => ok(books.boms.map(bm => ({ ...bm, product: books.items.find(i => i.id === bm.productId)?.name,
    components: bm.components.map(c => { const it = books.items.find(i => i.id === c.itemId); return { ...c, name: it?.name, onHand: stockOf(it).qty, unitCost: stockOf(it).avgCost } }) })))), { summary: 'Bills of materials' })
  route('POST', '/books/boms/:id/build', b((ctx) => {
    const r = guard(() => buildFromBom(ctx, ctx.params.id, ctx.body || {}))
    ctx.save()
    return ok({ ...r, auditSummary: `Built ${r.made} unit(s) at ${r.unitCost} each` }, 201)
  }), { summary: 'Assemble finished goods from components' })

  route('GET', '/books/reports/pnl', b(({ db, query }) => ok(profitAndLoss(db, query))), { summary: 'Profit and loss from the ledger (?from=&to=)' })
  route('GET', '/books/reports/balance-sheet', b(({ db, query }) => ok(balanceSheet(db, query.asOf))), { summary: 'Balance sheet from the ledger (?asOf=)' })
  route('GET', '/books/reports/cash-flow', b(({ db, query }) => ok(cashFlow(db, query))), { summary: 'Cash flow statement from the ledger' })
  route('GET', '/books/reports/ageing', b(({ query }, books) => ok(ageing(books, query.type === 'payable' ? 'payable' : 'receivable', query.asOf))), { summary: 'Receivable or payable ageing (?type=payable)' })
  route('PATCH', '/books/settings', b(({ body, save }, books) => {
    if (body?.billApprovalLimit != null) books.settings.billApprovalLimit = Math.max(0, Number(body.billApprovalLimit))
    save()
    return ok({ ...books.settings, auditSummary: 'Books settings updated' })
  }), { summary: 'Approval limit and numbering' })
}

function partyOr404Safe(books, id, badRequest) {
  if (!books.parties.some(p => p.id === id)) badRequest('Choose a customer that exists')
}
