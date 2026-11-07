import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { ensureBooks, createInvoice } from './booksServer.js'
import { buildGstr1, buildGstr3b, setOff, reconcile2b, generateIrn, cancelIrn, generateEwb, ewbValidityDays, financialYear, B2CL_LIMIT } from './gstServer.js'

const company = { id: 'gst-unit-IN', country: 'IN', name: 'GST Test Pvt Ltd', taxId: '27AABCU9603R1ZX' }
const fresh = () => { const db = { returns: [] }; ensureBooks(db, company); return { db, company, books: db.books } }
const item = (ctx, sku) => ctx.books.items.find(i => i.sku === sku)

test('GSTR-1 puts registered buyers in B2B and walk-in sales in B2CS, with an HSN summary', () => {
  const ctx = fresh()
  const r = buildGstr1(ctx.books, company)
  assert.equal(r.json.gstin, company.taxId)
  assert.ok(r.counts.b2b >= 3, 'three registered customers')
  assert.ok(r.json.b2cs.some(x => x.sply_ty === 'INTRA'), 'walk-in Maharashtra sale is intra-state B2CS')
  const wipro = r.json.b2b.find(x => x.ctin.startsWith('29'))
  assert.ok(wipro.inv[0].itms.every(i => i.itm_det.iamt > 0 && i.itm_det.camt === 0), 'Karnataka buyer = IGST only')
  assert.match(wipro.inv[0].idt, /^\d{2}-\d{2}-\d{4}$/, 'GSTN date format dd-mm-yyyy')
  const hsnTax = r.json.hsn.data.reduce((s, h) => s + h.iamt + h.camt + h.samt, 0)
  assert.equal(Math.round(hsnTax * 100) / 100, Math.round((r.totals.igst + r.totals.cgst + r.totals.sgst) * 100) / 100, 'HSN summary ties to invoice tax')
})

test('large inter-state sales to unregistered buyers go to B2CL', () => {
  const ctx = fresh()
  ctx.books.parties.push({ id: 'PTY-X', name: 'Unregistered Delhi Buyer', type: 'customer', state: '07', gstin: null, terms: 0, creditLimit: 0 })
  createInvoice(ctx, { partyId: 'PTY-X', lines: [{ itemId: item(ctx, 'LAP-5440').id, qty: 2 }] })
  const r = buildGstr1(ctx.books, company)
  assert.equal(r.counts.b2cl, 1)
  assert.ok(r.json.b2cl[0].inv[0].val > B2CL_LIMIT)
})

test('ITC set-off follows the statutory order; CGST never pays SGST', () => {
  const r = setOff({ igst: 1000, cgst: 500, sgst: 500 }, { igst: 1200, cgst: 0, sgst: 800 })
  assert.deepEqual(r.used[0], { from: 'igst', to: 'igst', amount: 1000 })
  assert.deepEqual(r.used[1], { from: 'igst', to: 'cgst', amount: 200 })
  assert.equal(r.cashPayable.cgst, 300, 'SGST credit cannot pay CGST')
  assert.equal(r.cashPayable.sgst, 0)
  assert.equal(r.creditCarriedForward.sgst, 300)
})

test('GSTR-2B limits credit to what suppliers reported', () => {
  const ctx = fresh()
  const recon = reconcile2b(ctx.books)
  assert.ok(recon.summary.missing_in_books >= 1)
  const inBooks = ctx.books.bills.filter(b => b.journalId && b.partyGstin).reduce((s, b) => s + b.tax, 0)
  const eligible = recon.eligible.igst + recon.eligible.cgst + recon.eligible.sgst
  assert.ok(eligible < inBooks, 'missing and short-reported invoices reduce eligible credit')
  const g3b = buildGstr3b(ctx.books, undefined, recon.eligible)
  assert.ok(g3b.table4.reversed.igst + g3b.table4.reversed.cgst + g3b.table4.reversed.sgst > 0)
})

test('the IRN is the SHA-256 of GSTIN + financial year + type + number, and cancels only within 24 hours', async () => {
  const ctx = fresh()
  const inv = ctx.books.invoices.find(i => i.partyGstin)
  const r = await generateIrn(ctx.books, company, inv.id)
  const expected = createHash('sha256').update(`${company.taxId}${financialYear(inv.date)}INV${inv.number}`).digest('hex')
  assert.equal(r.irn, expected)
  assert.equal(r.ackNo.length, 15)
  await assert.rejects(generateIrn(ctx.books, company, inv.id), /already has an IRN/)
  const walkIn = ctx.books.invoices.find(i => !i.partyGstin)
  await assert.rejects(generateIrn(ctx.books, company, walkIn.id), /registered buyers/)
  const later = new Date(Date.now() + 25 * 3600 * 1000)
  assert.throws(() => cancelIrn(ctx.books, inv.id, 'x', later), /within 24 hours/)
  assert.ok(cancelIrn(ctx.books, inv.id, 'Wrong rate').cancelled)
})

test('e-way bills: needed above ₹50,000, one day per 200 km, valid vehicle number', () => {
  assert.equal(ewbValidityDays(150), 1)
  assert.equal(ewbValidityDays(200), 1)
  assert.equal(ewbValidityDays(201), 2)
  assert.equal(ewbValidityDays(950), 5)
  const ctx = fresh()
  const big = ctx.books.invoices.find(i => i.total > 50000 && i.lines.some(l => !l.hsn.startsWith('99')))
  assert.throws(() => generateEwb(ctx.books, big.id, { vehicleNo: 'BAD', distanceKm: 300 }), /vehicle number/)
  const e = generateEwb(ctx.books, big.id, { vehicleNo: 'mh12 ab 1234', distanceKm: 450 })
  assert.equal(e.validityDays, 3)
  assert.equal(e.ewbNo.length, 12)
  assert.equal(e.vehicleNo, 'MH12AB1234')
  const small = ctx.books.invoices.find(i => i.total <= 50000)
  if (small) assert.throws(() => generateEwb(ctx.books, small.id, { vehicleNo: 'MH12AB1234', distanceKm: 10 }), /only above/)
})
