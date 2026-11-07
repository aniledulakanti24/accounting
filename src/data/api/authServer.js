/**
 * Mock identity & access service for the in-browser backend.
 *
 *  - Users with salted SHA-256 password hashes (never stored in plain text)
 *  - Opaque bearer session tokens with expiry
 *  - Role-based authorization enforced on every API request (same matrix as the UI)
 *  - Tamper-evident audit trail: each entry carries the hash of the previous one,
 *    so editing or deleting any entry breaks the chain and is detected by verifyAudit()
 *
 * A real deployment replaces this module with an identity provider (e.g. Auth0,
 * Cognito, Azure AD) and a server-side audit store; the request contract stays the same.
 */
import { DEFAULT_MATRIX, LEVELS, ACTION_MIN_LEVEL, ROLES } from '../../config/permissions.js'

export const DEMO_PASSWORD = 'Demo@2026'
import { verifyTotp } from './totp.js'
const SESSION_TTL_MS = 12 * 60 * 60 * 1000
const SESSION_KEY = 'ut-mock-api:sessions'

/* Demo workspace users — one per role */
export const DEMO_USERS = [
  { id: 'U1', name: 'Priya Sharma', email: 'priya@unifiedtree.demo', role: 'Super Admin', title: 'Owner' },
  { id: 'U2', name: 'Rahul Mehta', email: 'rahul@unifiedtree.demo', role: 'Finance Lead', title: 'Finance lead' },
  { id: 'U3', name: 'Ankit Rajput', email: 'ankit@unifiedtree.demo', role: 'Senior Accountant', title: 'Senior accountant' },
  { id: 'U4', name: 'Sneha Kulkarni', email: 'sneha@unifiedtree.demo', role: 'Accountant', title: 'Accountant' },
  { id: 'U5', name: 'Suresh Kumar', email: 'auditor@unifiedtree.demo', role: 'CA / Auditor', title: 'External auditor' },
  { id: 'U6', name: 'Vikram Joshi', email: 'vikram@unifiedtree.demo', role: 'Viewer (Branch)', title: 'Branch viewer' },
]

/* ── Crypto helpers (WebCrypto works in browsers and Node 19+) ── */
export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

function randomToken(bytes = 24) {
  const arr = new Uint8Array(bytes)
  globalThis.crypto.getRandomValues(arr)
  return [...arr].map(b => b.toString(16).padStart(2, '0')).join('')
}

/* Password hashes are computed once per user with a per-user salt */
const hashCache = new Map()
async function passwordHashFor(user) {
  if (!hashCache.has(user.id)) hashCache.set(user.id, await sha256Hex(`${user.id}:salt:${DEMO_PASSWORD}`))
  return hashCache.get(user.id)
}

/* ── Sessions ── */
const sessions = new Map()
function loadSessions() {
  if (sessions.size) return
  try {
    const raw = JSON.parse(localStorage.getItem(SESSION_KEY) || '[]')
    raw.forEach(([token, s]) => sessions.set(token, s))
  } catch {
    /* no persisted sessions */
  }
}
function saveSessions() {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify([...sessions])) } catch { /* memory only */ }
}

// Role reflects any change the admin made in Access control
const publicUser = u => ({ id: u.id, name: u.name, email: u.email, role: roleFor(u.id, u.role), title: u.title })

/* ── Two-factor sign-in (TOTP) — stored per person, outside any company ── */
const MFA_KEY = 'ut-mock-api:mfa'
const mfaMemory = new Map()
export function getMfa(userId) {
  try { const all = JSON.parse(localStorage.getItem(MFA_KEY) || '{}'); return all[userId] ?? null } catch { return mfaMemory.get(userId) ?? null }
}
export function setMfa(userId, value) {
  try {
    const all = JSON.parse(localStorage.getItem(MFA_KEY) || '{}')
    if (value) all[userId] = value; else delete all[userId]
    localStorage.setItem(MFA_KEY, JSON.stringify(all))
  } catch { if (value) mfaMemory.set(userId, value); else mfaMemory.delete(userId) }
}

export async function login(email, password, otp, meta = {}) {
  const user = DEMO_USERS.find(u => u.email.toLowerCase() === String(email || '').trim().toLowerCase())
  // Same error for unknown user and wrong password (no user enumeration)
  const fail = { status: 401, message: 'Email or password is incorrect' }
  if (!user) return { error: fail }
  const attempt = await sha256Hex(`${user.id}:salt:${password}`)
  if (attempt !== await passwordHashFor(user)) return { error: fail }
  const mfa = getMfa(user.id)
  if (mfa?.enabled) {
    if (!otp) return { error: { status: 401, message: 'Enter the 6-digit code from your authenticator app', details: { code: 'OTP_REQUIRED' } } }
    if (!await verifyTotp(mfa.secret, otp)) return { error: { status: 401, message: 'That code is not right — check the time on your phone and try again', details: { code: 'OTP_INVALID' } } }
  }
  loadSessions()
  const token = randomToken()
  sessions.set(token, { userId: user.id, expires: Date.now() + SESSION_TTL_MS, id: token.slice(-8), createdAt: new Date().toISOString(), device: meta.device || 'Web browser', mfa: !!mfa?.enabled })
  saveSessions()
  return { token, user: publicUser(user), expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString() }
}

export function listSessions(userId, currentToken) {
  loadSessions()
  return [...sessions].filter(([, s]) => s.userId === userId && s.expires > Date.now())
    .map(([token, s]) => ({ id: s.id ?? token.slice(-8), createdAt: s.createdAt ?? null, expiresAt: new Date(s.expires).toISOString(), device: s.device ?? 'Web browser', mfa: !!s.mfa, current: token === currentToken }))
}

export function revokeSession(userId, sessionId) {
  loadSessions()
  const hit = [...sessions].find(([token, s]) => s.userId === userId && (s.id ?? token.slice(-8)) === sessionId)
  if (!hit) return false
  sessions.delete(hit[0]); saveSessions()
  return true
}

export function logout(token) {
  loadSessions()
  sessions.delete(token)
  saveSessions()
}

export function userForToken(token) {
  if (!token) return null
  loadSessions()
  const s = sessions.get(token)
  if (!s) return null
  if (s.expires < Date.now()) { sessions.delete(token); saveSessions(); return null }
  const user = DEMO_USERS.find(u => u.id === s.userId)
  return user ? publicUser(user) : null
}

/* ── Access policy (set by the admin) ──
 * policy.roles[role]  = { sections: { sectionId: level }, hiddenTabs: ['section/tab'] }
 * policy.users[userId] = { role?, sections?: { sectionId: level }, hiddenTabs?: [...] }
 * Effective access = role defaults ← role policy ← person's own overrides.
 */
const POLICY_KEY = 'ut-mock-api:access-policy'
const LEVEL_SET = new Set(LEVELS)
let policyCache = null

export function getPolicy() {
  if (policyCache) return policyCache
  try { policyCache = JSON.parse(localStorage.getItem(POLICY_KEY) || 'null') } catch { policyCache = null }
  policyCache ??= { roles: {}, users: {}, updatedAt: null, updatedBy: null }
  return policyCache
}

function sanitizeGrant(grant = {}) {
  const sections = Object.fromEntries(Object.entries(grant.sections ?? {}).filter(([id, lvl]) => id in DEFAULT_MATRIX && LEVEL_SET.has(lvl)))
  const hiddenTabs = [...new Set((grant.hiddenTabs ?? []).filter(t => typeof t === 'string' && t.includes('/')))]
  return { sections, hiddenTabs }
}

export function savePolicy(next, by) {
  const roles = Object.fromEntries(Object.entries(next.roles ?? {}).filter(([r]) => ROLES.includes(r)).map(([r, g]) => [r, sanitizeGrant(g)]))
  // The owner role always keeps full control of settings, so an admin cannot lock everyone out
  if (roles['Super Admin']) roles['Super Admin'].sections.settings = 'full'
  const users = Object.fromEntries(Object.entries(next.users ?? {}).filter(([id]) => DEMO_USERS.some(u => u.id === id)).map(([id, g]) => [id, {
    ...sanitizeGrant(g),
    ...(g.inheritTabs === false ? { inheritTabs: false } : {}),
    ...(ROLES.includes(g.role) ? { role: g.role } : {}),
  }]))
  policyCache = { roles, users, updatedAt: new Date().toISOString(), updatedBy: by ?? null }
  try { localStorage.setItem(POLICY_KEY, JSON.stringify(policyCache)) } catch { /* memory only */ }
  return policyCache
}

/** A person's role after any change made by the admin. */
export function roleFor(userId, fallback) {
  return getPolicy().users[userId]?.role ?? fallback
}

/** Effective access for a user: { role, sections: { id: level }, hiddenTabs: [...] } */
export function effectiveAccess(user) {
  const policy = getPolicy()
  const role = user.role
  const roleGrant = policy.roles[role] ?? {}
  const personal = user.id ? policy.users[user.id] ?? {} : {}
  const sections = {}
  for (const id of Object.keys(DEFAULT_MATRIX)) {
    sections[id] = personal.sections?.[id] ?? roleGrant.sections?.[id] ?? DEFAULT_MATRIX[id][role] ?? 'none'
  }
  // Person-level tab choices replace the role's when set; otherwise the role's apply
  const hiddenTabs = personal.inheritTabs === false ? (personal.hiddenTabs ?? []) : [...new Set([...(roleGrant.hiddenTabs ?? []), ...(personal.hiddenTabs ?? [])])]
  return { role, sections, hiddenTabs }
}

/* ── Authorization ── */

/* Which permission section protects each API area */
const SECTION_FOR_PATH = [
  ['/ai', 'reports'],
  ['/migration', 'migration'], ['/accountants', 'settings'],
  ['/platform/backups', 'settings'], ['/platform/export', 'settings'], ['/platform/region', 'settings'],
  ['/apps', 'settings'],
  ['/gst', 'tax'],
  ['/books/invoices', 'sales'], ['/books/credit-notes', 'sales'], ['/books/recurring', 'sales'],
  ['/books/bills', 'procurement'], ['/books/payments', 'cashbank'],
  ['/books/items', 'inventory'], ['/books/godowns', 'inventory'], ['/books/reorder', 'inventory'], ['/books/purchase-orders', 'procurement'], ['/books/stock', 'inventory'], ['/books/boms', 'inventory'],
  ['/books/parties', 'parties'], ['/books/reports', 'reports'], ['/books/settings', 'settings'], ['/books/summary', 'dashboard'],
  ['/tax', 'tax'], ['/filing', 'tax'], ['/einvoice', 'tax'],
  ['/fx', 'cashbank'], ['/bank', 'cashbank'],
  ['/payment-links', 'receivables'],
  ['/ledger', 'reports'],
  ['/currencies', 'masters'],
  ['/audit', 'settings'], ['/developer', 'settings'], ['/users', 'settings'],
]

const ACTION_FOR_METHOD = { GET: 'view', POST: 'create', PATCH: 'edit', PUT: 'edit', DELETE: 'delete' }

/** Returns null when allowed, or an { status, message } error. */
export function authorize(user, method, path) {
  const entry = SECTION_FOR_PATH.find(([prefix]) => path.startsWith(prefix))
  if (!entry) return null
  const [, section] = entry
  const action = ACTION_FOR_METHOD[method] ?? 'view'
  // API keys act with their role's access; people get their personal overrides too
  const access = effectiveAccess(user.apiKey ? { role: user.role } : user)
  const level = access.sections[section] ?? 'none'
  if (LEVELS.indexOf(level) >= LEVELS.indexOf(ACTION_MIN_LEVEL[action] ?? 'view')) return null
  return { status: 403, message: `${user.role} cannot ${action} ${section}` }
}

/* ── Tamper-evident audit trail ── */
const GENESIS = '0'.repeat(64)

function auditPayload(e) {
  return JSON.stringify([e.seq, e.at, e.userId, e.role, e.method, e.path, e.status, e.summary, e.prevHash])
}

export async function appendAudit(db, { user, method, path, status, summary }) {
  db.audit ??= []
  const prev = db.audit[db.audit.length - 1]
  const entry = {
    seq: (prev?.seq ?? 0) + 1,
    at: new Date().toISOString(),
    userId: user?.id ?? null,
    user: user?.name ?? 'Customer (public checkout)',
    role: user?.role ?? 'public',
    method, path, status,
    summary: summary ?? `${method} ${path}`,
    prevHash: prev?.hash ?? GENESIS,
  }
  entry.hash = await sha256Hex(auditPayload(entry))
  db.audit.push(entry)
  if (db.audit.length > 2000) db.audit.splice(0, db.audit.length - 2000)
  return entry
}

/** Recompute the chain; reports the first entry whose hash or link does not match. */
export async function verifyAudit(db) {
  const list = db.audit ?? []
  for (let i = 0; i < list.length; i++) {
    const e = list[i]
    const expectedPrev = i === 0 ? e.prevHash : list[i - 1].hash
    if (e.prevHash !== expectedPrev) return { valid: false, brokenAt: e.seq, reason: 'Link to previous entry does not match' }
    if (await sha256Hex(auditPayload(e)) !== e.hash) return { valid: false, brokenAt: e.seq, reason: 'Entry contents were changed' }
  }
  return { valid: true, entries: list.length, head: list[list.length - 1]?.hash ?? GENESIS }
}
