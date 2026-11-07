import test from 'node:test'
import assert from 'node:assert/strict'
import { trialBalance } from './ledgerServer.js'
import { ensureBanking } from './bankingServer.js'
import { ensureBooks } from './booksServer.js'
import { applyRules, parseStatementCsv, importStatement, bookSuggestions, settleWithBooks, reconciliation, ruleMatches } from './bankRulesServer.js'

const company = { id: 'bank-unit-IN', country: 'IN', name: 'Bank Test Pvt Ltd', taxId: '27AABCU9603R1ZX' }
const fresh = () => { const db = { returns: [] }; ensureBooks(db, company); ensureBanking(db); return { db, company } }

test('CSV statements parse amount or debit/credit columns and Indian dates', () => {
  const a = parseStatementCsv('Date,Narration,Amount,Balance\n05/11/2026,"NEFT CR WIPRO, INV 22",11800,511800\n06/11/2026,BANK CHARGES,-59,511741')
  assert.equal(a.rows.length, 2)
  assert.deepEqual(a.rows[0], { date: '2026-11-05', description: 'NEFT CR WIPRO, INV 22', amount: 11800, direction: 'credit' })
  assert.equal(a.rows[1].direction, 'debit')
  assert.equal(a.closingBalance, 511741)
  const b = parseStatementCsv('Txn Date,Description,Withdrawal,Deposit\n2026-11-01,RENT NOV,"75,000",\n2026-11-02,???,,')
  assert.equal(b.rows[0].amount, 75000)
  assert.equal(b.skipped.length, 1, 'a row with no amount is skipped, not guessed')
  assert.throws(() => parseStatementCsv('Foo,Bar\n1,2'), /Columns needed/)
})

test('uploading the same statement twice skips duplicates', () => {
  const { db } = fresh()
  const csv = 'Date,Description,Amount\n2026-11-03,RENT NOVEMBER,-75000\n2026-11-04,BANK CHARGES,-118'
  assert.equal(importStatement(db, csv).added, 2)
  const again = importStatement(db, csv)
  assert.equal(again.added, 0)
  assert.equal(again.duplicates, 2)
})

test('rules categorise matching lines and post them to the ledger', () => {
  const { db } = fresh()
  importStatement(db, 'Date,Description,Amount\n2026-11-03,OFFICE RENT NOV,-75000\n2026-11-04,BANK CHARGES QTR,-118\n2026-11-04,UNKNOWN UPI,-999')
  assert.ok(ruleMatches({ active: true, contains: 'rent|lease', direction: 'debit' }, { description: 'Office RENT', direction: 'debit', amount: 1 }))
  const done = applyRules(db)
  assert.equal(done.length, 2, 'rent and charges; the unknown line is left for a person')
  assert.ok(ensureBanking(db).transactions.find(t => t.description === 'UNKNOWN UPI').status === 'unmatched')
  assert.ok(trialBalance(db).balanced)
})

test('a bank credit is suggested against the right invoice and settles it', () => {
  const ctx = fresh()
  const inv = ctx.db.books.invoices.find(i => i.balance > 0 && i.partyName.startsWith('Wipro'))
  importStatement(ctx.db, `Date,Description,Amount\n2026-11-05,NEFT CR WIPRO ${inv.number},${inv.balance}`)
  const txn = ensureBanking(ctx.db).transactions.find(t => t.description.includes(inv.number))
  const [best] = bookSuggestions(ctx.db, txn)
  assert.equal(best.docId, inv.id)
  assert.equal(best.score, 100)
  settleWithBooks(ctx, txn.id, inv.id)
  assert.equal(inv.balance, 0)
  assert.equal(txn.status, 'matched')
  assert.throws(() => settleWithBooks(ctx, txn.id, inv.id), /already reconciled/)
})

test('the reconciliation statement explains every difference', () => {
  const ctx = fresh()
  importStatement(ctx.db, 'Date,Description,Amount,Balance\n2026-11-05,INTEREST CREDIT,250,0')
  const r = reconciliation(ctx.db)
  const notInBooks = r.adjustments.find(a => a.label.startsWith('Add: received'))
  assert.equal(notInBooks.amount, 250)
  assert.equal(r.adjustedBookBalance, Math.round((r.bookBalance + 250 - r.adjustments[2].amount * -1 + r.adjustments[3].amount) * 100) / 100)
  assert.equal(r.reconciled, false, 'not reconciled while a bank line is unexplained')
})
