/**
 * Deterministic seed generator for the mock tax backend.
 * Given a company (id + country) it produces returns, e-invoices, withholding
 * entries, secondary-scheme entries, tax payments and an input-tax
 * reconciliation set that are internally consistent.
 */
import { getTaxCatalog } from './taxCatalog.js'
import { COUNTRY_BY_CODE } from '../../lib/countryTax.js'
import { USD_RATES_WORLD } from '../../lib/countries/worldCountries.js'

/* ── Deterministic PRNG (mulberry32) ── */
function hashString(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}
export function makeRng(seed) {
  let a = hashString(String(seed))
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const between = (rng, min, max) => min + (max - min) * rng()
const pick = (rng, list) => list[Math.floor(rng() * list.length)]
const round2 = (n) => Math.round(n * 100) / 100

/* Monthly taxable sales baseline in local currency */
const MONTHLY_SALES = {
  IN: 12000000, US: 150000, GB: 110000, AE: 520000,
  CA: 180000, AU: 200000, DE: 130000, SG: 190000,
}

const PARTIES = {
  IN: { customers: ['Infosys BPO Ltd', 'Tech Mahindra', 'Wipro Digital', 'Reliance Retail', 'Tata Consultancy'], suppliers: ['Dell India Pvt Ltd', 'Airtel Business', 'Godrej Interio', 'Blue Dart Express', 'Amazon Web Services India'] },
  US: { customers: ['Brightline Health Inc.', 'Northwind Traders LLC', 'Summit Analytics Corp.', 'Harbor Logistics Inc.', 'Redwood Retail Co.'], suppliers: ['Office Depot', 'Comcast Business', 'FedEx Freight', 'Staples Inc.', 'AWS Inc.'] },
  GB: { customers: ['Albion Retail Ltd', 'Thames Digital Ltd', 'Pennine Foods plc', 'Crown Media Ltd', 'Highland Outdoor Ltd'], suppliers: ['BT Business', 'Royal Mail Group', 'Screwfix Trade', 'Viking Direct', 'Kier Construction Ltd'] },
  AE: { customers: ['Emirates Trading LLC', 'Gulf Star General Trading', 'Al Noor Hospitality', 'Desert Rose Interiors', 'Marina Tech FZ-LLC'], suppliers: ['Etisalat (e&)', 'DEWA', 'Aramex', 'Emirates NBD Facilities', 'Al Futtaim Engineering'] },
  CA: { customers: ['Maple Leaf Distributors', 'Northern Lights Media', 'Rideau Consulting Inc.', 'Pacific Coast Outfitters', 'Laurentian Foods'], suppliers: ['Bell Business', 'Canada Post', 'Staples Canada', 'Purolator Inc.', 'Telus Communications'] },
  AU: { customers: ['Southern Cross Retail Pty Ltd', 'Harbour Bridge Media', 'Outback Supplies Pty Ltd', 'Coral Coast Tourism', 'Yarra Analytics'], suppliers: ['Telstra Business', 'Australia Post', 'Officeworks', 'Bunnings Trade', 'Toll Group'] },
  DE: { customers: ['Müller Handels GmbH', 'Schwarzwald Digital AG', 'Rheinland Logistik GmbH', 'Bayern Maschinenbau KG', 'Hanse Retail GmbH'], suppliers: ['Deutsche Telekom AG', 'DHL Paket GmbH', 'Würth GmbH', 'Bauhaus AG', 'SAP Deutschland SE'] },
  SG: { customers: ['Lion City Trading Pte Ltd', 'Marina Bay Ventures', 'Orchard Retail Pte Ltd', 'Jurong Logistics', 'Sentosa Hospitality'], suppliers: ['Singtel Business', 'SingPost', 'Challenger Technologies', 'Ninja Van', 'SP Group'] },
}

const GENERIC_PARTIES = {
  customers: ['Global Trade Partners Ltd', 'Meridian Retail Group', 'Northwind Distributors', 'Summit Industrial Co.', 'Bluewave Hospitality'],
  suppliers: ['Prime Logistics Co.', 'Metro Office Supplies', 'National Telecom', 'City Power & Utilities', 'Apex IT Services'],
}

export function partiesFor(country) {
  return PARTIES[country] || GENERIC_PARTIES
}

/** Typical monthly taxable sales in local currency (≈ USD 150k, scaled by FX). */
function monthlySales(country) {
  if (MONTHLY_SALES[country]) return MONTHLY_SALES[country]
  const currency = COUNTRY_BY_CODE[country]?.currency
  const perUsd = USD_RATES_WORLD[currency] ?? 1
  return Math.round(150000 * perUsd)
}

/* ── Period + due-date helpers ── */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function lastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0)
}

export function computeDueDate(periodEnd, dueRule) {
  const end = new Date(periodEnd)
  const endMonth = end.getMonth()
  switch (dueRule.kind) {
    case 'dayOfNextMonth': {
      let add = dueRule.months ?? 1
      let day = dueRule.day
      if (dueRule.decemberQuarterMonths && endMonth === 11) add = dueRule.decemberQuarterMonths
      if (dueRule.decemberQuarterDay && endMonth === 11) day = dueRule.decemberQuarterDay
      // Per-period exceptions keyed by the 0-based month the period ends in (e.g. NZ GST)
      const override = dueRule.overrides?.[endMonth]
      if (override) { add = override.months ?? add; day = override.day ?? day }
      const target = new Date(end.getFullYear(), endMonth + add, 1)
      const last = lastDayOfMonth(target.getFullYear(), target.getMonth()).getDate()
      return new Date(target.getFullYear(), target.getMonth(), Math.min(day, last))
    }
    case 'daysAfter':
      return new Date(end.getFullYear(), endMonth, end.getDate() + (dueRule.days ?? 30))
    case 'monthsPlusDays': {
      const target = lastDayOfMonth(end.getFullYear(), endMonth + (dueRule.months ?? 1))
      return new Date(target.getFullYear(), target.getMonth(), target.getDate() + (dueRule.days ?? 0))
    }
    case 'monthEnd':
    default:
      return lastDayOfMonth(end.getFullYear(), endMonth + (dueRule.months ?? 1))
  }
}

const STEP = { monthly: 1, bimonthly: 2, quarterly: 3, annual: 12 }

function buildPeriods(frequency, today, count = 6, phase = 0) {
  const step = STEP[frequency] ?? 3
  if (step === 12) count = Math.min(count, 3)
  // Start of the current (open) period
  // phase shifts the cycle, e.g. NZ two-monthly periods ending in odd months, JP April–March year
  const curStartMonth = Math.floor((today.getMonth() - phase) / step) * step + phase
  const periods = []
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(today.getFullYear(), curStartMonth - i * step, 1)
    const end = lastDayOfMonth(start.getFullYear(), start.getMonth() + step - 1)
    const label = step === 1
      ? `${MONTHS[start.getMonth()]} ${start.getFullYear()}`
      : step === 3
        ? `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()} (${MONTHS[start.getMonth()]}–${MONTHS[end.getMonth()]})`
        : step === 12
          ? `FY ${start.getFullYear()}`
          : `${MONTHS[start.getMonth()]}–${MONTHS[end.getMonth()]} ${end.getFullYear()}`
    periods.push({ start, end, label, months: step, isCurrent: i === 0 })
  }
  return periods
}

function computeFigures(rng, country, months, rate) {
  const sales = round2(monthlySales(country) * months * between(rng, 0.85, 1.2))
  const outputTax = round2(sales * rate / 100)
  const purchases = round2(sales * between(rng, 0.45, 0.62))
  const inputTax = round2(purchases * rate / 100 * between(rng, 0.85, 0.97))
  const zeroRated = round2(sales * between(rng, 0.04, 0.1))
  const exempt = round2(sales * between(rng, 0.01, 0.04))
  const wages = round2(sales * between(rng, 0.2, 0.3))
  const payg = round2(wages * between(rng, 0.17, 0.22))
  const useTax = round2(purchases * 0.01 * rate / 100)
  return {
    sales, outputTax, purchases, inputTax, zeroRated, exempt, wages, payg, useTax,
    gross: round2(sales + exempt),
    grossInclTax: round2(sales + outputTax + zeroRated + exempt),
    net: round2(outputTax - inputTax),
    netNoCredit: round2(outputTax + useTax),
    netWithPayg: round2(outputTax - inputTax + payg),
    zero: 0,
  }
}

export function buildBoxes(catalog, figures) {
  return catalog.boxes.map(b => ({ box: b.box, label: b.label, kind: b.kind, amount: figures[b.kind] ?? 0 }))
}

export function netPayableFromBoxes(boxes) {
  const final = [...boxes].reverse().find(b => ['net', 'netNoCredit', 'netWithPayg'].includes(b.kind))
  return final ? final.amount : 0
}

const ACK_PREFIX = {
  IN: 'ARN-', US: 'CONF-', GB: 'MTD-', AE: 'FTA-', CA: 'CRA-', AU: 'ATO-', DE: 'ELS-', SG: 'IRAS-',
}

export function makeAckRef(country, rng = Math.random) {
  const digits = Array.from({ length: 10 }, () => Math.floor(rng() * 10)).join('')
  return `${ACK_PREFIX[country] || 'ACK-'}${digits}`
}

/* ── Main seed ── */
export function seedCompanyTaxData(company, today = new Date()) {
  const country = company?.country || 'IN'
  const catalog = getTaxCatalog(country)
  const rng = makeRng(`${company?.id}-${country}`)
  const parties = partiesFor(country)
  const todayIso = iso(today)

  /* Returns — one stream per jurisdiction where the country files per region (US) */
  // Countries without VAT/GST (e.g. Qatar, Hong Kong) have no periodic return
  const streams = !catalog.returnForm ? [] : country === 'US' && catalog.jurisdictions
    ? catalog.jurisdictions.map(j => ({ jurisdiction: j.name, authority: j.authority, rate: j.rate, frequency: j.frequency, dueRule: j.dueRule ?? catalog.dueRule, share: 1 / catalog.jurisdictions.length }))
    : [{ jurisdiction: null, authority: catalog.authority, rate: catalog.standardRate, frequency: catalog.frequency, dueRule: catalog.dueRule, share: 1 }]

  const returns = []
  streams.forEach((stream, si) => {
    buildPeriods(stream.frequency, today, 6, catalog.periodPhase ?? 0).forEach((p, pi) => {
      const figures = computeFigures(rng, country, p.months * stream.share, stream.rate)
      const boxes = buildBoxes(catalog, figures)
      const due = computeDueDate(p.end, stream.dueRule)
      const dueIso = iso(due)
      let status
      if (p.isCurrent) status = 'open'
      else if (dueIso < todayIso) status = 'filed'
      else status = 'ready'
      const filedAt = status === 'filed'
        ? iso(new Date(due.getFullYear(), due.getMonth(), due.getDate() - Math.floor(between(rng, 1, 8))))
        : null
      returns.push({
        id: `RET-${country}-${si}-${pi}`,
        form: catalog.returnForm,
        name: catalog.returnName,
        jurisdiction: stream.jurisdiction,
        authority: stream.authority,
        rate: stream.rate,
        frequency: stream.frequency,
        periodLabel: p.label,
        periodStart: iso(p.start),
        periodEnd: iso(p.end),
        dueDate: dueIso,
        status,
        boxes,
        netPayable: netPayableFromBoxes(boxes),
        filedAt,
        ackRef: status === 'filed' ? makeAckRef(country, rng) : null,
        paid: status === 'filed',
      })
    })
  })

  /* E-invoices */
  const ei = catalog.eInvoicing
  const eiStatuses = ei.status === 'mandatory' ? ['accepted', 'accepted', 'accepted', 'pending', 'rejected']
    : ei.status === 'phased' ? ['accepted', 'pending', 'pending', 'not-sent']
      : ei.status === 'voluntary' ? ['delivered', 'delivered', 'not-sent']
        : ['pdf-sent', 'pdf-sent', 'pdf-sent', 'delivered']
  const einvoices = Array.from({ length: 10 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i * 3 - 1)
    const net = round2(monthlySales(country) * between(rng, 0.02, 0.09))
    const tax = round2(net * catalog.standardRate / 100)
    const status = pick(rng, eiStatuses)
    return {
      id: `EI-${country}-${i + 1}`,
      invoiceNo: `INV-${today.getFullYear()}-${String(480 - i).padStart(4, '0')}`,
      date: iso(d),
      customer: pick(rng, parties.customers),
      net, tax, total: round2(net + tax),
      status,
      networkRef: ['accepted', 'delivered'].includes(status) ? `${ei.idLabel.split(' ')[0].toUpperCase()}-${Math.floor(rng() * 1e9)}` : null,
      error: status === 'rejected' ? pick(rng, ['Buyer tax ID failed validation', 'Duplicate invoice number', 'Schema error: missing unit code']) : null,
    }
  })

  /* Withholding */
  const withholding = catalog.withholding.length
    ? Array.from({ length: 8 }, (_, i) => {
      const scheme = catalog.withholding[i % catalog.withholding.length]
      const gross = round2(monthlySales(country) * between(rng, 0.01, 0.05))
      const withheld = round2(gross * scheme.rate / 100)
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i * 9 - 2)
      const status = i < 3 ? 'deducted' : i < 6 ? 'remitted' : 'certified'
      return {
        id: `WH-${country}-${i + 1}`,
        code: scheme.code,
        scheme: scheme.name,
        rate: scheme.rate,
        payee: pick(rng, parties.suppliers),
        date: iso(d),
        gross, withheld,
        status: scheme.rate === 0 ? (i < 4 ? 'to-report' : 'reported') : status,
      }
    })
    : []

  /* Secondary scheme (reverse charge / provincial tax / exemption certificates) */
  const secondary = (catalog.secondary?.items?.length ? Array.from({ length: 6 }, (_, i) => {
    const item = catalog.secondary.items[i % catalog.secondary.items.length]
    const base = round2(monthlySales(country) * between(rng, 0.01, 0.06))
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i * 11 - 4)
    return {
      id: `SEC-${country}-${i + 1}`,
      code: item.code, name: item.name, rate: item.rate, appliesTo: item.appliesTo,
      party: pick(rng, i % 2 ? parties.suppliers : parties.customers),
      date: iso(d),
      base, tax: round2(base * item.rate / 100),
      status: i < 2 ? 'pending' : 'accounted',
    }
  }) : [])

  /* Payments — one per filed/ready return */
  const payments = returns
    .filter(r => r.status === 'filed' || r.status === 'ready')
    .map((r, i) => ({
      id: `PAY-${country}-${i + 1}`,
      returnId: r.id,
      description: `${r.form}${r.jurisdiction ? ` · ${r.jurisdiction}` : ''} · ${r.periodLabel}`,
      authority: r.authority,
      amount: Math.max(0, r.netPayable),
      dueDate: r.dueDate,
      paidOn: r.status === 'filed' ? r.filedAt : null,
      reference: r.status === 'filed' ? `PMT-${Math.floor(rng() * 1e8)}` : null,
      method: r.status === 'filed' ? pick(rng, ['Bank transfer', 'Direct debit', 'Online banking']) : null,
      status: r.status === 'filed' ? 'paid' : 'pending',
    }))

  /* Input tax reconciliation — books vs supplier / authority data */
  const reconStatuses = ['matched', 'matched', 'matched', 'matched', 'mismatch', 'missing-supplier', 'missing-books']
  const reconciliation = Array.from({ length: 12 }, (_, i) => {
    const net = round2(monthlySales(country) * between(rng, 0.005, 0.03))
    const tax = round2(net * catalog.standardRate / 100)
    const status = pick(rng, reconStatuses)
    const supplierTax = status === 'mismatch' ? round2(tax * between(rng, 0.8, 0.95)) : status === 'missing-supplier' ? null : tax
    const booksTax = status === 'missing-books' ? null : tax
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i * 4 - 3)
    return {
      id: `REC-${country}-${i + 1}`,
      supplier: pick(rng, parties.suppliers),
      billNo: `BILL-${String(9100 + i * 7)}`,
      date: iso(d),
      net, booksTax, supplierTax,
      status,
    }
  })

  return { seededAt: new Date().toISOString(), country, returns, einvoices, withholding, secondary, payments, reconciliation }
}
