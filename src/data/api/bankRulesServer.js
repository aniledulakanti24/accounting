/**
 * Bank rules, statement upload and bank reconciliation (mock backend).
 *
 *  - Rules: "if the description contains X (and the amount is in a range), post to account Y".
 *    Applying rules categorises matching transactions and posts each one to the ledger.
 *  - Statement upload: CSV from any bank (date, description, amount — or debit/credit columns),
 *    duplicates skipped, dd/mm/yyyy or yyyy-mm-dd dates.
 *  - Matching to the books: credits against open invoices, debits against open bills — settling
 *    one records the receipt or payment, allocated to that document.
 *  - Bank reconciliation statement: balance per books vs balance per bank, with every difference listed.
 */
import { round2 } from '../../lib/fx.js'
import { postJournal, seedLedger, trialBalance, ensureLedger, CHART } from './ledgerServer.js'
import { ensureBanking } from './bankingServer.js'
import { ensureBooks, recordPayment } from './booksServer.js'

const today = () => new Date().toISOString().slice(0, 10)
let seq = 0
const uid = p => `${p}-${Date.now().toString(36).toUpperCase()}${(seq++).toString(36).toUpperCase()}`

class RuleError extends Error { constructor(m) { super(m); this.status = 422 } }
const fail = m => { throw new RuleError(m) }

export const DEFAULT_RULES = [
  { name: 'Bank charges', contains: 'BANK CHARGES|SMS CHG|GST ON CHG', direction: 'debit', account: 'Operating Expenses' },
  { name: 'Card processing fees', contains: 'CARD PROCESSING|RAZORPAY FEE|STRIPE FEE', direction: 'debit', account: 'Payment Processing Fees' },
  { name: 'Rent', contains: 'RENT', direction: 'debit', account: 'Operating Expenses' },
  { name: 'Cloud & software', contains: 'CLOUD|AWS|GOOGLE WORKSPACE|MICROSOFT', direction: 'debit', account: 'Operating Expenses', maxAmount: 500000 },
]

export function ensureRules(db) {
  const banking = ensureBanking(db)
  if (!banking.rules) banking.rules = DEFAULT_RULES.map(r => ({ id: uid('RULE'), active: true, hits: 0, minAmount: null, maxAmount: null, ...r }))
  return banking.rules
}

export function ruleMatches(rule, txn) {
  if (!rule.active) return false
  if (rule.direction && rule.direction !== 'any' && rule.direction !== txn.direction) return false
  if (rule.minAmount != null && txn.amount < rule.minAmount) return false
  if (rule.maxAmount != null && txn.amount > rule.maxAmount) return false
  const words = String(rule.contains || '').toUpperCase().split('|').map(s => s.trim()).filter(Boolean)
  return words.some(w => txn.description.toUpperCase().includes(w))
}

function categorise(db, txn, account, via) {
  seedLedger(db)
  const journal = postJournal(db, {
    date: txn.date, memo: txn.description, source: 'bank', reference: txn.id,
    lines: txn.direction === 'debit'
      ? [{ account, debit: txn.amount }, { account: 'Bank', credit: txn.amount }]
      : [{ account: 'Bank', debit: txn.amount }, { account, credit: txn.amount }],
  })
  Object.assign(txn, { status: 'categorized', account, journalId: journal.id, ruleId: via ?? null })
  return journal
}

export function applyRules(db) {
  const rules = ensureRules(db)
  const done = []
  for (const txn of ensureBanking(db).transactions.filter(t => t.status === 'unmatched')) {
    const rule = rules.find(r => ruleMatches(r, txn))
    if (!rule) continue
    categorise(db, txn, rule.account, rule.id)
    rule.hits += 1
    done.push({ txnId: txn.id, rule: rule.name, account: rule.account })
  }
  return done
}

/* ── CSV statement upload ── */
function splitCsvLine(line) {
  const out = []; let cur = ''; let q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++ } else q = !q }
    else if (ch === ',' && !q) { out.push(cur.trim()); cur = '' }
    else cur += ch
  }
  out.push(cur.trim())
  return out
}

export function parseDate(s) {
  const v = String(s || '').trim()
  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return v
  m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3]
    return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }
  return null
}

const num = s => { const n = Number(String(s ?? '').replace(/[,\s₹$€£]/g, '')); return Number.isFinite(n) ? n : 0 }

export function parseStatementCsv(csv) {
  const lines = String(csv || '').split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) fail('The file needs a header row and at least one transaction')
  const head = splitCsvLine(lines[0]).map(h => h.toLowerCase())
  const col = (...names) => head.findIndex(h => names.some(n => h.includes(n)))
  const iDate = col('date'); const iDesc = col('description', 'narration', 'particulars', 'details')
  const iAmt = col('amount'); const iDr = col('debit', 'withdrawal'); const iCr = col('credit', 'deposit'); const iBal = col('balance')
  if (iDate < 0 || iDesc < 0 || (iAmt < 0 && (iDr < 0 || iCr < 0))) fail('Columns needed: Date, Description, and either Amount or Debit + Credit')
  const rows = []
  const skipped = []
  let closing = null
  lines.slice(1).forEach((line, n) => {
    const c = splitCsvLine(line)
    const date = parseDate(c[iDate])
    if (!date) { skipped.push({ line: n + 2, reason: 'date not recognised' }); return }
    let amount = iAmt >= 0 ? num(c[iAmt]) : num(c[iCr]) - num(c[iDr])
    if (!amount) { skipped.push({ line: n + 2, reason: 'no amount' }); return }
    const direction = amount < 0 ? 'debit' : 'credit'
    amount = round2(Math.abs(amount))
    if (iBal >= 0 && c[iBal]) closing = num(c[iBal])
    rows.push({ date, description: c[iDesc] || '(no description)', amount, direction })
  })
  return { rows, skipped, closingBalance: closing }
}

export function importStatement(db, csv, { bank = 'Statement upload' } = {}) {
  const banking = ensureBanking(db)
  const { rows, skipped, closingBalance } = parseStatementCsv(csv)
  let conn = banking.connections.find(c => c.bank === bank && c.source === 'upload')
  if (!conn) {
    conn = { id: uid('BC'), bank, aggregator: 'CSV statement', account: 'Uploaded', source: 'upload', status: 'active', connectedAt: new Date().toISOString() }
    banking.connections.push(conn)
  }
  const key = t => `${t.date}|${t.amount}|${t.direction}|${t.description.toUpperCase()}`
  const seen = new Set(banking.transactions.map(key))
  const added = []
  let duplicates = 0
  for (const r of rows) {
    if (seen.has(key(r))) { duplicates++; continue }
    seen.add(key(r))
    const txn = { id: uid('TX'), connectionId: conn.id, ...r, status: 'unmatched' }
    banking.transactions.unshift(txn)
    added.push(txn)
  }
  conn.lastSync = new Date().toISOString()
  if (closingBalance != null) conn.closingBalance = closingBalance
  return { added: added.length, duplicates, skipped, connectionId: conn.id, closingBalance }
}

/* ── Matching bank lines to invoices and bills in the books ── */
export function bookSuggestions(db, txn) {
  const books = db.books
  if (!books || txn.status !== 'unmatched') return []
  const docs = txn.direction === 'credit' ? books.invoices : books.bills
  return docs.filter(d => d.status === 'open' && d.balance > 0)
    .map(d => {
      const ref = d.number || d.supplierRef
      const refHit = ref && txn.description.toUpperCase().includes(String(ref).toUpperCase())
      const nameHit = txn.description.toUpperCase().includes(d.partyName.split(' ')[0].toUpperCase())
      const amountHit = Math.abs(d.balance - txn.amount) < 0.01
      const score = (amountHit ? 60 : 0) + (refHit ? 30 : 0) + (nameHit ? 10 : 0)
      return { docId: d.id, number: ref, party: d.partyName, balance: d.balance, score, kind: txn.direction === 'credit' ? 'invoice' : 'bill' }
    })
    .filter(s => s.score >= 60 || (s.score >= 10 && s.balance >= txn.amount))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

export function settleWithBooks(ctx, txnId, docId) {
  const { db } = ctx
  const txn = ensureBanking(db).transactions.find(t => t.id === txnId)
  if (!txn) fail('Transaction not found')
  if (txn.status !== 'unmatched') fail('This transaction is already reconciled')
  const books = db.books
  const doc = (txn.direction === 'credit' ? books.invoices : books.bills).find(d => d.id === docId)
  if (!doc) fail(`Choose an open ${txn.direction === 'credit' ? 'invoice' : 'bill'}`)
  const payment = recordPayment(ctx, {
    type: txn.direction === 'credit' ? 'receipt' : 'payment', partyId: doc.partyId, amount: txn.amount, date: txn.date, account: 'Bank',
    allocations: [{ docId: doc.id, amount: Math.min(txn.amount, doc.balance) }],
  })
  Object.assign(txn, { status: 'matched', documentId: doc.id, paymentId: payment.id, journalId: payment.journalId })
  return { txn, payment }
}

/* ── Bank reconciliation statement ── */
export function reconciliation(db, asOf = today()) {
  seedLedger(db)
  const banking = ensureBanking(db)
  const bookBalance = trialBalance(db, asOf).rows.find(r => r.code === '1000')?.balance ?? 0
  const linked = new Set(banking.transactions.filter(t => t.journalId).map(t => t.journalId))
  const bankLines = banking.transactions.filter(t => t.status === 'unmatched' && t.date <= asOf)
  // Book entries in the last 45 days that the bank has not shown yet (cheques not presented, deposits in transit)
  const since = new Date(`${asOf}T00:00:00`); since.setDate(since.getDate() - 45)
  const cutoff = since.toISOString().slice(0, 10)
  const bookLines = ensureLedger(db).journals
    .filter(j => j.date >= cutoff && j.date <= asOf && ['receipt', 'payment'].includes(j.source) && !linked.has(j.id))
    .map(j => {
      const bank = j.lines.find(l => l.account === '1000')
      return bank ? { id: j.id, date: j.date, memo: j.memo, amount: bank.debit || bank.credit, direction: bank.debit ? 'deposit' : 'withdrawal' } : null
    }).filter(Boolean)
  const add = (list, dir) => round2(list.filter(x => x.direction === dir).reduce((s, x) => s + x.amount, 0))
  const notInBooksCredits = add(bankLines, 'credit'); const notInBooksDebits = add(bankLines, 'debit')
  const depositsInTransit = add(bookLines, 'deposit'); const unpresented = add(bookLines, 'withdrawal')
  const derivedBank = round2(bookBalance + notInBooksCredits - notInBooksDebits - depositsInTransit + unpresented)
  const uploaded = banking.connections.find(c => c.closingBalance != null)
  const bankBalance = uploaded ? uploaded.closingBalance : derivedBank
  return {
    asOf, bookBalance, bankBalance, bankBalanceSource: uploaded ? `Closing balance on ${uploaded.bank}` : 'Bank feed',
    adjustments: [
      { label: 'Add: received in bank, not yet in books', amount: notInBooksCredits, items: bankLines.filter(x => x.direction === 'credit') },
      { label: 'Less: paid by bank, not yet in books', amount: -notInBooksDebits, items: bankLines.filter(x => x.direction === 'debit') },
      { label: 'Less: deposits in books, not yet in bank', amount: -depositsInTransit, items: bookLines.filter(x => x.direction === 'deposit') },
      { label: 'Add: payments in books, not yet cleared by bank', amount: unpresented, items: bookLines.filter(x => x.direction === 'withdrawal') },
    ],
    adjustedBookBalance: derivedBank,
    unexplained: round2(bankBalance - derivedBank),
    reconciled: round2(bankBalance - derivedBank) === 0 && bankLines.length === 0,
  }
}

export function registerBankRulesRoutes(route, { ok, badRequest, notFound }) {
  const guard = fn => { try { return fn() } catch (e) { if (e instanceof RuleError || e.status === 422) badRequest(e.message, e.details); throw e } }
  const withBooks = h => ctx => { ensureBooks(ctx.db, ctx.company); return h(ctx) }

  route('GET', '/bank/rules', ({ db }) => ok(ensureRules(db)), { summary: 'Bank rules' })
  route('POST', '/bank/rules', ({ db, body, save }) => {
    if (!body?.name?.trim() || !body?.contains?.trim()) badRequest('Give the rule a name and the words to look for')
    if (!CHART.some(a => a.name === body.account)) badRequest('Choose an account from the chart of accounts')
    const rule = { id: uid('RULE'), name: body.name.trim(), contains: body.contains.trim(), direction: body.direction || 'any', account: body.account,
      minAmount: body.minAmount === '' || body.minAmount == null ? null : Number(body.minAmount), maxAmount: body.maxAmount === '' || body.maxAmount == null ? null : Number(body.maxAmount), active: true, hits: 0 }
    ensureRules(db).push(rule); save()
    return ok({ ...rule, auditSummary: `Bank rule "${rule.name}" created` }, 201)
  }, { summary: 'Create a bank rule' })
  route('DELETE', '/bank/rules/:id', ({ db, params, save }) => {
    const rules = ensureRules(db)
    const i = rules.findIndex(r => r.id === params.id); if (i < 0) notFound('Rule')
    const [r] = rules.splice(i, 1); save()
    return ok({ id: r.id, auditSummary: `Bank rule "${r.name}" deleted` })
  }, { summary: 'Delete a bank rule' })
  route('POST', '/bank/rules/apply', ({ db, save }) => {
    const done = guard(() => applyRules(db)); save()
    return ok({ categorised: done.length, results: done, auditSummary: `Bank rules categorised ${done.length} transaction(s)` })
  }, { summary: 'Apply rules to unreconciled transactions (posts each one)' })

  route('POST', '/bank/statement/import', ({ db, body, save }) => {
    const r = guard(() => importStatement(db, body?.csv, { bank: body?.bank || 'Statement upload' })); save()
    return ok({ ...r, auditSummary: `Statement uploaded: ${r.added} new, ${r.duplicates} duplicate(s) skipped` }, 201)
  }, { summary: 'Upload a CSV bank statement' })

  route('GET', '/bank/book-matches', withBooks(({ db }) => ok(ensureBanking(db).transactions.filter(t => t.status === 'unmatched').map(t => ({ ...t, bookSuggestions: bookSuggestions(db, t) })))), { summary: 'Unreconciled lines with matching invoices and bills from the books' })
  route('POST', '/bank/transactions/:id/settle', withBooks(ctx => {
    const r = guard(() => settleWithBooks(ctx, ctx.params.id, ctx.body?.docId)); ctx.save()
    return ok({ ...r.txn, paymentId: r.payment.id, auditSummary: `Bank line ${r.txn.id} settled ${r.payment.type} ${r.payment.id}` })
  }), { summary: 'Settle a bank line against an invoice or bill (records the receipt/payment)' })

  route('GET', '/bank/reconciliation', withBooks(({ db, query }) => ok(reconciliation(db, query.asOf))), { summary: 'Bank reconciliation statement' })
}
