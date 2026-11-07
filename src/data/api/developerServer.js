/**
 * Developer platform for the mock backend.
 *
 *  - API keys: "utk_…" secrets shown once, stored only as SHA-256 hashes, scoped to a role
 *  - Webhooks: subscribe a URL to events; every change emits a signed event
 *    (HMAC-SHA256 of the body, header "UT-Signature") with a delivery log and retries
 *  - API reference generated from the live route table
 *
 * Deliveries are simulated (no network call leaves the browser). A real backend
 * would POST the same payload and signature to the subscriber URL.
 */
import { sha256Hex } from './authServer.js'

export const WEBHOOK_EVENTS = [
  { event: 'tax.return.submitted', description: 'A tax return was filed with the authority' },
  { event: 'tax.return.status_changed', description: 'The authority accepted or rejected a return' },
  { event: 'tax.payment.created', description: 'A tax payment was recorded' },
  { event: 'einvoice.transmitted', description: 'An e-invoice was cleared / delivered on its network' },
  { event: 'fx.document.created', description: 'A foreign-currency invoice or bill was recorded' },
  { event: 'fx.document.settled', description: 'A foreign-currency document was received or paid' },
  { event: 'fx.revaluation.posted', description: 'Month-end FX revaluation posted' },
  { event: 'ledger.journal.posted', description: 'A journal entry was posted to the general ledger' },
  { event: 'bank.connection.created', description: 'A bank feed was connected' },
  { event: 'bank.transaction.matched', description: 'A bank transaction was matched to a document' },
  { event: 'payment_link.created', description: 'A payment link was created for an invoice' },
  { event: 'payment_link.paid', description: 'A customer paid through a payment link' },
  { event: 'filing.connection.created', description: 'A tax authority connection was authorised' },
]

/* Map a successful request to an event name */
const EVENT_RULES = [
  [/^POST \/tax\/returns\/[^/]+\/submit$/, 'tax.return.submitted'],
  [/^POST \/filing\/submissions\/[^/]+\/refresh$/, 'tax.return.status_changed'],
  [/^POST \/tax\/payments$/, 'tax.payment.created'],
  [/^POST \/tax\/einvoices\/[^/]+\/transmit$/, 'einvoice.transmitted'],
  [/^POST \/einvoice\/[^/]+\/issue$/, 'einvoice.transmitted'],
  [/^POST \/fx\/documents$/, 'fx.document.created'],
  [/^POST \/fx\/documents\/[^/]+\/settle$/, 'fx.document.settled'],
  [/^POST \/fx\/revaluation$/, 'fx.revaluation.posted'],
  [/^POST \/ledger\/journals$/, 'ledger.journal.posted'],
  [/^POST \/bank\/connections$/, 'bank.connection.created'],
  [/^POST \/bank\/transactions\/[^/]+\/match$/, 'bank.transaction.matched'],
  [/^POST \/payment-links$/, 'payment_link.created'],
  [/^POST \/payment-links\/[^/]+\/pay$/, 'payment_link.paid'],
  [/^POST \/filing\/connections$/, 'filing.connection.created'],
]

export function eventFor(method, path) {
  const key = `${method} ${path}`
  return EVENT_RULES.find(([re]) => re.test(key))?.[1] ?? null
}

async function hmacHex(secret, message) {
  const enc = new TextEncoder()
  const key = await globalThis.crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(message))
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('')
}

function randomHex(bytes) {
  const arr = new Uint8Array(bytes)
  globalThis.crypto.getRandomValues(arr)
  return [...arr].map(b => b.toString(16).padStart(2, '0')).join('')
}

/* Simulated subscriber: hosts containing "fail"/"down" return 500, everything else 200 */
function simulateDelivery(url) {
  let host
  try { host = new URL(url).hostname } catch { return { status: 0, error: 'Invalid URL' } }
  if (/fail|down|error/.test(host)) return { status: 500, error: 'Subscriber returned 500' }
  return { status: 200 }
}

async function deliver(db, hook, event, data, companyId) {
  const payload = { id: `evt_${randomHex(8)}`, type: event, created: new Date().toISOString(), company: companyId, data }
  const body = JSON.stringify(payload)
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = `t=${timestamp},v1=${await hmacHex(hook.secret, `${timestamp}.${body}`)}`
  const attempts = []
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = simulateDelivery(hook.url)
    attempts.push({ attempt, status: res.status, error: res.error ?? null })
    if (res.status >= 200 && res.status < 300) break
  }
  const last = attempts[attempts.length - 1]
  db.webhookDeliveries ??= []
  db.webhookDeliveries.unshift({
    id: `whd_${randomHex(6)}`, webhookId: hook.id, event, at: payload.created,
    status: last.status, ok: last.status >= 200 && last.status < 300, attempts, signature, payload,
  })
  db.webhookDeliveries.splice(200)
}

/** Called by the server after every successful change. */
export async function emitWebhooks(db, company, method, path, response) {
  const event = eventFor(method, path)
  if (!event) return
  const hooks = (db.webhooks ?? []).filter(h => h.active && (h.events.includes('*') || h.events.includes(event)))
  for (const hook of hooks) await deliver(db, hook, event, response.data, company.id)
}

/** Never return stored hashes over the API */
function withoutHash(key) {
  const copy = { ...key }
  delete copy.hash
  return copy
}

export function registerDeveloperRoutes(route, { ok, badRequest, notFound, listRoutes }) {
  route('GET', '/developer/routes', () => ok(listRoutes()), { summary: 'API reference (this list)' })
  route('GET', '/developer/events', () => ok(WEBHOOK_EVENTS), { summary: 'Webhook event catalog' })

  /* API keys */
  route('GET', '/developer/api-keys', ({ db }) => ok((db.apiKeys ?? []).map(withoutHash)), { summary: 'List API keys (secrets are never returned)' })

  route('POST', '/developer/api-keys', async ({ db, body, user, save }) => {
    if (!body?.name?.trim()) badRequest('Key name is required')
    const role = body.role || 'Viewer (Branch)'
    const secret = `utk_${randomHex(20)}`
    const key = {
      id: randomHex(4), name: body.name.trim(), role, last4: secret.slice(-4),
      hash: await sha256Hex(secret), createdAt: new Date().toISOString(), createdBy: user?.name ?? null,
      lastUsedAt: null, revokedAt: null,
    }
    db.apiKeys ??= []
    db.apiKeys.unshift(key)
    save()
    const publicKey = withoutHash(key)
    return ok({ ...publicKey, secret, auditSummary: `API key "${key.name}" created (${role})` }, 201)
  }, { summary: 'Create an API key — the secret is shown only once' })

  route('DELETE', '/developer/api-keys/:id', ({ db, params, save }) => {
    const key = (db.apiKeys ?? []).find(k => k.id === params.id) || notFound('API key')
    key.revokedAt = new Date().toISOString()
    save()
    return ok({ id: key.id, revokedAt: key.revokedAt, auditSummary: `API key "${key.name}" revoked` })
  }, { summary: 'Revoke an API key' })

  /* Webhooks */
  route('GET', '/developer/webhooks', ({ db }) => ok((db.webhooks ?? []).map(({ secret, ...h }) => ({ ...h, secretPreview: `${secret.slice(0, 10)}…` }))), { summary: 'List webhook endpoints' })

  route('POST', '/developer/webhooks', ({ db, body, save }) => {
    let url
    try { url = new URL(body?.url) } catch { badRequest('A valid https:// URL is required') }
    if (url.protocol !== 'https:') badRequest('Webhook URLs must use https://')
    const events = Array.isArray(body.events) && body.events.length ? body.events : ['*']
    const hook = { id: `wh_${randomHex(5)}`, url: url.href, events, secret: `whsec_${randomHex(16)}`, active: true, createdAt: new Date().toISOString() }
    db.webhooks ??= []
    db.webhooks.unshift(hook)
    save()
    return ok({ ...hook, auditSummary: `Webhook added for ${url.host}` }, 201)
  }, { summary: 'Subscribe a URL to events — returns the signing secret once' })

  route('DELETE', '/developer/webhooks/:id', ({ db, params, save }) => {
    const before = (db.webhooks ?? []).length
    db.webhooks = (db.webhooks ?? []).filter(h => h.id !== params.id)
    if (db.webhooks.length === before) notFound('Webhook')
    save()
    return ok({ deleted: params.id })
  }, { summary: 'Remove a webhook endpoint' })

  route('POST', '/developer/webhooks/:id/test', async ({ db, params, company, save }) => {
    const hook = (db.webhooks ?? []).find(h => h.id === params.id) || notFound('Webhook')
    await deliver(db, hook, 'ping', { message: 'Test event from UnifiedTree' }, company.id)
    save()
    return ok(db.webhookDeliveries[0])
  }, { summary: 'Send a signed test event' })

  route('GET', '/developer/deliveries', ({ db }) => ok(db.webhookDeliveries ?? []), { summary: 'Recent webhook deliveries' })
}
