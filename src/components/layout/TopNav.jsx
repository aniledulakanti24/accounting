import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronDown, TreePine, Bell, HelpCircle, Search } from 'lucide-react'
import { cn } from '../../lib/cn'
import sections from '../../config/sections'
import CompanySwitcher from './CompanySwitcher'

const ALWAYS_VISIBLE = 7
const PINNED_TOP_IDS = ['settings']

export default function TopNav({ onSearch }) {
  const navigate   = useNavigate()
  const location   = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef    = useRef(null)

  const activeSectionId = location.pathname.split('/')[1] || 'dashboard'

  function goTo(section) {
    setMoreOpen(false)
    navigate(`/${section.id}/${section.tabs[0].id}`)
  }

  // Close More on outside click
  useEffect(() => {
    function handler(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false)
    }
    if (moreOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [moreOpen])

  const pinned = PINNED_TOP_IDS
    .map((id) => sections.find((section) => section.id === id))
    .filter(Boolean)
  const nonPinned = sections.filter((section) => !PINNED_TOP_IDS.includes(section.id))
  const primary = [
    ...nonPinned.slice(0, Math.max(0, ALWAYS_VISIBLE - pinned.length)),
    ...pinned,
  ]
  const primaryIds = new Set(primary.map((section) => section.id))
  const overflow = sections.filter((section) => !primaryIds.has(section.id))

  return (
    <nav
      className="flex items-center h-12 px-4 gap-0.5 flex-shrink-0"
      style={{ background: 'var(--nav)' }}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-[var(--primary)] flex items-center justify-center">
          <TreePine size={15} className="text-white" strokeWidth={2} />
        </div>
        <span className="text-sm font-bold text-white hidden lg:block tracking-tight">
          UnifiedTree
        </span>
        <span className="text-xs text-[var(--nav-text)] hidden lg:block font-medium opacity-60">
          · Accounting
        </span>
      </div>

      {/* Primary nav items */}
      <div className="flex items-center gap-0.5 flex-1 min-w-0 overflow-hidden">
        {primary.map((section) => {
          const Icon    = section.icon
          const active  = activeSectionId === section.id
          return (
            <button
              key={section.id}
              onClick={() => goTo(section)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap',
                active
                  ? 'bg-[var(--nav-2)] text-[var(--nav-active)]'
                  : 'text-[var(--nav-text)] hover:bg-[var(--nav-2)] hover:text-white'
              )}
            >
              <Icon size={14} strokeWidth={active ? 2 : 1.75} />
              <span className="hidden xl:block">{section.label}</span>
            </button>
          )
        })}

        {/* More */}
        {overflow.length > 0 && (
          <div ref={moreRef} className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={cn(
                'flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium transition-all duration-150',
                overflow.some(s => s.id === activeSectionId)
                  ? 'bg-[var(--nav-2)] text-white'
                  : 'text-[var(--nav-text)] hover:bg-[var(--nav-2)] hover:text-white',
                moreOpen && 'bg-[var(--nav-2)] text-white'
              )}
            >
              More
              <ChevronDown size={12} className={cn('transition-transform duration-150', moreOpen && 'rotate-180')} />
            </button>

            {moreOpen && (
              <div className="absolute top-full left-0 mt-1.5 z-30 w-[860px] max-w-[calc(100vw-2rem)] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">More Modules</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 max-h-[70vh] overflow-y-auto p-2">
                  {overflow.map((section) => {
                    const Icon   = section.icon
                    const active = activeSectionId === section.id
                    return (
                      <div key={section.id} className="rounded-[var(--radius-sm)] p-2">
                        <button
                          onClick={() => goTo(section)}
                          className={cn(
                            'w-full flex items-center gap-2 px-2 py-2 text-sm text-left rounded-[var(--radius-sm)] transition-colors',
                            active
                              ? 'bg-[var(--primary-tint)] text-[var(--primary)] font-semibold'
                              : 'text-[var(--text)] hover:bg-[var(--surface-2)]'
                          )}
                        >
                          <Icon size={15} strokeWidth={1.75} />
                          {section.label}
                        </button>
                        <div className="mt-1 pl-7 space-y-0.5">
                          {section.tabs.map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => {
                                setMoreOpen(false)
                                navigate(`/${section.id}/${tab.id}`)
                              }}
                              className="block w-full truncate rounded-md px-2 py-1.5 text-left text-xs text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
        <button onClick={onSearch}
          className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs text-[var(--nav-text)] hover:bg-[var(--nav-2)] hover:text-white transition-colors"
          aria-label="Search (Ctrl+K)">
          <Search size={14} />
          <span className="hidden lg:block opacity-60">Search</span>
          <kbd className="hidden lg:block text-[9px] bg-[var(--nav-2)] px-1 py-0.5 rounded opacity-60">⌘K</kbd>
        </button>
        <button className="p-2 rounded-lg text-[var(--nav-text)] hover:bg-[var(--nav-2)] hover:text-white transition-colors" aria-label="Help">
          <HelpCircle size={15} />
        </button>
        <button className="p-2 rounded-lg text-[var(--nav-text)] hover:bg-[var(--nav-2)] hover:text-white transition-colors" aria-label="Notifications">
          <Bell size={15} />
        </button>
        <div className="w-px h-5 bg-[var(--nav-2)] mx-1" />
        <CompanySwitcher />
      </div>
    </nav>
  )
}
