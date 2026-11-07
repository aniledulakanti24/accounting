/**
 * Seed foreign-currency receivables and payables for a company, plus a few
 * historical settlements so realized gains/losses exist from day one.
 */
import { makeRng, partiesFor } from './taxSeed.js'
import { rateOn, isoDay } from './fxRates.js'
import { settleDocument, settlementJournal, round2 } from '../../lib/fx.js'

const FOREIGN_POOL = ['USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD', 'INR']
// Typical invoice size in each currency (INR / JPY scale differs)
const SCALE = { INR: 80, JPY: 150, AED: 3.6 }

const FOREIGN_PARTIES = {
  receivable: ['Atlas Imports GmbH', 'Pacific Rim Trading Pte', 'Northstar Retail Inc.', 'Gulf Horizon LLC', 'Thames Analytics Ltd', 'Maple Freight Corp.'],
  payable: ['Shenzhen Components Co.', 'Bavaria Tools AG', 'Global Cloud Services Inc.', 'Mumbai Textiles Pvt Ltd', 'Sydney Logistics Pty'],
}

export function makeJournalEntry({ date, type, reference, description, legs }) {
  return {
    id: `FXJ-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    date, type, reference, description,
    legs: legs.map(l => ({ ...l, debit: round2(l.debit || 0), credit: round2(l.credit || 0) })),
    postedAt: new Date().toISOString(),
  }
}

export function seedFx(company, base) {
  const rng = makeRng(`fx-docs-${company.id}-${base}`)
  const foreign = FOREIGN_POOL.filter(c => c !== base)
  const currencies = foreign.slice(0, 4)
  const local = partiesFor(company.country)
  const today = new Date()
  const documents = []
  const journal = []

  for (let i = 0; i < 11; i++) {
    const kind = i % 3 === 2 ? 'payable' : 'receivable'
    const currency = currencies[i % currencies.length]
    const d = new Date(today); d.setDate(d.getDate() - Math.floor(15 + rng() * 140))
    const date = isoDay(d)
    const due = new Date(d); due.setDate(due.getDate() + 45)
    const amount = round2((2000 + rng() * 48000) * (SCALE[currency] ?? 1))
    const bookedRate = rateOn(currency, base, date)
    const partyList = rng() < 0.7 ? FOREIGN_PARTIES[kind] : (kind === 'receivable' ? local.customers : local.suppliers)
    documents.push({
      id: `FXD-${i + 1}`,
      reference: kind === 'receivable' ? `INV-FX-${String(2400 + i)}` : `BILL-FX-${String(7100 + i)}`,
      kind,
      party: partyList[Math.floor(rng() * partyList.length)],
      currency,
      amount,
      openAmount: amount,
      date,
      dueDate: isoDay(due),
      bookedRate,
      carryingRate: bookedRate,
      status: 'open',
      settlements: [],
    })
  }

  // Settle three older documents (one partially) to create realized history
  documents
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)
    .forEach((doc, idx) => {
      const d = new Date(`${doc.date}T00:00:00`); d.setDate(d.getDate() + 25 + idx * 5)
      const date = isoDay(d)
      const rate = rateOn(doc.currency, base, date)
      const amount = idx === 2 ? round2(doc.openAmount * 0.5) : doc.openAmount
      const result = settleDocument(doc, { amount, rate })
      doc.openAmount = result.remaining
      doc.status = result.status
      doc.settlements.push({ date, amount: result.settledAmount, rate, realized: result.realized })
      journal.push(makeJournalEntry({
        date, type: 'settlement', reference: doc.reference,
        description: `${doc.kind === 'receivable' ? 'Receipt from' : 'Payment to'} ${doc.party} · ${doc.currency} ${result.settledAmount} @ ${rate}`,
        legs: settlementJournal(doc, result),
      }))
    })

  return { base, documents, journal, revaluations: [] }
}
