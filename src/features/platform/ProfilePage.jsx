import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Lock, LogOut, ShieldCheck, Globe2, Compass } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'
import { api } from '../../data/api/client'
import { toast } from '../../lib/toast'
import { getLanguage } from '../../i18n/languages'
import { getSectionsForCountry } from '../../config/sections'
import { Chip } from '../tax/global/shared'

const LEVEL_TONE = { none: 'muted', view: 'primary', create: 'primary', edit: 'warn', full: 'pos' }
const input = 'h-9 w-full px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]'

function Card({ id, icon: Icon, title, children }) {
  return (
    <section id={id} className="mb-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text)]"><Icon size={16} className="text-[var(--primary)]" /> {title}</h2>
      {children}
    </section>
  )
}

/** "View my profile" — who you are, your preferences, security and what you can access. */
export default function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const session = useAppStore(s => s.session)
  const access = useAppStore(s => s.access)
  const company = useAppStore(s => s.activeCompany)
  const language = useAppStore(s => s.language)
  const clearSession = useAppStore(s => s.clearSession)
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const user = session?.user
  const sections = getSectionsForCountry(company?.country || 'IN', t)

  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [location.hash])

  if (!user) return null

  function changePassword(e) {
    e.preventDefault()
    if (pw.next.length < 10) return toast.error('Use at least 10 characters')
    if (pw.next !== pw.confirm) return toast.error('The new passwords do not match')
    toast.info('Demo accounts share one password — connect your identity provider to let people change theirs')
    setPw({ current: '', next: '', confirm: '' })
    return undefined
  }

  async function signOut() {
    try { await api.post('/auth/logout') } catch { /* already signed out */ }
    clearSession()
    navigate('/login', { replace: true })
  }

  const visible = sections.filter(s => (access?.sections?.[s.id] ?? 'none') !== 'none')
  return (
    <div className="max-w-3xl">
      <PageHeader title="My profile" subtitle={`${user.email} · ${company?.name ?? ''}`} breadcrumb={[t('shell.settings'), 'My profile']} />

      <Card icon={ShieldCheck} title="Account">
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          {[['Name', user.name], ['Email', user.email], ['Role', access?.role ?? user.role], ['Title', user.title], ['Company', company?.name], ['Session ends', new Date(session.expiresAt).toLocaleString()]].map(([k, v]) => (
            <div key={k}><dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{k}</dt><dd className="text-[var(--text)]">{v}</dd></div>
          ))}
        </dl>
      </Card>

      <Card icon={Globe2} title="Preferences">
        <p className="text-sm text-[var(--text)]">Language: <strong>{getLanguage(language).name}</strong> — change it with the language button (文A) at the top of any page.</p>
        <p className="mt-1 text-sm text-[var(--muted)]">Theme and accent colour are in your account panel (bottom-left).</p>
        <Button className="mt-3" size="sm" variant="secondary" icon={Compass} onClick={() => window.dispatchEvent(new Event('ut:start-tour'))}>Take the tour again</Button>
      </Card>

      <Card id="security" icon={Lock} title="Security">
        <form onSubmit={changePassword} className="grid gap-3 sm:grid-cols-3">
          <input type="password" autoComplete="current-password" placeholder="Current password" className={input} value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} />
          <input type="password" autoComplete="new-password" placeholder="New password" className={input} value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} />
          <input type="password" autoComplete="new-password" placeholder="Confirm new password" className={input} value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} />
          <div className="sm:col-span-3 flex flex-wrap gap-2">
            <Button size="sm" variant="primary" type="submit" disabled={!pw.current || !pw.next}>Change password</Button>
            <Button size="sm" variant="ghost" icon={LogOut} onClick={signOut}>Sign out of this device</Button>
          </div>
        </form>
        <p className="mt-3 text-xs text-[var(--muted)]">Sessions expire after 12 hours. Passwords are stored only as salted SHA-256 hashes.</p>
      </Card>

      <Card icon={ShieldCheck} title="What you can access">
        <div className="flex flex-wrap gap-2">
          {visible.map(s => <Chip key={s.id} tone={LEVEL_TONE[access.sections[s.id]]} label={`${s.label} · ${access.sections[s.id]}`} />)}
          {access?.sections?.settings && access.sections.settings !== 'none' && <Chip tone={LEVEL_TONE[access.sections.settings]} label={`${t('shell.settings')} · ${access.sections.settings}`} />}
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">Set by your administrator in Access control{access?.hiddenTabs?.length ? ` · ${access.hiddenTabs.length} page(s) hidden for you` : ''}.</p>
      </Card>
    </div>
  )
}
