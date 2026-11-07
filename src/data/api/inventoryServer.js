/**
 * Warehouses (godowns), stock transfers, reorder suggestions and purchase orders (mock backend).
 * Stock layers carry a godown; a transfer moves layers at their original cost (no profit, no journal).
 * Reorder suggestions turn into purchase orders per supplier; receiving a PO creates the bill.
 */
import { round2 } from '../../lib/fx.js'
import { ensureBooks, stockOf, createBill } from './booksServer.js'

export const GODOWNS = ['Main Warehouse', 'Pune Branch', 'Bengaluru Hub']
const today = () => new Date().toISOString().slice(0, 10)
const godownOf = layer => layer.godown || GODOWNS[0]

class InvError extends Error { constructor(m) { super(m); this.status = 422 } }
const fail = m => { throw new InvError(m) }

export function stockByGodown(item) {
  const out = Object.fromEntries(GODOWNS.map(g => [g, 0]))
  for (const l of item.layers ?? []) out[godownOf(l)] = round2((out[godownOf(l)] || 0) + l.qty)
  return out
}

export function transferStock(books, { itemId, qty, from, to, date = today() }) {
  const item = books.items.find(i => i.id === itemId)
  if (!item || item.type === 'service') fail('Choose a stocked item')
  if (!GODOWNS.includes(from) || !GODOWNS.includes(to)) fail('Choose warehouses that exist')
  if (from === to) fail('Pick two different warehouses')
  let left = Number(qty)
  if (!(left > 0)) fail('Enter a quantity to move')
  const available = stockByGodown(item)[from]
  if (left > available) fail(`Only ${available} ${item.unit} of ${item.name} in ${from}`)
  const moved = []
  for (const layer of [...item.layers].filter(l => godownOf(l) === from).sort((a, b) => a.date.localeCompare(b.date))) {
    if (left <= 0) break
    const take = Math.min(layer.qty, left)
    layer.qty = round2(layer.qty - take)
    moved.push({ ...layer, qty: take, godown: to, date: layer.date })
    left = round2(left - take)
  }
  item.layers = [...item.layers.filter(l => l.qty > 0), ...moved]
  const value = round2(moved.reduce((s, l) => s + l.qty * l.unitCost, 0))
  books.transfers ??= []
  const t = { id: `ST-${String(books.transfers.length + 1).padStart(4, '0')}`, itemId, item: item.name, qty: Number(qty), from, to, value, date }
  books.transfers.push(t)
  return t
}

/** Items at or below reorder level, with a suggested quantity and the last supplier and price. */
export function reorderSuggestions(books) {
  return books.items.filter(i => i.type !== 'service' && i.reorderLevel != null).map(i => {
    const { qty } = stockOf(i)
    if (qty > i.reorderLevel) return null
    const lastBill = [...books.bills].reverse().find(b => b.lines.some(l => l.itemId === i.id))
    const lastLine = lastBill?.lines.find(l => l.itemId === i.id)
    const onOrder = (books.purchaseOrders ?? []).filter(p => p.status === 'open').flatMap(p => p.lines).filter(l => l.itemId === i.id).reduce((s, l) => s + l.qty, 0)
    const suggest = Math.max(i.reorderLevel * 2 - qty - onOrder, 0)
    return { itemId: i.id, name: i.name, onHand: qty, reorderLevel: i.reorderLevel, onOrder, suggestQty: suggest,
      supplierId: lastBill?.partyId ?? null, supplier: lastBill?.partyName ?? null, lastRate: lastLine ? round2(lastLine.taxable / lastLine.qty) : null }
  }).filter(Boolean)
}

export function createPurchaseOrders(books, { itemIds } = {}) {
  books.purchaseOrders ??= []
  const picks = reorderSuggestions(books).filter(s => s.suggestQty > 0 && s.supplierId && (!itemIds || itemIds.includes(s.itemId)))
  if (!picks.length) fail('Nothing to order — no item below its reorder level has a known supplier')
  const bySupplier = {}
  for (const s of picks) (bySupplier[s.supplierId] ??= { partyId: s.supplierId, partyName: s.supplier, lines: [] }).lines.push({ itemId: s.itemId, name: s.name, qty: s.suggestQty, rate: s.lastRate })
  return Object.values(bySupplier).map(po => {
    const order = { id: `PO-${String(books.purchaseOrders.length + 1).padStart(4, '0')}`, ...po, date: today(), status: 'open',
      total: round2(po.lines.reduce((s, l) => s + l.qty * l.rate, 0)) }
    books.purchaseOrders.push(order)
    return order
  })
}

export function receivePurchaseOrder(ctx, poId, { godown = GODOWNS[0] } = {}) {
  const books = ctx.db.books
  const po = (books.purchaseOrders ?? []).find(p => p.id === poId)
  if (!po) fail('Purchase order not found')
  if (po.status !== 'open') fail('This purchase order has already been received')
  const bill = createBill(ctx, { partyId: po.partyId, supplierRef: po.id, lines: po.lines.map(l => ({ itemId: l.itemId, qty: l.qty, rate: l.rate })) }, { user: ctx.user })
  // New stock lands in the chosen warehouse
  if (bill.journalId) for (const it of books.items) for (const l of it.layers) if (l.source === bill.id) l.godown = godown
  po.status = 'received'; po.billId = bill.id
  return { po, bill }
}

export function registerInventoryRoutes(route, { ok, badRequest }) {
  const w = h => ctx => {
    ensureBooks(ctx.db, ctx.company)
    try { return h(ctx, ctx.db.books) } catch (e) { if (e instanceof InvError || e.status === 422) badRequest(e.message, e.details); throw e }
  }
  route('GET', '/books/godowns', w((_, books) => ok(GODOWNS.map(g => ({
    name: g, items: books.items.filter(i => i.type !== 'service').map(i => ({ itemId: i.id, name: i.name, qty: stockByGodown(i)[g] })).filter(x => x.qty > 0),
  })))), { summary: 'Stock in each warehouse' })
  route('POST', '/books/stock/transfer', w(({ body, save }, books) => {
    const t = transferStock(books, body || {}); save()
    return ok({ ...t, auditSummary: `Moved ${t.qty} ${t.item} from ${t.from} to ${t.to}` }, 201)
  }), { summary: 'Move stock between warehouses (at cost)' })
  route('GET', '/books/reorder', w((_, books) => ok(reorderSuggestions(books))), { summary: 'Items to reorder with suggested quantities' })
  route('GET', '/books/purchase-orders', w((_, books) => ok([...(books.purchaseOrders ?? [])].reverse())), { summary: 'Purchase orders' })
  route('POST', '/books/purchase-orders', w(({ body, save }, books) => {
    const pos = createPurchaseOrders(books, body || {}); save()
    return ok({ created: pos, auditSummary: `${pos.length} purchase order(s) raised from reorder suggestions` }, 201)
  }), { summary: 'Raise purchase orders from reorder suggestions' })
  route('POST', '/books/purchase-orders/:id/receive', w((ctx) => {
    const r = receivePurchaseOrder(ctx, ctx.params.id, ctx.body || {}); ctx.save()
    return ok({ ...r, auditSummary: `${r.po.id} received as bill ${r.bill.id}` })
  }), { summary: 'Receive goods on a purchase order (creates the bill)' })
}
