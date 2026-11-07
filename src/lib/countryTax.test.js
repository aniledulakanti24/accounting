import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getCountryTaxConfig,
  validateCountryTaxId,
  formatMoneyByCountry,
  calculateDocumentTax,
  SUPPORTED_COUNTRIES,
} from './countryTax.js'

test('country tax config retrieves correctly with fallbacks', () => {
  const india = getCountryTaxConfig('IN')
  assert.equal(india.currency, 'INR')
  assert.equal(india.taxSystem, 'GST')
  assert.equal(india.taxIdLabel, 'GSTIN')

  const us = getCountryTaxConfig('US')
  assert.equal(us.currency, 'USD')
  assert.equal(us.taxSystem, 'SalesTax')
  assert.equal(us.taxIdLabel, 'EIN / SSN')

  const uae = getCountryTaxConfig('AE')
  assert.equal(uae.currency, 'AED')
  assert.equal(uae.taxSystem, 'VAT')
  assert.equal(uae.taxIdLabel, 'TRN')

  const fallback = getCountryTaxConfig('UNKNOWN')
  assert.equal(fallback.code, 'IN')
})

test('validates country-specific tax IDs accurately', () => {
  // India GSTIN
  assert.equal(validateCountryTaxId('27AABCU9603R1ZX', 'IN').valid, true)
  assert.equal(validateCountryTaxId('INVALID_GSTIN', 'IN').valid, false)

  // US EIN / SSN
  assert.equal(validateCountryTaxId('12-3456789', 'US').valid, true)
  assert.equal(validateCountryTaxId('123456789', 'US').valid, true)
  assert.equal(validateCountryTaxId('INVALID', 'US').valid, false)

  // UK VAT
  assert.equal(validateCountryTaxId('GB 123 4567 89', 'GB').valid, true)
  assert.equal(validateCountryTaxId('GB123456789', 'GB').valid, true)

  // UAE TRN (15 digits starting with 100)
  assert.equal(validateCountryTaxId('100234567800003', 'AE').valid, true)
  assert.equal(validateCountryTaxId('999999999999999', 'AE').valid, false)
})

test('calculateDocumentTax dynamically calculates taxes by jurisdiction', () => {
  // India Intra-State (CGST + SGST)
  const inIntra = calculateDocumentTax({
    subtotal: 10000,
    taxRate: 18,
    companyCountry: 'IN',
    companyRegion: 'Maharashtra',
    partyRegion: 'Maharashtra',
  })
  assert.equal(inIntra.taxAmount, 1800)
  assert.equal(inIntra.total, 11800)
  assert.equal(inIntra.lines.length, 2)
  assert.equal(inIntra.lines[0].name, 'CGST (9%)')
  assert.equal(inIntra.lines[1].name, 'SGST (9%)')

  // India Inter-State (IGST)
  const inInter = calculateDocumentTax({
    subtotal: 10000,
    taxRate: 18,
    companyCountry: 'IN',
    companyRegion: 'Maharashtra',
    partyRegion: 'Karnataka',
  })
  assert.equal(inInter.lines.length, 1)
  assert.equal(inInter.lines[0].name, 'IGST (18%)')

  // US Sales Tax
  const usTax = calculateDocumentTax({
    subtotal: 1000,
    taxRate: 10,
    companyCountry: 'US',
    companyRegion: 'California',
    partyRegion: 'California',
  })
  assert.equal(usTax.taxAmount, 100)
  assert.equal(usTax.lines.length, 2)
  assert.equal(usTax.lines[0].name, 'State Sales Tax (7.00%)')

  // UK/UAE VAT
  const vatTax = calculateDocumentTax({
    subtotal: 1000,
    taxRate: 20,
    companyCountry: 'GB',
  })
  assert.equal(vatTax.taxAmount, 200)
  assert.equal(vatTax.lines.length, 1)
  assert.equal(vatTax.lines[0].name, 'VAT (20%)')
})

test('formats international currency by country correctly', () => {
  const inr = formatMoneyByCountry(50000, 'IN')
  assert.ok(inr.includes('50,000') || inr.includes('₹'))

  const usd = formatMoneyByCountry(50000, 'US')
  assert.ok(usd.includes('$50,000.00'))

  const gbp = formatMoneyByCountry(50000, 'GB')
  assert.ok(gbp.includes('£50,000.00'))
})

test('every country has a profile, currency, flag and rate table', async () => {
  const { COUNTRY_TAX_RATES, standardRateFor, invoiceRatesFor } = await import('./countryTax.js')
  assert.ok(SUPPORTED_COUNTRIES.length >= 190, 'covers ~all countries')
  const codes = new Set()
  for (const c of SUPPORTED_COUNTRIES) {
    assert.ok(!codes.has(c.code), `duplicate ${c.code}`)
    codes.add(c.code)
    assert.match(c.currency, /^[A-Z]{3}$/, `${c.code} currency`)
    assert.ok(c.flag && c.name && c.taxIdLabel, `${c.code} basics`)
    assert.ok(COUNTRY_TAX_RATES[c.code]?.length > 0, `${c.code} rates`)
    assert.ok(invoiceRatesFor(c.code).includes(0))
    if (c.taxSystem !== 'None') assert.ok(standardRateFor(c.code) > 0, `${c.code} standard rate`)
  }
})

test('India uses GST 2.0 slabs', async () => {
  const { invoiceRatesFor, standardRateFor } = await import('./countryTax.js')
  const rates = invoiceRatesFor('IN')
  assert.ok(rates.includes(40) && rates.includes(18) && rates.includes(5))
  assert.ok(!rates.includes(12), '12% slab removed')
  assert.equal(standardRateFor('IN'), 18)
})
