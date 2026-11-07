import test from 'node:test'
import assert from 'node:assert/strict'
import {
  toBase, crossRate, exchangeDifference, settleDocument, buildRevaluation,
  settlementJournal, journalImbalance, valueDocument,
} from './fx.js'

test('cross rates and conversion', () => {
  const usd = { USD: 1, GBP: 0.75, EUR: 0.86 }
  assert.equal(crossRate(usd, 'USD', 'GBP'), 0.75)
  assert.equal(crossRate(usd, 'EUR', 'GBP'), 0.872093)
  assert.equal(toBase(1000, 0.75), 750)
  assert.equal(crossRate(usd, 'XXX', 'GBP'), null)
})

test('receivables gain when foreign currency strengthens, payables lose', () => {
  assert.equal(exchangeDifference({ amount: 1000, fromRate: 0.75, toRate: 0.8, kind: 'receivable' }), 50)
  assert.equal(exchangeDifference({ amount: 1000, fromRate: 0.75, toRate: 0.8, kind: 'payable' }), -50)
})

test('settlement realizes against booked rate and reverses prior unrealized', () => {
  // Invoice USD 1,000 booked at 0.75, revalued to 0.78, collected at 0.80
  const doc = { id: 'd1', kind: 'receivable', currency: 'USD', openAmount: 1000, bookedRate: 0.75, carryingRate: 0.78 }
  const r = settleDocument(doc, { amount: 1000, rate: 0.8 })
  assert.equal(r.realized, 50)            // (0.80 − 0.75) × 1000
  assert.equal(r.unrealizedReversal, 30)  // (0.78 − 0.75) × 1000 already booked
  assert.equal(r.netPnl, 20)              // new P&L on top of carrying value
  assert.equal(r.status, 'settled')
  const legs = settlementJournal(doc, r)
  assert.equal(journalImbalance(legs), 0)
})

test('partial settlement of a payable keeps the journal balanced', () => {
  const doc = { id: 'd2', kind: 'payable', currency: 'EUR', openAmount: 5000, bookedRate: 1.17, carryingRate: 1.15 }
  const r = settleDocument(doc, { amount: 2000, rate: 1.19 })
  assert.equal(r.realized, -40)           // paid more base for the same EUR
  assert.equal(r.remaining, 3000)
  assert.equal(r.status, 'partial')
  assert.equal(journalImbalance(settlementJournal(doc, r)), 0)
  assert.throws(() => settleDocument(doc, { amount: 0, rate: 1.2 }))
})

test('month-end revaluation posts balanced unrealized entries', () => {
  const docs = [
    { id: 'a', kind: 'receivable', currency: 'USD', openAmount: 1000, carryingRate: 0.75 },
    { id: 'b', kind: 'payable', currency: 'USD', openAmount: 400, carryingRate: 0.75 },
    { id: 'c', kind: 'receivable', currency: 'EUR', openAmount: 300, carryingRate: 0.9 },
  ]
  const rev = buildRevaluation(docs, { USD: 0.77, EUR: 0.88 })
  assert.equal(rev.lines.length, 3)
  assert.equal(rev.totalGain, 20)          // receivable USD
  assert.equal(rev.totalLoss, 14)          // payable USD 8 + receivable EUR 6
  assert.equal(rev.net, 6)
  for (const line of rev.lines) assert.equal(journalImbalance(line.legs), 0)
  const v = valueDocument({ ...docs[0], bookedRate: 0.74 }, 0.77)
  assert.equal(v.unrealizedSinceBooking, 30)
  assert.equal(v.baseNow, 770)
})
