/**
 * Mock FX market data: indicative mid-market rates per 1 USD today, and a
 * deterministic daily history (random walk, ~0.4% daily volatility) going back
 * one year so any date can be priced consistently.
 */
import { makeRng } from './taxSeed.js'
import { crossRate } from '../../lib/fx.js'
import { USD_RATES_WORLD } from '../../lib/countries/worldCountries.js'
import { symbolFor } from '../../lib/countryTax.js'

/** Units per 1 USD for every currency used by a supported country. */
export const USD_RATES = USD_RATES_WORLD

const displayNames = (() => {
  try { return new Intl.DisplayNames(['en'], { type: 'currency' }) } catch { return null }
})()

/** [English name, symbol] for every currency in USD_RATES. */
export const CURRENCY_NAMES = Object.fromEntries(
  Object.keys(USD_RATES).map(code => [code, [displayNames?.of(code) ?? code, symbolFor(code)]])
)

const HISTORY_DAYS = 400
// Currencies pegged to the US dollar barely move against it
const USD_PEGGED = ['AED', 'SAR', 'BHD', 'OMR', 'QAR', 'HKD', 'BSD', 'BBD', 'BZD', 'PAB', 'XCD', 'JOD', 'DJF', 'ERN', 'MOP']
const VOL = Object.fromEntries(USD_PEGGED.map(c => [c, 0.0003]))
const cache = new Map()

export function isoDay(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayIso() {
  return isoDay(new Date())
}

/** Array index 0 = today; each step back is one day earlier. */
function series(code) {
  const key = `${code}|${todayIso()}`
  if (cache.has(key)) return cache.get(key)
  const rng = makeRng(`fx-${code}`)
  const vol = VOL[code] ?? 0.004
  const out = [USD_RATES[code]]
  for (let i = 1; i < HISTORY_DAYS; i++) {
    const shock = (rng() - 0.5) * 2 * vol
    out.push(code === 'USD' ? 1 : out[i - 1] * (1 + shock))
  }
  cache.set(key, out)
  return out
}

function daysAgo(dateIso) {
  const today = new Date(`${todayIso()}T00:00:00`)
  const d = new Date(`${dateIso}T00:00:00`)
  return Math.round((today - d) / 86400000)
}

/** Units per 1 USD for every currency on a given date (future dates use today). */
export function usdRatesOn(dateIso = todayIso()) {
  const n = Math.min(Math.max(daysAgo(dateIso), 0), HISTORY_DAYS - 1)
  return Object.fromEntries(Object.keys(USD_RATES).map(c => [c, series(c)[n]]))
}

/** Base units per 1 unit of `currency` on a date. */
export function rateOn(currency, base, dateIso) {
  return crossRate(usdRatesOn(dateIso), currency, base)
}

/** All rates against a base currency on a date. */
export function ratesAgainst(base, dateIso) {
  const usd = usdRatesOn(dateIso)
  return Object.fromEntries(Object.keys(USD_RATES).filter(c => c !== base).map(c => [c, crossRate(usd, c, base)]))
}

export function rateHistory(currency, base, days = 90) {
  const out = []
  const today = new Date(`${todayIso()}T00:00:00`)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const iso = isoDay(d)
    out.push({ date: iso, rate: rateOn(currency, base, iso) })
  }
  return out
}
