/**
 * Interface languages — every language supported by Google Translate.
 *
 * Languages with a locale file in ./locales are fully translated; the rest
 * fall back to English until `npm run translate` generates their file with the
 * Google Cloud Translation API (see scripts/translate-locales.mjs).
 *
 * Running the script with --refresh-languages writes googleLanguages.json,
 * which adds any newer Google languages to this list automatically.
 */
import extraGoogleLanguages from './googleLanguages.json' with { type: 'json' }

/* Google Translate language codes (BCP-47 style; zh-CN / zh-TW keep their region). */
const GOOGLE_CODES = [
  'af', 'ak', 'am', 'ar', 'as', 'ay', 'az', 'be', 'bg', 'bho', 'bm', 'bn', 'bs', 'ca', 'ceb', 'ckb', 'co', 'cs',
  'cy', 'da', 'de', 'doi', 'dv', 'ee', 'el', 'en', 'eo', 'es', 'et', 'eu', 'fa', 'fi', 'fil', 'fr', 'fy', 'ga',
  'gd', 'gl', 'gn', 'gom', 'gu', 'ha', 'haw', 'he', 'hi', 'hmn', 'hr', 'ht', 'hu', 'hy', 'id', 'ig', 'ilo', 'is',
  'it', 'ja', 'jv', 'ka', 'kk', 'km', 'kn', 'ko', 'kri', 'ku', 'ky', 'la', 'lb', 'lg', 'ln', 'lo', 'lt', 'lus',
  'lv', 'mai', 'mg', 'mi', 'mk', 'ml', 'mn', 'mni-Mtei', 'mr', 'ms', 'mt', 'my', 'ne', 'nl', 'no', 'nso', 'ny',
  'om', 'or', 'pa', 'pl', 'ps', 'pt', 'qu', 'ro', 'ru', 'rw', 'sa', 'sd', 'si', 'sk', 'sl', 'sm', 'sn', 'so',
  'sq', 'sr', 'st', 'su', 'sv', 'sw', 'ta', 'te', 'tg', 'th', 'ti', 'tk', 'tr', 'ts', 'tt', 'ug', 'uk', 'ur',
  'uz', 'vi', 'xh', 'yi', 'yo', 'zh-CN', 'zh-TW', 'zu',
]

/* Right-to-left scripts */
const RTL = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'dv', 'yi', 'ckb'])

/* Names Intl may not know (fallback English names) */
const NAME_FALLBACK = {
  bho: 'Bhojpuri', ceb: 'Cebuano', ckb: 'Kurdish (Sorani)', doi: 'Dogri', gom: 'Konkani', hmn: 'Hmong',
  ilo: 'Ilocano', kri: 'Krio', lus: 'Mizo', 'mni-Mtei': 'Meitei (Manipuri)', nso: 'Sepedi', fil: 'Filipino',
  haw: 'Hawaiian', ak: 'Twi (Akan)', ay: 'Aymara', gn: 'Guarani', qu: 'Quechua', ts: 'Tsonga', ti: 'Tigrinya',
}

function intlName(code, inLocale) {
  try {
    const name = new Intl.DisplayNames([inLocale], { type: 'language' }).of(code)
    return name && name !== code ? name : null
  } catch {
    return null
  }
}

function buildLanguage(code, googleName) {
  const english = NAME_FALLBACK[code] || intlName(code, 'en') || googleName || code
  const native = intlName(code, code) || english
  return {
    code,
    englishName: english,
    name: native.charAt(0).toLocaleUpperCase(code) + native.slice(1),
    dir: RTL.has(code.split('-')[0]) ? 'rtl' : 'ltr',
  }
}

const extra = (Array.isArray(extraGoogleLanguages) ? extraGoogleLanguages : [])
  .filter(l => l?.code && !GOOGLE_CODES.includes(l.code))

export const LANGUAGES = [
  ...GOOGLE_CODES.map(code => buildLanguage(code)),
  ...extra.map(l => buildLanguage(l.code, l.name)),
].sort((a, b) => (a.code === 'en' ? -1 : b.code === 'en' ? 1 : a.englishName.localeCompare(b.englishName)))

export const LANGUAGE_BY_CODE = Object.fromEntries(LANGUAGES.map(l => [l.code, l]))

export function getLanguage(code) {
  return LANGUAGE_BY_CODE[code] || LANGUAGE_BY_CODE.en
}

/**
 * Locale used to format numbers and dates: the interface language combined with
 * the company's country (French + Canada → fr-CA, German + UK → de-GB).
 * English keeps the country's own locale (en-IN keeps lakh/crore grouping).
 * Other languages are pinned to Latin digits so amounts stay consistent.
 */
export function displayLocale(languageCode, countryLocale) {
  const lang = getLanguage(languageCode)
  const fallback = countryLocale || 'en-IN'
  if (lang.code === 'en') return fallback
  const region = fallback.split('-')[1]
  // Codes that already carry a region/script (zh-CN, mni-Mtei) are used as-is
  const base = lang.code.includes('-') || !region ? lang.code : `${lang.code}-${region}`
  for (const candidate of [`${base}-u-nu-latn`, base, `${lang.code.split('-')[0]}-u-nu-latn`]) {
    try {
      if (Intl.NumberFormat.supportedLocalesOf([candidate]).length) return candidate
    } catch {
      /* invalid tag — try the next one */
    }
  }
  return fallback
}

/** Set <html lang dir> so the browser lays the page out for the language. */
export function applyDocumentLanguage(code) {
  if (typeof document === 'undefined') return
  const lang = getLanguage(code)
  document.documentElement.setAttribute('lang', lang.code)
  document.documentElement.setAttribute('dir', lang.dir)
}
