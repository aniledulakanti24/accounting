import test from 'node:test'
import assert from 'node:assert/strict'
import { handleRequest as rawRequest } from './mockServer.js'
import { computeDueDate } from './taxSeed.js'
import { SUPPORTED_COUNTRIES } from '../../lib/countryTax.js'
import { setFiscalYearStartMonth, fyRange, fyLabel, currentFYYear } from '../../lib/fy.js'
import { setActiveCurrency, formatCurrency, formatCompact, localizeMoneyText } from '../../lib/currency.js'

// Every API call is made as the signed-in demo Super Admin unless a token is given
let adminToken = null
async function handleRequest(args) {
  if (!adminToken) {
    const res = await rawRequest({ method: 'POST', url: '/auth/login', body: { email: 'priya@unifiedtree.demo', password: 'Demo@2026' } })
    adminToken = res.data.token
  }
  return rawRequest({ token: adminToken, ...args })
}

const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

test('due-date rules follow each authority', () => {
  // UK VAT: 1 month + 7 days after quarter end
  assert.equal(iso(computeDueDate(new Date(2026, 8, 30), { kind: 'monthsPlusDays', months: 1, days: 7 })), '2026-11-07')
  // UAE VAT 201: 28th of next month
  assert.equal(iso(computeDueDate(new Date(2026, 8, 30), { kind: 'dayOfNextMonth', day: 28, months: 1 })), '2026-10-28')
  // Australia BAS: December quarter is due 28 February
  assert.equal(iso(computeDueDate(new Date(2026, 11, 31), { kind: 'dayOfNextMonth', day: 28, months: 1, decemberQuarterMonths: 2 })), '2027-02-28')
  // Germany UStVA: 10th of next month
  assert.equal(iso(computeDueDate(new Date(2026, 9, 31), { kind: 'dayOfNextMonth', day: 10, months: 1 })), '2026-11-10')
  // Canada / Singapore: end of the following month
  assert.equal(iso(computeDueDate(new Date(2026, 8, 30), { kind: 'monthEnd', months: 1 })), '2026-10-31')
})

test('fiscal year follows the country start month', () => {
  setFiscalYearStartMonth(7) // Australia
  assert.equal(iso(fyRange(2026).from), '2026-07-01')
  assert.equal(iso(fyRange(2026).to), '2027-06-30')
  assert.equal(fyLabel(2026), 'FY 2026-27')
  assert.equal(currentFYYear(new Date(2026, 1, 1)), 2025)

  setFiscalYearStartMonth(1) // calendar-year countries
  assert.equal(iso(fyRange(2026).to), '2026-12-31')
  assert.equal(fyLabel(2026), 'FY 2026')

  setFiscalYearStartMonth(4) // India (restore default)
  assert.equal(fyLabel(2026), 'FY 2026-27')
})

test('formatters default to the active company currency', () => {
  setActiveCurrency('GBP')
  assert.equal(formatCurrency(1234.5), '£1,234.50')
  assert.equal(formatCompact(2500000), '£2.50M')
  assert.equal(localizeMoneyText('Payment received — ₹8,50,000'), 'Payment received — £850.0K')
  setActiveCurrency('INR')
  assert.ok(formatCurrency(1234567.5).includes('12,34,567.50'))
  assert.equal(localizeMoneyText('₹1.2L due'), '₹1.2L due')
})

test('mock API serves every country and files a return end-to-end', async () => {
  // All 25 full profiles plus a sample of basic ones (incl. Qatar, which has no VAT)
  const sample = SUPPORTED_COUNTRIES.filter(c => c.tier === 'full' || ['KE', 'AR', 'TR', 'VN'].includes(c.code))
  assert.equal(SUPPORTED_COUNTRIES.filter(c => c.tier === 'full').length, 25)
  const qatar = await handleRequest({ url: '/tax/returns', company: { id: 'test-QA', country: 'QA' } })
  assert.equal(qatar.status, 200)
  assert.equal(qatar.data.length, 0, 'no VAT → no returns')

  for (const c of sample) {
    const company = { id: `test-${c.code}`, country: c.code, name: `Test ${c.code}` }
    const profile = await handleRequest({ url: '/tax/profile', company })
    assert.equal(profile.status, 200)
    assert.equal(profile.data.country.code, c.code)

    const returns = await handleRequest({ url: '/tax/returns', company })
    assert.equal(returns.status, 200)
    assert.ok(returns.data.length >= 3, `${c.code} has returns`)
    assert.ok(returns.data.every(r => r.boxes.length > 0))

    const ready = returns.data.find(r => r.status === 'ready') ?? returns.data.find(r => r.status === 'filed')
    if (ready.status === 'ready') {
      await handleRequest({ method: 'POST', url: '/filing/connections', body: { consent: true }, company })
      const noDecl = await handleRequest({ method: 'POST', url: `/tax/returns/${ready.id}/submit`, body: {}, company })
      assert.equal(noDecl.status, 422)
      const filed = await handleRequest({ method: 'POST', url: `/tax/returns/${ready.id}/submit`, body: { declaration: true }, company })
      assert.equal(filed.status, 201)
      assert.equal(filed.data.status, 'filed')
      assert.ok(filed.data.ackRef)
    }
  }
})

test('mock API rejects unknown routes and missing tenant', async () => {
  const missing = await handleRequest({ url: '/nope', company: { id: 'x', country: 'US' } })
  assert.equal(missing.status, 404)
  const noTenant = await handleRequest({ url: '/tax/profile', company: null })
  assert.equal(noTenant.status, 401)
})

test('FX API: create, settle, revalue — journal always balances', async () => {
  const { journalImbalance } = await import('../../lib/fx.js')
  const company = { id: 'fx-test-GB', country: 'GB', name: 'FX Test Ltd' }
  const rates = await handleRequest({ url: '/fx/rates', company })
  assert.equal(rates.data.base, 'GBP')
  assert.ok(rates.data.rates.USD > 0)

  const created = await handleRequest({ method: 'POST', url: '/fx/documents', company, body: { kind: 'receivable', party: 'Acme Inc.', currency: 'USD', amount: 10000, rate: 0.75 } })
  assert.equal(created.status, 201)
  assert.equal(created.data.baseAtBooked, 7500)

  const baseDoc = await handleRequest({ method: 'POST', url: '/fx/documents', company, body: { party: 'X', currency: 'GBP', amount: 10 } })
  assert.equal(baseDoc.status, 422)

  const settled = await handleRequest({ method: 'POST', url: `/fx/documents/${created.data.id}/settle`, company, body: { amount: 4000, rate: 0.78 } })
  assert.equal(settled.status, 201)
  assert.equal(settled.data.result.realized, 120)
  assert.equal(settled.data.document.openAmount, 6000)

  const preview = await handleRequest({ url: '/fx/revaluation/preview', company })
  assert.equal(preview.status, 200)
  const posted = await handleRequest({ method: 'POST', url: '/fx/revaluation', company, body: { date: preview.data.date } })
  assert.equal(posted.status, 201)
  const again = await handleRequest({ method: 'POST', url: '/fx/revaluation', company, body: { date: preview.data.date } })
  assert.equal(again.status, 422)

  const journal = await handleRequest({ url: '/fx/journal', company })
  assert.ok(journal.data.length >= 3)
  for (const entry of journal.data) assert.equal(journalImbalance(entry.legs), 0, `${entry.type} ${entry.reference} balances`)

  const summary = await handleRequest({ url: '/fx/summary', company })
  assert.equal(summary.data.base, 'GBP')
  assert.ok(summary.data.exposure.length > 0)
})
