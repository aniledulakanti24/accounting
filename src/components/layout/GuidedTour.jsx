import { useEffect, useLayoutEffect, useState } from 'react'
import { Compass, X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

/* Each step points at an element tagged with data-tour="…" */
const STEPS = [
  { target: 'search', title: 'Find anything', text: 'Search every invoice, party, item and page, or run a command. Press Ctrl K from anywhere.' },
  { target: 'create', title: 'Create in one click', text: 'Add an invoice, bill, payment, party or item from any page.' },
  { target: 'menu', title: 'Your menu', text: 'Every page you can use, grouped by area — only what your administrator has given you. Star a page to pin it to the top.' },
  { target: 'country', title: 'Country and tax', text: 'Switch the tax country — currency, tax rules and the financial year follow it.' },
  { target: 'language', title: 'Your language', text: 'Use UnifiedTree in any of 133 languages, including right-to-left ones.' },
  { target: 'help', title: 'Help is always here', text: 'See tips for the page you are on, all keyboard shortcuts and the AI assistant.' },
  { target: 'account', title: 'Your account', text: 'Your profile, theme and this tour. Admins also find users, roles and access control here.' },
]

const CARD_W = 320
const CARD_H = 190
const GAP = 16

const doneKey = id => `ut-tour-done:${id}`
function isDone(id) { try { return localStorage.getItem(doneKey(id)) === '1' } catch { return true } }
function markDone(id) { try { localStorage.setItem(doneKey(id), '1') } catch { /* private mode */ } }
const findTarget = name => document.querySelector(`[data-tour="${name}"]`)

/** Place the card next to the highlighted element, inside the window. */
function cardPosition(r) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const clamp = (v, min, max) => Math.max(min, Math.min(v, max))
  if (r.right + GAP + CARD_W < vw) return { left: r.right + GAP, top: clamp(r.top, GAP, vh - CARD_H - GAP) }
  if (r.bottom + GAP + CARD_H < vh) return { top: r.bottom + GAP, left: clamp(r.left, GAP, vw - CARD_W - GAP) }
  if (r.top - GAP - CARD_H > 0) return { top: r.top - GAP - CARD_H, left: clamp(r.right - CARD_W, GAP, vw - CARD_W - GAP) }
  return { left: clamp(r.left - GAP - CARD_W, GAP, vw - CARD_W - GAP), top: clamp(r.top, GAP, vh - CARD_H - GAP) }
}

/**
 * First-login tour: a welcome card, then a spotlight on each part of the screen.
 * Shown once per person; "Take the tour" in the account panel starts it again.
 */
export default function GuidedTour() {
  const user = useAppStore(s => s.session?.user)
  const [phase, setPhase] = useState(() => (user && !isDone(user.id) ? 'welcome' : null))
  const [steps, setSteps] = useState(STEPS)
  const [rect, setRect] = useState(null)
  const step = typeof phase === 'number' ? steps[phase] : null

  // Restart from the account panel / profile page
  useEffect(() => {
    const start = () => setPhase('welcome')
    window.addEventListener('ut:start-tour', start)
    return () => window.removeEventListener('ut:start-tour', start)
  }, [])

  // Track the highlighted element's position (it can move when the window resizes)
  useLayoutEffect(() => {
    if (!step) return undefined
    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = findTarget(step.target)
        setRect(el ? el.getBoundingClientRect() : null)
      })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', measure) }
  }, [step])

  function finish() {
    if (user) markDone(user.id)
    setPhase(null)
    setRect(null)
  }
  function begin() {
    // Skip steps whose element is not on screen for this person (e.g. hidden by access rules)
    const available = STEPS.filter(s => findTarget(s.target))
    if (!available.length) return finish()
    setSteps(available)
    setPhase(0)
    return undefined
  }
  const next = () => (phase + 1 < steps.length ? setPhase(phase + 1) : finish())
  const back = () => phase > 0 && setPhase(phase - 1)

  useEffect(() => {
    if (phase === null) return undefined
    const onKey = e => {
      if (e.key === 'Escape') { e.stopPropagation(); finish() }
      if (typeof phase === 'number' && e.key === 'ArrowRight') next()
      if (typeof phase === 'number' && e.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })

  if (!user || phase === null) return null

  const btn = 'h-8 rounded-lg px-3.5 text-sm font-semibold cursor-pointer border'
  const primary = `${btn} border-[var(--primary)] bg-[var(--primary)] text-white hover:opacity-90`
  const quiet = `${btn} border-transparent bg-transparent text-[var(--muted)] hover:text-[var(--text)]`
  const outline = `${btn} border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]`

  if (phase === 'welcome') {
    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="ut-tour-welcome">
        <div className="w-full max-w-sm rounded-2xl bg-[var(--surface)] p-6 text-center shadow-2xl" style={{ animation: 'utTourIn 200ms cubic-bezier(0.16,1,0.3,1) both' }}>
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-tint)] text-[var(--primary)]"><Compass size={24} /></span>
          <h2 id="ut-tour-welcome" className="text-lg font-bold text-[var(--text)]">Welcome, {user.name.split(' ')[0]}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">A quick look around takes about 30 seconds.</p>
          <div className="mt-5 flex justify-center gap-2">
            <button type="button" className={outline} onClick={finish}>Skip</button>
            <button type="button" className={primary} onClick={begin} autoFocus>Show me around</button>
          </div>
        </div>
        <style>{TOUR_CSS}</style>
      </div>
    )
  }

  const pad = 6
  const hole = rect && { left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
  const pos = rect ? cardPosition(rect) : { left: (window.innerWidth - CARD_W) / 2, top: (window.innerHeight - CARD_H) / 2 }
  return (
    <div className="fixed inset-0 z-[2000]" role="dialog" aria-modal="true" aria-labelledby="ut-tour-title">
      {hole
        ? <div className="pointer-events-none fixed rounded-xl transition-all duration-200" style={{ ...hole, boxShadow: '0 0 0 3px var(--primary), 0 0 0 9999px rgba(8,20,16,0.58)' }} />
        : <div className="fixed inset-0 bg-black/55" />}
      <div key={phase} className="fixed rounded-xl bg-[var(--surface)] p-4 shadow-2xl" style={{ width: CARD_W, ...pos, animation: 'utTourIn 180ms cubic-bezier(0.16,1,0.3,1) both' }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">Step {phase + 1} of {steps.length}</span>
          <button type="button" aria-label="Close tour" onClick={finish} className="rounded-md border-0 bg-transparent p-0.5 text-[var(--muted)] hover:bg-[var(--surface-2)] cursor-pointer"><X size={16} /></button>
        </div>
        <h3 id="ut-tour-title" className="mt-1.5 text-base font-bold text-[var(--text)]">{step.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{step.text}</p>
        <div className="mt-4 flex items-center gap-1">
          {steps.map((s, i) => <span key={s.target} className="h-1.5 rounded-full transition-all" style={{ width: i === phase ? 16 : 6, background: i === phase ? 'var(--primary)' : 'var(--border)' }} />)}
          <span className="flex-1" />
          <button type="button" className={quiet} onClick={finish}>Skip</button>
          {phase > 0 && <button type="button" className={outline} onClick={back}>Back</button>}
          <button type="button" className={primary} onClick={next} autoFocus>{phase + 1 === steps.length ? 'Done' : 'Next'}</button>
        </div>
      </div>
      <style>{TOUR_CSS}</style>
    </div>
  )
}

const TOUR_CSS = '@keyframes utTourIn { from { opacity: 0; transform: translateY(6px) scale(0.98); } to { opacity: 1; transform: none; } }'
