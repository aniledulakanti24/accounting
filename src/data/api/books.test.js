import test from 'node:test'
import assert from 'node:assert/strict'
import { handleRequest } from './mockServer.js'
import { trialBalance } from './ledgerServer.js'
import {
  ensureBooks, createInvoice, createBill, approveBill, recordPayment, createCreditNote, buildFromBom, runRecurring,
  profitAndLoss, balanceSheet, cashFlow, stockOf, consumeStock, taxLine,
} from './booksServer.js'

const company = { id: 'books-unit-IN', country: 'IN', name: 'Books Test Pvt Ltd', taxId: '27AABCU9603R1ZX' }
const fresh = () => { const db = { returns: [] }; ensureBooks(db, company); return { db, company } }
const party = (ctx, name) => ctx.db.books.parties.find(p => p.name === name)
const item = (ctx, sku) => ctx.db.books.items.find(i => i.sku === sku)

test('the seeded books balance: trial balance, balance sheet and cash all agree', () => {
  const ctx = fresh()
  assert.ok(trialBalance(ctx.db).balanced, 'debits equal credits')
  const bs = balanceSheet(ctx.db)
  assert.ok(bs.balanced, `assets ${bs.totalAssets} = liabilities ${bs.totalLiabilities} + equity ${bs.totalEquity}`)
  const pnl = profitAndLoss(ctx.db)
  assert.ok(pnl.revenue > 0 && pnl.costOfSalesTotal > 0)
  assert.equal(pnl.grossProfit, Math.round((pnl.revenue - pnl.costOfSalesTotal) * 100) / 100)
  const cf = cashFlow(ctx.db)
  const bank = bs.assets.filter(a => ['1000', '1010'].includes(a.code)).reduce((s, a) => s + a.amount, 0)
  assert.equal(cf.closing, Math.round(bank * 100) / 100, 'cash flow closes on the bank balance')
})

test('GST splits into CGST+SGST in the same state and IGST across states', () => {
  assert.deepEqual(taxLine({ taxable: 1000, rate: 18, country: 'IN', homeState: '27', partyState: '27' }), { taxable: 1000, rate: 18, tax: 180, cgst: 90, sgst: 90, igst: 0, vat: 0 })
  assert.equal(taxLine({ taxable: 1000, rate: 18, country: 'IN', homeState: '27', partyState: '29' }).igst, 180)
  assert.equal(taxLine({ taxable: 1000, rate: 20, country: 'GB', homeState: null, partyState: null }).vat, 200)
})

test('FIFO uses the earliest-expiring batch first; weighted average blends cost', () => {
  const fifo = { name: 'A', unit: 'pcs', costMethod: 'FIFO', layers: [{ qty: 5, unitCost: 10, date: '2026-01-01', expiry: '2027-01-01' }, { qty: 5, unitCost: 20, date: '2026-02-01', expiry: '2026-06-01' }] }
  assert.equal(consumeStock(fifo, 6), 5 * 20 + 1 * 10, 'expiring batch (cost 20) consumed first')
  const wavg = { name: 'B', unit: 'pcs', costMethod: 'WAVG', layers: [{ qty: 10, unitCost: 10, date: '2026-01-01' }, { qty: 10, unitCost: 20, date: '2026-02-01' }] }
  assert.equal(consumeStock(wavg, 4), 60, 'average cost 15 × 4')
  assert.throws(() => consumeStock(wavg, 100), /Not enough stock/)
})

test('an invoice posts receivables, sales, tax and cost of goods sold', () => {
  const ctx = fresh()
  const lap = item(ctx, 'LAP-5440')
  const before = stockOf(lap).qty
  const inv = createInvoice(ctx, { partyId: party(ctx, 'Wipro Digital Ltd').id, lines: [{ itemId: lap.id, qty: 2 }] })
  assert.equal(inv.igst, inv.tax, 'Karnataka customer from Maharashtra = IGST')
  assert.equal(stockOf(lap).qty, before - 2)
  const j = ctx.db.ledger.journals.find(x => x.id === inv.journalId)
  const line = name => j.lines.find(l => l.accountName === name)
  assert.equal(line('Accounts Receivable').debit, inv.total)
  assert.equal(line('Sales').credit, inv.subtotal)
  assert.equal(line('Cost of Goods Sold').debit, inv.cogs)
  assert.ok(trialBalance(ctx.db).balanced)
})

test('credit limits block a sale unless overridden', () => {
  const ctx = fresh()
  const tm = party(ctx, 'Tech Mahindra Ltd')
  assert.throws(() => createInvoice(ctx, { partyId: tm.id, lines: [{ itemId: item(ctx, 'LAP-5440').id, qty: 3 }] }), /credit limit/)
  assert.ok(createInvoice(ctx, { partyId: tm.id, lines: [{ itemId: item(ctx, 'LAP-5440').id, qty: 3 }], overrideCreditLimit: true }).creditOverride)
})

test('large bills need a second person (maker-checker) before they post', () => {
  const ctx = fresh()
  const bill = createBill(ctx, { partyId: party(ctx, 'Dell Technologies').id, lines: [{ itemId: item(ctx, 'LAP-5440').id, qty: 20, rate: 50000 }] }, { user: { id: 'U4' } })
  assert.equal(bill.status, 'pending_approval')
  assert.equal(bill.journalId, null, 'nothing posted yet')
  assert.throws(() => approveBill(ctx.db, bill.id, { id: 'U4' }), /cannot also approve/)
  approveBill(ctx.db, bill.id, { id: 'U2' })
  assert.equal(bill.status, 'open')
  assert.ok(bill.journalId)
})

test('receipts settle the oldest invoices first; credit notes restock goods', () => {
  const ctx = fresh()
  const wipro = party(ctx, 'Wipro Digital Ltd')
  const a = createInvoice(ctx, { partyId: wipro.id, date: '2026-01-05', lines: [{ itemId: item(ctx, 'CBL-HDMI').id, qty: 10 }] })
  const open = ctx.db.books.invoices.filter(i => i.partyId === wipro.id && i.balance > 0).sort((x, y) => x.date.localeCompare(y.date))
  const pay = recordPayment(ctx, { type: 'receipt', partyId: wipro.id, amount: open[0].balance })
  assert.equal(pay.allocations[0].docId, open[0].id)
  const cbl = item(ctx, 'CBL-HDMI')
  const before = stockOf(cbl).qty
  const cn = createCreditNote(ctx, a.id, { fraction: 0.5 })
  assert.equal(stockOf(cbl).qty, before + 5)
  assert.equal(cn.total, Math.round(a.totalBase * 0.5 * 100) / 100)
  assert.throws(() => createCreditNote(ctx, a.id, { fraction: 0.6 }), /credited in full/)
  assert.ok(trialBalance(ctx.db).balanced)
})

test('bills of materials assemble finished goods at the cost of their parts', () => {
  const ctx = fresh()
  const bom = ctx.db.books.boms[0]
  const r = buildFromBom(ctx, bom.id, { qty: 2 })
  assert.equal(r.made, 2)
  assert.equal(stockOf(item(ctx, 'WS-KIT')).qty, 2)
  assert.throws(() => buildFromBom(ctx, bom.id, { qty: 500 }), /Not enough/)
  assert.ok(trialBalance(ctx.db).balanced)
})

test('recurring schedules raise invoices when they fall due', () => {
  const ctx = fresh()
  const far = new Date(); far.setMonth(far.getMonth() + 2)
  const created = runRecurring(ctx, far.toISOString().slice(0, 10))
  assert.ok(created.length >= 2, 'one per month that has come due')
  assert.ok(created.every(i => i.recurringId))
})

test('the books API enforces roles and returns validation errors', async () => {
  const co = { id: 'books-api-IN', country: 'IN', name: 'Books API Ltd', taxId: '27AABCU9603R1ZX' }
  const signIn = async email => (await handleRequest({ method: 'POST', url: '/auth/login', body: { email, password: 'Demo@2026' } })).data.token
  const call = (method, url, body, token) => handleRequest({ method, url, body, token, company: co })
  const admin = await signIn('priya@unifiedtree.demo')
  const viewer = await signIn('vikram@unifiedtree.demo')
  const parties = (await call('GET', '/books/parties', null, admin)).data
  const cust = parties.find(p => p.type === 'customer')
  assert.equal((await call('POST', '/books/invoices', { partyId: cust.id, lines: [{ description: 'x', qty: 1, rate: 1 }] }, viewer)).status, 403)
  assert.equal((await call('POST', '/books/invoices', { partyId: cust.id, lines: [] }, admin)).status, 422)
  const created = await call('POST', '/books/invoices', { partyId: cust.id, lines: [{ description: 'Consulting', qty: 2, rate: 1000, taxRate: 18 }] }, admin)
  assert.equal(created.status, 201)
  assert.equal(created.data.total, 2360)
  assert.ok((await call('GET', '/books/reports/balance-sheet', null, admin)).data.balanced)
})

test('a foreign-currency invoice is booked at the rate and its receipt clears the FX receivable', () => {
  const ctx = fresh()
  const wipro = party(ctx, 'Wipro Digital Ltd')
  const inv = createInvoice(ctx, { partyId: wipro.id, currency: 'USD', baseCurrency: 'INR', fxRate: 83.5, lines: [{ description: 'Consulting', qty: 10, rate: 100, taxRate: 0 }] })
  assert.equal(inv.total, 1000)
  assert.equal(inv.totalBase, 83500)
  const j = ctx.db.ledger.journals.find(x => x.id === inv.journalId)
  assert.equal(j.lines.find(l => l.accountName === 'Accounts Receivable (FX)').debit, 83500)
  const pay = recordPayment(ctx, { type: 'receipt', partyId: wipro.id, amount: 83500, allocations: [{ docId: inv.id, amount: 83500 }] })
  const pj = ctx.db.ledger.journals.find(x => x.id === pay.journalId)
  assert.equal(pj.lines.find(l => l.accountName === 'Accounts Receivable (FX)').credit, 83500)
  assert.equal(trialBalance(ctx.db).rows.find(r => r.name === 'Accounts Receivable (FX)').balance, 0, 'FX receivable fully cleared')
})
