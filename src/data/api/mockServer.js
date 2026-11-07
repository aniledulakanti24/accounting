/**
 * Mock backend — an in-browser REST server.
 *
 * Mimics a real API: path-based routing, JSON request/response, HTTP status
 * codes, validation errors, network latency, per-tenant (company) data
 * isolation and persistence. Data lives in localStorage under one key per
 * company so it survives reloads. Swap `client.js` to point at a real server
 * and the UI keeps working unchanged.
 */
import { SUPPORTED_COUNTRIES, getCountryTaxConfig, COUNTRY_TAX_RATES } from '../../lib/countryTax.js'
import { getTaxCatalog } from './taxCatalog.js'
import { seedCompanyTaxData, makeAckRef, computeDueDate } from './taxSeed.js'
import { USD_RATES, CURRENCY_NAMES, usdRatesOn, isoDay } from './fxRates.js'
import { seedFx } from './fxSeed.js'
import { registerFxRoutes } from './fxRoutes.js'
import { DEMO_USERS, DEMO_PASSWORD, login, logout, userForToken, authorize, appendAudit, verifyAudit, sha256Hex, getPolicy, savePolicy, effectiveAccess, roleFor } from './authServer.js'
import { ROLES } from '../../config/permissions.js'
import { emitWebhooks, registerDeveloperRoutes } from './developerServer.js'
import { registerLedgerRoutes, seedLedger, postFromLegs } from './ledgerServer.js'
import { registerComplianceRoutes, issueEInvoice, activeConnection, recordSubmission, filingProviderFor } from './complianceServer.js'
import { registerBankingRoutes } from './bankingServer.js'
import { registerBooksRoutes } from './booksServer.js'
import { registerBankRulesRoutes } from './bankRulesServer.js'
import { registerGstRoutes } from './gstServer.js'
import { registerInventoryRoutes } from './inventoryServer.js'
import { registerAppsRoutes } from './appsServer.js'
import { registerPlatformRoutes } from './platformServer.js'
import { registerMigrationRoutes } from './migrationServer.js'
import { registerAiRoutes } from './aiServer.js'

const STORAGE_PREFIX = 'ut-mock-api:v1:'
// Bump when the seed shape or rules change so stored demo data is re-generated
const SEED_VERSION = 2
const LATENCY = { min: 180, max: 520 }
const memoryStore = new Map()
const requestLog = []
const logListeners = new Set()

/* ── Persistence ── */
function storageKey(companyId) {
  return `${STORAGE_PREFIX}${companyId}`
}

function loadTenant(company) {
  const key = storageKey(company.id)
  if (memoryStore.has(key)) {
    const cached = memoryStore.get(key)
    if (cached.country === company.country && cached.seedVersion === SEED_VERSION) return cached
  }
  let data = null
  try {
    const raw = localStorage.getItem(key)
    if (raw) data = JSON.parse(raw)
  } catch {
    data = null
  }
  // Re-seed when the company's jurisdiction changed or nothing is stored yet
  if (!data || data.country !== company.country || data.seedVersion !== SEED_VERSION) {
    data = { ...seedCompanyTaxData(company), seedVersion: SEED_VERSION }
    saveTenant(company, data)
  }
  memoryStore.set(key, data)
  return data
}

function saveTenant(company, data) {
  const key = storageKey(company.id)
  memoryStore.set(key, data)
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    /* storage full or unavailable — keep in memory only */
  }
}

export function resetTenant(companyId) {
  const key = storageKey(companyId)
  memoryStore.delete(key)
  try { localStorage.removeItem(key) } catch { /* ignore */ }
}

/* ── HTTP helpers ── */
class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}
const ok = (data, status = 200) => ({ status, data })
const notFound = (what) => { throw new HttpError(404, `${what} not found`) }
const badRequest = (message, details) => { throw new HttpError(422, message, details) }

// Local calendar date (not UTC) so "today" matches what the user sees
const todayIso = () => isoDay(new Date())

function summarizeReturns(returns) {
  const filed = returns.filter(r => r.status === 'filed')
  const ready = returns.filter(r => r.status === 'ready')
  const open = returns.filter(r => r.status === 'open')
  const overdue = ready.filter(r => r.dueDate < todayIso())
  const nextDue = [...ready, ...open].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null
  return {
    filed: filed.length,
    ready: ready.length,
    open: open.length,
    overdue: overdue.length,
    liabilityDue: ready.reduce((s, r) => s + Math.max(0, r.netPayable), 0),
    paidYtd: filed.filter(r => r.periodStart.slice(0, 4) === String(new Date().getFullYear()))
      .reduce((s, r) => s + Math.max(0, r.netPayable), 0),
    nextDue,
  }
}

function validateReturn(ret, data) {
  const issues = []
  const unmatched = data.reconciliation.filter(r => r.status !== 'matched' && r.date >= ret.periodStart && r.date <= ret.periodEnd)
  if (unmatched.length) {
    issues.push({ level: 'warn', message: `${unmatched.length} purchase invoice(s) in this period are not matched with supplier data — input tax may be overstated.` })
  }
  const rejected = data.einvoices.filter(e => e.status === 'rejected')
  if (rejected.length) {
    issues.push({ level: 'warn', message: `${rejected.length} e-invoice(s) were rejected by the network and should be corrected before filing.` })
  }
  if (ret.netPayable < 0) {
    issues.push({ level: 'info', message: 'This return shows a refund/credit position. The authority may review the claim before paying out.' })
  }
  if (ret.status === 'open') {
    issues.push({ level: 'error', message: 'The period has not ended yet — the return can only be filed after the period closes.' })
  }
  issues.push({ level: 'ok', message: 'Box totals reconcile with posted sales and purchase ledgers.' })
  return issues
}

/* ── Routes ── */
const routes = []
/**
 * Register a route. opts: { public, noTenant, summary, internal }
 *  public   — no sign-in required
 *  noTenant — works without an active company (identity endpoints)
 *  summary  — one-line description shown in the developer API reference
 */
function route(method, pattern, handler, opts = {}) {
  const keys = []
  const regex = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)' }) + '$')
  routes.push({ method, pattern, regex, keys, handler, opts })
}

/** Route table for the developer API reference */
export function listRoutes() {
  return routes
    .filter(r => !r.opts.internal)
    .map(r => ({ method: r.method, path: r.pattern, public: !!r.opts.public, summary: r.opts.summary ?? '' }))
}

/* ── Identity ── */
route('GET', '/auth/demo-users', () => ok({ users: DEMO_USERS, password: DEMO_PASSWORD }), { public: true, noTenant: true, summary: 'Demo workspace accounts' })

route('POST', '/auth/login', async ({ body }) => {
  const result = await login(body?.email, body?.password, body?.otp, { device: body?.device })
  if (result.error) throw new HttpError(result.error.status, result.error.message, result.error.details)
  return ok(result, 201)
}, { public: true, noTenant: true, summary: 'Sign in — returns a bearer session token' })

route('GET', '/auth/me', ({ user }) => ok(user), { noTenant: true, summary: 'Current user' })

route('POST', '/auth/logout', ({ token }) => { logout(token); return ok({ signedOut: true }) }, { noTenant: true, summary: 'End the session' })

/* ── Access control (admin decides what each role and person can see and do) ── */
function requireSettings(user, level) {
  const have = effectiveAccess(user).sections.settings
  const order = ['none', 'view', 'create', 'edit', 'full']
  if (order.indexOf(have) < order.indexOf(level)) throw new HttpError(403, 'Only administrators can manage access')
}

route('GET', '/access/me', ({ user }) => ok(effectiveAccess(user)), { noTenant: true, summary: 'Your effective access (sections and visible pages)' })

route('GET', '/access/policy', ({ user }) => {
  requireSettings(user, 'view')
  const policy = getPolicy()
  return ok({
    ...policy,
    users: DEMO_USERS.map(u => ({ ...u, role: roleFor(u.id, u.role), baseRole: u.role, overrides: policy.users[u.id] ?? null })),
    roles: ROLES.map(role => ({ role, grant: policy.roles[role] ?? null, effective: effectiveAccess({ role }) })),
  })
}, { noTenant: true, summary: 'Access policy for every role and person' })

route('PUT', '/access/policy', ({ user, body }) => {
  requireSettings(user, 'full')
  const saved = savePolicy(body ?? {}, user.name)
  return ok({ ...saved, auditSummary: 'Access policy updated' })
}, { noTenant: true, summary: 'Replace the access policy (administrators only)' })

/* ── Audit trail ── */
route('GET', '/audit', ({ db, query }) => {
  const limit = Math.min(Number(query.limit) || 100, 500)
  return ok([...(db.audit ?? [])].reverse().slice(0, limit))
}, { summary: 'Tamper-evident audit log (newest first)' })

route('GET', '/audit/verify', async ({ db }) => ok(await verifyAudit(db)), { summary: 'Verify the audit hash chain' })

route('GET', '/countries', () => ok(SUPPORTED_COUNTRIES.map(c => ({
  code: c.code, name: c.name, flag: c.flag, currency: c.currency, taxSystem: c.taxSystem,
  authority: getTaxCatalog(c.code).authority, returnForm: getTaxCatalog(c.code).returnForm,
}))), { summary: 'Supported countries and tax regimes' })

route('GET', '/currencies', ({ company }) => {
  const base = getCountryTaxConfig(company.country).currency
  const usd = usdRatesOn(todayIso())
  const active = new Set([base, 'USD', 'EUR', 'GBP', 'INR', 'AED'])
  return ok({
    base,
    asOf: todayIso(),
    source: 'Mock FX feed (indicative rates)',
    currencies: Object.keys(USD_RATES).map((code, i) => ({
      id: `CUR${String(i + 1).padStart(2, '0')}`,
      code,
      name: CURRENCY_NAMES[code][0],
      symbol: CURRENCY_NAMES[code][1],
      // How many units of the base currency one unit of `code` buys
      exchangeRate: Math.round((usd[base] / usd[code]) * 1e6) / 1e6,
      isBase: code === base,
      status: active.has(code) ? 'active' : 'inactive',
    })).sort((a, b) => (b.isBase - a.isBase) || a.code.localeCompare(b.code)),
  })
})

route('GET', '/tax/profile', ({ company }) => {
  const config = getCountryTaxConfig(company.country)
  const catalog = getTaxCatalog(company.country)
  const publicConfig = { ...config, taxIdRegex: config.taxIdRegex ? String(config.taxIdRegex) : null }
  return ok({ country: publicConfig, catalog, company: { id: company.id, name: company.name, taxId: company.taxId } })
})

route('GET', '/tax/summary', ({ db }) => {
  const s = summarizeReturns(db.returns)
  return ok({
    ...s,
    einvoices: {
      total: db.einvoices.length,
      pending: db.einvoices.filter(e => ['pending', 'not-sent'].includes(e.status)).length,
      rejected: db.einvoices.filter(e => e.status === 'rejected').length,
    },
    withholdingDue: db.withholding.filter(w => w.status === 'deducted').reduce((sum, w) => sum + w.withheld, 0),
    reconciliationIssues: db.reconciliation.filter(r => r.status !== 'matched').length,
  })
})

route('GET', '/tax/rates', ({ company }) => ok(COUNTRY_TAX_RATES[company.country] || []))

route('GET', '/tax/returns', ({ db, query }) => {
  let list = [...db.returns]
  if (query.status) list = list.filter(r => r.status === query.status)
  if (query.jurisdiction) list = list.filter(r => r.jurisdiction === query.jurisdiction)
  list.sort((a, b) => b.periodStart.localeCompare(a.periodStart) || (a.jurisdiction || '').localeCompare(b.jurisdiction || ''))
  return ok(list)
})

route('GET', '/tax/returns/:id', ({ db, params }) => {
  const ret = db.returns.find(r => r.id === params.id) || notFound('Return')
  return ok(ret)
})

route('POST', '/tax/returns/:id/validate', ({ db, params }) => {
  const ret = db.returns.find(r => r.id === params.id) || notFound('Return')
  const issues = validateReturn(ret, db)
  return ok({ returnId: ret.id, canFile: !issues.some(i => i.level === 'error'), issues })
})

route('POST', '/tax/returns/:id/submit', ({ db, params, body, company, save, user }) => {
  const ret = db.returns.find(r => r.id === params.id) || notFound('Return')
  if (ret.status === 'filed') badRequest('This return has already been filed.', { ackRef: ret.ackRef })
  if (ret.status === 'open') badRequest('The period has not ended yet — the return cannot be submitted.')
  if (!body?.declaration) badRequest('The declaration must be accepted before submitting.')
  // Returns are filed through the company's authorised connection (MTD, GSP, ELSTER, SBR…)
  if (!activeConnection(db)) {
    throw new HttpError(428, `Connect to ${filingProviderFor(company.country).name} before filing`, { code: 'FILING_CONNECTION_REQUIRED' })
  }
  ret.status = 'filed'
  ret.filedAt = todayIso()
  ret.ackRef = makeAckRef(company.country)
  ret.filedBy = user?.name || body.filedBy || 'Demo User'
  const submission = recordSubmission(db, ret)
  ret.submissionId = submission.id
  // Move the period's output / input tax into the filed-return liability
  seedLedger(db)
  const get = kind => ret.boxes.find(b => b.kind === kind)?.amount ?? 0
  const out = get('outputTax')
  const inp = get('inputTax')
  const net = Math.round((out - inp) * 100) / 100
  try {
    postFromLegs(db, {
      date: todayIso(), memo: `${ret.form} filed — ${ret.periodLabel}`, source: 'tax-return', reference: ret.id,
      legs: [
        { account: 'Output Tax Payable', debit: out },
        { account: 'Input Tax Recoverable', credit: inp },
        net >= 0 ? { account: 'Tax Liability — Filed Returns', credit: net } : { account: 'Tax Liability — Filed Returns', debit: -net },
      ],
    })
  } catch { /* closed period — the filing stands, the journal is posted by the accountant */ }
  save()
  return ok({ ...ret, submission, message: `${ret.form} submitted to ${ret.authority}. Acknowledgement ${ret.ackRef}.`, auditSummary: `${ret.form} ${ret.periodLabel} filed (${ret.ackRef})` }, 201)
}, { summary: 'File a return through the authority connection' })

route('GET', '/tax/obligations', ({ db, company }) => {
  const catalog = getTaxCatalog(company.country)
  const items = []
  db.returns.filter(r => r.status !== 'filed').forEach(r => items.push({
    id: `OB-${r.id}`, type: 'return', title: `File ${r.form}${r.jurisdiction ? ` (${r.jurisdiction})` : ''}`,
    period: r.periodLabel, dueDate: r.dueDate, authority: r.authority, amount: r.netPayable, status: r.status,
  }))
  db.payments.filter(p => p.status === 'pending').forEach(p => items.push({
    id: `OB-${p.id}`, type: 'payment', title: `Pay ${p.description}`, period: '', dueDate: p.dueDate,
    authority: p.authority, amount: p.amount, status: 'pending',
  }))
  const pendingWh = db.withholding.filter(w => w.status === 'deducted' || w.status === 'to-report')
  if (pendingWh.length) {
    const end = new Date(); end.setDate(0)
    items.push({
      id: 'OB-WH', type: 'withholding', title: `Remit / report withholding (${pendingWh.length} entries)`, period: 'Current month',
      dueDate: computeDueDate(new Date(end.getFullYear(), end.getMonth() + 1, 0), { kind: 'dayOfNextMonth', day: 15, months: 1 }).toISOString().slice(0, 10),
      authority: catalog.authority, amount: pendingWh.reduce((s, w) => s + w.withheld, 0), status: 'pending',
    })
  }
  items.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  return ok(items)
})

route('GET', '/tax/einvoices', ({ db }) => ok(db.einvoices))

route('POST', '/tax/einvoices/:id/transmit', async ({ db, params, company, save }) => {
  const doc = db.einvoices.find(e => e.id === params.id) || notFound('Invoice')
  const catalog = getTaxCatalog(company.country)
  if (['accepted', 'delivered'].includes(doc.status)) badRequest('Invoice already transmitted.')
  const delivered = ['voluntary', 'not-required'].includes(catalog.eInvoicing.status)
  // Network-specific identifiers (IRN, ZATCA QR, KSeF number, Peppol id…)
  doc.artifact = { ...(await issueEInvoice(company.country, company, doc)), issuedAt: new Date().toISOString() }
  doc.status = delivered ? 'delivered' : 'accepted'
  doc.error = null
  doc.networkRef = doc.artifact.id
  doc.transmittedAt = doc.artifact.issuedAt
  save()
  return ok({ ...doc, auditSummary: `E-invoice ${doc.invoiceNo} transmitted on ${doc.artifact.network}` })
}, { summary: 'Transmit an e-invoice to its network' })

route('GET', '/tax/withholding', ({ db }) => ok(db.withholding))

route('POST', '/tax/withholding/:id/remit', ({ db, params, save }) => {
  const entry = db.withholding.find(w => w.id === params.id) || notFound('Withholding entry')
  if (entry.status === 'to-report') entry.status = 'reported'
  else if (entry.status === 'deducted') entry.status = 'remitted'
  else if (entry.status === 'remitted') entry.status = 'certified'
  else badRequest('Nothing left to do for this entry.')
  save()
  return ok(entry)
})

route('GET', '/tax/secondary', ({ db }) => ok(db.secondary))

route('POST', '/tax/secondary/:id/account', ({ db, params, save }) => {
  const entry = db.secondary.find(s => s.id === params.id) || notFound('Entry')
  entry.status = 'accounted'
  save()
  return ok(entry)
})

route('GET', '/tax/payments', ({ db }) => ok([...db.payments].sort((a, b) => b.dueDate.localeCompare(a.dueDate))))

route('POST', '/tax/payments', ({ db, body, save }) => {
  const payment = db.payments.find(p => p.id === body?.paymentId || p.returnId === body?.returnId)
  if (!payment) notFound('Payment')
  if (payment.status === 'paid') badRequest('This liability is already paid.')
  if (!body?.method) badRequest('Payment method is required.')
  payment.status = 'paid'
  payment.paidOn = todayIso()
  payment.method = body.method
  payment.reference = `PMT-${Math.floor(Math.random() * 1e8)}`
  const ret = db.returns.find(r => r.id === payment.returnId)
  if (ret) ret.paid = true
  seedLedger(db)
  try {
    postFromLegs(db, {
      date: todayIso(), memo: `Tax payment — ${payment.description}`, source: 'tax-payment', reference: payment.reference,
      legs: [{ account: 'Tax Liability — Filed Returns', debit: payment.amount }, { account: 'Bank', credit: payment.amount }],
    })
  } catch { /* closed period */ }
  save()
  return ok({ ...payment, auditSummary: `Tax payment ${payment.reference} (${payment.amount})` }, 201)
}, { summary: 'Pay a tax liability' })

route('GET', '/tax/reconciliation', ({ db }) => ok(db.reconciliation))

route('POST', '/tax/reconciliation/:id/resolve', ({ db, params, body, save }) => {
  const line = db.reconciliation.find(r => r.id === params.id) || notFound('Reconciliation line')
  const action = body?.action || 'accept'
  if (action === 'accept-supplier' && line.supplierTax != null) line.booksTax = line.supplierTax
  if (action === 'accept-books' && line.booksTax != null) line.supplierTax = line.booksTax
  line.status = action === 'defer' ? 'deferred' : 'matched'
  line.resolvedAt = new Date().toISOString()
  save()
  return ok(line)
})

route('POST', '/tax/reset', ({ company }) => {
  resetTenant(company.id)
  return ok({ reset: true })
})

/* ── Foreign currency ── */
registerFxRoutes(route, { ok, badRequest, notFound, todayIso })

/* ── Ledger, filing gateways, e-invoicing, banking, developer platform ── */
registerLedgerRoutes(route, { ok, badRequest, notFound })
registerComplianceRoutes(route, { ok, badRequest, notFound })
registerBankingRoutes(route, { ok, badRequest, notFound })
registerBooksRoutes(route, { ok, badRequest, notFound })
registerBankRulesRoutes(route, { ok, badRequest, notFound })
registerGstRoutes(route, { ok, badRequest, notFound })
registerInventoryRoutes(route, { ok, badRequest, notFound })
registerAppsRoutes(route, { ok, badRequest, notFound, listRoutes })
registerPlatformRoutes(route, { ok, badRequest, notFound })
registerMigrationRoutes(route, { ok, badRequest, notFound })
registerAiRoutes(route, { ok, badRequest, notFound })
registerDeveloperRoutes(route, { ok, badRequest, notFound, listRoutes })

route('POST', '/fx/reset', ({ db, save }) => {
  delete db.fx
  save()
  return ok({ reset: true })
})

/* ── Dispatcher ── */
function logRequest(entry) {
  requestLog.unshift(entry)
  if (requestLog.length > 50) requestLog.pop()
  logListeners.forEach(fn => fn([...requestLog]))
}

export function getRequestLog() {
  return [...requestLog]
}

export function onRequestLog(fn) {
  logListeners.add(fn)
  return () => logListeners.delete(fn)
}

function parseUrl(url) {
  const [path, qs = ''] = url.split('?')
  const query = Object.fromEntries(new URLSearchParams(qs))
  return { path, query }
}

/**
 * Resolve the caller: a user session token, or a developer API key ("utk_…")
 * registered for the tenant. API keys act with the role they were issued for.
 */
async function resolveCaller(token, db) {
  if (!token) return null
  if (token.startsWith('utk_') && db) {
    const hash = await sha256Hex(token)
    const key = (db.apiKeys ?? []).find(k => k.hash === hash && !k.revokedAt)
    if (!key) return null
    key.lastUsedAt = new Date().toISOString()
    return { id: `KEY-${key.id}`, name: `API key "${key.name}"`, email: null, role: key.role, apiKey: true }
  }
  return userForToken(token)
}

export async function handleRequest({ method = 'GET', url, body, company, token }) {
  const started = performance.now()
  const latency = LATENCY.min + Math.random() * (LATENCY.max - LATENCY.min)
  await new Promise(resolve => setTimeout(resolve, latency))

  const { path, query } = parseUrl(url)
  let response
  let caller = null
  try {
    const match = routes.find(r => r.method === method && r.regex.test(path))
    if (!match) throw new HttpError(404, `No route for ${method} ${path}`)
    const values = path.match(match.regex).slice(1)
    const params = Object.fromEntries(match.keys.map((k, i) => [k, decodeURIComponent(values[i])]))
    // Clone body so handlers never mutate caller objects
    const payload = body == null ? body : JSON.parse(JSON.stringify(body))

    if (match.opts.noTenant) {
      // Identity endpoints (login, demo users) work without a company
      caller = match.opts.public ? null : userForToken(token)
      if (!match.opts.public && !caller) throw new HttpError(401, 'Sign in required')
      response = await match.handler({ params, query, body: payload, token, user: caller })
    } else {
      if (!company?.id) throw new HttpError(401, 'No active company (tenant) selected')
      const db = loadTenant(company)
      caller = await resolveCaller(token, db)
      if (!match.opts.public && !caller) throw new HttpError(401, 'Sign in required')
      if (caller && !match.opts.public) {
        const denied = authorize(caller, method, path)
        if (denied) throw new HttpError(denied.status, denied.message)
      }
      const save = () => saveTenant(company, db)
      // Foreign-currency ledger is seeded lazily per company, in its base currency
      const base = getCountryTaxConfig(company.country).currency
      if (path.startsWith('/fx/') && (!db.fx || db.fx.base !== base)) {
        db.fx = seedFx(company, base)
        save()
      }
      response = await match.handler({ params, query, body: payload, company, db, fx: db.fx, save, user: caller })
      // Every successful change is written to the tamper-evident audit trail
      if (method !== 'GET' && response.status < 400) {
        await appendAudit(db, { user: caller, method, path, status: response.status, summary: response.data?.auditSummary })
        await emitWebhooks(db, company, method, path, response)
        save()
      }
    }
  } catch (err) {
    response = { status: err.status || 500, error: { message: err.message, details: err.details ?? null } }
  }

  logRequest({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    method, url, status: response.status,
    ms: Math.round(performance.now() - started),
    company: company?.id ?? null,
    user: caller?.email ?? caller?.name ?? null,
    at: new Date().toISOString(),
  })

  // Deep-clone the response to mimic JSON serialization over the wire
  return JSON.parse(JSON.stringify(response))
}
