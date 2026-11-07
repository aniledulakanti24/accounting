import { useEffect, useState } from 'react'
import { Check, ChevronsUpDown, MapPin, Plus, TreePine, Search, X, Briefcase } from 'lucide-react'
import { cn } from '../../lib/cn'
import { validateCompanyDraft } from '../../lib/company'
import { SUPPORTED_COUNTRIES, getCountryTaxConfig } from '../../lib/countryTax'
import { useAppStore } from '../../store/useAppStore'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

const EMPTY_COMPANY = {
  name: '',
  country: 'IN',
  legalType: 'Private Limited',
  branch: '',
  taxId: '',
  gstin: '',
  departments: 'Accounts, Sales, Finance',
  zones: 'Maharashtra, Karnataka, Delhi',
}

const DEFAULT_BRANCHES = [
  'Factory - Hyderabad',
  'Office - Hyderabad',
  'Maharashtra Branch',
  'Karnataka Branch',
  'Delhi Branch',
  'Tamil Nadu Branch',
  'Telangana Branch',
  'Gujarat Branch',
  'Uttar Pradesh Branch',
  'West Bengal Branch',
]

/* Initials avatar with a steady colour per company */
const AVATAR_TINTS = ['#0e7c66', '#2563eb', '#7c3aed', '#c2410c', '#0891b2', '#be185d', '#4d7c0f', '#475569']
function Avatar({ name = '?', size = 28 }) {
  const initials = name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
  const tint = AVATAR_TINTS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_TINTS.length]
  return <span className="flex shrink-0 items-center justify-center rounded-[8px] font-bold text-white" style={{ width: size, height: size, background: tint, fontSize: size * 0.38 }} aria-hidden="true">{initials}</span>
}

/* Country code badge (flag emoji don't render on Windows) */
function CountryCode({ code = 'IN' }) {
  return <span className="inline-flex h-[16px] items-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--surface)] px-1 text-[10px] font-bold leading-none tracking-wide text-[var(--muted)]">{code}</span>
}

/** Company switcher at the top of the side menu (CRM style); `collapsed` shows only the logo. */
export default function CompanySwitcher({ collapsed = false }) {
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState(EMPTY_COMPANY)
  const [newZone, setNewZone] = useState('')
  const [errors, setErrors] = useState({})
  const [coQuery, setCoQuery] = useState('')
  const [branchQuery, setBranchQuery] = useState('')
  const {
    companies,
    activeCompany,
    activeDepartment,
    activeZone,
    setCompanyContext,
    setActiveDepartment,
    setActiveZone,
    addCompanyZone,
    addCompany,
  } = useAppStore()

  const activeCountry = getCountryTaxConfig(activeCompany?.country || 'IN')
  const draftCountry = getCountryTaxConfig(draft.country || 'IN')

  const departments = activeCompany?.departments?.length ? activeCompany.departments : ['Accounts']
  const zones = activeCompany?.zones?.length ? activeCompany.zones : DEFAULT_BRANCHES
  const has = (text, q) => text.toLowerCase().includes(q.trim().toLowerCase())
  const shownCompanies = companies.filter(c => !coQuery.trim() || has(`${c.name} ${c.branch ?? ''} ${c.country}`, coQuery))
  const shownZones = zones.filter(z => !branchQuery.trim() || has(z, branchQuery))
  const close = () => { setOpen(false); setCoQuery(''); setBranchQuery('') }

  // Esc closes the switcher
  useEffect(() => {
    if (!open) return undefined
    const onKey = e => { if (e.key === 'Escape') { setOpen(false); setCoQuery(''); setBranchQuery('') } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const updateDraft = (field, value) => {
    setDraft((current) => {
      const next = { ...current, [field]: value }
      if (field === 'country') {
        const countryCfg = getCountryTaxConfig(value)
        next.legalType = countryCfg.legalTypes[0]
        next.zones = countryCfg.regions.slice(0, 4).join(', ')
        next.taxId = ''
        next.gstin = ''
      }
      return next
    })
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }))
    }
  }

  const openCreateCompany = () => {
    setOpen(false)
    setCreateOpen(true)
  }

  const closeCreateCompany = () => {
    setCreateOpen(false)
    setDraft(EMPTY_COMPANY)
    setErrors({})
  }

  const handleCreateCompany = (event) => {
    event.preventDefault()
    const result = validateCompanyDraft(draft)

    if (!result.valid) {
      setErrors(result.errors)
      return
    }

    addCompany(draft)
    closeCreateCompany()
  }

  function submitZone(event) {
    event.preventDefault()
    addCompanyZone(newZone)
    setNewZone('')
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          title={collapsed ? `${activeCompany?.name} · switch company` : undefined}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-lg border-0 text-left transition-colors duration-150 cursor-pointer',
            collapsed ? 'justify-center p-1' : 'px-2 py-1.5',
            open ? 'bg-white/[0.1]' : 'bg-transparent hover:bg-white/[0.07]'
          )}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--nav-active-bg)] text-white">
            <TreePine size={17} strokeWidth={2.2} />
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold leading-tight text-white" translate="no">{activeCompany?.name ?? 'UnifiedTree'}</span>
                <span className="block truncate text-[11.5px] leading-tight text-[var(--nav-text-2)]">
                  {activeCountry.name} · {activeCountry.currencySymbol} · {activeZone ?? zones[0]}
                </span>
              </span>
              <ChevronsUpDown size={15} className="shrink-0 text-[var(--nav-text)] opacity-60" />
            </>
          )}
        </button>


        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={close} aria-hidden="true" />
            <div role="dialog" aria-label="Switch company, department and branch"
              className="fixed left-3 top-[60px] z-30 flex max-h-[calc(100vh-80px)] w-[640px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-2)]"
              style={{ animation: 'utSwitchIn 160ms cubic-bezier(0.16,1,0.3,1) both' }}>

              {/* Header — the company you're in */}
              <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
                <Avatar name={activeCompany?.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{activeCompany?.name}</p>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-[var(--muted)]">
                    <CountryCode code={activeCompany?.country} />
                    <span>{activeCountry.name}</span><span aria-hidden="true">·</span>
                    <span>{activeCountry.taxSystem}</span><span aria-hidden="true">·</span>
                    <span>{activeCountry.currencySymbol} {activeCountry.currency}</span>
                    {(activeCompany?.taxId || activeCompany?.gstin) && <><span aria-hidden="true">·</span><span className="tabular">{activeCountry.taxIdLabel} {activeCompany.taxId || activeCompany.gstin}</span></>}
                  </p>
                </div>
                <button type="button" onClick={close} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-[8px] border-0 bg-transparent text-[var(--muted)] hover:bg-[var(--surface-2)] cursor-pointer"><X size={17} /></button>
              </div>

              <div className="grid min-h-0 flex-1 md:grid-cols-[236px_minmax(0,1fr)]">
                {/* Companies */}
                <div className="flex min-h-0 flex-col border-b border-[var(--border)] bg-[var(--surface-2)]/60 p-3 md:border-b-0 md:border-e">
                  <p className="mb-2 px-1 text-[12px] font-semibold text-[var(--muted)]">Companies <span className="font-normal text-[var(--faint)]">{companies.length}</span></p>
                  {companies.length > 4 && (
                    <div className="relative mb-2">
                      <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
                      <input id="co-search" value={coQuery} onChange={e => setCoQuery(e.target.value)} placeholder="Find a company"
                        className="h-8 w-full rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] pl-8 pr-2 text-[13px] outline-none focus:border-[var(--primary)]" />
                    </div>
                  )}
                  <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
                    {shownCompanies.map((co) => {
                      const coCountry = getCountryTaxConfig(co.country || 'IN')
                      const isSelected = activeCompany?.id === co.id
                      return (
                        <button key={co.id} type="button" aria-pressed={isSelected}
                          onClick={() => setCompanyContext({ company: co, department: co.departments?.[0] ?? 'Accounts', zone: co.zones?.[0] ?? 'Default' })}
                          className={cn('flex w-full items-center gap-2.5 rounded-[8px] border-0 px-2 py-2 text-left transition-colors cursor-pointer',
                            isSelected ? 'bg-[var(--surface)] shadow-[0_1px_2px_rgba(16,32,28,0.08)] ring-1 ring-[var(--border)]' : 'bg-transparent hover:bg-[var(--surface)]')}>
                          <Avatar name={co.name} size={28} />
                          <span className="min-w-0 flex-1">
                            <span className={cn('block truncate text-[13.5px]', isSelected ? 'font-semibold' : 'font-medium')}>{co.name}</span>
                            <span className="flex items-center gap-1.5 truncate text-[12px] text-[var(--muted)]"><CountryCode code={co.country} /> {coCountry.currencySymbol} · {co.branch || coCountry.name}</span>
                          </span>
                          {isSelected && <Check size={15} className="shrink-0 text-[var(--primary)]" />}
                        </button>
                      )
                    })}
                    {shownCompanies.length === 0 && <p className="px-2 py-3 text-[12.5px] text-[var(--muted)]">No company matches “{coQuery}”.</p>}
                  </div>
                  <button type="button" onClick={openCreateCompany}
                    className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-[8px] border border-dashed border-[var(--border-strong)] bg-transparent text-[13px] font-[550] text-[var(--primary-ink)] hover:border-[var(--primary)] hover:bg-[var(--primary-tint)] cursor-pointer">
                    <Plus size={15} /> New company
                  </button>
                </div>

                {/* Department and branch */}
                <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-4">
                  <section>
                    <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-[var(--muted)]"><Briefcase size={13} /> Department</p>
                    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Department">
                      {departments.map(department => {
                        const on = (activeDepartment ?? departments[0]) === department
                        return (
                          <button key={department} type="button" role="radio" aria-checked={on} onClick={() => setActiveDepartment(department)}
                            className={cn('inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-[550] transition-colors cursor-pointer',
                              on ? 'border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--primary-ink)]' : 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]')}>
                            {on && <Check size={13} />}{department}
                          </button>
                        )
                      })}
                    </div>
                  </section>

                  <section className="flex min-h-0 flex-col">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--muted)]"><MapPin size={13} /> Branch <span className="font-normal text-[var(--faint)]">{zones.length}</span></p>
                    </div>
                    <div className="relative mb-2">
                      <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
                      <input id="branch-search" value={branchQuery} onChange={e => setBranchQuery(e.target.value)} placeholder={`Find a branch in ${activeCountry.name}`}
                        className="h-9 w-full rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] pl-8 pr-2 text-[13.5px] outline-none focus:border-[var(--primary)]" />
                    </div>
                    <div className="max-h-[220px] overflow-y-auto rounded-[10px] border border-[var(--border)]" role="radiogroup" aria-label="Branch">
                      {shownZones.map((zone, i) => {
                        const on = (activeZone ?? zones[0]) === zone
                        return (
                          <button key={zone} type="button" role="radio" aria-checked={on} onClick={() => setActiveZone(zone)}
                            className={cn('flex w-full items-center gap-2.5 border-0 px-3 py-2 text-left text-[13.5px] transition-colors cursor-pointer',
                              i > 0 && 'border-t border-[var(--border)]',
                              on ? 'bg-[var(--primary-tint)] font-semibold text-[var(--primary-ink)]' : 'bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]')}
                            style={i > 0 ? { borderTop: '1px solid var(--border)' } : undefined}>
                            <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', on ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-[var(--border-strong)]')}>
                              {on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{zone}</span>
                            {/^(factory|plant|warehouse)/i.test(zone) && <span className="rounded-full bg-[var(--muted-bg)] px-2 text-[11px] text-[var(--muted)]">Factory</span>}
                            {/^office|head office/i.test(zone) && <span className="rounded-full bg-[var(--muted-bg)] px-2 text-[11px] text-[var(--muted)]">Office</span>}
                          </button>
                        )
                      })}
                      {shownZones.length === 0 && (
                        <p className="px-3 py-3 text-[12.5px] text-[var(--muted)]">No branch matches “{branchQuery}”. Add it below.</p>
                      )}
                    </div>
                    <form onSubmit={submitZone} className="mt-2 flex gap-2">
                      <input id="new-branch" value={newZone} onChange={event => setNewZone(event.target.value)} placeholder={`New ${activeCountry.name} branch`}
                        className="h-9 min-w-0 flex-1 rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-[13.5px] outline-none focus:border-[var(--primary)]" />
                      <Button type="submit" variant="secondary" icon={Plus} disabled={!newZone.trim()}>Add branch</Button>
                    </form>
                  </section>
                </div>
              </div>

              {/* Footer — what everything you do next is recorded against */}
              <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5">
                <p className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--muted)]">
                  Working in <strong className="font-semibold text-[var(--text)]">{activeCompany?.name}</strong> · {activeDepartment ?? departments[0]} · {activeZone ?? zones[0]}
                </p>
                <Button variant="primary" onClick={close}>Done</Button>
              </div>
            </div>
            <style>{'@keyframes utSwitchIn{from{opacity:0;transform:translateY(-6px) scale(.99)}to{opacity:1;transform:none}}'}</style>
          </>
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={closeCreateCompany}
        title="Create Global Entity / Company"
        size="lg"
        footer={(
          <>
            <Button type="button" variant="ghost" onClick={closeCreateCompany}>Cancel</Button>
            <Button type="submit" form="create-company-form" variant="primary" icon={Plus}>Create Entity</Button>
          </>
        )}
      >
        <form id="create-company-form" onSubmit={handleCreateCompany} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="md:col-span-2">
            <span className="text-sm font-medium text-[var(--text)]">Country & Tax Jurisdiction</span>
            <select
              value={draft.country || 'IN'}
              onChange={(event) => updateDraft('country', event.target.value)}
              className="mt-1.5 h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm font-medium text-[var(--text)] outline-none focus:border-[var(--primary)]"
            >
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} — {c.taxSystemName} ({c.currencySymbol} {c.currency})
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-medium text-[var(--text)]">Company Name</span>
            <input
              value={draft.name}
              onChange={(event) => updateDraft('name', event.target.value)}
              className="mt-1.5 h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              placeholder={`e.g. Acme Corp (${draftCountry.name})`}
              autoFocus
            />
            {errors.name && <p className="mt-1 text-xs font-medium text-[var(--neg)]">{errors.name}</p>}
          </label>

          <label>
            <span className="text-sm font-medium text-[var(--text)]">Legal Structure</span>
            <select
              value={draft.legalType}
              onChange={(event) => updateDraft('legalType', event.target.value)}
              className="mt-1.5 h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
            >
              {draftCountry.legalTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-sm font-medium text-[var(--text)]">Branch / Region</span>
            <input
              value={draft.branch}
              onChange={(event) => updateDraft('branch', event.target.value)}
              className="mt-1.5 h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              placeholder={`e.g. ${draftCountry.regions[0] || 'Main Office'}`}
            />
            {errors.branch && <p className="mt-1 text-xs font-medium text-[var(--neg)]">{errors.branch}</p>}
          </label>

          <label className="md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--text)]">{draftCountry.taxIdLabel}</span>
              <span className="text-xs text-[var(--muted)]">Format: {draftCountry.taxIdPlaceholder}</span>
            </div>
            <input
              value={draft.taxId || draft.gstin || ''}
              onChange={(event) => {
                updateDraft('taxId', event.target.value)
                updateDraft('gstin', event.target.value)
              }}
              className="mt-1.5 h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm uppercase text-[var(--text)] outline-none focus:border-[var(--primary)]"
              placeholder={draftCountry.taxIdPlaceholder}
            />
            {(errors.taxId || errors.gstin) && (
              <p className="mt-1 text-xs font-medium text-[var(--neg)]">{errors.taxId || errors.gstin}</p>
            )}
          </label>

          <label>
            <span className="text-sm font-medium text-[var(--text)]">Departments</span>
            <input
              value={draft.departments}
              onChange={(event) => updateDraft('departments', event.target.value)}
              className="mt-1.5 h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              placeholder="Sales, Accounts, Operations"
            />
          </label>

          <label>
            <span className="text-sm font-medium text-[var(--text)]">Operational Regions</span>
            <input
              value={draft.zones}
              onChange={(event) => updateDraft('zones', event.target.value)}
              className="mt-1.5 h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              placeholder={draftCountry.regions.slice(0, 3).join(', ')}
            />
          </label>
        </form>
      </Modal>
    </>
  )
}
