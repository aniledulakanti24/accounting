#!/usr/bin/env node
/**
 * Generate interface translations for every Google Translate language.
 *
 *   GOOGLE_TRANSLATE_API_KEY=… npm run translate                 # all missing languages
 *   GOOGLE_TRANSLATE_API_KEY=… npm run translate -- --langs=ja,ko # only these
 *   GOOGLE_TRANSLATE_API_KEY=… npm run translate -- --force       # also overwrite existing files
 *   GOOGLE_TRANSLATE_API_KEY=… npm run translate -- --refresh-languages  # update the language list
 *   npm run translate -- --dry-run                                # show what would be translated
 *
 * Reads src/i18n/locales/en.json and writes src/i18n/locales/<code>.json using
 * the Google Cloud Translation API (v2, "Basic"). Hand-written files are kept
 * unless --force is passed. {{placeholders}} and product/tax terms are protected
 * so they are never translated. Uses only Node's built-in fetch (Node 18+).
 *
 * Only the English UI strings in en.json are sent to Google — no customer or
 * company data.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LOCALES = path.join(ROOT, 'src/i18n/locales')
const LANG_LIST = path.join(ROOT, 'src/i18n/googleLanguages.json')
const API = 'https://translation.googleapis.com/language/translate/v2'
const BATCH = 100 // the v2 API accepts up to 128 segments per request

/* App code → Google code where they differ */
const TO_GOOGLE = { he: 'iw', jv: 'jw', fil: 'tl' }
const FROM_GOOGLE = Object.fromEntries(Object.entries(TO_GOOGLE).map(([a, g]) => [g, a]))

/* Terms that must stay as-is (tax forms, product names, acronyms) */
const PROTECTED = [
  'UnifiedTree', 'GSTR-3B', 'GSTR-1', 'GST', 'TDS', 'TCS', 'CA', 'PI', 'SMS', 'FX', 'PDF', 'E-Way', 'VAT', 'IVA', 'TVA',
]

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=')
  return [k, v ?? true]
}))
const KEY = process.env.GOOGLE_TRANSLATE_API_KEY

/* ── helpers ── */
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object') flatten(v, `${prefix}${k}.`, out)
    else out[`${prefix}${k}`] = v
  }
  return out
}

function unflatten(flat) {
  const out = {}
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.')
    let node = out
    parts.slice(0, -1).forEach(p => { node = node[p] ??= {} })
    node[parts.at(-1)] = value
  }
  return out
}

const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const decodeHtml = s => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

/** Wrap placeholders and protected terms in no-translate spans (HTML mode). */
function protect(text) {
  let html = escapeHtml(text)
  html = html.replace(/\{\{\s*(\w+)\s*\}\}/g, '<span translate="no">{{$1}}</span>')
  for (const term of PROTECTED) {
    const re = new RegExp(`(?<![\\w-])${term.replace(/[-]/g, '\\-')}(?![\\w-])`, 'g')
    html = html.replace(re, `<span translate="no">${term}</span>`)
  }
  return html
}

function unprotect(html) {
  return decodeHtml(html.replace(/<span translate="no">\s*([\s\S]*?)\s*<\/span>/g, '$1')).replace(/\s{2,}/g, ' ').trim()
}

async function callApi(url, body, attempt = 0) {
  const res = await fetch(`${url}?key=${encodeURIComponent(KEY)}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    await new Promise(r => setTimeout(r, 1000 * 2 ** attempt))
    return callApi(url, body, attempt + 1)
  }
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Google API ${res.status}: ${json?.error?.message || res.statusText}`)
  return json.data
}

/*
 * Keyless mode: the public endpoint used by translate.google.com's own web
 * client. No API key or billing needed, but it is unofficial and rate-limited,
 * so requests are small and spaced out. Use an API key for production runs.
 */
const FREE_API = 'https://translate.googleapis.com/translate_a/t?client=gtx&sl=en&format=text'
const FREE_BATCH = 60
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function translateFree(strings, target) {
  const out = []
  for (let i = 0; i < strings.length; i += FREE_BATCH) {
    const chunk = strings.slice(i, i + FREE_BATCH)
    const body = new URLSearchParams()
    chunk.forEach(s => body.append('q', s))
    let result
    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await fetch(`${FREE_API}&tl=${encodeURIComponent(TO_GOOGLE[target] ?? target)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body,
      })
      if (res.ok) { result = await res.json(); break }
      if (res.status !== 429 && res.status < 500) throw new Error(`Google Translate ${res.status}`)
      await sleep(2000 * 2 ** attempt)
    }
    if (!result) throw new Error('Google Translate rate limit — try again later')
    // One string → plain string; several → array (items may be [text, detectedLang])
    const list = Array.isArray(result) ? result : [result]
    out.push(...list.map(item => (Array.isArray(item) ? item[0] : item)))
    await sleep(400)
  }
  return out
}

async function translateAll(strings, target) {
  if (!KEY) return translateFree(strings, target)
  const out = []
  for (let i = 0; i < strings.length; i += BATCH) {
    const chunk = strings.slice(i, i + BATCH)
    const data = await callApi(API, { q: chunk.map(protect), source: 'en', target: TO_GOOGLE[target] ?? target, format: 'html' })
    out.push(...data.translations.map(t => unprotect(t.translatedText)))
  }
  return out
}

/** Keep the English value wherever a placeholder went missing in translation. */
function checkPlaceholders(en, translated) {
  const want = (en.match(/\{\{\w+\}\}/g) || []).sort().join()
  const got = (translated.match(/\{\{\w+\}\}/g) || []).sort().join()
  return want === got ? translated : en
}

/* ── main ── */
async function main() {
  const en = JSON.parse(readFileSync(path.join(LOCALES, 'en.json'), 'utf8'))
  const flat = flatten(en)
  const keys = Object.keys(flat)
  const values = keys.map(k => flat[k])

  if (!KEY && !args['dry-run']) {
    console.log('No GOOGLE_TRANSLATE_API_KEY set — using the keyless Google Translate web endpoint (slower, rate-limited).')
  }

  if (args['refresh-languages'] && KEY) {
    // GET …/languages?target=en returns every language Google currently supports, with English names
    const res = await fetch(`${API}/languages?target=en&key=${encodeURIComponent(KEY)}`)
    const json = await res.json()
    if (!res.ok) throw new Error(`Google API ${res.status}: ${json?.error?.message || res.statusText}`)
    const list = (json.data?.languages || []).map(l => ({ code: FROM_GOOGLE[l.language] ?? l.language, name: l.name ?? l.language }))
    writeFileSync(LANG_LIST, JSON.stringify(list, null, 2) + '\n')
    console.log(`Wrote ${list.length} languages to ${path.relative(ROOT, LANG_LIST)}`)
  }

  // Language list: the app registry plus anything refreshed from Google
  const { LANGUAGES } = await import(pathToFileURL(path.join(ROOT, 'src/i18n/languages.js')).href)

  // --missing: add only the keys that are new in en.json to every existing language file
  if (args.missing) {
    const files = LANGUAGES.map(l => l.code).filter(c => c !== 'en' && existsSync(path.join(LOCALES, `${c}.json`)))
    let updated = 0
    for (const code of files) {
      const file = path.join(LOCALES, `${code}.json`)
      const current = flatten(JSON.parse(readFileSync(file, 'utf8')))
      const missing = keys.filter(k => !(k in current))
      const stale = Object.keys(current).filter(k => !(k in flat))
      if (!missing.length && !stale.length) continue
      if (args['dry-run']) { console.log(`${code}: ${missing.length} missing, ${stale.length} removed`); continue }
      try {
        const translated = missing.length ? await translateAll(missing.map(k => flat[k]), code) : []
        missing.forEach((k, i) => { current[k] = checkPlaceholders(flat[k], translated[i] || flat[k]) })
        stale.forEach(k => delete current[k])
        // Keep en.json key order
        const ordered = Object.fromEntries(keys.map(k => [k, current[k]]))
        writeFileSync(file, JSON.stringify(unflatten(ordered), null, 2) + '\n')
        updated++
        console.log(`✓ ${code}: +${missing.length}${stale.length ? ` −${stale.length}` : ''}`)
      } catch (err) {
        console.error(`✗ ${code}: ${err.message}`)
      }
    }
    console.log(`Done — ${updated} language file(s) updated.`)
    return
  }

  let targets = LANGUAGES.map(l => l.code).filter(c => c !== 'en')
  if (typeof args.langs === 'string') targets = args.langs.split(',').map(s => s.trim()).filter(Boolean)
  if (!args.force) targets = targets.filter(c => !existsSync(path.join(LOCALES, `${c}.json`)))

  console.log(`${keys.length} strings × ${targets.length} languages${args['dry-run'] ? ' (dry run)' : ''}`)
  if (args['dry-run']) {
    console.log(targets.join(', '))
    return
  }

  let done = 0
  for (const code of targets) {
    try {
      const translated = await translateAll(values, code)
      const result = Object.fromEntries(keys.map((k, i) => [k, checkPlaceholders(values[i], translated[i] || values[i])]))
      writeFileSync(path.join(LOCALES, `${code}.json`), JSON.stringify(unflatten(result), null, 2) + '\n')
      done++
      console.log(`✓ ${code} (${done}/${targets.length})`)
    } catch (err) {
      console.error(`✗ ${code}: ${err.message}`)
    }
  }
  console.log(`Done — ${done} language file(s) written. Run "npm test" style checks: node --test src/i18n/locales.test.js`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
