import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { ChevronRight, ShieldCheck, Users, UserCog, RotateCcw, Save, Settings as SettingsIcon } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { api } from '../../data/api/client'
import { toast } from '../../lib/toast'
import { getSectionsForCountry } from '../../config/sections'
import { useAppStore } from '../../store/useAppStore'
import { useCan } from '../../hooks/useCan'
import { ErrorBox } from '../tax/global/shared'

const LEVEL_LABELS = { none: 'No access', view: 'View', create: 'Create', edit: 'Edit', full: 'Full' }
const LEVEL_HINT = { none: 'Hidden', view: 'Can look', create: 'Can add', edit: 'Can change', full: 'Can delete & approve' }
const LEVELS = ['none', 'view', 'create', 'edit', 'full']
const GROUPS = [
  ['Overview', ['dashboard']],
  ['Day-to-day', ['parties', 'inventory', 'sales', 'procurement', 'receivables', 'payables', 'expenses', 'cashbank']],
  ['Finance', ['tax', 'reports']],
  ['Advanced', ['masters', 'assets', 'business-tools', 'storage', 'alerts', 'migration', 'advanced-features']],
]
const AVATAR = ['#9d3a6b', '#0f766e', '#2f5d8a', '#7c5c1e', '#5b3fa6', '#475569']
const initials = n => n.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
const clone = o => JSON.parse(JSON.stringify(o ?? {}))

function LevelPicker({ value, inherited, onChange, disabled }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {inherited !== undefined && (
        <button type="button" disabled={disabled} onClick={() => onChange(undefined)}
          className={`rounded-full border px-2.5 py-1 text-[11px] cursor-pointer ${value === undefined ? 'border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--primary)] font-semibold' : 'border-[var(--border)] text-[var(--muted)]'}`}>
          Role: {LEVEL_LABELS[inherited]}
        </button>
      )}
      {LEVELS.map(l => (
        <button key={l} type="button" disabled={disabled} title={LEVEL_HINT[l]} onClick={() => onChange(l)}
          className={`rounded-full border px-2.5 py-1 text-[11px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${value === l ? (l === 'none' ? 'border-[var(--neg)] bg-[var(--neg-tint)] text-[var(--neg)] font-semibold' : 'border-[var(--primary)] bg-[var(--primary)] text-white font-semibold') : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'}`}>
          {LEVEL_LABELS[l]}
        </button>
      ))}
    </div>
  )
}

export default function AccessControl() {
  const { t } = useTranslation()
  const country = useAppStore(s => s.activeCompany?.country || 'IN')
  const session = useAppStore(s => s.session)
  const setAccess = useAppStore(s => s.setAccess)
  const can = useCan()
  const canEdit = can.level('settings') === 'full'
  const sections = useMemo(() => getSectionsForCountry(country, t), [country, t])
  const byId = useMemo(() => Object.fromEntries(sections.map(s => [s.id, s])), [sections])

  const [server, setServer] = useState(null)
  const [error, setError] = useState(null)
  const [draft, setDraft] = useState({ roles: {}, users: {} })
  const [params] = useSearchParams()
  const startPeople = params.get('view') === 'people'
  const [mode, setMode] = useState(startPeople ? 'people' : 'roles')
  const [subject, setSubject] = useState(startPeople ? 'U4' : 'Accountant')
  const [open, setOpen] = useState(() => new Set())
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const p = await api.get('/access/policy')
      setServer(p)
      setDraft({
        roles: Object.fromEntries(p.roles.map(r => [r.role, clone(r.grant)])),
        users: Object.fromEntries(p.users.map(u => [u.id, clone(u.overrides)])),
      })
      setError(null)
    } catch (err) { setError(err) }
  }
  useEffect(() => {
    let cancelled = false
    api.get('/access/policy').then(p => {
      if (cancelled) return
      setServer(p)
      setDraft({
        roles: Object.fromEntries(p.roles.map(r => [r.role, clone(r.grant)])),
        users: Object.fromEntries(p.users.map(u => [u.id, clone(u.overrides)])),
      })
    }, err => { if (!cancelled) setError(err) })
    return () => { cancelled = true }
  }, [])

  const roles = server?.roles ?? []
  const users = server?.users ?? []
  const userInfo = users.find(u => u.id === subject)
  const userRole = userInfo ? (draft.users[userInfo.id]?.role ?? userInfo.baseRole) : null

  // Effective level for the role the person currently has (including unsaved role edits)
  const roleLevel = (role, sectionId) => draft.roles[role]?.sections?.[sectionId] ?? roles.find(r => r.role === role)?.effective.sections[sectionId] ?? 'none'
  const roleHidden = role => new Set(draft.roles[role]?.hiddenTabs ?? [])

  const dirty = server && JSON.stringify(draft) !== JSON.stringify({
    roles: Object.fromEntries(roles.map(r => [r.role, clone(r.grant)])),
    users: Object.fromEntries(users.map(u => [u.id, clone(u.overrides)])),
  })

  function updateRole(role, fn) {
    setDraft(d => { const next = clone(d); next.roles[role] ??= {}; next.roles[role].sections ??= {}; next.roles[role].hiddenTabs ??= []; fn(next.roles[role]); return next })
  }
  function updateUser(id, fn) {
    setDraft(d => { const next = clone(d); next.users[id] ??= {}; fn(next.users[id]); return next })
  }

  async function save() {
    setSaving(true)
    try {
      const body = { roles: draft.roles, users: Object.fromEntries(Object.entries(draft.users).filter(([, v]) => v && Object.keys(v).length)) }
      await api.put('/access/policy', body)
      toast.success('Access saved — changes apply immediately and are enforced by the server')
      await load()
      setAccess(await api.get('/access/me'))
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }

  const toggleOpen = id => setOpen(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })

  function sectionRow(sectionId) {
    const isSettings = sectionId === 'settings'
    const section = isSettings ? { id: 'settings', label: t('shell.settings'), icon: SettingsIcon, tabs: [] } : byId[sectionId]
    if (!section) return null
    const Icon = section.icon
    const lockedOwner = mode === 'roles' && subject === 'Super Admin' && isSettings

    let level, inherited, hidden, tabsInherited
    if (mode === 'roles') {
      level = roleLevel(subject, sectionId)
      hidden = roleHidden(subject)
    } else {
      const own = draft.users[subject] ?? {}
      inherited = roleLevel(userRole, sectionId)
      level = own.sections?.[sectionId]
      tabsInherited = own.inheritTabs !== false
      hidden = tabsInherited ? roleHidden(userRole) : new Set(own.hiddenTabs ?? [])
    }
    const effective = level ?? inherited
    const expanded = open.has(sectionId)

    return (
      <div key={sectionId} className="border-t border-[var(--border)] first:border-t-0">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <button type="button" onClick={() => section.tabs.length && toggleOpen(sectionId)} disabled={!section.tabs.length}
            className="flex min-w-[200px] flex-1 items-center gap-2.5 border-0 bg-transparent text-left cursor-pointer disabled:cursor-default">
            {section.tabs.length > 0
              ? <ChevronRight size={14} className="rtl-flip text-[var(--muted)]" style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 150ms' }} />
              : <span className="w-[14px]" />}
            <Icon size={16} className="text-[var(--primary)]" />
            <span className="text-sm font-medium text-[var(--text)]">{section.label}</span>
            {section.tabs.length > 0 && (
              <span className="text-xs text-[var(--muted)]">{section.tabs.filter(tb => !hidden.has(`${sectionId}/${tb.id}`)).length}/{section.tabs.length} pages</span>
            )}
          </button>
          <LevelPicker value={level} inherited={mode === 'people' ? inherited : undefined} disabled={!canEdit || lockedOwner}
            onChange={l => mode === 'roles'
              ? updateRole(subject, g => { g.sections[sectionId] = l })
              : updateUser(subject, g => { g.sections ??= {}; if (l === undefined) delete g.sections[sectionId]; else g.sections[sectionId] = l })} />
        </div>
        {expanded && section.tabs.length > 0 && (
          <div className="bg-[var(--surface-2)] px-4 py-3 ps-14">
            {mode === 'people' && (
              <label className="mb-2 flex items-center gap-2 text-xs text-[var(--muted)] cursor-pointer">
                <input type="checkbox" disabled={!canEdit} checked={tabsInherited}
                  onChange={e => updateUser(subject, g => { if (e.target.checked) { delete g.inheritTabs; delete g.hiddenTabs } else { g.inheritTabs = false; g.hiddenTabs = [...roleHidden(userRole)] } })} />
                Use the pages chosen for the {userRole} role
              </label>
            )}
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {section.tabs.map(tab => {
                const key = `${sectionId}/${tab.id}`
                const checked = !hidden.has(key)
                const disabled = !canEdit || effective === 'none' || (mode === 'people' && tabsInherited)
                return (
                  <label key={tab.id} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${disabled ? 'opacity-60' : 'cursor-pointer hover:bg-[var(--surface)]'}`}>
                    <input type="checkbox" checked={checked && effective !== 'none'} disabled={disabled}
                      onChange={e => {
                        const visible = e.target.checked
                        const apply = g => { const set = new Set(g.hiddenTabs ?? []); if (visible) set.delete(key); else set.add(key); g.hiddenTabs = [...set] }
                        if (mode === 'roles') updateRole(subject, apply); else updateUser(subject, apply)
                      }} />
                    <span className="text-[var(--text)]">{tab.label}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="pb-20">
      <PageHeader title="Access control" subtitle="Decide which sections and pages each role and each person can see, and what they can do there. The server enforces the same rules."
        breadcrumb={[t('shell.settings'), 'Access control']} />
      <ErrorBox error={error} onRetry={load} />
      {!canEdit && server && <p className="mb-3 rounded-[var(--radius-sm)] bg-[var(--warn-tint)] p-3 text-sm text-[var(--warn)]">You can view access but only administrators with full Settings access can change it.</p>}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-2 h-fit">
          <div className="flex gap-1 mb-2">
            {[['roles', 'Roles', ShieldCheck], ['people', 'People', Users]].map(([k, l, I]) => (
              <button key={k} type="button" onClick={() => { setMode(k); setSubject(k === 'roles' ? 'Accountant' : users[3]?.id ?? users[0]?.id) }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border-0 py-1.5 text-xs font-semibold cursor-pointer ${mode === k ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-2)] text-[var(--muted)]'}`}>
                <I size={13} /> {l}
              </button>
            ))}
          </div>
          {mode === 'roles' && roles.map(r => (
            <button key={r.role} type="button" onClick={() => setSubject(r.role)}
              className={`flex w-full items-center gap-2 rounded-md border-0 px-2.5 py-2 text-left text-sm cursor-pointer ${subject === r.role ? 'bg-[var(--primary-tint)] text-[var(--primary)] font-semibold' : 'bg-transparent text-[var(--text)] hover:bg-[var(--surface-2)]'}`}>
              <ShieldCheck size={14} /> <span className="flex-1">{r.role}</span>
              <span className="text-[11px] text-[var(--muted)]">{users.filter(u => (draft.users[u.id]?.role ?? u.baseRole) === r.role).length}</span>
            </button>
          ))}
          {mode === 'people' && users.map((u, i) => (
            <button key={u.id} type="button" onClick={() => setSubject(u.id)}
              className={`flex w-full items-center gap-2 rounded-md border-0 px-2 py-1.5 text-left cursor-pointer ${subject === u.id ? 'bg-[var(--primary-tint)]' : 'bg-transparent hover:bg-[var(--surface-2)]'}`}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: AVATAR[i % AVATAR.length] }}>{initials(u.name)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-[var(--text)]">{u.name}{u.id === session?.user?.id ? ' (you)' : ''}</span>
                <span className="block truncate text-[11px] text-[var(--muted)]">{draft.users[u.id]?.role ?? u.baseRole}{draft.users[u.id] && Object.keys(draft.users[u.id]).some(k => k !== 'role') ? ' · custom' : ''}</span>
              </span>
            </button>
          ))}
        </aside>

        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-4 py-3">
            {mode === 'roles'
              ? <><ShieldCheck size={18} className="text-[var(--primary)]" /><div className="flex-1"><p className="text-sm font-bold text-[var(--text)]">{subject}</p><p className="text-xs text-[var(--muted)]">Applies to everyone with this role</p></div></>
              : userInfo && <>
                  <UserCog size={18} className="text-[var(--primary)]" />
                  <div className="flex-1"><p className="text-sm font-bold text-[var(--text)]">{userInfo.name}</p><p className="text-xs text-[var(--muted)]">{userInfo.email} · overrides apply to this person only</p></div>
                  <label className="flex items-center gap-2 text-xs text-[var(--muted)]">Role
                    <select disabled={!canEdit || userInfo.id === session?.user?.id} value={userRole}
                      onChange={e => updateUser(userInfo.id, g => { if (e.target.value === userInfo.baseRole) delete g.role; else g.role = e.target.value })}
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm text-[var(--text)]">
                      {roles.map(r => <option key={r.role}>{r.role}</option>)}
                    </select>
                  </label>
                  <Button size="sm" variant="ghost" icon={RotateCcw} disabled={!canEdit} onClick={() => updateUser(userInfo.id, g => { Object.keys(g).forEach(k => { if (k !== 'role') delete g[k] }) })}>Use role defaults</Button>
                </>}
          </div>
          {!server && !error && <p className="p-4 text-sm text-[var(--muted)]">Loading…</p>}
          {server && GROUPS.map(([label, ids]) => (
            <div key={label}>
              <p className="bg-[var(--surface-2)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
              {ids.map(sectionRow)}
            </div>
          ))}
          {server && (
            <div>
              <p className="bg-[var(--surface-2)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Administration</p>
              {sectionRow('settings')}
            </div>
          )}
        </section>
      </div>

      {dirty && (
        <div className="fixed bottom-4 start-1/2 z-[900] flex -translate-x-1/2 items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 shadow-lg rtl:translate-x-1/2">
          <span className="text-sm text-[var(--text)]">Unsaved access changes</span>
          <Button size="sm" variant="ghost" onClick={load}>Discard</Button>
          <Button size="sm" variant="primary" icon={Save} onClick={save} disabled={saving || !canEdit}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      )}
    </div>
  )
}
