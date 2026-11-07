import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, ChevronRight, User, UserCog, ShieldCheck, Lock, Fingerprint, Code2, Plug,
  Building2, SlidersHorizontal, CalendarDays, BellDot, ScrollText, Sun, Moon, LogOut, Compass, Palette,
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useCan } from '../../hooks/useCan'
import { api } from '../../data/api/client'

const AVATAR_COLORS = { 'Super Admin': '#9d3a6b', 'Finance Lead': '#0f766e', 'Senior Accountant': '#2f5d8a', Accountant: '#7c5c1e', 'CA / Auditor': '#5b3fa6', 'Viewer (Branch)': '#475569' }
const initialsOf = name => (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()

/* Administration links — the same places the CRM's account panel leads to */
const ADMIN_ITEMS = [
  { to: '/settings/access-control?view=people', icon: UserCog, title: 'Users & roles', hint: 'Add people and set their roles' },
  { to: '/settings/access-control', icon: ShieldCheck, title: 'Access control', hint: 'What each role and person can see and do' },
  { to: '/settings/backup-security', icon: Lock, title: 'Backup & security', hint: 'Backups, export, 2FA, sessions, data region' },
  { to: '/settings/audit-trail', icon: Fingerprint, title: 'Audit log', hint: 'Every change, by everyone — tamper-proof' },
  { to: '/settings/apps', icon: Plug, title: 'App marketplace', hint: 'Shop, payments, CRM, messaging, payroll' },
  { to: '/settings/developer', icon: Code2, title: 'Developer & API', hint: 'API keys, webhooks and API reference' },
  { to: '/settings/company-profile', icon: Building2, title: 'Company profile', hint: 'Name, tax IDs, address and logo' },
  { to: '/settings/configuration', icon: SlidersHorizontal, title: 'Configuration', hint: 'Numbering, approvals and defaults' },
  { to: '/settings/fiscal-periods', icon: CalendarDays, title: 'Fiscal periods', hint: 'Financial year and period close' },
  { to: '/settings/notifications', icon: BellDot, title: 'Notifications', hint: 'Email, WhatsApp and in-app alerts' },
  { to: '/settings/audit-logs', icon: ScrollText, title: 'Activity log', hint: 'Recent activity in the app' },
]

const ACCENTS = [['emerald', 'Emerald', '#0f766e'], ['cobalt', 'Cobalt', '#2563eb'], ['onyx', 'Onyx', '#334155']]

function Row({ icon: Icon, title, hint, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border-0 bg-transparent px-3 py-2.5 text-left hover:bg-[var(--surface-2)] cursor-pointer">
      <Icon size={17} className="shrink-0 text-[var(--muted)]" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-[var(--text)]">{title}</span>
        {hint && <span className="block truncate text-xs text-[var(--muted)]">{hint}</span>}
      </span>
      <ChevronRight size={15} className="rtl-flip text-[var(--muted)]" />
    </button>
  )
}

/**
 * Signed-in person chip (bottom of the side menu) and the "Your account" panel:
 * profile card, administration shortcuts, preferences, theme and log out.
 */
export default function AccountPanel({ collapsed = false, navWidth = 252 }) {
  const navigate = useNavigate()
  const session = useAppStore(s => s.session)
  const company = useAppStore(s => s.activeCompany)
  const clearSession = useAppStore(s => s.clearSession)
  const theme = useAppStore(s => s.theme)
  const setTheme = useAppStore(s => s.setTheme)
  const accent = useAppStore(s => s.accentTheme)
  const setAccent = useAppStore(s => s.setAccentTheme)
  const can = useCan()
  const [open, setOpen] = useState(false)
  const user = session?.user
  const role = can.role ?? user?.role
  const isAdmin = can('view', 'settings')
  const systemDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && systemDark)

  useEffect(() => {
    if (!open) return undefined
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Let other parts of the app (e.g. the tour) open the panel
  useEffect(() => {
    const openPanel = () => setOpen(true)
    window.addEventListener('ut:open-account', openPanel)
    return () => window.removeEventListener('ut:open-account', openPanel)
  }, [])

  if (!user) return null
  const go = to => { setOpen(false); navigate(to) }

  async function signOut() {
    try { await api.post('/auth/logout') } catch { /* already signed out */ }
    setOpen(false)
    clearSession()
    navigate('/login', { replace: true })
  }

  const avatar = (size = 34, text = 12) => (
    <span className="flex shrink-0 items-center justify-center rounded-full font-bold text-white" style={{ width: size, height: size, fontSize: text, background: AVATAR_COLORS[role] ?? '#475569' }}>
      {initialsOf(user.name)}
    </span>
  )

  return (
    <>
      <button type="button" data-tour="account" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={`Your account: ${user.name}`}
        title={collapsed ? `${user.name} · ${role}` : undefined}
        className={`flex w-full items-center gap-2.5 rounded-lg border-0 text-left hover:bg-white/10 cursor-pointer ${collapsed ? 'justify-center p-1.5' : 'px-2.5 py-2'}`}
        style={{ background: open ? 'var(--nav-2)' : 'transparent', color: 'var(--nav-text)' }}>
        {avatar(30, 11)}
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-white">{user.name}</span>
              <span className="block truncate text-[11.5px] text-[var(--nav-text-2)]">{role}</span>
            </span>
            <ChevronRight size={15} className="rtl-flip text-[var(--nav-text-2)]" />
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[940] bg-black/25" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside role="dialog" aria-label="Your account"
            className="fixed top-0 bottom-0 z-[950] flex w-[400px] max-w-[calc(100vw-16px)] flex-col border-e border-[var(--border)] bg-[var(--surface)] shadow-2xl"
            style={{ insetInlineStart: navWidth, animation: 'utAccountIn 180ms cubic-bezier(0.16,1,0.3,1) both' }}>
            <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">Your account</h2>
                <p className="text-sm text-[var(--muted)]">Profile, settings and preferences</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded-md border-0 bg-transparent p-1 text-[var(--muted)] hover:bg-[var(--surface-2)] cursor-pointer"><X size={18} /></button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="rounded-xl bg-[var(--primary-tint)] p-4">
                <div className="flex items-center gap-3">
                  {avatar(52, 17)}
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-[var(--text)]">{user.name}</p>
                    <p className="truncate text-sm text-[var(--muted)]">{user.title}</p>
                    <p className="truncate text-sm text-[var(--muted)]">{company?.name ?? 'UnifiedTree'} · {role}</p>
                  </div>
                </div>
                <button type="button" onClick={() => go('/settings/profile')}
                  className="mt-3 flex w-full items-center gap-2 rounded-lg border-0 bg-[var(--surface)] px-3 py-2.5 text-sm font-semibold text-[var(--text)] shadow-sm hover:shadow cursor-pointer">
                  <User size={16} /> <span className="flex-1 text-left">View my profile</span> <ChevronRight size={15} className="rtl-flip" />
                </button>
              </div>

              {isAdmin && (
                <>
                  <p className="mb-1 mt-5 px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Administration</p>
                  {ADMIN_ITEMS.map(item => <Row key={item.to} {...item} onClick={() => go(item.to)} />)}
                </>
              )}

              <p className="mb-1 mt-5 px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Preferences</p>
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Palette size={17} className="text-[var(--muted)]" />
                <span className="flex-1 text-sm font-medium text-[var(--text)]">Accent colour</span>
                {ACCENTS.map(([id, label, color]) => (
                  <button key={id} type="button" title={label} aria-label={label} aria-pressed={accent === id} onClick={() => setAccent(id)}
                    className="h-6 w-6 rounded-full border-2 cursor-pointer" style={{ background: color, borderColor: accent === id ? 'var(--text)' : 'transparent' }} />
                ))}
              </div>
              <Row icon={Compass} title="Take the tour" hint="A 30-second look around" onClick={() => { setOpen(false); window.dispatchEvent(new Event('ut:start-tour')) }} />
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3">
              <div className="flex rounded-lg bg-[var(--surface-2)] p-0.5">
                {[['light', 'Light', Sun], ['dark', 'Dark', Moon]].map(([id, label, Icon]) => {
                  const active = (id === 'dark') === isDark
                  return (
                    <button key={id} type="button" onClick={() => setTheme(id)} aria-pressed={active}
                      className={`flex items-center gap-1.5 rounded-md border-0 px-3 py-1.5 text-sm cursor-pointer ${active ? 'bg-[var(--surface)] font-semibold text-[var(--primary)] shadow-sm' : 'bg-transparent text-[var(--muted)]'}`}>
                      <Icon size={14} /> {label}
                    </button>
                  )
                })}
              </div>
              <button type="button" onClick={signOut} className="flex items-center gap-1.5 rounded-md border-0 bg-transparent px-2 py-1.5 text-sm font-semibold text-[var(--neg)] hover:bg-[var(--neg-tint)] cursor-pointer">
                <LogOut size={15} className="rtl-flip" /> Log out
              </button>
            </footer>
          </aside>
          <style>{'@keyframes utAccountIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: none; } }'}</style>
        </>
      )}
    </>
  )
}
