/**
 * Google Website Translator — live page translation into every language
 * Google Translate supports (~250), the same engine the Unifiedtree CRM uses.
 *
 * The widget is loaded on demand (first time the language menu opens, or on
 * start-up when a Google translation was active). Its own UI is hidden; our
 * LanguageSwitcher drives the hidden <select class="goog-te-combo">.
 * Note: when active, page text is sent to Google for translation.
 */

const SCRIPT_URL = 'https://translate.google.com/translate_a/element.js?cb=__utGoogleTranslateInit'
const HOST_ID = 'google_translate_element'

/* Our language codes → Google's, where they differ */
const TO_GOOGLE = { he: 'iw', jv: 'jw', fil: 'tl' }
const FROM_GOOGLE = Object.fromEntries(Object.entries(TO_GOOGLE).map(([a, g]) => [g, a]))
export const toGoogleCode = code => TO_GOOGLE[code] ?? code
export const fromGoogleCode = code => FROM_GOOGLE[code] ?? code

let widgetPromise = null

/**
 * Google's translator rewraps text nodes in <font> tags, which can make React
 * throw "removeChild/insertBefore: node is not a child" on re-render. This is
 * the standard guard: ignore those calls instead of crashing the page.
 */
function guardDomForTranslation() {
  if (typeof Node === 'undefined' || Node.prototype.__utTranslateGuard) return
  const removeChild = Node.prototype.removeChild
  Node.prototype.removeChild = function guardedRemoveChild(child) {
    if (child.parentNode !== this) return child
    return removeChild.call(this, child)
  }
  const insertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function guardedInsertBefore(newNode, ref) {
    if (ref && ref.parentNode !== this) return newNode
    return insertBefore.call(this, newNode, ref)
  }
  Node.prototype.__utTranslateGuard = true
}

/*
 * Never let Google translate amounts, rates, codes or the brand: it rewrites
 * number formats ("1.20L" → "1,20L") and names. Anything matching these
 * selectors is marked notranslate, including content rendered later.
 */
const NO_TRANSLATE = '.tabular, .font-mono, [data-brand], input, textarea, select, code, kbd'

function markNoTranslate(root = document.body) {
  if (!root?.querySelectorAll) return
  if (root.matches?.(NO_TRANSLATE)) root.classList.add('notranslate')
  root.querySelectorAll(NO_TRANSLATE).forEach(el => el.classList.add('notranslate'))
}

let observer = null
function protectNumbers() {
  if (observer || typeof MutationObserver === 'undefined') return
  markNoTranslate()
  observer = new MutationObserver(mutations => {
    for (const m of mutations) m.addedNodes.forEach(n => { if (n.nodeType === 1) markNoTranslate(n) })
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

function findCombo() {
  return document.querySelector('select.goog-te-combo')
}

/** Load Google's widget once; resolves with the hidden <select> when its languages are ready. */
export function ensureGoogleWidget(timeoutMs = 15000) {
  if (typeof document === 'undefined') return Promise.reject(new Error('No document'))
  if (widgetPromise) return widgetPromise
  guardDomForTranslation()
  protectNumbers()

  widgetPromise = new Promise((resolve, reject) => {
    if (!document.getElementById(HOST_ID)) {
      const host = document.createElement('div')
      host.id = HOST_ID
      host.setAttribute('aria-hidden', 'true')
      host.className = 'ut-gt-host notranslate'
      document.body.appendChild(host)
    }
    window.__utGoogleTranslateInit = () => {
      new window.google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, HOST_ID)
    }
    if (!document.querySelector(`script[src^="${SCRIPT_URL.split('?')[0]}"]`)) {
      const script = document.createElement('script')
      script.src = SCRIPT_URL
      script.async = true
      script.onerror = () => { widgetPromise = null; reject(new Error('Google Translate could not be loaded')) }
      document.head.appendChild(script)
    } else if (window.google?.translate?.TranslateElement && !findCombo()) {
      window.__utGoogleTranslateInit()
    }
    const started = Date.now()
    const timer = setInterval(() => {
      const combo = findCombo()
      if (combo && combo.options.length > 1) {
        clearInterval(timer)
        resolve(combo)
      } else if (Date.now() - started > timeoutMs) {
        clearInterval(timer)
        widgetPromise = null
        reject(new Error('Google Translate did not respond'))
      }
    }, 150)
  })
  return widgetPromise
}

/** Every language the Google widget offers: [{ code, name }] (codes in our format). */
export async function getGoogleLanguages() {
  const combo = await ensureGoogleWidget()
  return [...combo.options]
    .filter(o => o.value)
    .map(o => ({ code: fromGoogleCode(o.value), name: o.textContent.trim() }))
}

/* We remember the chosen Google language ourselves: Google's own cookie makes
   its widget start translating an empty page on reload and then get stuck. */
const STORAGE_KEY = 'ut-google-lang'

function rememberGoogleLanguage(code) {
  try {
    if (code) localStorage.setItem(STORAGE_KEY, code)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable — translation still works for this visit */
  }
}

/** Language Google is translating the page into, or null. */
export function getActiveGoogleLanguage() {
  try {
    return localStorage.getItem(STORAGE_KEY) || null
  } catch {
    return null
  }
}

/* Right-to-left scripts among Google's languages (same list as the Unifiedtree CRM) */
const RTL_CODES = new Set(['ar', 'fa', 'iw', 'he', 'ur', 'ps', 'sd', 'ug', 'yi', 'dv', 'ckb', 'pa-Arab', 'ms-Arab', 'fa-AF'])

/** Translate the whole page into `code` with Google. */
export async function translatePageWithGoogle(code) {
  document.documentElement.dir = RTL_CODES.has(code) || RTL_CODES.has(toGoogleCode(code)) ? 'rtl' : 'ltr'
  const combo = await ensureGoogleWidget()
  combo.value = toGoogleCode(code)
  combo.dispatchEvent(new Event('change'))
  rememberGoogleLanguage(code)
}

function clearGoogleCookies() {
  const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT'
  const host = window.location.hostname
  const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`]
  for (const d of domains) {
    document.cookie = `googtrans=; ${expired}; path=/${d ? `; domain=${d}` : ''}`
  }
}

/** Stop Google translation and show the original page (reloads if a translation was applied). */
export function restoreOriginalPage({ reload = true } = {}) {
  const wasActive = !!getActiveGoogleLanguage()
    || document.documentElement.classList.contains('translated-ltr')
    || document.documentElement.classList.contains('translated-rtl')
  clearGoogleCookies()
  rememberGoogleLanguage(null)
  if (wasActive && reload) window.location.reload()
  return wasActive
}

/** On start-up, re-apply a Google translation chosen in a previous visit. */
export function resumeGoogleTranslation() {
  // Drop Google's cookie so its widget starts clean, then replay the choice once the app has rendered
  clearGoogleCookies()
  const code = getActiveGoogleLanguage()
  if (!code) return
  new Promise(resolve => {
    const root = document.getElementById('root')
    const ready = () => root && root.innerText.trim().length > 50
    const started = Date.now()
    const timer = setInterval(() => {
      if (ready() || Date.now() - started > 8000) { clearInterval(timer); resolve() }
    }, 200)
  })
    .then(() => ensureGoogleWidget())
    // The <select> appears before Google's change handler is wired up; switching
    // too early leaves the widget stuck, so give it a moment to finish initialising.
    .then(() => new Promise(r => setTimeout(r, 2000)))
    .then(() => translatePageWithGoogle(code))
    .catch(() => {})
}
