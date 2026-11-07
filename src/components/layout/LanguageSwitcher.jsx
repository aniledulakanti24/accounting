import { useEffect, useMemo, useRef, useState } from 'react'
import { Languages, Search, CircleCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'
import { LANGUAGES } from '../../i18n/languages'
import { isTranslated } from '../../i18n'
import { toast } from '../../lib/toast'
import {
  getGoogleLanguages, getActiveGoogleLanguage, translatePageWithGoogle, restoreOriginalPage,
} from '../../lib/googleTranslate'

/* Same suggestions, in the same order, as the Unifiedtree CRM */
const SUGGESTED = ['es', 'fr', 'de', 'pt', 'ar', 'zh-CN', 'hi', 'ru', 'ja', 'ko', 'id']

function nativeName(code) {
  try {
    const name = new Intl.DisplayNames([code], { type: 'language' }).of(code)
    return name && name !== code ? name : null
  } catch {
    return null
  }
}

function englishName(code, fallback) {
  try {
    const name = new Intl.DisplayNames(['en'], { type: 'language' }).of(code)
    return fallback || (name && name !== code ? name : code)
  } catch {
    return fallback || code
  }
}

/** "português · Portuguese (Brazil)" — native name first, English after when they differ. */
function labelFor(code, googleName) {
  const english = englishName(code, googleName)
  const native = nativeName(code)
  if (!native || native.toLocaleLowerCase() === english.toLocaleLowerCase()) return { primary: english, secondary: null }
  return { primary: native, secondary: english }
}

function Row({ code, googleName, current, onPick }) {
  const { primary, secondary } = labelFor(code, googleName)
  const active = current === code
  return (
    <button
      type="button"
      lang={code}
      aria-current={active}
      onClick={() => onPick(code)}
      className={`flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[13.5px] cursor-pointer border-0 ${
        active ? 'bg-[var(--primary-tint)]' : 'bg-transparent hover:bg-[var(--surface-2)]'
      }`}
    >
      <span className="min-w-0 flex-1 truncate">
        <span className="font-medium text-[var(--text)]">{primary}</span>
        {secondary && <span className="text-xs text-[var(--muted)]"> · {secondary}</span>}
      </span>
      {active && <CircleCheck size={15} style={{ color: 'var(--primary)' }} />}
    </button>
  )
}

/**
 * Language menu: a "languages" icon button opening a searchable list of every
 * Google Translate language. Languages with an app translation use it (better
 * wording, right-to-left layout, local number formats); all others are
 * translated live by Google's website translator.
 */
export default function LanguageSwitcher() {
  const { t } = useTranslation()
  const language = useAppStore(s => s.language)
  const setLanguage = useAppStore(s => s.setLanguage)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [googleList, setGoogleList] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [googleLang, setGoogleLang] = useState(getActiveGoogleLanguage)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  const current = googleLang || language || 'en'

  // Load Google's language list the first time the menu opens (or right away
  // when a Google language is active, so the button can show its name)
  useEffect(() => {
    if (!(open || googleLang) || googleList || loadError) return undefined
    let cancelled = false
    getGoogleLanguages().then(
      list => { if (!cancelled) setGoogleList(list) },
      () => { if (!cancelled) setLoadError(true) },
    )
    return () => { cancelled = true }
  }, [open, googleLang, googleList, loadError])

  useEffect(() => {
    if (!open) return undefined
    inputRef.current?.focus()
    const onDown = e => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // All languages: Google's live list, or our registry if Google can't be reached
  const all = useMemo(() => {
    const base = googleList ?? (loadError ? LANGUAGES.filter(l => l.code !== 'en').map(l => ({ code: l.code, name: l.englishName })) : [])
    const byCode = new Map(base.map(l => [l.code, l]))
    // App-translated languages are always offered
    for (const l of LANGUAGES) if (l.code !== 'en' && isTranslated(l.code) && !byCode.has(l.code)) byCode.set(l.code, { code: l.code, name: l.englishName })
    return [...byCode.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [googleList, loadError])

  const nameOf = code => all.find(l => l.code === code)?.name
  const q = query.trim().toLocaleLowerCase()
  const matches = l => {
    if (!q) return true
    const { primary, secondary } = labelFor(l.code, l.name)
    return [primary, secondary, l.code].some(s => s?.toLocaleLowerCase().includes(q))
  }
  const suggested = SUGGESTED.map(code => ({ code, name: nameOf(code) })).filter(matches)
  const rest = all.filter(matches)

  async function pick(code) {
    setOpen(false)
    setQuery('')
    if (code === current) return

    if (code === 'en') {
      setLanguage('en')
      setGoogleLang(null)
      restoreOriginalPage()
      return
    }

    if (isTranslated(code)) {
      // App translation: switch i18n; drop any Google layer (needs a reload to undo)
      setLanguage(code)
      setGoogleLang(null)
      restoreOriginalPage()
      return
    }

    // Everything else: Google translates the English page live
    try {
      if (language !== 'en') setLanguage('en')
      await translatePageWithGoogle(code)
      setGoogleLang(code)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const currentName = labelFor(current, nameOf(current)).secondary ?? labelFor(current, nameOf(current)).primary

  return (
    <span ref={wrapRef} className="relative inline-flex notranslate" translate="no">
      <button
        data-tour="language"
        type="button"
        onClick={() => setOpen(o => !o)}
        title={t('shell.language')}
        aria-label={`${t('shell.language')}: ${currentName}`}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-[8px] border-0 bg-transparent text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
      >
        <Languages size={18} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('shell.language')}
          className="absolute end-0 top-full z-[960] mt-2 w-[300px] rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-1.5"
          style={{ boxShadow: '0 12px 32px rgba(16, 32, 28, 0.16)' }}
        >
          <div className="flex items-center gap-2 rounded-lg border-2 border-[var(--primary)] px-2.5 h-9 mb-1.5">
            <Search size={15} className="text-[var(--muted)] shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search languages"
              aria-label="Search languages"
              className="w-full bg-transparent border-0 outline-none text-sm text-[var(--text)]"
            />
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {(!q || 'english'.includes(q)) && <Row code="en" googleName="English" current={current} onPick={pick} />}

            {suggested.length > 0 && (
              <>
                <div className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Suggested</div>
                {suggested.map(l => <Row key={`s-${l.code}`} code={l.code} googleName={l.name} current={current} onPick={pick} />)}
              </>
            )}

            <div className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">All languages</div>
            {!googleList && !loadError && <p className="px-2.5 py-3 text-center text-xs text-[var(--muted)]">Loading languages…</p>}
            {loadError && <p className="px-2.5 py-1 text-xs text-[var(--warn)]">Google Translate is unavailable — showing languages with app translations only.</p>}
            {rest.map(l => <Row key={l.code} code={l.code} googleName={l.name} current={current} onPick={pick} />)}
            {q && suggested.length === 0 && rest.length === 0 && (
              <p className="px-2.5 py-3 text-center text-xs text-[var(--muted)]">No languages match “{query}”.</p>
            )}
          </div>

          <p className="mt-1.5 border-t border-[var(--border)] px-2.5 pt-2 pb-1 text-[11px] leading-snug text-[var(--muted)]">
            Translated by Google, so page text is sent to Google. Translations can contain mistakes.
          </p>
        </div>
      )}
    </span>
  )
}
