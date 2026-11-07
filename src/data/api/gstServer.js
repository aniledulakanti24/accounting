/**
 * India GST from the books (mock GSTN / IRP / e-way bill portal).
 *
 *  - GSTR-1 in the GSTN JSON layout (b2b, b2cl, b2cs, cdnr, hsn, doc_issue) from posted invoices
 *  - GSTR-3B with input-tax-credit set-off in the statutory order (IGST first, CGST/SGST never against each other)
 *  - e-invoice: IRN = SHA-256(supplier GSTIN + financial year + document type + document number), the IRP formula
 *  - e-way bill for goods over ₹50,000: validity of 1 day per 200 km (part day counts as a day)
 *  - GSTR-2B: the supplier-reported side; only invoices present in 2B carry eligible credit
 */
import { round2 } from '../../lib/fx.js'
import { sha256Hex } from './authServer.js'
import { ensureBooks, homeStateOf } from './booksServer.js'

export const B2CL_LIMIT = 100000      // inter-state B2C invoices above this are reported invoice-wise
export const EWB_THRESHOLD = 50000

const pad = n => String(n).padStart(2, '0')
const toGstDate = iso => `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}`
const inPeriod = (date, period) => !period || date.slice(0, 7) === period
const fp = period => `${period.slice(5, 7)}${period.slice(0, 4)}`
const sumBy = (list, k) => round2(list.reduce((s, x) => s + (x[k] || 0), 0))

class GstError extends Error { constructor(m, d) { super(m); this.status = 422; this.details = d } }
const fail = (m, d) => { throw new GstError(m, d) }

export function financialYear(iso) {
  const y = Number(iso.slice(0, 4)); const m = Number(iso.slice(5, 7))
  const start = m >= 4 ? y : y - 1
  return `${start}-${String(start + 1).slice(2)}`
}

function rateRows(inv) {
  const byRate = {}
  for (const l of inv.lines) {
    const r = byRate[l.taxRate] ??= { rt: l.taxRate, txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 }
    r.txval = round2(r.txval + l.taxable); r.iamt = round2(r.iamt + l.igst); r.camt = round2(r.camt + l.cgst); r.samt = round2(r.samt + l.sgst)
  }
  return Object.values(byRate)
}

export function buildGstr1(books, company, period) {
  const gstin = company.taxId
  const home = homeStateOf(company)
  const invs = books.invoices.filter(i => inPeriod(i.date, period))
  const b2b = {}; const b2cl = {}; const b2cs = {}; const hsn = {}
  for (const inv of invs) {
    const pos = inv.placeOfSupply || home
    const items = rateRows(inv)
    if (inv.partyGstin) {
      (b2b[inv.partyGstin] ??= { ctin: inv.partyGstin, inv: [] }).inv.push({
        inum: inv.number, idt: toGstDate(inv.date), val: inv.total, pos, rchrg: 'N', inv_typ: 'R',
        itms: items.map((it, n) => ({ num: n + 1, itm_det: it })),
      })
    } else if (pos !== home && inv.total > B2CL_LIMIT) {
      (b2cl[pos] ??= { pos, inv: [] }).inv.push({ inum: inv.number, idt: toGstDate(inv.date), val: inv.total, itms: items.map((it, n) => ({ num: n + 1, itm_det: it })) })
    } else {
      for (const it of items) {
        const key = `${pos}|${it.rt}`
        const row = b2cs[key] ??= { sply_ty: pos === home ? 'INTRA' : 'INTER', pos, typ: 'OE', rt: it.rt, txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 }
        row.txval = round2(row.txval + it.txval); row.iamt = round2(row.iamt + it.iamt); row.camt = round2(row.camt + it.camt); row.samt = round2(row.samt + it.samt)
      }
    }
    for (const l of inv.lines) {
      const key = `${l.hsn}|${l.taxRate}`
      const h = hsn[key] ??= { hsn_sc: l.hsn, desc: l.description.slice(0, 30), uqc: (l.unit || 'NOS').toUpperCase().slice(0, 3), qty: 0, rt: l.taxRate, txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 }
      h.qty = round2(h.qty + l.qty); h.txval = round2(h.txval + l.taxable); h.iamt = round2(h.iamt + l.igst); h.camt = round2(h.camt + l.cgst); h.samt = round2(h.samt + l.sgst)
    }
  }
  const cdnr = books.creditNotes.filter(c => inPeriod(c.date, period)).map(c => {
    const inv = books.invoices.find(i => i.id === c.invoiceId)
    return inv?.partyGstin ? { ctin: inv.partyGstin, nt: [{ ntty: 'C', nt_num: c.id, nt_dt: toGstDate(c.date), val: c.total, pos: inv.placeOfSupply, rchrg: 'N', inv_typ: 'R' }] } : null
  }).filter(Boolean)
  const numbers = invs.map(i => i.number).sort()
  const json = {
    gstin, fp: period ? fp(period) : null, version: 'GST3.1.6', hash: 'hash',
    b2b: Object.values(b2b), b2cl: Object.values(b2cl), b2cs: Object.values(b2cs), cdnr,
    hsn: { data: Object.values(hsn).map((h, n) => ({ num: n + 1, ...h, val: round2(h.txval + h.iamt + h.camt + h.samt) })) },
    doc_issue: { doc_det: numbers.length ? [{ doc_num: 1, docs: [{ num: 1, from: numbers[0], to: numbers[numbers.length - 1], totnum: numbers.length, cancel: 0, net_issue: numbers.length }] }] : [] },
  }
  const totals = { invoices: invs.length, taxable: sumBy(invs, 'subtotal'), igst: sumBy(invs, 'igst'), cgst: sumBy(invs, 'cgst'), sgst: sumBy(invs, 'sgst') }
  return { period, json, totals, counts: { b2b: json.b2b.reduce((s, x) => s + x.inv.length, 0), b2cl: json.b2cl.reduce((s, x) => s + x.inv.length, 0), b2cs: json.b2cs.length, cdnr: cdnr.length, hsn: json.hsn.data.length } }
}

/**
 * Use input tax credit against output tax in the order the law sets:
 * IGST credit → IGST, then CGST, then SGST; CGST credit → CGST, then IGST; SGST credit → SGST, then IGST.
 * CGST credit is never used against SGST or the other way round.
 */
export function setOff(liability, credit) {
  const due = { ...liability }; const itc = { ...credit }; const used = []
  const apply = (from, to) => {
    const amt = round2(Math.min(itc[from], due[to]))
    if (amt <= 0) return
    itc[from] = round2(itc[from] - amt); due[to] = round2(due[to] - amt)
    used.push({ from, to, amount: amt })
  }
  apply('igst', 'igst'); apply('igst', 'cgst'); apply('igst', 'sgst')
  apply('cgst', 'cgst'); apply('cgst', 'igst')
  apply('sgst', 'sgst'); apply('sgst', 'igst')
  return { cashPayable: due, creditCarriedForward: itc, used }
}

export function buildGstr3b(books, period, eligibleItc) {
  const invs = books.invoices.filter(i => inPeriod(i.date, period))
  const cns = books.creditNotes.filter(c => inPeriod(c.date, period))
  const bills = books.bills.filter(b => inPeriod(b.date, period) && b.journalId)
  const cnTax = { igst: 0, cgst: 0, sgst: 0 }
  for (const c of cns) {
    const inv = books.invoices.find(i => i.id === c.invoiceId)
    if (!inv) continue
    cnTax.igst += round2(inv.igst * c.share); cnTax.cgst += round2(inv.cgst * c.share); cnTax.sgst += round2(inv.sgst * c.share)
  }
  const outward = {
    txval: round2(sumBy(invs, 'subtotal') - sumBy(cns, 'taxable')),
    igst: round2(sumBy(invs, 'igst') - cnTax.igst), cgst: round2(sumBy(invs, 'cgst') - cnTax.cgst), sgst: round2(sumBy(invs, 'sgst') - cnTax.sgst),
  }
  const claimed = { igst: sumBy(bills, 'igst'), cgst: sumBy(bills, 'cgst'), sgst: sumBy(bills, 'sgst') }
  const itc = eligibleItc ?? claimed
  const result = setOff({ igst: outward.igst, cgst: outward.cgst, sgst: outward.sgst }, itc)
  return {
    period,
    table31a: outward,
    table4: { itcInBooks: claimed, eligible: itc, reversed: { igst: round2(claimed.igst - itc.igst), cgst: round2(claimed.cgst - itc.cgst), sgst: round2(claimed.sgst - itc.sgst) } },
    table61: result,
    totalCash: round2(result.cashPayable.igst + result.cashPayable.cgst + result.cashPayable.sgst),
  }
}

/* ── GSTR-2B: what suppliers reported. Deterministic so tests can rely on it. ── */
export function gstr2bFor(books, period) {
  const bills = books.bills.filter(b => inPeriod(b.date, period) && b.journalId && b.partyGstin)
  const reported = []
  bills.forEach((b, i) => {
    if (i % 4 === 3) return                                            // supplier has not filed this one yet
    const tweak = i % 5 === 1 ? 0.97 : 1                               // supplier reported a lower taxable value
    reported.push({ ctin: b.partyGstin, supplier: b.partyName, inum: b.supplierRef, dt: b.date, txval: round2(b.subtotal * tweak), igst: round2(b.igst * tweak), cgst: round2(b.cgst * tweak), sgst: round2(b.sgst * tweak), billId: b.id })
  })
  if (bills.length) reported.push({ ctin: bills[0].partyGstin, supplier: bills[0].partyName, inum: 'NOT-IN-BOOKS-01', dt: bills[0].date, txval: 12000, igst: 2160, cgst: 0, sgst: 0, billId: null })
  return reported
}

export function reconcile2b(books, period) {
  const bills = books.bills.filter(b => inPeriod(b.date, period) && b.journalId && b.partyGstin)
  const twoB = gstr2bFor(books, period)
  const rows = bills.map(b => {
    const r = twoB.find(x => x.billId === b.id)
    const bookTax = round2(b.igst + b.cgst + b.sgst)
    if (!r) return { billId: b.id, supplier: b.partyName, gstin: b.partyGstin, ref: b.supplierRef, bookTax, portalTax: 0, status: 'missing_in_2b', eligible: { igst: 0, cgst: 0, sgst: 0 } }
    const portalTax = round2(r.igst + r.cgst + r.sgst)
    const same = Math.abs(portalTax - bookTax) < 1
    // Credit is limited to what the supplier reported
    return { billId: b.id, supplier: b.partyName, gstin: b.partyGstin, ref: b.supplierRef, bookTax, portalTax, status: same ? 'matched' : 'mismatch',
      eligible: { igst: Math.min(b.igst, r.igst), cgst: Math.min(b.cgst, r.cgst), sgst: Math.min(b.sgst, r.sgst) } }
  })
  twoB.filter(x => !x.billId).forEach(x => rows.push({ billId: null, supplier: x.supplier, gstin: x.ctin, ref: x.inum, bookTax: 0, portalTax: round2(x.igst + x.cgst + x.sgst), status: 'missing_in_books', eligible: { igst: 0, cgst: 0, sgst: 0 } }))
  const eligible = { igst: sumBy(rows.map(r => r.eligible), 'igst'), cgst: sumBy(rows.map(r => r.eligible), 'cgst'), sgst: sumBy(rows.map(r => r.eligible), 'sgst') }
  const count = s => rows.filter(r => r.status === s).length
  return { period, rows, eligible, summary: { matched: count('matched'), mismatch: count('mismatch'), missing_in_2b: count('missing_in_2b'), missing_in_books: count('missing_in_books') } }
}

/* ── e-invoice (IRP) ── */
export async function generateIrn(books, company, invoiceId) {
  const inv = books.invoices.find(i => i.id === invoiceId)
  if (!inv) fail('Invoice not found')
  if (!inv.partyGstin) fail('e-invoices are for registered buyers (B2B). This invoice has no buyer GSTIN.')
  if (inv.irn && !inv.irnCancelled) fail('This invoice already has an IRN', { irn: inv.irn })
  const missing = inv.lines.filter(l => !/^\d{4,8}$/.test(l.hsn || ''))
  if (missing.length) fail(`HSN/SAC code missing or invalid on: ${missing.map(l => l.description).join(', ')}`)
  if (inv.number.length > 16) fail('Document number must be 16 characters or fewer')
  const fy = financialYear(inv.date)
  const irn = await sha256Hex(`${company.taxId}${fy}INV${inv.number}`)
  const now = new Date()
  const ackNo = `1${String(now.getTime()).padStart(14, "0").slice(-14)}`
  const payload = {
    SellerGstin: company.taxId, BuyerGstin: inv.partyGstin, DocNo: inv.number, DocTyp: 'INV', DocDt: toGstDate(inv.date),
    TotInvVal: inv.total, ItemCnt: inv.lines.length, MainHsnCode: inv.lines[0].hsn, Irn: irn, IrnDt: now.toISOString().slice(0, 19).replace('T', ' '),
  }
  const b64 = s => { let bin = ''; new TextEncoder().encode(s).forEach(c => { bin += String.fromCharCode(c) }); return btoa(bin) }
  Object.assign(inv, { irn, ackNo, ackDate: now.toISOString(), signedQr: `${b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64(JSON.stringify({ data: JSON.stringify(payload) }))}.sig-mock`, qrPayload: payload, irnCancelled: false })
  return { invoiceId, irn, ackNo, ackDate: inv.ackDate, qrPayload: payload, signedQr: inv.signedQr }
}

export function cancelIrn(books, invoiceId, reason, now = new Date()) {
  const inv = books.invoices.find(i => i.id === invoiceId)
  if (!inv?.irn || inv.irnCancelled) fail('There is no active IRN on this invoice')
  if ((now - new Date(inv.ackDate)) > 24 * 3600 * 1000) fail('An IRN can only be cancelled within 24 hours — issue a credit note instead')
  inv.irnCancelled = true
  inv.irnCancelReason = reason || 'Data entry mistake'
  return { invoiceId, irn: inv.irn, cancelled: true }
}

/* ── e-way bill ── */
export function ewbValidityDays(distanceKm) {
  return Math.max(1, Math.ceil(Number(distanceKm) / 200))
}

export function generateEwb(books, invoiceId, { vehicleNo, distanceKm, transporterId } = {}, now = new Date()) {
  const inv = books.invoices.find(i => i.id === invoiceId)
  if (!inv) fail('Invoice not found')
  const goods = inv.lines.filter(l => !String(l.hsn).startsWith('99'))
  if (!goods.length) fail('No goods on this invoice — services do not need an e-way bill')
  if (inv.total <= EWB_THRESHOLD) fail(`An e-way bill is needed only above ₹${EWB_THRESHOLD.toLocaleString('en-IN')} (this invoice is ₹${inv.total.toLocaleString('en-IN')})`)
  const km = Number(distanceKm)
  if (!(km > 0 && km <= 4000)) fail('Enter the distance in km (1 to 4000)')
  const vehicle = String(vehicleNo || '').toUpperCase().replace(/\s|-/g, '')
  if (!transporterId && !/^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}$/.test(vehicle)) fail('Enter a vehicle number like MH12AB1234, or a transporter ID')
  if (inv.ewb && !inv.ewb.cancelled) fail('This invoice already has an e-way bill', { ewbNo: inv.ewb.ewbNo })
  const days = ewbValidityDays(km)
  // Validity runs to midnight of the last day
  const until = new Date(now); until.setDate(until.getDate() + days); until.setHours(23, 59, 59, 0)
  const ewbNo = String(1e11 + (now.getTime() % 9e11)).slice(0, 12)
  inv.ewb = { ewbNo, generatedAt: now.toISOString(), validUntil: until.toISOString(), validityDays: days, distanceKm: km, vehicleNo: vehicle || null, transporterId: transporterId || null, cancelled: false }
  return { invoiceId, ...inv.ewb }
}

/* ── Routes ── */
export function registerGstRoutes(route, { ok, badRequest }) {
  const india = h => async ctx => {
    if (ctx.company.country !== 'IN') badRequest('GST returns from the books are for India. Other countries file from Tax → Returns.')
    ensureBooks(ctx.db, ctx.company)
    try { return await h(ctx, ctx.db.books) } catch (e) { if (e instanceof GstError) badRequest(e.message, e.details); throw e }
  }
  route('GET', '/gst/periods', india((_, books) => {
    const months = [...new Set([...books.invoices, ...books.bills].map(d => d.date.slice(0, 7)))].sort().reverse()
    return ok(months)
  }), { summary: 'Months that have GST activity' })
  route('GET', '/gst/gstr1', india(({ company, query }, books) => ok(buildGstr1(books, company, query.period))), { summary: 'GSTR-1 in GSTN JSON layout (?period=YYYY-MM)' })
  route('GET', '/gst/gstr3b', india(({ query }, books) => {
    const recon = reconcile2b(books, query.period)
    return ok({ ...buildGstr3b(books, query.period, recon.eligible), twoB: recon.summary })
  }), { summary: 'GSTR-3B with ITC limited to GSTR-2B and statutory set-off' })
  route('GET', '/gst/2b-recon', india(({ query }, books) => ok(reconcile2b(books, query.period))), { summary: 'Purchase register vs GSTR-2B' })
  route('POST', '/gst/einvoice/:id', india(async ({ company, params, save }, books) => {
    const r = await generateIrn(books, company, params.id); save()
    return ok({ ...r, auditSummary: `IRN generated for ${params.id}` }, 201)
  }), { summary: 'Generate an e-invoice IRN and signed QR' })
  route('POST', '/gst/einvoice/:id/cancel', india(({ params, body, save }, books) => {
    const r = cancelIrn(books, params.id, body?.reason); save()
    return ok({ ...r, auditSummary: `IRN cancelled for ${params.id}` })
  }), { summary: 'Cancel an IRN (within 24 hours)' })
  route('POST', '/gst/ewaybill/:id', india(({ params, body, save }, books) => {
    const r = generateEwb(books, params.id, body || {}); save()
    return ok({ ...r, auditSummary: `E-way bill ${r.ewbNo} generated` }, 201)
  }), { summary: 'Generate an e-way bill (validity from distance)' })
}

export { pad, toGstDate }
