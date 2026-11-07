/**
 * Foreign-currency accounting helpers (pure functions).
 *
 * Conventions
 *  - A rate is "base units per 1 unit of foreign currency" (e.g. company in GBP,
 *    invoice in USD, rate 0.75 → 1 USD = 0.75 GBP).
 *  - Receivables (customer invoices) gain when the foreign currency strengthens;
 *    payables (supplier bills) lose when it strengthens.
 *  - Booked rate   = rate on the document date (initial recognition).
 *    Carrying rate = rate the open balance is currently carried at (booked rate,
 *                    or the closing rate of the last month-end revaluation).
 *  - Month-end revaluation books the unrealized difference between carrying and
 *    closing rate. At settlement the realized difference is measured against the
 *    booked rate and the unrealized amount booked so far for that portion is reversed,
 *    so total P&L always equals (settlement rate − booked rate) × amount.
 */

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100
export const round6 = (n) => Math.round(Number(n) * 1e6) / 1e6

/** Convert a foreign amount to base currency at a rate. */
export function toBase(amount, rate) {
  return round2(Number(amount || 0) * Number(rate || 0))
}

/**
 * Rate between two currencies from a table of "units per 1 USD".
 * Returns base units per 1 unit of `from`.
 */
export function crossRate(usdRates, from, base) {
  const f = usdRates[from]
  const b = usdRates[base]
  if (!f || !b) return null
  return round6(b / f)
}

const sign = (kind) => (kind === 'payable' ? -1 : 1)

/** Exchange difference when the rate moves from `fromRate` to `toRate` on `amount`. Positive = gain. */
export function exchangeDifference({ amount, fromRate, toRate, kind = 'receivable' }) {
  return round2(sign(kind) * Number(amount || 0) * (Number(toRate) - Number(fromRate)))
}

/** Unrealized gain/loss on an open balance at a closing rate (vs the carrying rate). */
export function unrealizedGainLoss({ openAmount, carryingRate, closingRate, kind }) {
  return exchangeDifference({ amount: openAmount, fromRate: carryingRate, toRate: closingRate, kind })
}

/**
 * Settle all or part of a foreign-currency document.
 * Returns the realized gain/loss (vs booked rate), the unrealized amount to reverse
 * for the settled portion, and the new open state.
 */
export function settleDocument(doc, { amount, rate }) {
  const open = Number(doc.openAmount)
  const settled = Math.min(Number(amount || 0), open)
  if (!(settled > 0)) throw new Error('Settlement amount must be greater than zero')
  if (!(Number(rate) > 0)) throw new Error('Settlement rate must be greater than zero')
  const baseReceived = toBase(settled, rate)
  const baseCarrying = toBase(settled, doc.carryingRate)
  const realized = exchangeDifference({ amount: settled, fromRate: doc.bookedRate, toRate: rate, kind: doc.kind })
  // P&L on top of carrying value, from the rounded base amounts so the journal always balances
  const netPnl = round2(sign(doc.kind) * (baseReceived - baseCarrying))
  // Unrealized booked so far for the settled share (carrying vs booked) is reversed
  const unrealizedReversal = round2(realized - netPnl)
  const remaining = round2(open - settled)
  return {
    settledAmount: round2(settled),
    settlementRate: Number(rate),
    baseReceived,
    baseCarrying,
    realized,
    unrealizedReversal,
    netPnl,
    remaining,
    status: remaining <= 0.005 ? 'settled' : 'partial',
  }
}

/** Enrich an open document with current base value and unrealized position at `currentRate`. */
export function valueDocument(doc, currentRate) {
  return {
    ...doc,
    currentRate,
    baseAtBooked: toBase(doc.openAmount, doc.bookedRate),
    baseAtCarrying: toBase(doc.openAmount, doc.carryingRate),
    baseNow: toBase(doc.openAmount, currentRate),
    unrealizedSinceBooking: exchangeDifference({ amount: doc.openAmount, fromRate: doc.bookedRate, toRate: currentRate, kind: doc.kind }),
    unrealizedSinceCarrying: unrealizedGainLoss({ openAmount: doc.openAmount, carryingRate: doc.carryingRate, closingRate: currentRate, kind: doc.kind }),
  }
}

/**
 * Month-end revaluation of open documents at closing rates.
 * closingRates: { [currency]: rate }
 * Returns { lines, totalGain, totalLoss, net } where each line has its journal legs.
 */
export function buildRevaluation(docs, closingRates) {
  const lines = docs
    .filter(d => d.openAmount > 0 && closingRates[d.currency])
    .map(d => {
      const closingRate = closingRates[d.currency]
      const diff = unrealizedGainLoss({ openAmount: d.openAmount, carryingRate: d.carryingRate, closingRate, kind: d.kind })
      const control = d.kind === 'payable' ? 'Accounts Payable (FX)' : 'Accounts Receivable (FX)'
      const fxAccount = diff >= 0 ? 'Unrealized FX Gain' : 'Unrealized FX Loss'
      const amt = Math.abs(diff)
      // A gain debits the control account (asset up / liability down); a loss credits it.
      const legs = amt === 0 ? [] : diff > 0
        ? [{ account: control, debit: amt, credit: 0 }, { account: fxAccount, debit: 0, credit: amt }]
        : [{ account: fxAccount, debit: amt, credit: 0 }, { account: control, debit: 0, credit: amt }]
      return {
        documentId: d.id, reference: d.reference, party: d.party, kind: d.kind, currency: d.currency,
        openAmount: d.openAmount, carryingRate: d.carryingRate, closingRate,
        baseBefore: toBase(d.openAmount, d.carryingRate), baseAfter: toBase(d.openAmount, closingRate),
        difference: diff, legs,
      }
    })
  const totalGain = round2(lines.filter(l => l.difference > 0).reduce((s, l) => s + l.difference, 0))
  const totalLoss = round2(lines.filter(l => l.difference < 0).reduce((s, l) => s - l.difference, 0))
  return { lines, totalGain, totalLoss, net: round2(totalGain - totalLoss) }
}

/** Journal legs for a settlement result (base currency). */
export function settlementJournal(doc, result, bankAccount = 'Bank') {
  const control = doc.kind === 'payable' ? 'Accounts Payable (FX)' : 'Accounts Receivable (FX)'
  const legs = []
  if (doc.kind === 'receivable') {
    legs.push({ account: bankAccount, debit: result.baseReceived, credit: 0 })
    legs.push({ account: control, debit: 0, credit: result.baseCarrying })
  } else {
    legs.push({ account: control, debit: result.baseCarrying, credit: 0 })
    legs.push({ account: bankAccount, debit: 0, credit: result.baseReceived })
  }
  // The P&L on top of the carrying value is split into realized + reversal of unrealized
  if (result.realized !== 0) {
    legs.push(result.realized > 0
      ? { account: 'Realized FX Gain', debit: 0, credit: Math.abs(result.realized) }
      : { account: 'Realized FX Loss', debit: Math.abs(result.realized), credit: 0 })
  }
  if (result.unrealizedReversal !== 0) {
    legs.push(result.unrealizedReversal > 0
      ? { account: 'Unrealized FX Gain', debit: Math.abs(result.unrealizedReversal), credit: 0 }
      : { account: 'Unrealized FX Loss', debit: 0, credit: Math.abs(result.unrealizedReversal) })
  }
  return legs
}

/** Sum debits and credits — a balanced journal returns 0. */
export function journalImbalance(legs) {
  return round2(legs.reduce((s, l) => s + (l.debit || 0) - (l.credit || 0), 0))
}
