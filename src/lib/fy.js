/**
 * Financial Year helpers — country-aware.
 *
 * The fiscal year start month follows the active company's country
 * (India/UK: April, Australia: July, US/UAE/Canada/Germany/Singapore: January).
 * The store calls `setFiscalYearStartMonth()` whenever the company changes.
 *
 * `fyYear` is always the calendar year in which the fiscal year starts.
 */
import {
  startOfMonth, endOfMonth, addMonths,
  format, parseISO, isWithinInterval,
  getMonth, getYear,
} from 'date-fns'

let START_MONTH = 3 // 0-indexed; 3 = April (India default)

/** month: 1–12 (January = 1), as stored in the country config. */
export function setFiscalYearStartMonth(month = 4) {
  const m = Number(month)
  START_MONTH = Number.isInteger(m) && m >= 1 && m <= 12 ? m - 1 : 3
}

/** Returns the start month as 1–12. */
export function getFiscalYearStartMonth() {
  return START_MONTH + 1
}

/** True when the fiscal year is the calendar year (no year split in the label). */
function isCalendarFY() {
  return START_MONTH === 0
}

/**
 * Label for a fiscal year start year.
 * April start, 2024 → "FY 2024-25"; January start, 2024 → "FY 2024".
 */
export function fyLabel(fyYear) {
  if (isCalendarFY()) return `FY ${fyYear}`
  return `FY ${fyYear}-${String(fyYear + 1).slice(-2)}`
}

/**
 * Current FY start year based on a date.
 */
export function currentFYYear(date = new Date()) {
  const month = getMonth(date)
  const year = getYear(date)
  return month >= START_MONTH ? year : year - 1
}

/**
 * Given any date, return the FY label it belongs to.
 */
export function getFYLabel(date = new Date()) {
  const d = date instanceof Date ? date : parseISO(date)
  return fyLabel(currentFYYear(d))
}

/**
 * Return { from, to } Date objects for a full FY.
 */
export function fyRange(fyYear) {
  const from = new Date(fyYear, START_MONTH, 1)
  return { from, to: endOfMonth(addMonths(from, 11)) }
}

/**
 * Quarters for a given FY start year.
 * Returns array of { label, quarter, from, to }
 */
export function fyQuarters(fyYear) {
  return [0, 1, 2, 3].map(i => {
    const from = new Date(fyYear, START_MONTH + i * 3, 1)
    return { label: `Q${i + 1}`, quarter: i + 1, from, to: endOfMonth(addMonths(from, 2)) }
  })
}

/**
 * Which quarter does a date belong to (within an FY)?
 * Returns 1–4 or null if outside FY.
 */
export function getQuarter(date, fyYear) {
  const d = date instanceof Date ? date : parseISO(date)
  const quarters = fyQuarters(fyYear)
  for (const q of quarters) {
    if (isWithinInterval(d, { start: q.from, end: q.to })) return q.quarter
  }
  return null
}

/**
 * Build a date range from a PeriodSelector value.
 * mode: 'month' | 'quarter' | 'half' | 'year' | 'custom'
 */
export function periodRange(mode, value, fyYear) {
  fyYear = fyYear ?? currentFYYear()
  switch (mode) {
    case 'month': {
      const d = value instanceof Date ? value : parseISO(value)
      return { from: startOfMonth(d), to: endOfMonth(d) }
    }
    case 'quarter': {
      const qs = fyQuarters(fyYear)
      return qs[value - 1] ?? fyRange(fyYear)
    }
    case 'half': {
      const from = new Date(fyYear, START_MONTH + (value === 1 ? 0 : 6), 1)
      return { from, to: endOfMonth(addMonths(from, 5)) }
    }
    case 'year':
      return fyRange(fyYear)
    case 'custom':
      return { from: value.from, to: value.to }
    default:
      return fyRange(fyYear)
  }
}

/**
 * List of months in a FY, each as { label, date }.
 */
export function fyMonths(fyYear) {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(fyYear, START_MONTH + i, 1)
    return { label: format(d, 'MMM yyyy'), date: d }
  })
}

/**
 * Format date range as readable label.
 */
export function formatRange(from, to) {
  if (!from || !to) return ''
  return `${format(from, 'd MMM yyyy')} – ${format(to, 'd MMM yyyy')}`
}
