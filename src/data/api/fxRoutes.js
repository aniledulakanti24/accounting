/**
 * Foreign-currency endpoints for the mock backend.
 *   GET  /fx/rates?date=            rates against the company's base currency
 *   GET  /fx/history?currency=&days= daily rate history
 *   GET  /fx/summary                exposure, unrealized and realized totals
 *   GET  /fx/documents              open/settled foreign documents valued at today's rate
 *   POST /fx/documents              create a foreign-currency invoice or bill
 *   POST /fx/documents/:id/settle   receive / pay (part of) a document → realized G/L
 *   GET  /fx/revaluation/preview?date=
 *   POST /fx/revaluation            post month-end revaluation (unrealized G/L)
 *   GET  /fx/revaluations           previous revaluation runs
 *   GET  /fx/journal                FX journal entries
 */
import { ratesAgainst, rateOn, rateHistory, isoDay, CURRENCY_NAMES } from './fxRates.js'
import { makeJournalEntry } from './fxSeed.js'
import { settleDocument, settlementJournal, buildRevaluation, valueDocument, toBase, round2 } from '../../lib/fx.js'
import { seedLedger, postFromLegs } from './ledgerServer.js'

/** Keep the FX journal and post the same legs to the general ledger. */
function record(db, fx, entry) {
  fx.journal.unshift(entry)
  try {
    seedLedger(db)
    postFromLegs(db, { date: entry.date, memo: entry.description, legs: entry.legs, source: 'fx', reference: entry.reference })
  } catch {
    /* closed period — the FX sub-ledger keeps the entry; the accountant posts it in an open period */
  }
}

function lastMonthEnd() {
  const d = new Date(); d.setDate(0)
  return isoDay(d)
}

export function registerFxRoutes(route, { ok, badRequest, notFound, todayIso }) {
  route('GET', '/fx/rates', ({ fx, query }) => {
    const date = query.date || todayIso()
    return ok({ base: fx.base, date, rates: ratesAgainst(fx.base, date), names: CURRENCY_NAMES })
  })

  route('GET', '/fx/history', ({ fx, query }) => {
    if (!query.currency || !CURRENCY_NAMES[query.currency]) badRequest('A supported currency is required')
    const days = Math.min(Math.max(Number(query.days) || 90, 7), 365)
    return ok({ base: fx.base, currency: query.currency, points: rateHistory(query.currency, fx.base, days) })
  })

  route('GET', '/fx/documents', ({ fx, query }) => {
    const rates = ratesAgainst(fx.base, todayIso())
    let docs = fx.documents.map(d => valueDocument(d, rates[d.currency]))
    if (query.status === 'open') docs = docs.filter(d => d.openAmount > 0)
    docs.sort((a, b) => b.date.localeCompare(a.date))
    return ok(docs)
  })

  route('POST', '/fx/documents', ({ db, fx, body, save }) => {
    const { kind = 'receivable', party, currency, amount, date = todayIso(), reference, rate } = body || {}
    if (!party?.trim()) badRequest('Party is required')
    if (!CURRENCY_NAMES[currency]) badRequest('Unsupported currency')
    if (currency === fx.base) badRequest(`Documents in the base currency (${fx.base}) are not foreign-currency documents`)
    if (!(Number(amount) > 0)) badRequest('Amount must be greater than zero')
    const bookedRate = Number(rate) > 0 ? Number(rate) : rateOn(currency, fx.base, date)
    const due = new Date(`${date}T00:00:00`); due.setDate(due.getDate() + 30)
    const doc = {
      id: `FXD-${Date.now().toString(36)}`,
      reference: reference || `${kind === 'receivable' ? 'INV' : 'BILL'}-FX-${Math.floor(Math.random() * 9000 + 1000)}`,
      kind, party: party.trim(), currency,
      amount: round2(amount), openAmount: round2(amount),
      date, dueDate: isoDay(due),
      bookedRate, carryingRate: bookedRate,
      status: 'open', settlements: [],
    }
    fx.documents.unshift(doc)
    const base = toBase(doc.amount, bookedRate)
    const control = kind === 'payable' ? 'Accounts Payable (FX)' : 'Accounts Receivable (FX)'
    record(db, fx, makeJournalEntry({
      date, type: 'recognition', reference: doc.reference,
      description: `${kind === 'receivable' ? 'Invoice to' : 'Bill from'} ${doc.party} · ${currency} ${doc.amount} @ ${bookedRate}`,
      legs: kind === 'receivable'
        ? [{ account: control, debit: base, credit: 0 }, { account: 'Sales', debit: 0, credit: base }]
        : [{ account: 'Purchases', debit: base, credit: 0 }, { account: control, debit: 0, credit: base }],
    }))
    save()
    return ok(valueDocument(doc, rateOn(currency, fx.base, todayIso())), 201)
  })

  route('POST', '/fx/documents/:id/settle', ({ db, fx, params, body, save }) => {
    const doc = fx.documents.find(d => d.id === params.id) || notFound('Document')
    if (doc.openAmount <= 0) badRequest('This document is already fully settled')
    const date = body?.date || todayIso()
    if (date < doc.date) badRequest('Settlement date cannot be before the document date')
    const rate = Number(body?.rate) > 0 ? Number(body.rate) : rateOn(doc.currency, fx.base, date)
    let result
    try {
      result = settleDocument(doc, { amount: body?.amount ?? doc.openAmount, rate })
    } catch (err) {
      badRequest(err.message)
    }
    const legs = settlementJournal(doc, result, body?.bankAccount || 'Bank')
    doc.openAmount = result.remaining
    doc.status = result.status
    doc.settlements.push({ date, amount: result.settledAmount, rate, realized: result.realized })
    const entry = makeJournalEntry({
      date, type: 'settlement', reference: doc.reference,
      description: `${doc.kind === 'receivable' ? 'Receipt from' : 'Payment to'} ${doc.party} · ${doc.currency} ${result.settledAmount} @ ${rate}`,
      legs,
    })
    record(db, fx, entry)
    save()
    return ok({ document: valueDocument(doc, rateOn(doc.currency, fx.base, todayIso())), result, journal: entry }, 201)
  })

  route('GET', '/fx/revaluation/preview', ({ fx, query }) => {
    const date = query.date || lastMonthEnd()
    const eligible = fx.documents.filter(d => d.openAmount > 0 && d.date <= date)
    const rates = ratesAgainst(fx.base, date)
    const already = fx.revaluations.find(r => r.date === date)
    return ok({ date, base: fx.base, alreadyPosted: !!already, ...buildRevaluation(eligible, rates) })
  })

  route('POST', '/fx/revaluation', ({ db, fx, body, save }) => {
    const date = body?.date || lastMonthEnd()
    if (date > todayIso()) badRequest('Revaluation date cannot be in the future')
    if (fx.revaluations.some(r => r.date === date)) badRequest(`A revaluation is already posted for ${date}`)
    if (fx.revaluations[0] && date < fx.revaluations[0].date) badRequest(`Revaluation date must be after the last run (${fx.revaluations[0].date})`)
    const eligible = fx.documents.filter(d => d.openAmount > 0 && d.date <= date)
    const rates = ratesAgainst(fx.base, date)
    const rev = buildRevaluation(eligible, rates)
    if (!rev.lines.length) badRequest('No open foreign-currency balances to revalue at this date')
    const legs = rev.lines.flatMap(l => l.legs)
    rev.lines.forEach(l => {
      const doc = fx.documents.find(d => d.id === l.documentId)
      doc.carryingRate = l.closingRate
    })
    const entry = makeJournalEntry({
      date, type: 'revaluation', reference: `REVAL-${date}`,
      description: `Month-end revaluation of ${rev.lines.length} open balance(s) at closing rates`,
      legs,
    })
    record(db, fx, entry)
    const run = { id: `RUN-${date}`, date, documents: rev.lines.length, gain: rev.totalGain, loss: rev.totalLoss, net: rev.net, journalId: entry.id, postedAt: new Date().toISOString() }
    fx.revaluations.unshift(run)
    save()
    return ok(run, 201)
  })

  route('GET', '/fx/revaluations', ({ fx }) => ok(fx.revaluations))

  route('GET', '/fx/journal', ({ fx }) => ok([...fx.journal].sort((a, b) => b.date.localeCompare(a.date) || b.postedAt.localeCompare(a.postedAt))))

  route('GET', '/fx/summary', ({ fx }) => {
    const today = todayIso()
    const rates = ratesAgainst(fx.base, today)
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30)
    const ratesThen = ratesAgainst(fx.base, isoDay(monthAgo))
    const open = fx.documents.filter(d => d.openAmount > 0).map(d => valueDocument(d, rates[d.currency]))
    const byCurrency = {}
    for (const d of open) {
      const row = byCurrency[d.currency] ??= { currency: d.currency, receivable: 0, payable: 0, rate: rates[d.currency], change30d: 0 }
      row[d.kind] = round2(row[d.kind] + d.openAmount)
    }
    const exposure = Object.values(byCurrency).map(r => ({
      ...r,
      net: round2(r.receivable - r.payable),
      baseNet: toBase(r.receivable - r.payable, r.rate),
      change30d: round2(((r.rate / ratesThen[r.currency]) - 1) * 100),
    })).sort((a, b) => Math.abs(b.baseNet) - Math.abs(a.baseNet))
    const year = today.slice(0, 4)
    const realizedYtd = round2(fx.documents.flatMap(d => d.settlements).filter(s => s.date.startsWith(year)).reduce((s, x) => s + x.realized, 0))
    return ok({
      base: fx.base,
      openDocuments: open.length,
      grossExposure: round2(open.reduce((s, d) => s + d.baseNow, 0)),
      netExposure: round2(exposure.reduce((s, e) => s + e.baseNet, 0)),
      unrealizedBooked: round2(open.reduce((s, d) => s + (d.unrealizedSinceBooking - d.unrealizedSinceCarrying), 0)),
      unrealizedNow: round2(open.reduce((s, d) => s + d.unrealizedSinceBooking, 0)),
      unrealizedUnposted: round2(open.reduce((s, d) => s + d.unrealizedSinceCarrying, 0)),
      realizedYtd,
      lastRevaluation: fx.revaluations[0] ?? null,
      suggestedRevaluationDate: lastMonthEnd(),
      exposure,
    })
  })
}
