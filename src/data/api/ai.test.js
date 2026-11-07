import test from 'node:test'
import assert from 'node:assert/strict'
import { postJournal } from './ledgerServer.js'
import { ensureBooks, createBill, createInvoice, profitAndLoss } from './booksServer.js'
import { anomalies, forecast, ask } from './aiServer.js'

const company = { id: 'ai-unit-IN', country: 'IN', name: 'AI Test Ltd', taxId: '27AABCU9603R1ZX' }
const fresh = () => { const db = { returns: [] }; ensureBooks(db, company); return { db, company, books: db.books } }

test('anomaly checks catch duplicate bills, weekend round-number journals and sales below cost', () => {
  const ctx = fresh()
  const ofc = ctx.books.parties.find(p => p.name === 'Office Supplies Co')
  const line = [{ description: 'Stationery', qty: 1, rate: 4200, taxRate: 18 }]
  createBill(ctx, { partyId: ofc.id, date: '2026-10-01', lines: line }, { system: true })
  createBill(ctx, { partyId: ofc.id, date: '2026-10-09', lines: line }, { system: true })
  postJournal(ctx.db, { date: '2026-10-04', memo: 'Year-end estimate', lines: [{ account: 'Operating Expenses', debit: 500000 }, { account: 'Bank', credit: 500000 }] })
  const cbl = ctx.books.items.find(i => i.sku === 'CBL-HDMI')
  createInvoice(ctx, { partyId: ctx.books.parties.find(p => p.name === 'Walk-in Customer').id, lines: [{ itemId: cbl.id, qty: 5, rate: 10 }] })
  const kinds = anomalies(ctx.db).map(a => a.kind)
  assert.ok(kinds.includes('duplicate-bill'))
  assert.ok(kinds.includes('weekend'), '4 Oct 2026 is a Sunday')
  assert.ok(kinds.includes('round-number'))
  assert.ok(kinds.includes('below-cost'))
  assert.equal(anomalies(ctx.db)[0].severity, 'high', 'most serious first')
})

test('the forecast projects from the trend and counts expected collections', () => {
  const ctx = fresh()
  const f = forecast(ctx.db, 3)
  assert.equal(f.projection.length, 3)
  assert.equal(f.projection[0].balance, Math.round((f.cashToday + f.projection[0].net) * 100) / 100)
  assert.ok(f.expectedCollections[2].amount >= f.expectedCollections[0].amount, '90-day collections include the 30-day ones')
})

test('questions are answered from the books with their source', () => {
  const ctx = fresh()
  const pnl = profitAndLoss(ctx.db)
  const a = ask(ctx.db, 'What is our profit overall?')
  assert.equal(a.value, pnl.netProfit)
  assert.equal(a.source, 'Profit & loss')
  assert.match(ask(ctx.db, 'Who owes us money?').answer, /Customers owe/)
  assert.match(ask(ctx.db, 'how much stock do we have').answer, /Stock is worth/)
  assert.equal(ask(ctx.db, 'tell me a joke').value, null, 'says what it can answer instead of guessing')
})
