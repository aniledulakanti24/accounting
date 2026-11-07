/**
 * App marketplace (mock OAuth + sync) and the OpenAPI description of this API.
 *
 * Connecting an app asks for consent to named scopes and stores a (fake, masked) token.
 * Syncing does real work in the books: shop orders become invoices, CRM contacts become
 * customers, gateway payouts settle invoices. Every sync is logged.
 */
import { ensureBooks, createInvoice, recordPayment } from './booksServer.js'

export const APP_CATALOG = [
  { id: 'shopify', name: 'Shopify', category: 'E-commerce', does: 'orders', blurb: 'Online store orders become sales invoices', scopes: ['read_orders', 'read_customers'] },
  { id: 'amazon', name: 'Amazon Seller Central', category: 'E-commerce', does: 'orders', blurb: 'Marketplace orders and fees into the books', scopes: ['orders', 'settlements'] },
  { id: 'woocommerce', name: 'WooCommerce', category: 'E-commerce', does: 'orders', blurb: 'WordPress shop orders as invoices', scopes: ['read'] },
  { id: 'flipkart', name: 'Flipkart Seller Hub', category: 'E-commerce', does: 'orders', blurb: 'Flipkart orders and returns', scopes: ['orders'] },
  { id: 'razorpay', name: 'Razorpay', category: 'Payments', does: 'payouts', blurb: 'Settlements mark invoices paid and book fees', scopes: ['payments:read', 'settlements:read'] },
  { id: 'stripe', name: 'Stripe', category: 'Payments', does: 'payouts', blurb: 'Card payments and payouts reconciled automatically', scopes: ['read_only'] },
  { id: 'paypal', name: 'PayPal', category: 'Payments', does: 'payouts', blurb: 'PayPal receipts against invoices', scopes: ['transactions'] },
  { id: 'ut-crm', name: 'UnifiedTree CRM', category: 'CRM', does: 'contacts', blurb: 'Won deals and contacts become customers', scopes: ['contacts.read', 'deals.read'] },
  { id: 'hubspot', name: 'HubSpot', category: 'CRM', does: 'contacts', blurb: 'Companies sync as customers', scopes: ['crm.objects.companies.read'] },
  { id: 'salesforce', name: 'Salesforce', category: 'CRM', does: 'contacts', blurb: 'Accounts sync as customers', scopes: ['api', 'refresh_token'] },
  { id: 'whatsapp', name: 'WhatsApp Business', category: 'Messaging', does: 'notify', blurb: 'Send invoices and payment reminders', scopes: ['whatsapp_business_messaging'] },
  { id: 'slack', name: 'Slack', category: 'Messaging', does: 'notify', blurb: 'Approval requests and alerts in a channel', scopes: ['chat:write'] },
  { id: 'gdrive', name: 'Google Drive', category: 'Files', does: 'backup', blurb: 'Nightly backup of your books', scopes: ['drive.file'] },
  { id: 'zapier', name: 'Zapier', category: 'Automation', does: 'notify', blurb: 'Connect 6,000+ apps with webhooks', scopes: ['webhooks'] },
  { id: 'greythr', name: 'greytHR', category: 'Payroll', does: 'payroll', blurb: 'Monthly payroll journal posted automatically', scopes: ['payroll.read'] },
  { id: 'gusto', name: 'Gusto', category: 'Payroll', does: 'payroll', blurb: 'US payroll runs into the books', scopes: ['payrolls:read'] },
]

class AppError extends Error { constructor(m) { super(m); this.status = 422 } }
const fail = m => { throw new AppError(m) }

function ensureApps(db) {
  db.apps ??= { connections: {}, log: [] }
  return db.apps
}

export function connectApp(db, appId, { consent, scopes } = {}, user) {
  const app = APP_CATALOG.find(a => a.id === appId)
  if (!app) fail('That app is not in the marketplace')
  if (!consent) fail(`Allow ${app.name} to access the data it needs before connecting`)
  const granted = scopes?.length ? scopes.filter(s => app.scopes.includes(s)) : app.scopes
  if (!granted.length) fail('Grant at least one permission')
  const apps = ensureApps(db)
  apps.connections[app.id] = { appId: app.id, status: 'connected', scopes: granted, token: `oauth_${Math.random().toString(36).slice(2, 6)}••••`, connectedAt: new Date().toISOString(), connectedBy: user?.name ?? 'system', lastSync: null, syncs: 0 }
  return apps.connections[app.id]
}

export function disconnectApp(db, appId) {
  const apps = ensureApps(db)
  if (!apps.connections[appId]) fail('That app is not connected')
  delete apps.connections[appId]
  return { appId, status: 'disconnected' }
}

/** Run one sync. Returns what was created so the UI can say exactly what happened. */
export function syncApp(ctx, appId) {
  const { db } = ctx
  const app = APP_CATALOG.find(a => a.id === appId)
  const conn = ensureApps(db).connections[appId]
  if (!app || !conn) fail('Connect the app first')
  const books = db.books
  const n = conn.syncs + 1
  const result = { appId, at: new Date().toISOString(), created: [], message: '' }
  if (app.does === 'orders') {
    let party = books.parties.find(p => p.name === `${app.name} customers`)
    if (!party) { party = { id: `PTY-${app.id.toUpperCase()}`, name: `${app.name} customers`, type: 'customer', state: books.parties[0]?.state ?? null, gstin: null, terms: 0, creditLimit: 0 }; books.parties.push(party) }
    const stocked = books.items.filter(i => i.type !== 'service' && (i.layers ?? []).reduce((s, l) => s + l.qty, 0) >= 4)
    const orders = Math.min(3, stocked.length)
    for (let k = 0; k < orders; k++) {
      const item = stocked[(n + k) % stocked.length]
      const inv = createInvoice(ctx, { partyId: party.id, lines: [{ itemId: item.id, qty: 1 + ((n + k) % 3) }], overrideCreditLimit: true })
      result.created.push({ kind: 'invoice', id: inv.id, label: `${inv.number} · ${item.name}`, amount: inv.total })
    }
    result.message = `${orders} order(s) imported as invoices`
  } else if (app.does === 'payouts') {
    const open = books.invoices.filter(i => i.status === 'open' && i.balance > 0).slice(0, 2)
    for (const inv of open) {
      const p = recordPayment(ctx, { type: 'receipt', partyId: inv.partyId, amount: inv.balance, account: 'Bank', allocations: [{ docId: inv.id, amount: inv.balance }] })
      result.created.push({ kind: 'receipt', id: p.id, label: `${inv.number} settled via ${app.name}`, amount: p.amount })
    }
    result.message = open.length ? `${open.length} invoice(s) settled from the payout` : 'No open invoices to settle'
  } else if (app.does === 'contacts') {
    const names = ['Zenith Analytics Pvt Ltd', 'Northwind Retail LLP', 'Blue Ocean Logistics'].map(x => `${x}${n > 1 ? ` ${n}` : ''}`)
    for (const name of names) {
      if (books.parties.some(p => p.name === name)) continue
      const p = { id: `PTY-${app.id.slice(0, 3).toUpperCase()}${books.parties.length + 1}`, name, type: 'customer', state: null, gstin: null, terms: 30, creditLimit: 500000 }
      books.parties.push(p)
      result.created.push({ kind: 'customer', id: p.id, label: name })
    }
    result.message = `${result.created.length} customer(s) added from ${app.name}`
  } else if (app.does === 'payroll') {
    result.message = 'Payroll for this month already posted — nothing new'
  } else {
    result.message = `${app.name} is ready — events will be sent as they happen`
  }
  conn.syncs = n
  conn.lastSync = result.at
  ensureApps(db).log.unshift({ ...result, appName: app.name })
  ensureApps(db).log.splice(50)
  return result
}

/** OpenAPI 3.0 description built from the live route table. */
export function openApiSpec(routes, { title = 'UnifiedTree Accounting API', version = '1.0.0' } = {}) {
  const paths = {}
  for (const r of routes) {
    const path = r.path.replace(/:(\w+)/g, '{$1}')
    const params = [...r.path.matchAll(/:(\w+)/g)].map(m => ({ name: m[1], in: 'path', required: true, schema: { type: 'string' } }))
    const tag = r.path.split('/')[1]
    paths[path] ??= {}
    paths[path][r.method.toLowerCase()] = {
      summary: r.summary || `${r.method} ${r.path}`, tags: [tag],
      ...(params.length ? { parameters: params } : {}),
      ...(['POST', 'PUT', 'PATCH'].includes(r.method) ? { requestBody: { content: { 'application/json': { schema: { type: 'object' } } } } } : {}),
      ...(r.public ? { security: [] } : {}),
      responses: { 200: { description: 'OK' }, 201: { description: 'Created' }, 401: { description: 'Sign in or send an API key' }, 403: { description: 'Your role cannot do this' }, 422: { description: 'Validation error — the message says what to fix' } },
    }
  }
  return {
    openapi: '3.0.3',
    info: { title, version, description: 'REST API for UnifiedTree Accounting. Authenticate with a session token or an API key (Bearer utk_…). Every company is a separate tenant.' },
    servers: [{ url: 'https://api.unifiedtree.example/v1', description: 'Production' }, { url: 'https://sandbox.api.unifiedtree.example/v1', description: 'Sandbox' }],
    components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer' } } },
    security: [{ bearer: [] }],
    tags: [...new Set(routes.map(r => r.path.split('/')[1]))].map(name => ({ name })),
    paths,
  }
}

export function registerAppsRoutes(route, { ok, badRequest, listRoutes }) {
  const w = h => ctx => { ensureBooks(ctx.db, ctx.company); try { return h(ctx) } catch (e) { if (e instanceof AppError || e.status === 422) badRequest(e.message, e.details); throw e } }
  route('GET', '/apps', w(({ db }) => {
    const apps = ensureApps(db)
    return ok(APP_CATALOG.map(a => ({ ...a, connection: apps.connections[a.id] ?? null })))
  }), { summary: 'App marketplace with connection status' })
  route('POST', '/apps/:id/connect', w(({ db, params, body, user, save }) => {
    const c = connectApp(db, params.id, body || {}, user); save()
    return ok({ ...c, auditSummary: `Connected ${params.id} (${c.scopes.join(', ')})` }, 201)
  }), { summary: 'Connect an app (OAuth consent to scopes)' })
  route('POST', '/apps/:id/sync', w((ctx) => {
    const r = syncApp(ctx, ctx.params.id); ctx.save()
    return ok({ ...r, auditSummary: `${ctx.params.id} sync: ${r.message}` })
  }), { summary: 'Run a sync now' })
  route('DELETE', '/apps/:id', w(({ db, params, save }) => {
    const r = disconnectApp(db, params.id); save()
    return ok({ ...r, auditSummary: `Disconnected ${params.id}` })
  }), { summary: 'Disconnect an app and revoke its token' })
  route('GET', '/apps/log', w(({ db }) => ok(ensureApps(db).log)), { summary: 'Recent syncs' })
  route('GET', '/developer/openapi.json', () => ok(openApiSpec(listRoutes())), { summary: 'OpenAPI 3.0 description of this API' })
}
