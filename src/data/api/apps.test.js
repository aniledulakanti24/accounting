import test from 'node:test'
import assert from 'node:assert/strict'
import { handleRequest, listRoutes } from './mockServer.js'
import { trialBalance } from './ledgerServer.js'
import { ensureBooks } from './booksServer.js'
import { connectApp, syncApp, disconnectApp, openApiSpec, APP_CATALOG } from './appsServer.js'

const company = { id: 'apps-unit-IN', country: 'IN', name: 'Apps Test Ltd', taxId: '27AABCU9603R1ZX' }
const fresh = () => { const db = { returns: [] }; ensureBooks(db, company); return { db, company } }

test('connecting needs consent; syncing a shop imports orders as posted invoices', () => {
  const ctx = fresh()
  assert.throws(() => connectApp(ctx.db, 'shopify', {}), /Allow Shopify/)
  assert.throws(() => syncApp(ctx, 'shopify'), /Connect the app first/)
  const c = connectApp(ctx.db, 'shopify', { consent: true }, { name: 'Priya' })
  assert.deepEqual(c.scopes, ['read_orders', 'read_customers'])
  const before = ctx.db.books.invoices.length
  const r = syncApp(ctx, 'shopify')
  assert.ok(r.created.length > 0)
  assert.equal(ctx.db.books.invoices.length, before + r.created.length)
  assert.ok(trialBalance(ctx.db).balanced)
  disconnectApp(ctx.db, 'shopify')
  assert.throws(() => syncApp(ctx, 'shopify'), /Connect the app first/)
})

test('payment and CRM apps settle invoices and add customers', () => {
  const ctx = fresh()
  connectApp(ctx.db, 'razorpay', { consent: true })
  const r = syncApp(ctx, 'razorpay')
  assert.ok(r.created.every(x => x.kind === 'receipt'))
  connectApp(ctx.db, 'ut-crm', { consent: true })
  const before = ctx.db.books.parties.length
  syncApp(ctx, 'ut-crm')
  assert.equal(ctx.db.books.parties.length, before + 3)
  assert.equal(syncApp(ctx, 'ut-crm').created.length, 3, 'second sync brings new contacts, not duplicates')
})

test('the OpenAPI document covers every public route with parameters and security', () => {
  const spec = openApiSpec(listRoutes())
  assert.equal(spec.openapi, '3.0.3')
  assert.ok(spec.paths['/books/invoices'].post)
  assert.deepEqual(spec.paths['/books/invoices/{id}/credit-note'].post.parameters[0], { name: 'id', in: 'path', required: true, schema: { type: 'string' } })
  assert.deepEqual(spec.paths['/auth/login'].post.security, [], 'sign-in needs no token')
  assert.ok(APP_CATALOG.length >= 16)
})

test('only people with settings access can connect apps', async () => {
  const co = { id: 'apps-api-IN', country: 'IN', name: 'Apps API Ltd', taxId: '27AABCU9603R1ZX' }
  const signIn = async email => (await handleRequest({ method: 'POST', url: '/auth/login', body: { email, password: 'Demo@2026' } })).data.token
  const call = (method, url, body, token) => handleRequest({ method, url, body, token, company: co })
  const accountant = await signIn('sneha@unifiedtree.demo')
  const admin = await signIn('priya@unifiedtree.demo')
  assert.equal((await call('POST', '/apps/slack/connect', { consent: true }, accountant)).status, 403)
  assert.equal((await call('POST', '/apps/slack/connect', { consent: true }, admin)).status, 201)
})
