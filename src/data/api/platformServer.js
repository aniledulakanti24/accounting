/**
 * Production-readiness services (mock): encrypted backups and restore, full data export,
 * data residency, a status page, and the security centre (two-factor sign-in, active sessions).
 *
 * Backups are encrypted with AES-256-GCM using a per-company key (standing in for a cloud KMS)
 * and carry a SHA-256 checksum of the plaintext, verified again on restore.
 */
import { sha256Hex, getMfa, setMfa, listSessions, revokeSession } from './authServer.js'
import { newSecret, verifyTotp, otpauthUrl } from './totp.js'

const BACKUP_PREFIX = 'ut-mock-api:backups:'
const KMS_KEY = 'ut-mock-api:kms'
const memory = new Map()
const KEEP = 10

export const REGIONS = [
  { id: 'in-mumbai', name: 'India (Mumbai)', law: 'DPDP Act 2023' },
  { id: 'eu-frankfurt', name: 'European Union (Frankfurt)', law: 'GDPR' },
  { id: 'uk-london', name: 'United Kingdom (London)', law: 'UK GDPR' },
  { id: 'us-virginia', name: 'United States (Virginia)', law: 'CCPA / SOC 2' },
  { id: 'me-uae', name: 'UAE (Dubai)', law: 'PDPL' },
  { id: 'ap-singapore', name: 'Singapore', law: 'PDPA' },
  { id: 'ap-sydney', name: 'Australia (Sydney)', law: 'Privacy Act 1988' },
]
const DEFAULT_REGION = { IN: 'in-mumbai', GB: 'uk-london', US: 'us-virginia', AE: 'me-uae', SA: 'me-uae', SG: 'ap-singapore', AU: 'ap-sydney', NZ: 'ap-sydney' }

class PlatformError extends Error { constructor(m) { super(m); this.status = 422 } }
const fail = m => { throw new PlatformError(m) }

const read = key => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null } catch { return memory.get(key) ?? null } }
const write = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)) } catch { memory.set(key, v) } }

const toB64 = bytes => { let s = ''; new Uint8Array(bytes).forEach(b => { s += String.fromCharCode(b) }); return btoa(s) }
const fromB64 = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0))

async function companyKey(companyId) {
  const kms = read(KMS_KEY) ?? {}
  if (!kms[companyId]) {
    const raw = new Uint8Array(32); globalThis.crypto.getRandomValues(raw)
    kms[companyId] = toB64(raw); write(KMS_KEY, kms)
  }
  return globalThis.crypto.subtle.importKey('raw', fromB64(kms[companyId]), 'AES-GCM', false, ['encrypt', 'decrypt'])
}

/* ── Backups ── */
export function listBackups(companyId) {
  return (read(BACKUP_PREFIX + companyId) ?? []).map(({ cipher, ...meta }) => ({ ...meta, encryptedBytes: cipher.length }))
}

export async function createBackup(db, company, { kind = 'manual', by = 'system' } = {}) {
  const plain = JSON.stringify(db)
  const checksum = await sha256Hex(plain)
  const iv = new Uint8Array(12); globalThis.crypto.getRandomValues(iv)
  const cipher = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await companyKey(company.id), new TextEncoder().encode(plain))
  const entry = {
    id: `BK-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`,
    at: new Date().toISOString(), kind, by, checksum, sizeBytes: plain.length, iv: toB64(iv), cipher: toB64(cipher),
    counts: { journals: db.ledger?.journals?.length ?? 0, invoices: db.books?.invoices?.length ?? 0, bills: db.books?.bills?.length ?? 0, parties: db.books?.parties?.length ?? 0 },
  }
  const all = [entry, ...(read(BACKUP_PREFIX + company.id) ?? [])].slice(0, KEEP)
  write(BACKUP_PREFIX + company.id, all)
  return Object.fromEntries(Object.entries(entry).filter(([k]) => k !== 'cipher'))
}

/** Take today's automatic backup if it hasn't run yet (stands in for the nightly job). */
export async function ensureDailyBackup(db, company) {
  const today = new Date().toISOString().slice(0, 10)
  if (listBackups(company.id).some(b => b.kind === 'automatic' && b.at.startsWith(today))) return null
  return createBackup(db, company, { kind: 'automatic' })
}

export async function restoreBackup(db, company, backupId) {
  const entry = (read(BACKUP_PREFIX + company.id) ?? []).find(b => b.id === backupId)
  if (!entry) fail('Backup not found')
  let plain
  try {
    const bytes = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(entry.iv) }, await companyKey(company.id), fromB64(entry.cipher))
    plain = new TextDecoder().decode(bytes)
  } catch { fail('This backup could not be decrypted — it may have been tampered with') }
  if (await sha256Hex(plain) !== entry.checksum) fail('Checksum mismatch — the backup is damaged and was not restored')
  const snapshot = JSON.parse(plain)
  // Keep a safety copy of the current state first, so a restore can itself be undone
  const safety = await createBackup(db, company, { kind: 'before-restore' })
  for (const k of Object.keys(db)) delete db[k]
  Object.assign(db, snapshot)
  return { restored: entry.id, from: entry.at, safetyBackup: safety.id, counts: entry.counts }
}

/* ── Status page: deterministic uptime per component, plus live latency ── */
export function statusReport(latencyMs) {
  const day = Math.floor(Date.now() / 86400000)
  const components = ['API', 'Web app', 'Bank feeds', 'GST / IRP gateway', 'E-way bill gateway', 'Payment links', 'Webhooks', 'Backups'].map((name, i) => {
    const minutesDown = ((day * 7 + i * 13) % 37) / 2                        // 0–18 minutes over 90 days
    const uptime = Math.round((1 - minutesDown / (90 * 24 * 60)) * 100000) / 1000
    return { name, status: name === 'GST / IRP gateway' && (day % 11 === 0) ? 'degraded' : 'operational', uptime90d: uptime }
  })
  return { overall: components.every(c => c.status === 'operational') ? 'All systems operational' : 'Some systems degraded', components, latencyMs, checkedAt: new Date().toISOString(),
    incidents: [{ date: new Date(Date.now() - 9 * 86400000).toISOString().slice(0, 10), title: 'Delayed bank feed sync for one aggregator', minutes: 22, resolved: true }] }
}

export function registerPlatformRoutes(route, { ok, badRequest, notFound }) {
  const guard = h => async ctx => { try { return await h(ctx) } catch (e) { if (e instanceof PlatformError) badRequest(e.message); throw e } }

  route('GET', '/platform/backups', guard(async ({ db, company, save }) => {
    if (await ensureDailyBackup(db, company)) save()
    return ok(listBackups(company.id))
  }), { summary: 'Backups (encrypted, newest first; one automatic backup a day)' })
  route('POST', '/platform/backups', guard(async ({ db, company, user }) => {
    const b = await createBackup(db, company, { by: user?.name ?? 'system' })
    return ok({ ...b, auditSummary: `Backup ${b.id} created (${Math.round(b.sizeBytes / 1024)} KB, AES-256-GCM)` }, 201)
  }), { summary: 'Take an encrypted backup now' })
  route('POST', '/platform/backups/:id/restore', guard(async ({ db, company, params, user, save }) => {
    if (user?.role !== 'Super Admin') badRequest('Only a Super Admin can restore a backup')
    const r = await restoreBackup(db, company, params.id); save()
    return ok({ ...r, auditSummary: `Restored backup ${params.id} (safety copy ${r.safetyBackup})` })
  }), { summary: 'Restore a backup (verifies the checksum, keeps a safety copy)' })
  route('GET', '/platform/export', ({ db, company }) => ok({ exportedAt: new Date().toISOString(), company: { id: company.id, name: company.name, country: company.country }, format: 'unifiedtree-export/1', data: db }), { summary: 'Everything for this company as JSON — your data, portable' })
  route('GET', '/platform/region', ({ db, company }) => {
    const id = db.region ?? DEFAULT_REGION[company.country] ?? 'eu-frankfurt'
    return ok({ current: REGIONS.find(r => r.id === id), options: REGIONS })
  }, { summary: 'Where this company’s data is stored' })
  route('PUT', '/platform/region', ({ db, body, save }) => {
    const r = REGIONS.find(x => x.id === body?.region) || badRequest('Choose a region from the list')
    db.region = r.id; save()
    return ok({ current: r, auditSummary: `Data region set to ${r.name}` })
  }, { summary: 'Choose the data region' })
  route('GET', '/platform/status', () => { const t0 = Date.now(); return ok(statusReport(Date.now() - t0 + 180 + Math.round(Math.random() * 120))) }, { public: true, noTenant: true, summary: 'Service status and uptime' })

  /* Security centre — about the signed-in person, not the company */
  route('GET', '/security/overview', ({ user, token }) => {
    const mfa = getMfa(user.id)
    return ok({ mfaEnabled: !!mfa?.enabled, sessions: listSessions(user.id, token), passwordPolicy: { minLength: 10, hashing: 'SHA-256 with per-user salt', lockout: '5 failed attempts → 15 minutes' }, encryption: { atRest: 'AES-256-GCM', inTransit: 'TLS 1.3' } })
  }, { noTenant: true, summary: 'Your sign-in security' })
  route('POST', '/security/2fa/setup', ({ user }) => {
    const secret = newSecret()
    setMfa(user.id, { secret, enabled: false })
    return ok({ secret, otpauthUrl: otpauthUrl(secret, user.email) })
  }, { noTenant: true, summary: 'Start two-factor setup (shows the secret for your authenticator app)' })
  route('POST', '/security/2fa/enable', async ({ user, body }) => {
    const mfa = getMfa(user.id) || badRequest('Start setup first')
    if (!await verifyTotp(mfa.secret, body?.code)) badRequest('That code is not right — enter the 6 digits your app shows now')
    setMfa(user.id, { ...mfa, enabled: true, enabledAt: new Date().toISOString() })
    return ok({ enabled: true, auditSummary: 'Two-factor sign-in turned on' })
  }, { noTenant: true, summary: 'Turn on two-factor sign-in (confirm with a code)' })
  route('POST', '/security/2fa/disable', async ({ user, body }) => {
    const mfa = getMfa(user.id)
    if (!mfa?.enabled) badRequest('Two-factor sign-in is not on')
    if (!await verifyTotp(mfa.secret, body?.code)) badRequest('Enter a current code to turn two-factor off')
    setMfa(user.id, null)
    return ok({ enabled: false, auditSummary: 'Two-factor sign-in turned off' })
  }, { noTenant: true, summary: 'Turn off two-factor sign-in' })
  route('DELETE', '/security/sessions/:id', ({ user, params }) => {
    if (!revokeSession(user.id, params.id)) notFound('Session')
    return ok({ revoked: params.id, auditSummary: `Signed out session ${params.id}` })
  }, { noTenant: true, summary: 'Sign out another device' })
}
