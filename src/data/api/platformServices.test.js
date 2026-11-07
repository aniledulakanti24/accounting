// Browser storage stand-in so the tamper test can reach the stored ciphertext
if (!globalThis.localStorage) {
  const m = new Map()
  globalThis.localStorage = { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }
}
import test from 'node:test'
import assert from 'node:assert/strict'
import { handleRequest } from './mockServer.js'
import { base32Encode, totp, verifyTotp, hotp } from './totp.js'
import { ensureBooks } from './booksServer.js'
import { createBackup, restoreBackup, listBackups } from './platformServer.js'
import { setMfa } from './authServer.js'

test('TOTP matches the RFC 6238 / RFC 4226 reference values', async () => {
  const secret = base32Encode(new TextEncoder().encode('12345678901234567890'))
  assert.equal(await totp(secret, { time: 59000, digits: 8 }), '94287082')
  assert.equal(await totp(secret, { time: 1111111109000, digits: 8 }), '07081804')
  assert.equal(await hotp(new TextEncoder().encode('12345678901234567890'), 0), '755224')
  assert.ok(await verifyTotp(secret, await totp(secret, { time: Date.now() - 30000 })), 'one step of clock drift is accepted')
  assert.equal(await verifyTotp(secret, '12345'), false)
})

test('with two-factor on, sign-in needs a valid code', async () => {
  const secret = base32Encode(new TextEncoder().encode('ABCDEFGHIJ0123456789'))
  setMfa('U3', { secret, enabled: true })
  const login = body => handleRequest({ method: 'POST', url: '/auth/login', body: { email: 'ankit@unifiedtree.demo', password: 'Demo@2026', ...body } })
  const none = await login({})
  assert.equal(none.status, 401)
  assert.equal(none.error.details.code, 'OTP_REQUIRED')
  assert.equal((await login({ otp: '000000' })).error.details.code, 'OTP_INVALID')
  const good = await login({ otp: await totp(secret) })
  assert.equal(good.status, 201)
  setMfa('U3', null)
})

test('backups are encrypted, restore the exact data, and refuse tampered copies', async () => {
  const company = { id: 'backup-unit-IN', country: 'IN', name: 'Backup Test Ltd', taxId: '27AABCU9603R1ZX' }
  const db = { returns: [] }
  ensureBooks(db, company)
  const invoicesBefore = db.books.invoices.length
  const b = await createBackup(db, company)
  assert.equal(b.checksum.length, 64)
  assert.equal(b.cipher, undefined, 'ciphertext is never returned')
  db.books.invoices.length = 0
  const r = await restoreBackup(db, company, b.id)
  assert.equal(db.books.invoices.length, invoicesBefore)
  assert.ok(listBackups(company.id).some(x => x.id === r.safetyBackup && x.kind === 'before-restore'))
  // Flip one byte of the stored ciphertext: AES-GCM authentication must reject it
  const key = `ut-mock-api:backups:${company.id}`
  const stored = JSON.parse(globalThis.localStorage?.getItem?.(key) ?? 'null')
  assert.ok(stored, 'backups are stored')
  {
    const c = stored[stored.length - 1]
    c.cipher = (c.cipher[0] === 'A' ? 'B' : 'A') + c.cipher.slice(1)
    globalThis.localStorage.setItem(key, JSON.stringify(stored))
    await assert.rejects(restoreBackup(db, company, c.id), /tampered|damaged/)
  }
})

test('only a Super Admin can restore; anyone signed in sees their sessions', async () => {
  const co = { id: 'platform-api-IN', country: 'IN', name: 'Platform API Ltd', taxId: '27AABCU9603R1ZX' }
  const signIn = async email => (await handleRequest({ method: 'POST', url: '/auth/login', body: { email, password: 'Demo@2026' } })).data.token
  const call = (method, url, body, token) => handleRequest({ method, url, body, token, company: co })
  const admin = await signIn('priya@unifiedtree.demo')
  const lead = await signIn('rahul@unifiedtree.demo')
  const backup = (await call('POST', '/platform/backups', {}, admin)).data
  const asLead = await call('POST', `/platform/backups/${backup.id}/restore`, {}, lead)
  assert.ok([403, 422].includes(asLead.status), 'a Finance Lead cannot restore')
  assert.equal((await call('POST', `/platform/backups/${backup.id}/restore`, {}, admin)).status, 200)
  const sec = (await call('GET', '/security/overview', null, admin)).data
  assert.ok(sec.sessions.some(s => s.current))
})
