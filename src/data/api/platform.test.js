import test from 'node:test'
import assert from 'node:assert/strict'
import { handleRequest } from './mockServer.js'
import { zatcaTlv, nfeAccessKey, issueEInvoice } from './complianceServer.js'
import { verifyAudit } from './authServer.js'

const company = { id: 'platform-test-IN', country: 'IN', name: 'Platform Test Pvt Ltd', taxId: '27AABCU9603R1ZX' }
const call = (method, url, body, token, co = company) => handleRequest({ method, url, body, token, company: co })
const signIn = async email => (await handleRequest({ method: 'POST', url: '/auth/login', body: { email, password: 'Demo@2026' } })).data.token

test('authentication and role-based access are enforced by the backend', async () => {
  assert.equal((await call('GET', '/tax/returns')).status, 401, 'no session')
  assert.equal((await handleRequest({ method: 'POST', url: '/auth/login', body: { email: 'priya@unifiedtree.demo', password: 'wrong' } })).status, 401)
  const admin = await signIn('priya@unifiedtree.demo')
  const viewer = await signIn('vikram@unifiedtree.demo')
  assert.equal((await call('GET', '/auth/me', null, admin)).data.role, 'Super Admin')
  assert.equal((await call('GET', '/tax/returns', null, viewer)).status, 403, 'viewer has no tax access')
  assert.equal((await call('POST', '/ledger/journals', { date: '2026-11-07', lines: [] }, viewer)).status, 403)
  await call('POST', '/auth/logout', null, admin)
  assert.equal((await call('GET', '/auth/me', null, admin)).status, 401, 'token revoked on logout')
})

test('ledger accepts only balanced journals, supports reversal and period lock', async () => {
  const t = await signIn('priya@unifiedtree.demo')
  const bad = await call('POST', '/ledger/journals', { date: '2026-11-07', lines: [{ account: 'Bank', debit: 10 }, { account: 'Sales', credit: 9 }] }, t)
  assert.equal(bad.status, 422)
  const good = await call('POST', '/ledger/journals', { date: '2026-11-07', memo: 'Capital', lines: [{ account: 'Bank', debit: 100 }, { account: "Owner's Equity", credit: 100 }] }, t)
  assert.equal(good.status, 201)
  const rev = await call('POST', `/ledger/journals/${good.data.id}/reverse`, { date: '2026-11-07' }, t)
  assert.equal(rev.status, 201)
  assert.equal((await call('POST', `/ledger/journals/${good.data.id}/reverse`, {}, t)).status, 422, 'cannot reverse twice')
  const tb = (await call('GET', '/ledger/trial-balance', null, t)).data
  assert.ok(tb.balanced)
  assert.equal((await call('POST', '/ledger/lock', { through: '2026-10-31' }, t)).status, 200)
  assert.equal((await call('POST', '/ledger/journals', { date: '2026-10-15', lines: [{ account: 'Bank', debit: 1 }, { account: 'Sales', credit: 1 }] }, t)).status, 422, 'closed period')
})

test('filing requires an authority connection and reports a status', async () => {
  const co = { ...company, id: 'platform-filing-GB', country: 'GB' }
  const t = await signIn('priya@unifiedtree.demo')
  const ready = (await call('GET', '/tax/returns', null, t, co)).data.find(r => r.status === 'ready')
  if (!ready) return
  assert.equal((await call('POST', `/tax/returns/${ready.id}/submit`, { declaration: true }, t, co)).status, 428)
  assert.equal((await call('POST', '/filing/connections', { consent: true }, t, co)).data.provider, 'HMRC Making Tax Digital')
  const filed = await call('POST', `/tax/returns/${ready.id}/submit`, { declaration: true }, t, co)
  assert.equal(filed.status, 201)
  const refreshed = await call('POST', `/filing/submissions/${filed.data.submission.id}/refresh`, null, t, co)
  assert.ok(['accepted', 'rejected'].includes(refreshed.data.status))
})

test('e-invoice identifiers follow each network format', async () => {
  const doc = { invoiceNo: 'INV-2026-0001', date: '2026-11-07', customer: 'Buyer Co', net: 1000, tax: 150, total: 1150 }
  const irn = await issueEInvoice('IN', company, doc)
  assert.match(irn.id, /^[0-9a-f]{64}$/, 'IRN is a SHA-256 hex hash')
  assert.equal(irn.qrPayload.split('.').length, 3, 'signed QR is a JWT')
  // ZATCA TLV: tag 1, length, value…
  const tlv = Uint8Array.from(atob(zatcaTlv(['Seller', '300000000000003', '2026-11-07T00:00:00Z', '1150.00', '150.00'])), c => c.charCodeAt(0))
  assert.equal(tlv[0], 1)
  assert.equal(tlv[1], 6)
  assert.equal(new TextDecoder().decode(tlv.slice(2, 8)), 'Seller')
  // Brazil access key: 44 digits with a valid modulo-11 check digit
  const key = nfeAccessKey('12345678000190', new Date('2026-11-07'), 1)
  assert.match(key, /^\d{44}$/)
  let w = 2, sum = 0
  for (let i = 42; i >= 0; i--) { sum += Number(key[i]) * w; w = w === 9 ? 2 : w + 1 }
  const dv = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  assert.equal(Number(key[43]), dv)
  const ksef = await issueEInvoice('PL', { ...company, taxId: 'PL1234567890' }, doc)
  assert.match(ksef.id, /^\d{10}-20261107-[0-9A-F]{12}-[0-9A-F]{2}$/)
  const peppol = await issueEInvoice('AU', company, doc)
  assert.ok(peppol.xml.includes('urn:fdc:peppol.eu:2017:poacc:billing:3.0'))
})

test('bank feed auto-match and payment links settle invoices in the ledger', async () => {
  const co = { ...company, id: 'platform-bank-IN' }
  const t = await signIn('priya@unifiedtree.demo')
  assert.equal((await call('POST', '/bank/connections', { bank: 'Unknown Bank', consent: true }, t, co)).status, 422)
  assert.equal((await call('POST', '/bank/connections', { bank: 'HDFC Bank', consent: true }, t, co)).status, 201)
  const matched = (await call('POST', '/bank/auto-match', null, t, co)).data.matched
  assert.ok(matched > 0)
  const inv = (await call('GET', '/tax/einvoices', null, t, co)).data.find(e => !e.paid)
  const link = (await call('POST', '/payment-links', { invoiceId: inv.id }, t, co)).data
  assert.equal(link.gateway, 'Razorpay')
  // The customer pays without signing in
  const paid = await call('POST', `/payment-links/${link.id}/pay`, { method: 'UPI' }, undefined, co)
  assert.equal(paid.data.status, 'paid')
  assert.ok(paid.data.fee > 0)
  assert.ok((await call('GET', '/ledger/trial-balance', null, t, co)).data.balanced)
})

test('API keys, signed webhooks and a tamper-evident audit trail', async () => {
  const co = { ...company, id: 'platform-dev-IN' }
  const t = await signIn('priya@unifiedtree.demo')
  const key = (await call('POST', '/developer/api-keys', { name: 'ERP', role: 'Finance Lead' }, t, co)).data
  assert.match(key.secret, /^utk_[0-9a-f]{40}$/)
  assert.ok(!('hash' in key))
  assert.equal((await call('GET', '/ledger/trial-balance', null, key.secret, co)).status, 200)
  await call('DELETE', `/developer/api-keys/${key.id}`, null, t, co)
  assert.equal((await call('GET', '/ledger/trial-balance', null, key.secret, co)).status, 401, 'revoked key')
  assert.equal((await call('POST', '/developer/webhooks', { url: 'http://insecure.example.com' }, t, co)).status, 422)
  await call('POST', '/developer/webhooks', { url: 'https://hooks.example.com/ut', events: ['ledger.journal.posted'] }, t, co)
  await call('POST', '/ledger/journals', { date: '2026-11-07', lines: [{ account: 'Bank', debit: 5 }, { account: "Owner's Equity", credit: 5 }] }, t, co)
  const deliveries = (await call('GET', '/developer/deliveries', null, t, co)).data
  assert.equal(deliveries[0].event, 'ledger.journal.posted')
  assert.match(deliveries[0].signature, /^t=\d+,v1=[0-9a-f]{64}$/)
  const verified = (await call('GET', '/audit/verify', null, t, co)).data
  assert.ok(verified.valid && verified.entries >= 4)
  // Tampering with any entry breaks the chain
  const log = (await call('GET', '/audit', null, t, co)).data.reverse()
  const tampered = { audit: log.map((e, i) => (i === 1 ? { ...e, summary: 'edited' } : e)) }
  const result = await verifyAudit(tampered)
  assert.equal(result.valid, false)
  assert.equal(result.brokenAt, log[1].seq)
})

test('admin-defined access policy limits sections and pages on the API', async () => {
  const admin = await signIn('priya@unifiedtree.demo')
  const sneha = await signIn('sneha@unifiedtree.demo')
  assert.equal((await call('PUT', '/access/policy', { roles: {}, users: {} }, sneha)).status, 403, 'only full settings access can change the policy')
  const saved = await call('PUT', '/access/policy', { roles: { Accountant: { sections: { receivables: 'none' }, hiddenTabs: ['sales/quotations'] } }, users: {} }, admin)
  assert.equal(saved.status, 200)
  const me = (await call('GET', '/access/me', null, sneha)).data
  assert.equal(me.sections.receivables, 'none')
  assert.ok(me.hiddenTabs.includes('sales/quotations'))
  assert.equal((await call('GET', '/payment-links', null, sneha)).status, 403, 'hidden section is blocked on the API')
  // Super Admin can never lock themself out of settings
  await call('PUT', '/access/policy', { roles: { 'Super Admin': { sections: { settings: 'none' } } }, users: {} }, admin)
  assert.equal((await call('GET', '/access/me', null, admin)).data.sections.settings, 'full')
  assert.equal((await call('PUT', '/access/policy', { roles: {}, users: {} }, admin)).status, 200, 'reset')
})
