/**
 * Time-based one-time passwords (RFC 6238 / RFC 4226) — the codes authenticator apps
 * such as Google Authenticator and Microsoft Authenticator show. Uses Web Crypto HMAC-SHA1.
 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Encode(bytes) {
  let bits = 0; let value = 0; let out = ''
  for (const b of bytes) {
    value = (value << 8) | b; bits += 8
    while (bits >= 5) { out += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5 }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31]
  return out
}

export function base32Decode(text) {
  const clean = String(text).toUpperCase().replace(/=+$|\s/g, '')
  let bits = 0; let value = 0; const out = []
  for (const ch of clean) {
    const i = ALPHABET.indexOf(ch)
    if (i < 0) throw new Error('Invalid base32 secret')
    value = (value << 5) | i; bits += 5
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8 }
  }
  return new Uint8Array(out)
}

export function newSecret(bytes = 20) {
  const b = new Uint8Array(bytes)
  globalThis.crypto.getRandomValues(b)
  return base32Encode(b)
}

export async function hotp(keyBytes, counter, digits = 6) {
  const msg = new Uint8Array(8)
  let c = BigInt(counter)
  for (let i = 7; i >= 0; i--) { msg[i] = Number(c & 255n); c >>= 8n }
  const key = await globalThis.crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const mac = new Uint8Array(await globalThis.crypto.subtle.sign('HMAC', key, msg))
  const offset = mac[mac.length - 1] & 15
  const bin = ((mac[offset] & 127) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3]
  return String(bin % 10 ** digits).padStart(digits, '0')
}

export function totp(secretBase32, { time = Date.now(), step = 30, digits = 6 } = {}) {
  return hotp(base32Decode(secretBase32), Math.floor(time / 1000 / step), digits)
}

/** Accept the current code or one step either side (clock drift), like real servers do. */
export async function verifyTotp(secretBase32, code, { time = Date.now(), window = 1 } = {}) {
  const want = String(code || '').replace(/\s/g, '')
  if (!/^\d{6}$/.test(want)) return false
  for (let w = -window; w <= window; w++) {
    if (await totp(secretBase32, { time: time + w * 30000 }) === want) return true
  }
  return false
}

export function otpauthUrl(secret, account, issuer = 'UnifiedTree') {
  return `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
}
