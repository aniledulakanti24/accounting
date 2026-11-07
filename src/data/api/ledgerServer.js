/**
 * Double-entry general ledger for the mock backend.
 *
 * Rules enforced on every posting (as a real ledger service would):
 *  - at least two lines, every account must exist, no negative amounts
 *  - total debits = total credits (to the cent)
 *  - posted journals are immutable; corrections are made with a reversing journal
 *  - nothing can be posted on or before the locked-through date (period close)
 */
import { round2 } from '../../lib/fx.js'

/* Chart of accounts. Names match the account labels used by the FX and tax engines. */
export const CHART = [
  { code: '1000', name: 'Bank', type: 'asset' },
  { code: '1010', name: 'Cash', type: 'asset' },
  { code: '1100', name: 'Accounts Receivable', type: 'asset' },
  { code: '1150', name: 'Accounts Receivable (FX)', type: 'asset' },
  { code: '1200', name: 'Input Tax Recoverable', type: 'asset' },
  { code: '1300', name: 'Inventory', type: 'asset' },
  { code: '1310', name: 'Finished Goods', type: 'asset' },
  { code: '1400', name: 'Payment Gateway Clearing', type: 'asset' },
  { code: '2000', name: 'Accounts Payable', type: 'liability' },
  { code: '2050', name: 'Accounts Payable (FX)', type: 'liability' },
  { code: '2100', name: 'Output Tax Payable', type: 'liability' },
  { code: '2200', name: 'Tax Liability — Filed Returns', type: 'liability' },
  { code: '2300', name: 'Withholding Tax Payable', type: 'liability' },
  { code: '3000', name: "Owner's Equity", type: 'equity' },
  { code: '3100', name: 'Retained Earnings', type: 'equity' },
  { code: '4000', name: 'Sales', type: 'income' },
  { code: '4050', name: 'Sales Returns', type: 'income' },
  { code: '4100', name: 'Realized FX Gain', type: 'income' },
  { code: '4110', name: 'Unrealized FX Gain', type: 'income' },
  { code: '5000', name: 'Purchases', type: 'expense' },
  { code: '5010', name: 'Cost of Goods Sold', type: 'expense' },
  { code: '5020', name: 'Inventory Adjustments', type: 'expense' },
  { code: '5100', name: 'Operating Expenses', type: 'expense' },
  { code: '5150', name: 'Payment Processing Fees', type: 'expense' },
  { code: '5200', name: 'Realized FX Loss', type: 'expense' },
  { code: '5210', name: 'Unrealized FX Loss', type: 'expense' },
]

const DEBIT_NORMAL = new Set(['asset', 'expense'])

function accountFor(ref) {
  return CHART.find(a => a.code === ref || a.name.toLowerCase() === String(ref).toLowerCase())
}

class LedgerError extends Error {
  constructor(message) { super(message); this.status = 422 }
}

export function ensureLedger(db) {
  db.ledger ??= { journals: [], lockedThrough: null, seq: 0 }
  return db.ledger
}

/** Validate and post a journal. Throws a 422 error describing the first problem. */
export function postJournal(db, { date, memo, lines, source = 'manual', reference = null, reverses = null }) {
  const ledger = ensureLedger(db)
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new LedgerError('A posting date (YYYY-MM-DD) is required')
  if (ledger.lockedThrough && date <= ledger.lockedThrough) throw new LedgerError(`The period through ${ledger.lockedThrough} is closed — post in an open period`)
  if (!Array.isArray(lines) || lines.length < 2) throw new LedgerError('A journal needs at least two lines')
  const clean = lines.map((l, i) => {
    const account = accountFor(l.account)
    if (!account) throw new LedgerError(`Line ${i + 1}: unknown account "${l.account}"`)
    const debit = round2(Number(l.debit) || 0)
    const credit = round2(Number(l.credit) || 0)
    if (debit < 0 || credit < 0) throw new LedgerError(`Line ${i + 1}: amounts cannot be negative`)
    if (debit > 0 && credit > 0) throw new LedgerError(`Line ${i + 1}: use either a debit or a credit, not both`)
    return { account: account.code, accountName: account.name, debit, credit, note: l.note ?? null }
  }).filter(l => l.debit > 0 || l.credit > 0)
  if (clean.length < 2) throw new LedgerError('A journal needs at least two non-zero lines')
  const dr = round2(clean.reduce((s, l) => s + l.debit, 0))
  const cr = round2(clean.reduce((s, l) => s + l.credit, 0))
  if (dr !== cr) throw new LedgerError(`Journal does not balance: debits ${dr} ≠ credits ${cr}`)
  ledger.seq += 1
  const journal = {
    id: `JV-${String(ledger.seq).padStart(5, '0')}`,
    date, memo: memo || '', source, reference, reverses,
    lines: clean, total: dr, postedAt: new Date().toISOString(),
  }
  ledger.journals.push(journal)
  return journal
}

/** Post legs produced by the FX/tax engines, silently skipping empty postings. */
export function postFromLegs(db, { date, memo, legs, source, reference }) {
  const lines = (legs || []).filter(l => (l.debit || 0) > 0 || (l.credit || 0) > 0)
  if (lines.length < 2) return null
  return postJournal(db, { date, memo, lines, source, reference })
}

export function trialBalance(db, asOf) {
  const ledger = ensureLedger(db)
  const totals = new Map(CHART.map(a => [a.code, { ...a, debit: 0, credit: 0 }]))
  for (const j of ledger.journals) {
    if (asOf && j.date > asOf) continue
    for (const l of j.lines) {
      const t = totals.get(l.account)
      t.debit = round2(t.debit + l.debit)
      t.credit = round2(t.credit + l.credit)
    }
  }
  const rows = [...totals.values()].map(a => {
    const net = round2(a.debit - a.credit)
    return { ...a, balance: DEBIT_NORMAL.has(a.type) ? net : round2(-net), balanceDebit: net > 0 ? net : 0, balanceCredit: net < 0 ? -net : 0 }
  })
  const totalDebit = round2(rows.reduce((s, r) => s + r.balanceDebit, 0))
  const totalCredit = round2(rows.reduce((s, r) => s + r.balanceCredit, 0))
  return { asOf: asOf ?? null, rows, totalDebit, totalCredit, balanced: totalDebit === totalCredit }
}

/* Seed: opening balances plus sales / purchases / tax postings derived from the tax returns */
export function seedLedger(db, today = new Date()) {
  const ledger = ensureLedger(db)
  if (ledger.seeded) return ledger
  const iso = d => d.toISOString().slice(0, 10)
  const start = new Date(today.getFullYear(), today.getMonth() - 7, 1)
  const opening = round2(Math.max(...(db.returns ?? []).map(r => r.boxes.find(b => b.kind === 'sales')?.amount ?? 0), 100000) * 1.5)
  postJournal(db, { date: iso(start), memo: 'Opening balances', source: 'opening', lines: [
    { account: 'Bank', debit: opening }, { account: "Owner's Equity", credit: opening },
  ] })
  for (const r of (db.returns ?? []).filter(x => x.status !== 'open')) {
    const get = kind => r.boxes.find(b => b.kind === kind)?.amount ?? 0
    const sales = get('sales'); const out = get('outputTax'); const inp = get('inputTax')
    // Some returns (e.g. India GSTR-3B) report input tax but not the purchase value — derive it from the rate
    const purch = get('purchases') || (inp > 0 && r.rate ? round2(inp * 100 / r.rate) : 0)
    if (sales > 0 && out >= 0) {
      postJournal(db, { date: r.periodEnd, memo: `Sales — ${r.periodLabel}`, source: 'sales', reference: r.id, lines: [
        { account: 'Accounts Receivable', debit: round2(sales + out) }, { account: 'Sales', credit: sales }, { account: 'Output Tax Payable', credit: out },
      ] })
    }
    if (purch > 0 && inp >= 0) {
      postJournal(db, { date: r.periodEnd, memo: `Purchases — ${r.periodLabel}`, source: 'purchases', reference: r.id, lines: [
        { account: 'Purchases', debit: purch }, { account: 'Input Tax Recoverable', debit: inp }, { account: 'Accounts Payable', credit: round2(purch + inp) },
      ] })
    }
  }
  ledger.seeded = true
  return ledger
}

export function registerLedgerRoutes(route, { ok, notFound, badRequest }) {
  const withSeed = handler => ctx => { seedLedger(ctx.db); return handler(ctx) }

  route('GET', '/ledger/accounts', withSeed(({ db }) => ok(trialBalance(db).rows)), { summary: 'Chart of accounts with balances' })

  route('GET', '/ledger/journals', withSeed(({ db, query }) => {
    let list = [...ensureLedger(db).journals].reverse()
    if (query.account) list = list.filter(j => j.lines.some(l => l.account === query.account))
    if (query.source) list = list.filter(j => j.source === query.source)
    return ok(list.slice(0, Math.min(Number(query.limit) || 200, 1000)))
  }), { summary: 'Journals (newest first); filter by ?account= or ?source=' })

  route('POST', '/ledger/journals', withSeed(({ db, body, save }) => {
    const j = postJournal(db, { ...body, source: 'manual' })
    save()
    return ok({ ...j, auditSummary: `Journal ${j.id} posted (${j.total})` }, 201)
  }), { summary: 'Post a balanced manual journal' })

  route('POST', '/ledger/journals/:id/reverse', withSeed(({ db, params, body, save }) => {
    const ledger = ensureLedger(db)
    const original = ledger.journals.find(j => j.id === params.id) || notFound('Journal')
    if (ledger.journals.some(j => j.reverses === original.id)) badRequest('This journal has already been reversed')
    const date = body?.date || new Date().toISOString().slice(0, 10)
    const j = postJournal(db, {
      date, memo: `Reversal of ${original.id} — ${original.memo}`, source: 'reversal', reverses: original.id,
      lines: original.lines.map(l => ({ account: l.account, debit: l.credit, credit: l.debit })),
    })
    save()
    return ok({ ...j, auditSummary: `Journal ${original.id} reversed by ${j.id}` }, 201)
  }), { summary: 'Reverse a posted journal (journals are never edited)' })

  route('GET', '/ledger/trial-balance', withSeed(({ db, query }) => ok(trialBalance(db, query.asOf))), { summary: 'Trial balance, optionally ?asOf=YYYY-MM-DD' })

  route('POST', '/ledger/lock', withSeed(({ db, body, save }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body?.through || '')) badRequest('Provide { through: "YYYY-MM-DD" }')
    const ledger = ensureLedger(db)
    if (ledger.lockedThrough && body.through < ledger.lockedThrough) badRequest(`Already closed through ${ledger.lockedThrough}`)
    ledger.lockedThrough = body.through
    save()
    return ok({ lockedThrough: ledger.lockedThrough, auditSummary: `Books closed through ${body.through}` })
  }), { summary: 'Close the books through a date (period lock)' })
}
