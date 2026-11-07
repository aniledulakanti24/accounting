import test from 'node:test'
import assert from 'node:assert/strict'
import { formatCurrency, formatCurrencyWhole, formatCompact, formatNumber, parseCurrency } from './currency.js'

test('formatCompact handles numbers and ignores numeric callback indexes from Recharts', () => {
  // Recharts calls tickFormatter(value, index) e.g. formatCompact(100000, 0)
  const resultWithIndex = formatCompact(100000, 0)
  assert.ok(resultWithIndex.includes('1.00L') || resultWithIndex.includes('₹'))

  const resultWithIndex2 = formatCompact(2500000, 3)
  assert.ok(resultWithIndex2.includes('25.00L') || resultWithIndex2.includes('₹'))

  const inrResult = formatCompact(10000000, 'INR')
  assert.ok(inrResult.includes('1.00Cr'))

  const usdResult = formatCompact(1000000, 'USD')
  assert.equal(usdResult, '$1.00M')

  const usdResultWithIndex = formatCompact(1500, 'USD')
  assert.equal(usdResultWithIndex, '$1.5K')
})

test('formatCurrency handles currencies and non-string callback indexes safely', () => {
  const inr = formatCurrency(1250.50, 'INR')
  assert.ok(inr.includes('1,250.50'))

  // When called like formatCurrency(1250.50, 0)
  const fallback = formatCurrency(1250.50, 0)
  assert.ok(fallback.includes('1,250.50'))

  const usd = formatCurrency(1250.50, 'USD')
  assert.equal(usd, '$1,250.50')
})

test('parseCurrency parses currency strings reliably', () => {
  assert.equal(parseCurrency('₹12,34,567.50'), 1234567.5)
  assert.equal(parseCurrency('$1,234.50'), 1234.5)
  assert.equal(parseCurrency(''), 0)
})
