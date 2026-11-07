/**
 * Bank feeds and payment links (mock).
 *
 * Bank feeds: connect a bank through the country's open-banking aggregator
 * (Account Aggregator, Plaid, TrueLayer, Lean, Basiq, Belvo…), import
 * transactions, and match them to invoices — exact matches (amount + reference)
 * are matched automatically; each match / categorisation posts to the ledger.
 *
 * Payment links: hosted checkout links for invoices via the country's gateway
 * (Razorpay, Stripe, Pix…). Paying a link settles the receivable, books the
 * gateway fee and posts the journal.
 */
import { COUNTRY_BY_CODE } from '../../lib/countryTax.js'
import { round2 } from '../../lib/fx.js'
import { makeRng } from './taxSeed.js'
import { postJournal, seedLedger } from './ledgerServer.js'

const BANK_PROVIDERS = {
  IN: { aggregator: 'Account Aggregator (RBI framework)', banks: ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'] },
  US: { aggregator: 'Plaid', banks: ['Chase', 'Bank of America', 'Wells Fargo', 'Citi'] },
  CA: { aggregator: 'Plaid', banks: ['RBC', 'TD', 'Scotiabank', 'BMO'] },
  GB: { aggregator: 'TrueLayer (Open Banking UK)', banks: ['Barclays', 'HSBC UK', 'Lloyds', 'NatWest'] },
  IE: { aggregator: 'TrueLayer (PSD2)', banks: ['AIB', 'Bank of Ireland'] },
  FR: { aggregator: 'TrueLayer (PSD2)', banks: ['BNP Paribas', 'Société Générale', 'Crédit Agricole'] },
  DE: { aggregator: 'TrueLayer (PSD2)', banks: ['Deutsche Bank', 'Commerzbank', 'Sparkasse'] },
  ES: { aggregator: 'TrueLayer (PSD2)', banks: ['Santander', 'BBVA', 'CaixaBank'] },
  IT: { aggregator: 'TrueLayer (PSD2)', banks: ['Intesa Sanpaolo', 'UniCredit'] },
  NL: { aggregator: 'TrueLayer (PSD2)', banks: ['ING', 'ABN AMRO', 'Rabobank'] },
  AE: { aggregator: 'Lean Technologies', banks: ['Emirates NBD', 'FAB', 'ADCB'] },
  SA: { aggregator: 'Lean Technologies', banks: ['Al Rajhi Bank', 'SNB', 'Riyad Bank'] },
  AU: { aggregator: 'Basiq (Consumer Data Right)', banks: ['CommBank', 'Westpac', 'ANZ', 'NAB'] },
  NZ: { aggregator: 'Akahu', banks: ['ANZ NZ', 'ASB', 'BNZ'] },
  SG: { aggregator: 'SGFinDex / Brankas', banks: ['DBS', 'OCBC', 'UOB'] },
  BR: { aggregator: 'Open Finance Brasil (Belvo)', banks: ['Itaú', 'Bradesco', 'Banco do Brasil', 'Nubank'] },
  MX: { aggregator: 'Belvo', banks: ['BBVA México', 'Banorte', 'Santander México'] },
  JP: { aggregator: 'Moneytree LINK', banks: ['MUFG', 'SMBC', 'Mizuho'] },
}

const GATEWAYS = {
  IN: { name: 'Razorpay', methods: ['UPI', 'Card', 'Netbanking'], feePct: 2 },
  BR: { name: 'Stripe (Pix + cards)', methods: ['Pix', 'Card', 'Boleto'], feePct: 3.99 },
  NL: { name: 'Stripe (iDEAL + cards)', methods: ['iDEAL', 'Card'], feePct: 1.5 },
  MX: { name: 'Stripe (OXXO + cards)', methods: ['Card', 'OXXO'], feePct: 3.6 },
  default: { name: 'Stripe', methods: ['Card', 'Bank transfer'], feePct: 2.9 },
}

export function bankProviderFor(country) {
  return BANK_PROVIDERS[country] ?? { aggregator: 'Open-banking aggregator', banks: ['Primary Business Bank', 'National Bank'] }
}
export function gatewayFor(country) {
  return GATEWAYS[country] ?? GATEWAYS.default
}

function randomHex(n) {
  const arr = new Uint8Array(n)
  globalThis.crypto.getRandomValues(arr)
  return [...arr].map(b => b.toString(16).padStart(2, '0')).join('')
}
const today = () => new Date().toISOString().slice(0, 10)

export function ensureBanking(db) {
  db.banking ??= { connections: [], transactions: [], links: [] }
  return db.banking
}

/* Generate a realistic feed: customer receipts (some referencing invoice numbers), fees, payroll, rent */
function seedTransactions(db, connection) {
  const rng = makeRng(`bank-${connection.id}`)
  const txns = []
  const invoices = (db.einvoices ?? []).filter(e => !e.paid)
  invoices.slice(0, 6).forEach((inv, i) => {
    const d = new Date(); d.setDate(d.getDate() - (i * 2 + 1))
    const exact = i % 3 !== 2
    txns.push({
      id: `TX-${randomHex(5)}`, connectionId: connection.id, date: d.toISOString().slice(0, 10),
      description: exact ? `NEFT/IMPS CR ${inv.customer.toUpperCase().slice(0, 18)} ${inv.invoiceNo}` : `CREDIT ${inv.customer.toUpperCase().slice(0, 22)}`,
      amount: inv.total, direction: 'credit', status: 'unmatched',
    })
  })
  const monthly = round2((db.einvoices?.[0]?.total ?? 10000) * 0.6)
  const others = [
    ['Bank charges', 0.004, 'Operating Expenses'], ['Office rent', 1.1, 'Operating Expenses'], ['Payroll transfer', 3.2, 'Operating Expenses'],
    ['Cloud services', 0.08, 'Operating Expenses'], ['Card processing fees', 0.02, 'Payment Processing Fees'],
  ]
  others.forEach(([label, factor, account], i) => {
    const d = new Date(); d.setDate(d.getDate() - (i * 3 + 2))
    txns.push({
      id: `TX-${randomHex(5)}`, connectionId: connection.id, date: d.toISOString().slice(0, 10),
      description: `${label.toUpperCase()} ${randomHex(3).toUpperCase()}`, amount: round2(monthly * factor * (0.9 + rng() * 0.2)),
      direction: 'debit', status: 'unmatched', suggestedAccount: account,
    })
  })
  return txns.sort((a, b) => b.date.localeCompare(a.date))
}

/** Candidate documents for a credit: invoices with the same amount; exact when the reference matches too. */
function suggestionsFor(db, txn) {
  if (txn.direction !== 'credit') return []
  return (db.einvoices ?? [])
    .filter(e => !e.paid && Math.abs(e.total - txn.amount) < 0.01)
    .map(e => ({ documentId: e.id, invoiceNo: e.invoiceNo, customer: e.customer, amount: e.total, confidence: txn.description.includes(e.invoiceNo) ? 'exact' : 'amount' }))
}

function settleInvoice(db, inv, { date, account, memo, reference, fee = 0 }) {
  seedLedger(db)
  inv.paid = true
  inv.paidOn = date
  return postJournal(db, {
    date, memo, source: 'receipt', reference,
    lines: [
      { account, debit: round2(inv.total - fee) },
      ...(fee > 0 ? [{ account: 'Payment Processing Fees', debit: fee }] : []),
      { account: 'Accounts Receivable', credit: inv.total },
    ],
  })
}

export function registerBankingRoutes(route, { ok, badRequest, notFound }) {
  route('GET', '/bank/providers', ({ company }) => ok({ ...bankProviderFor(company.country), gateway: gatewayFor(company.country) }), { summary: 'Open-banking aggregator and payment gateway for the country' })

  route('GET', '/bank/connections', ({ db }) => ok(ensureBanking(db).connections), { summary: 'Connected bank feeds' })

  route('POST', '/bank/connections', ({ db, body, company, user, save }) => {
    const provider = bankProviderFor(company.country)
    if (!provider.banks.includes(body?.bank)) badRequest(`Choose one of: ${provider.banks.join(', ')}`)
    if (!body?.consent) badRequest('Account-information consent is required')
    const banking = ensureBanking(db)
    const conn = {
      id: `BC-${randomHex(4).toUpperCase()}`, bank: body.bank, aggregator: provider.aggregator,
      account: `****${String(Math.floor(1000 + Math.random() * 9000))}`, currency: COUNTRY_BY_CODE[company.country]?.currency,
      consentExpires: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      connectedAt: new Date().toISOString(), connectedBy: user?.name ?? null, lastSync: new Date().toISOString(), status: 'active',
    }
    banking.connections.unshift(conn)
    banking.transactions.unshift(...seedTransactions(db, conn))
    save()
    return ok({ ...conn, auditSummary: `Bank feed connected: ${conn.bank} ${conn.account} via ${conn.aggregator}` }, 201)
  }, { summary: 'Connect a bank feed (account-information consent)' })

  route('GET', '/bank/transactions', ({ db }) => {
    const banking = ensureBanking(db)
    return ok(banking.transactions.map(t => ({ ...t, suggestions: t.status === 'unmatched' ? suggestionsFor(db, t) : [] })))
  }, { summary: 'Imported transactions with match suggestions' })

  route('POST', '/bank/transactions/:id/match', ({ db, params, body, save }) => {
    const txn = ensureBanking(db).transactions.find(t => t.id === params.id) || notFound('Transaction')
    if (txn.status !== 'unmatched') badRequest('Transaction is already reconciled')
    const inv = (db.einvoices ?? []).find(e => e.id === body?.documentId) || notFound('Invoice')
    if (Math.abs(inv.total - txn.amount) >= 0.01) badRequest('Amounts differ — record a part-payment instead')
    const journal = settleInvoice(db, inv, { date: txn.date, account: 'Bank', memo: `Receipt ${inv.invoiceNo} — ${inv.customer}`, reference: txn.id })
    Object.assign(txn, { status: 'matched', documentId: inv.id, journalId: journal.id })
    save()
    return ok({ ...txn, auditSummary: `Bank transaction ${txn.id} matched to ${inv.invoiceNo}` })
  }, { summary: 'Match a bank transaction to an invoice (posts the receipt)' })

  route('POST', '/bank/transactions/:id/categorize', ({ db, params, body, save }) => {
    const txn = ensureBanking(db).transactions.find(t => t.id === params.id) || notFound('Transaction')
    if (txn.status !== 'unmatched') badRequest('Transaction is already reconciled')
    const account = body?.account || txn.suggestedAccount || 'Operating Expenses'
    seedLedger(db)
    const journal = postJournal(db, {
      date: txn.date, memo: txn.description, source: 'bank', reference: txn.id,
      lines: txn.direction === 'debit'
        ? [{ account, debit: txn.amount }, { account: 'Bank', credit: txn.amount }]
        : [{ account: 'Bank', debit: txn.amount }, { account, credit: txn.amount }],
    })
    Object.assign(txn, { status: 'categorized', account, journalId: journal.id })
    save()
    return ok({ ...txn, auditSummary: `Bank transaction ${txn.id} posted to ${account}` })
  }, { summary: 'Post a bank transaction to an account' })

  route('POST', '/bank/auto-match', ({ db, save }) => {
    const banking = ensureBanking(db)
    const done = []
    for (const txn of banking.transactions.filter(t => t.status === 'unmatched')) {
      const exact = suggestionsFor(db, txn).find(s => s.confidence === 'exact')
      if (!exact) continue
      const inv = db.einvoices.find(e => e.id === exact.documentId)
      const journal = settleInvoice(db, inv, { date: txn.date, account: 'Bank', memo: `Receipt ${inv.invoiceNo} — ${inv.customer}`, reference: txn.id })
      Object.assign(txn, { status: 'matched', documentId: inv.id, journalId: journal.id })
      done.push(txn.id)
    }
    save()
    return ok({ matched: done.length, ids: done, auditSummary: `Auto-matched ${done.length} bank transaction(s)` })
  }, { summary: 'Auto-match exact amount + reference matches' })

  /* ── Payment links ── */
  route('GET', '/payment-links', ({ db }) => ok(ensureBanking(db).links), { summary: 'Payment links' })

  route('POST', '/payment-links', ({ db, body, company, save }) => {
    const inv = (db.einvoices ?? []).find(e => e.id === body?.invoiceId) || notFound('Invoice')
    if (inv.paid) badRequest('This invoice is already paid')
    const banking = ensureBanking(db)
    const existing = banking.links.find(l => l.invoiceId === inv.id && l.status === 'open')
    if (existing) return ok(existing)
    const gw = gatewayFor(company.country)
    const link = {
      id: `pl_${randomHex(6)}`, invoiceId: inv.id, invoiceNo: inv.invoiceNo, customer: inv.customer,
      amount: inv.total, currency: COUNTRY_BY_CODE[company.country]?.currency, gateway: gw.name, methods: gw.methods,
      companyId: company.id, companyName: company.name, country: company.country,
      status: 'open', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    }
    banking.links.unshift(link)
    save()
    return ok({ ...link, auditSummary: `Payment link ${link.id} created for ${inv.invoiceNo}` }, 201)
  }, { summary: 'Create a hosted payment link for an invoice' })

  // Checkout page — customers pay without signing in
  route('GET', '/payment-links/:id', ({ db, params }) => {
    const link = ensureBanking(db).links.find(l => l.id === params.id) || notFound('Payment link')
    return ok(link)
  }, { public: true, summary: 'Public checkout details for a payment link' })

  route('POST', '/payment-links/:id/pay', ({ db, params, body, save }) => {
    const banking = ensureBanking(db)
    const link = banking.links.find(l => l.id === params.id) || notFound('Payment link')
    if (link.status !== 'open') badRequest(`This link is ${link.status}`)
    if (!link.methods.includes(body?.method)) badRequest(`Choose a payment method: ${link.methods.join(', ')}`)
    const inv = (db.einvoices ?? []).find(e => e.id === link.invoiceId)
    const gw = Object.values(GATEWAYS).find(g => g.name === link.gateway) ?? GATEWAYS.default
    const fee = round2(link.amount * gw.feePct / 100)
    const journal = inv && !inv.paid
      ? settleInvoice(db, inv, { date: today(), account: 'Payment Gateway Clearing', memo: `${link.gateway} payment ${link.invoiceNo}`, reference: link.id, fee })
      : null
    Object.assign(link, { status: 'paid', paidAt: new Date().toISOString(), method: body.method, fee, net: round2(link.amount - fee), paymentId: `pay_${randomHex(8)}`, journalId: journal?.id ?? null })
    save()
    return ok({ ...link, auditSummary: `Payment link ${link.id} paid by ${body.method}` })
  }, { public: true, summary: 'Pay a payment link (customer checkout)' })
}
