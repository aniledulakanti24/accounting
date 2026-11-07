import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import { LANGUAGE_BY_CODE, applyDocumentLanguage } from './languages'

/*
 * English ships with the app; every other language is loaded on demand from
 * ./locales/<code>.json. Languages without a file fall back to English until
 * `npm run translate` generates them with Google Translate.
 */
const LOCALE_LOADERS = Object.fromEntries(
  Object.entries(import.meta.glob(['./locales/*.json', '!./locales/en.json']))
    .map(([path, loader]) => [path.replace('./locales/', '').replace('.json', ''), loader]),
)

/** Codes that have a translation file (others show English). */
export const TRANSLATED_LANGUAGES = new Set(['en', ...Object.keys(LOCALE_LOADERS)])

export function isTranslated(code) {
  return TRANSLATED_LANGUAGES.has(code)
}

/** Load a language's strings (no-op for English or untranslated languages). */
export async function loadLanguage(code) {
  if (code === 'en' || i18n.hasResourceBundle(code, 'translation')) return
  const loader = LOCALE_LOADERS[code]
  if (!loader) return
  const mod = await loader()
  i18n.addResourceBundle(code, 'translation', mod.default ?? mod, true, true)
}

/** Switch language: load its strings first so the UI never flashes keys. */
export async function changeLanguage(code) {
  await loadLanguage(code)
  await i18n.changeLanguage(code)
}

function initialLanguage() {
  try {
    const lang = localStorage.getItem('ut-lang')
    if (lang && LANGUAGE_BY_CODE[lang]) return lang
  } catch {
    /* ignore malformed storage */
  }
  return 'en'
}

const lng = initialLanguage()

i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en } },
    // Start in English; the saved language is applied once its file has loaded (below),
    // which gives every component a real language change to re-render on
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { bindI18nStore: 'added' },
  })

applyDocumentLanguage('en')
i18n.on('languageChanged', applyDocumentLanguage)
// Load the saved language's strings, then announce the language again so every
// component (including memoized menus) re-renders with the translations
if (lng !== 'en') loadLanguage(lng).then(() => i18n.changeLanguage(lng))

export default i18n
