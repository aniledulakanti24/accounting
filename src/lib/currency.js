/**
 * Multi-Country Currency Formatting
 *
 * Every formatter defaults to the *active company's* currency and locale, so
 * call sites written as `formatCurrency(v)` follow whichever company is
 * selected. The store calls `setActiveCurrency()` whenever the company changes.
 *
 * Supports INR (₹), USD ($), GBP (£), AED, EUR (€), CAD (CA$), AUD (A$), SGD (S$).
 */

export const CURRENCY_META = {
  INR: { symbol: '₹',   locale: 'en-IN', name: 'Indian Rupee' },
  USD: { symbol: '$',   locale: 'en-US', name: 'US Dollar' },
  GBP: { symbol: '£',   locale: 'en-GB', name: 'British Pound' },
  AED: { symbol: 'AED', locale: 'en-AE', name: 'UAE Dirham' },
  EUR: { symbol: '€',   locale: 'de-DE', name: 'Euro' },
  CAD: { symbol: 'CA$', locale: 'en-CA', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$',  locale: 'en-AU', name: 'Australian Dollar' },
  SGD: { symbol: 'S$',  locale: 'en-SG', name: 'Singapore Dollar' },
}

let ACTIVE = { currency: 'INR', locale: 'en-IN' }
const listeners = new Set()

/** Set the currency/locale used when a formatter is called without one. */
export function setActiveCurrency(currency = 'INR', locale) {
  const code = typeof currency === 'string' && currency.trim() ? currency.trim().toUpperCase() : 'INR'
  const next = { currency: code, locale: locale || CURRENCY_META[code]?.locale || 'en-US' }
  if (next.currency === ACTIVE.currency && next.locale === ACTIVE.locale) return
  ACTIVE = next
  listeners.forEach(fn => fn(ACTIVE))
}

export function getActiveCurrency() {
  return ACTIVE.currency
}

export function getActiveLocale() {
  return ACTIVE.locale
}

export function onActiveCurrencyChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Symbol for a currency code (defaults to the active currency). */
export function currencySymbol(currency) {
  const code = sanitizeCurrency(currency)
  if (CURRENCY_META[code]) return CURRENCY_META[code].symbol
  // Any other ISO 4217 currency: ask Intl for its narrow symbol (KES → Ksh, BRL → R$)
  try {
    const part = getFormatter(localeFor(code), { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0).find(p => p.type === 'currency')
    return part?.value || code
  } catch {
    return code
  }
}

const fmtCache = new Map()
function getFormatter(locale, options) {
  const key = `${locale}|${JSON.stringify(options)}`
  if (!fmtCache.has(key)) fmtCache.set(key, new Intl.NumberFormat(locale, options))
  return fmtCache.get(key)
}

/**
 * Recharts and similar callbacks pass a numeric index as the 2nd argument
 * (e.g. tickFormatter(value, index)) — treat anything that is not a currency
 * code string as "use the active currency".
 */
function sanitizeCurrency(currency) {
  if (typeof currency === 'string' && currency.trim()) {
    return currency.trim().toUpperCase()
  }
  return ACTIVE.currency
}

function localeFor(code) {
  if (code === ACTIVE.currency) return ACTIVE.locale
  return CURRENCY_META[code]?.locale || 'en-US'
}

/**
 * Format currency with 2 decimal places.
 * e.g. 1234567.5, 'INR' → "₹12,34,567.50"
 * e.g. 1234.5, 'USD'    → "$1,234.50"
 */
export function formatCurrency(value, currency) {
  if (value == null || isNaN(value)) return '—'
  const code = sanitizeCurrency(currency)
  try {
    return getFormatter(localeFor(code), {
      style: 'currency', currency: code, minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currencySymbol(code)}${Number(value).toFixed(2)}`
  }
}

/**
 * Format as currency with no decimals.
 */
export function formatCurrencyWhole(value, currency) {
  if (value == null || isNaN(value)) return '—'
  const code = sanitizeCurrency(currency)
  try {
    return getFormatter(localeFor(code), {
      style: 'currency', currency: code, minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currencySymbol(code)}${Math.round(Number(value))}`
  }
}

/**
 * Format number (no currency symbol) using the active locale's grouping.
 */
export function formatNumber(value, decimals = 2) {
  if (value == null || isNaN(value)) return '—'
  const digits = typeof decimals === 'number' && decimals >= 0 && decimals <= 6 ? decimals : 2
  return getFormatter(ACTIVE.locale, {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(value)
}

/** Plain integer/amount grouping for the active locale (replacement for toLocaleString('en-IN')). */
export function formatAmount(value) {
  if (value == null || isNaN(value)) return '—'
  return getFormatter(ACTIVE.locale, { maximumFractionDigits: 2 }).format(value)
}

/**
 * Compact notation: ₹1.2L, ₹3.4Cr or $1.2M
 * Resilient to callbacks like tickFormatter(value, index) where index is passed as second argument.
 */
export function formatCompact(value, currency) {
  if (value == null || isNaN(value)) return '—'
  const currCode = sanitizeCurrency(currency)
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  const sym = currencySymbol(currCode)
  const pad = sym.length > 1 && /^[A-Z]+$/.test(sym) ? ' ' : ''

  if (currCode === 'INR') {
    if (abs >= 1e7) return `${sign}${sym}${(abs / 1e7).toFixed(2)}Cr`
    if (abs >= 1e5) return `${sign}${sym}${(abs / 1e5).toFixed(2)}L`
    if (abs >= 1e3) return `${sign}${sym}${(abs / 1e3).toFixed(1)}K`
    return `${sign}${sym}${abs.toFixed(2)}`
  }

  // Non-English interface languages: let Intl write the local short form
  // (fr-CA "71,3 k $", de-DE "71.300 €" → "71.3 Tsd. €", ar "71.3 ألف")
  const locale = localeFor(currCode)
  if (!locale.startsWith('en') && !locale.startsWith('hi')) {
    try {
      return getFormatter(locale, {
        style: 'currency', currency: currCode, notation: 'compact',
        minimumFractionDigits: abs >= 1e3 ? 1 : 2, maximumFractionDigits: abs >= 1e3 ? 2 : 2,
      }).format(value)
    } catch {
      /* fall through to the manual form */
    }
  }

  // Western notation (M / K / B) for USD, GBP, AED, EUR, etc.
  if (abs >= 1e9) return `${sign}${sym}${pad}${(abs / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${sign}${sym}${pad}${(abs / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${sign}${sym}${pad}${(abs / 1e3).toFixed(1)}K`
  return `${sign}${sym}${pad}${abs.toFixed(2)}`
}

/**
 * Re-express rupee amounts embedded in demo/narrative text in the active
 * currency, e.g. "Payment received — ₹8,50,000" → "Payment received — $850.0K"
 * and "₹1.2L overdue" → "$120.0K overdue". Returns the text unchanged for INR.
 */
const RUPEE_RE = /₹\s?(\d[\d,]*(?:\.\d+)?)\s?(Cr|crore|L|lakh|K)?\b/g
export function localizeMoneyText(text, currency) {
  if (typeof text !== 'string' || !text.includes('₹')) return text
  const code = sanitizeCurrency(currency)
  if (code === 'INR') return text
  return text.replace(RUPEE_RE, (_, num, unit) => {
    let value = parseFloat(num.replace(/,/g, ''))
    if (unit === 'Cr' || unit === 'crore') value *= 1e7
    else if (unit === 'L' || unit === 'lakh') value *= 1e5
    else if (unit === 'K') value *= 1e3
    return value >= 10000 ? formatCompact(value, code) : formatCurrencyWhole(value, code)
  })
}

/**
 * Parse string like "12,34,567.50" or "$1,234.50" → number.
 */
export function parseCurrency(str) {
  if (!str) return 0
  return parseFloat(String(str).replace(/[^0-9.-]/g, '')) || 0
}
