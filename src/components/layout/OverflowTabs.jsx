import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

const MORE_WIDTH = 96
const GAP = 4

/**
 * Sub-page tabs as clean pills. Tabs that don't fit the width move into a
 * "More" menu; the active tab is always kept visible.
 */
export default function OverflowTabs({ tabs, activeId, onSelect }) {
  const wrapRef = useRef(null)
  const measureRef = useRef(null)
  const menuRef = useRef(null)
  const [fit, setFit] = useState(tabs.length)
  const [open, setOpen] = useState(false)

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const measure = measureRef.current
    if (!wrap || !measure) return undefined
    const compute = () => {
      const widths = [...measure.children].map(el => el.getBoundingClientRect().width)
      const available = wrap.clientWidth
      const total = widths.reduce((s, w) => s + w + GAP, 0)
      if (total <= available) { setFit(tabs.length); return }
      let used = MORE_WIDTH
      let count = 0
      for (const w of widths) {
        if (used + w + GAP > available) break
        used += w + GAP
        count++
      }
      setFit(Math.max(1, count))
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [tabs])

  useEffect(() => {
    if (!open) return undefined
    const close = e => { if (!menuRef.current?.contains(e.target)) setOpen(false) }
    const esc = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [open])

  // Keep the active tab in the visible row (swap it into the last slot if needed)
  let visible = tabs.slice(0, fit)
  let overflow = tabs.slice(fit)
  const activeInOverflow = overflow.find(t => t.id === activeId)
  if (activeInOverflow && visible.length) {
    const bumped = visible[visible.length - 1]
    visible = [...visible.slice(0, -1), activeInOverflow]
    overflow = [bumped, ...overflow.filter(t => t.id !== activeId)]
  }

  const pill = active => [
    'whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer border',
    active
      ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm'
      : 'bg-transparent text-[var(--muted)] border-transparent hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
  ].join(' ')

  return (
    <div ref={wrapRef} className="relative px-5 pt-2.5 pb-2.5">
      {/* Off-screen copy used to measure every tab's width */}
      <div ref={measureRef} aria-hidden="true" className="pointer-events-none invisible absolute left-0 top-0 flex gap-1 whitespace-nowrap">
        {tabs.map(t => <span key={t.id} className={pill(false)}>{t.label}</span>)}
      </div>

      <div className="flex items-center gap-1" role="tablist">
        {visible.map(t => (
          <button key={t.id} type="button" role="tab" aria-selected={t.id === activeId} onClick={() => onSelect(t.id)} className={pill(t.id === activeId)}>
            {t.label}
          </button>
        ))}

        {overflow.length > 0 && (
          <div ref={menuRef} className="relative">
            <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}
              className={`${pill(false)} inline-flex items-center gap-1 !border-[var(--border)]`}>
              More <span className="rounded-full bg-[var(--surface-2)] px-1.5 text-[11px] tabular">{overflow.length}</span> <ChevronDown size={13} />
            </button>
            {open && (
              <div role="menu" className="absolute end-0 top-full z-[950] mt-1.5 w-60 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-1.5" style={{ boxShadow: '0 12px 32px rgba(16,32,28,0.16)' }}>
                {overflow.map(t => (
                  <button key={t.id} type="button" role="menuitem" onClick={() => { onSelect(t.id); setOpen(false) }}
                    className="flex w-full items-center gap-2 rounded-[7px] border-0 bg-transparent px-2.5 py-2 text-left text-[13px] text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer">
                    <span className="flex-1 truncate">{t.label}</span>
                    {t.id === activeId && <Check size={14} className="text-[var(--primary)]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
