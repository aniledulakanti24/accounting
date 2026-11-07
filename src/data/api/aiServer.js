/**
 * AI analyst over the books (mock backend, deterministic so it can be tested):
 *  - anomaly checks a controller would run: duplicate bills, statistical outliers, weekend and
 *    round-number manual journals, sales below cost, customers over their credit limit
 *  - cash forecast: least-squares trend of monthly net cash plus expected collections by due date
 *  - plain-language questions answered from the ledger, each with the report it came from
 */
import { round2 } from '../../lib/fx.js'
import { ensureLedger, trialBalance } from './ledgerServer.js'
import { ensureBooks, profitAndLoss, ageing, stockReport, outstandingFor } from './booksServer.js'

const iso = d => d.toISOString().slice(0, 10)
const today = () => iso(new Date())
const shift = (days, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + days); return iso(d) }

export function anomalies(db) {
  const books = db.books
  const journals = ensureLedger(db).journals
  const out = []
  // 1. Same supplier, same amount, within 30 days
  const bills = [...books.bills].sort((a, b) => a.date.localeCompare(b.date))
  bills.forEach((b, i) => bills.slice(i + 1).forEach(o => {
    if (o.partyId === b.partyId && Math.abs(o.total - b.total) < 0.01 && (new Date(o.date) - new Date(b.date)) / 86400000 <= 30) {
      out.push({ severity: 'high', kind: 'duplicate-bill', title: `Possible duplicate bill from ${b.partyName}`, detail: `${b.id} and ${o.id} are both ${o.total} within 30 days.`, refs: [b.id, o.id], link: '/procurement/bill-approvals' })
    }
  }))
  // 2. Statistical outliers per kind of entry (more than 3 standard deviations above the mean)
  const bySource = {}
  journals.forEach(j => { (bySource[j.source] ??= []).push(j) })
  for (const [source, list] of Object.entries(bySource)) {
    if (list.length < 6) continue
    const vals = list.map(j => j.total)
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length
    const sd = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length)
    list.filter(j => sd > 0 && (j.total - mean) / sd > 3).forEach(j => out.push({ severity: 'medium', kind: 'outlier', title: `Unusually large ${source} entry`, detail: `${j.id} (${j.total}) is ${round2((j.total - mean) / sd)} standard deviations above the usual ${source} amount.`, refs: [j.id], link: '/reports/general-ledger' }))
  }
  // 3. Manual journals on weekends, and big round numbers
  journals.filter(j => j.source === 'manual').forEach(j => {
    const day = new Date(`${j.date}T00:00:00`).getDay()
    if (day === 0 || day === 6) out.push({ severity: 'low', kind: 'weekend', title: 'Manual journal dated on a weekend', detail: `${j.id} on ${j.date}: ${j.memo || 'no memo'}.`, refs: [j.id], link: '/reports/general-ledger' })
    if (j.total >= 100000 && j.total % 100000 === 0) out.push({ severity: 'medium', kind: 'round-number', title: 'Large round-number manual journal', detail: `${j.id} is exactly ${j.total}. Round estimates deserve a supporting document.`, refs: [j.id], link: '/reports/general-ledger' })
  })
  // 4. Sold below cost
  books.invoices.filter(i => i.cogs > 0 && i.cogs > i.subtotal * i.fxRate).forEach(i => out.push({ severity: 'high', kind: 'below-cost', title: `Sold below cost — ${i.number}`, detail: `Cost of goods ${i.cogs} is more than the sale value ${round2(i.subtotal * i.fxRate)}.`, refs: [i.id], link: '/sales/invoice-desk' }))
  // 5. Customers over their limit
  books.parties.filter(p => p.type === 'customer' && p.creditLimit > 0).forEach(p => {
    const owed = outstandingFor(books, p.id)
    if (owed > p.creditLimit) out.push({ severity: 'medium', kind: 'credit-limit', title: `${p.name} is over their credit limit`, detail: `Owes ${owed} against a limit of ${p.creditLimit}.`, refs: [p.id], link: '/sales/invoice-desk' })
  })
  const rank = { high: 0, medium: 1, low: 2 }
  return out.sort((a, b) => rank[a.severity] - rank[b.severity])
}

/** Least-squares line through monthly net cash, then project the bank balance. */
export function forecast(db, months = 3) {
  const books = db.books
  const cash = trialBalance(db).rows.filter(r => ['1000', '1010'].includes(r.code)).reduce((s, r) => s + r.balance, 0)
  const byMonth = {}
  for (const j of ensureLedger(db).journals) {
    const net = j.lines.filter(l => ['1000', '1010'].includes(l.account)).reduce((s, l) => s + l.debit - l.credit, 0)
    if (net && j.source !== 'opening') byMonth[j.date.slice(0, 7)] = round2((byMonth[j.date.slice(0, 7)] || 0) + net)
  }
  const history = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, net]) => ({ month, net }))
  const n = history.length
  let slope = 0; let intercept = n ? history[0].net : 0
  if (n >= 2) {
    const xs = history.map((_, i) => i); const ys = history.map(h => h.net)
    const mx = xs.reduce((s, v) => s + v, 0) / n; const my = ys.reduce((s, v) => s + v, 0) / n
    const den = xs.reduce((s, x) => s + (x - mx) ** 2, 0)
    slope = den ? xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / den : 0
    intercept = my - slope * mx
  }
  // Collections we can expect from open invoices: due ones at 90%, overdue at 60%
  const ar = ageing(books, 'receivable').documents
  const expected = [30, 60, 90].map(days => {
    const until = shift(days)
    return { withinDays: days, amount: round2(ar.filter(d => d.dueDate <= until).reduce((s, d) => s + d.balance * (d.daysOverdue > 0 ? 0.6 : 0.9), 0)) }
  })
  let balance = round2(cash)
  const projection = Array.from({ length: months }, (_, k) => {
    const net = round2(intercept + slope * (n + k))
    balance = round2(balance + net)
    const d = new Date(); d.setMonth(d.getMonth() + k + 1)
    return { month: iso(d).slice(0, 7), net, balance }
  })
  const burn = projection.find(p => p.balance < 0)
  return { cashToday: round2(cash), history, trendPerMonth: round2(slope), projection, expectedCollections: expected,
    runway: burn ? `Cash runs out around ${burn.month} on the current trend` : 'Cash stays positive for the forecast period',
    method: 'Least-squares trend of the last 6 months of net cash movement' }
}

function periodFrom(q) {
  const now = new Date()
  const first = (y, m) => iso(new Date(y, m, 1))
  if (/last month/.test(q)) return { from: first(now.getFullYear(), now.getMonth() - 1), to: iso(new Date(now.getFullYear(), now.getMonth(), 0)), label: 'last month' }
  if (/this month/.test(q)) return { from: first(now.getFullYear(), now.getMonth()), to: today(), label: 'this month' }
  if (/last (30|thirty) days/.test(q)) return { from: shift(-30), to: today(), label: 'the last 30 days' }
  if (/this (year|fy|financial year)/.test(q) || /ytd/.test(q)) { const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1; return { from: `${y}-04-01`, to: today(), label: 'this financial year' } }
  return { from: null, to: null, label: 'all time' }
}

/** Answer a plain-language question from the books; always says which report the number came from. */
export function ask(db, question) {
  const q = String(question || '').toLowerCase()
  const books = db.books
  const p = periodFrom(q)
  const money = v => round2(v)
  if (/profit|margin|earn/.test(q)) {
    const r = profitAndLoss(db, p)
    return { answer: `Net profit for ${p.label} is ${money(r.netProfit)} on revenue of ${money(r.revenue)} (${r.netMargin}% margin).`, value: r.netProfit, source: 'Profit & loss', link: '/reports/live-financials' }
  }
  if (/sales|revenue|turnover|sold/.test(q)) {
    const r = profitAndLoss(db, p)
    return { answer: `Sales for ${p.label}: ${money(r.revenue)}.`, value: r.revenue, source: 'Profit & loss', link: '/reports/live-financials' }
  }
  if (/expense|spend|spent|cost/.test(q)) {
    const r = profitAndLoss(db, p)
    return { answer: `Costs for ${p.label}: ${money(r.costOfSalesTotal)} cost of sales and ${money(r.opex)} operating expenses.`, value: r.costOfSalesTotal + r.opex, source: 'Profit & loss', link: '/reports/live-financials' }
  }
  if (/overdue|late/.test(q)) {
    const r = ageing(books, 'receivable').documents.filter(d => d.daysOverdue > 0)
    const top = r[0]
    return { answer: r.length ? `${r.length} invoice(s) are overdue, ${money(r.reduce((s, d) => s + d.balance, 0))} in total. The oldest is ${top.number} from ${top.party}, ${top.daysOverdue} days late.` : 'Nothing is overdue.', value: r.length, source: 'Receivable ageing', link: '/reports/live-financials' }
  }
  if (/owe|debtor|receivable|who.*pay/.test(q)) {
    const r = ageing(books, 'receivable')
    const byParty = {}
    r.documents.forEach(d => { byParty[d.party] = (byParty[d.party] || 0) + d.balance })
    const top = Object.entries(byParty).sort((a, b) => b[1] - a[1]).slice(0, 3)
    return { answer: `Customers owe ${money(r.total)}. Largest: ${top.map(([n, v]) => `${n} (${money(v)})`).join(', ') || 'none'}.`, value: r.total, source: 'Receivable ageing', link: '/reports/live-financials' }
  }
  if (/payable|creditor|supplier|bills? (due|to pay)/.test(q)) {
    const r = ageing(books, 'payable')
    return { answer: `You owe suppliers ${money(r.total)} across ${r.documents.length} bill(s).`, value: r.total, source: 'Payable ageing', link: '/procurement/bill-approvals' }
  }
  if (/cash|bank|balance/.test(q)) {
    const f = forecast(db)
    return { answer: `Cash and bank stand at ${money(f.cashToday)}. ${f.runway}.`, value: f.cashToday, source: 'Ledger + cash forecast', link: '/cashbank/bank-rules' }
  }
  if (/gst|tax|vat/.test(q)) {
    const tb = trialBalance(db).rows
    const out = tb.find(r => r.code === '2100')?.balance ?? 0
    const inp = tb.find(r => r.code === '1200')?.balance ?? 0
    return { answer: `Output tax ${money(out)} less input credit ${money(inp)} — net ${money(out - inp)} ${out - inp >= 0 ? 'to pay' : 'refundable'} (before GSTR-2B checks).`, value: out - inp, source: 'Trial balance', link: '/tax/gst-from-books' }
  }
  if (/stock|inventory|warehouse/.test(q)) {
    const s = stockReport(books)
    return { answer: `Stock is worth ${money(s.totalValue)}; ${s.lowStock} item(s) are at or below reorder level and ${s.expiringBatches} batch(es) expire within 30 days.`, value: s.totalValue, source: 'Stock valuation', link: '/inventory/stock-valuation' }
  }
  if (/best|top|biggest|largest/.test(q) && /customer|client/.test(q)) {
    const totals = {}
    books.invoices.filter(i => (!p.from || i.date >= p.from) && (!p.to || i.date <= p.to)).forEach(i => { totals[i.partyName] = (totals[i.partyName] || 0) + i.totalBase })
    const [name, v] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0] ?? []
    return { answer: name ? `Your biggest customer for ${p.label} is ${name} with ${money(v)} invoiced.` : 'No sales in that period.', value: v ?? 0, source: 'Sales invoices', link: '/sales/invoice-desk' }
  }
  return { answer: 'I can answer questions about sales, profit, expenses, cash, who owes you, overdue invoices, suppliers, GST and stock. Try "What was profit this month?"', value: null, source: null, link: null }
}

export function registerAiRoutes(route, { ok, badRequest }) {
  const w = h => ctx => { ensureBooks(ctx.db, ctx.company); return h(ctx) }
  route('GET', '/ai/anomalies', w(({ db }) => ok(anomalies(db))), { summary: 'Things in the books that look wrong' })
  route('GET', '/ai/forecast', w(({ db, query }) => ok(forecast(db, Math.min(12, Math.max(1, Number(query.months) || 3))))), { summary: 'Cash forecast from the ledger trend' })
  route('POST', '/ai/ask', w(({ db, body }) => {
    if (!body?.question?.trim()) badRequest('Ask a question')
    return ok({ question: body.question, ...ask(db, body.question) })
  }), { summary: 'Ask a question about your books' })
}
