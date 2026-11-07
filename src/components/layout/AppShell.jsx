import { useState, useEffect, useCallback, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import SideNav              from './SideNav'
import TabPanel             from './TabPanel'
import CommandPalette       from '../ui/CommandPalette'
import KeyboardShortcutsModal from '../ui/KeyboardShortcutsModal'
import ToastContainer       from '../ui/Toast'
import AIAssistantPanel     from '../ai/AIAssistantPanel'
import NotificationsPanel   from '../notifications/NotificationsPanel'
import HelpPanel            from '../help/HelpPanel'
import GuidedTour           from './GuidedTour'
import { useAppStore }      from '../../store/useAppStore'

/**
 * AppShell — root layout shell.
 *
 * Panels managed here (single source of truth for open/close):
 *  • Command palette     — Ctrl+K
 *  • Keyboard shortcuts  — ?
 *  • AI assistant        — Ctrl+Shift+A  |  floating "Ask AI" button
 *  • Notifications       — Bell icon in the top bar
 *  • Help                — Help icon in the top bar
 */
export default function AppShell() {
  const location = useLocation()
  const activeCompanyKey = useAppStore(s => `${s.activeCompany?.id}-${s.activeCompany?.country}-${s.activeCompany?.currency}-${s.language}`)
  const navigate = useNavigate()
  const userId = useAppStore(s => s.session?.user?.id)

  const [paletteOpen, setPaletteOpen]  = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [aiOpen,      setAiOpen]       = useState(false)
  const [notiOpen,    setNotiOpen]     = useState(false)
  const [helpOpen,    setHelpOpen]     = useState(false)

  const pendingKeyRef = useRef(null)
  const pendingTimerRef = useRef(null)

  // Ensure only one right panel open at a time
  function openAI()    { setAiOpen(true);   setNotiOpen(false); setHelpOpen(false) }
  function openNoti()  { setNotiOpen(true);  setAiOpen(false);  setHelpOpen(false) }
  function openHelp()  { setHelpOpen(true);  setAiOpen(false);  setNotiOpen(false) }

  const openPalette  = useCallback(() => setPaletteOpen(true),  [])
  const closePalette = useCallback(() => setPaletteOpen(false), [])

  // Keyboard shortcuts & ergonomics
  useEffect(() => {
    const handler = (e) => {
      const activeEl = document.activeElement
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setPaletteOpen(prev => !prev)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toUpperCase() === 'A') {
        e.preventDefault(); setAiOpen(prev => !prev)
        return
      }

      if (e.key === 'Escape') {
        setPaletteOpen(false); setShortcutsOpen(false)
        setAiOpen(false); setNotiOpen(false); setHelpOpen(false)
        pendingKeyRef.current = null
        return
      }

      if (isInput) return

      // Toggle shortcuts modal on '?'
      if (e.key === '?') {
        e.preventDefault()
        setShortcutsOpen(prev => !prev)
        return
      }

      const key = e.key.toLowerCase()

      // Jump Sequences (e.g. g -> d, s, r, p, b, t, m)
      if (pendingKeyRef.current === 'g') {
        clearTimeout(pendingTimerRef.current)
        pendingKeyRef.current = null

        const routes = {
          d: '/dashboard/overview',
          s: '/sales/sales-invoices',
          r: '/receivables/money-in-center',
          p: '/procurement/purchase-orders',
          b: '/cashbank/bank-accounts',
          t: '/tax/gst-returns',
          m: '/masters/tax-masters',
        }

        if (routes[key]) {
          e.preventDefault()
          navigate(routes[key])
        }
        return
      }

      if (key === 'g') {
        pendingKeyRef.current = 'g'
        clearTimeout(pendingTimerRef.current)
        pendingTimerRef.current = setTimeout(() => {
          pendingKeyRef.current = null
        }, 1200)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])


  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      {/* ── Left sidebar ── */}
      <SideNav />

      {/* ── Right column ── */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <TabPanel onSearch={openPalette} onAsk={openAI} onNotifications={openNoti} onHelp={openHelp} />

        <main className="ut-main" style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          background: 'var(--bg)',
        }}>
          {/* Re-mount the page when the company (and so currency, tax regime, FY) changes */}
          <div key={`${location.key}-${activeCompanyKey}`} className="page-enter" style={{ padding: "22px 24px 48px" }}>
            <Outlet />
          </div>
        </main>

      </div>

      {/* ── Right panels (mutually exclusive) ── */}
      <AIAssistantPanel   open={aiOpen}   onClose={() => setAiOpen(false)}   />
      <NotificationsPanel open={notiOpen} onClose={() => setNotiOpen(false)} />
      <HelpPanel          open={helpOpen} onClose={() => setHelpOpen(false)} onOpenAI={openAI} />

      {/* ── Command palette & Shortcuts ── */}
      <CommandPalette open={paletteOpen} onClose={closePalette} />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />


      {/* ── First-login guided tour ── */}
      <GuidedTour key={userId} />

      {/* ── Toast notifications ── */}
      <ToastContainer />
    </div>
  )
}
