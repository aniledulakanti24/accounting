import test from 'node:test'
import assert from 'node:assert/strict'
import { trialBalance } from './ledgerServer.js'
import { ensureBooks, createInvoice, stockOf } from './booksServer.js'
import { stockByGodown, transferStock, reorderSuggestions, createPurchaseOrders, receivePurchaseOrder, GODOWNS } from './inventoryServer.js'

const company = { id: 'inv-unit-IN', country: 'IN', name: 'Inventory Test Ltd', taxId: '27AABCU9603R1ZX' }
const fresh = () => { const db = { returns: [] }; ensureBooks(db, company); return { db, company, books: db.books } }
const item = (ctx, sku) => ctx.books.items.find(i => i.sku === sku)

test('transfers move stock between warehouses at cost, keeping total value', () => {
  const ctx = fresh()
  const mon = item(ctx, 'MON-24')
  const before = stockOf(mon)
  const t = transferStock(ctx.books, { itemId: mon.id, qty: 5, from: GODOWNS[0], to: GODOWNS[1] })
  assert.equal(stockByGodown(mon)[GODOWNS[1]], 5)
  assert.deepEqual(stockOf(mon), before, 'quantity and value unchanged overall')
  assert.ok(t.value > 0)
  assert.throws(() => transferStock(ctx.books, { itemId: mon.id, qty: 999, from: GODOWNS[1], to: GODOWNS[2] }), /Only 5/)
})

test('items below reorder level become purchase orders, and receiving one posts the bill', () => {
  const ctx = fresh()
  const lap = item(ctx, 'LAP-5440')
  const sellDown = stockOf(lap).qty - 3
  createInvoice(ctx, { partyId: ctx.books.parties.find(p => p.name.startsWith('Infosys')).id, lines: [{ itemId: lap.id, qty: sellDown }] })
  const s = reorderSuggestions(ctx.books).find(x => x.itemId === lap.id)
  assert.equal(s.onHand, 3)
  assert.equal(s.suggestQty, 7, 'up to twice the reorder level (5 × 2 − 3)')
  assert.equal(s.supplier, 'Dell Technologies', 'last supplier')
  const [po] = createPurchaseOrders(ctx.books, { itemIds: [lap.id] })
  assert.equal(reorderSuggestions(ctx.books).find(x => x.itemId === lap.id).suggestQty, 0, 'quantity on order is not suggested again')
  const { bill } = receivePurchaseOrder(ctx, po.id, { godown: GODOWNS[2] })
  assert.equal(stockOf(lap).qty, 10)
  assert.equal(stockByGodown(lap)[GODOWNS[2]], 7)
  assert.equal(bill.supplierRef, po.id)
  assert.throws(() => receivePurchaseOrder(ctx, po.id), /already been received/)
  assert.ok(trialBalance(ctx.db).balanced)
})
