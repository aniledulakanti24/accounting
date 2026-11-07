import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildCompanyRecord } from '../lib/company'
import { currentFYYear, fyRange, setFiscalYearStartMonth } from '../lib/fy'
import { COUNTRY_TAX_RATES, getCountryTaxConfig } from '../lib/countryTax'
import { setActiveCurrency } from '../lib/currency'
import { changeLanguage } from '../i18n'
import { displayLocale, LANGUAGE_BY_CODE } from '../i18n/languages'

const defaultFYYear = currentFYYear()
const defaultFYRange = fyRange(defaultFYYear)
const defaultLanguage = (() => {
  try {
    const saved = localStorage.getItem('ut-lang')
    return saved && LANGUAGE_BY_CODE[saved] ? saved : 'en'
  } catch {
    return 'en'
  }
})()
const defaultTheme = (() => {
  try {
    return localStorage.getItem('ut-theme') || 'system'
  } catch {
    return 'system'
  }
})()
const defaultAccent = (() => {
  try {
    return localStorage.getItem('ut-accent') || 'emerald'
  } catch {
    return 'emerald'
  }
})()

function applyTheme(theme) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && systemDark)
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
}

function applyAccent(accent) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  document.documentElement.setAttribute('data-accent', accent || 'emerald')
}

const MOCK_COMPANIES = [
  {
    id: 'c1',
    name: 'Nclever Technologies Pvt Ltd',
    country: 'IN',
    countryName: 'India',
    countryFlag: '🇮🇳',
    currency: 'INR',
    currencySymbol: '₹',
    taxSystem: 'GST',
    taxIdLabel: 'GSTIN',
    taxId: '27AABCU9603R1ZX',
    gstin: '27AABCU9603R1ZX',
    branch: 'Head Office - Mumbai',
    legalType: 'Private Limited',
    departments: ['Accounts', 'Sales', 'Procurement', 'Finance'],
    zones: [
      'Maharashtra Branch',
      'Karnataka Branch',
      'Delhi Branch',
      'Tamil Nadu Branch',
      'Telangana Branch',
      'Gujarat Branch',
    ],
  },
  {
    id: 'c2',
    name: 'Nclever Inc.',
    country: 'US',
    countryName: 'United States',
    countryFlag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    taxSystem: 'SalesTax',
    taxIdLabel: 'EIN / SSN',
    taxId: '12-3456789',
    gstin: '12-3456789',
    branch: 'San Francisco, CA',
    legalType: 'C-Corporation',
    departments: ['Accounts', 'Sales', 'Finance'],
    zones: ['California Division', 'New York Division', 'Texas Division'],
  },
  {
    id: 'c3',
    name: 'Nclever Middle East FZ-LLC',
    country: 'AE',
    countryName: 'United Arab Emirates',
    countryFlag: '🇦🇪',
    currency: 'AED',
    currencySymbol: 'AED',
    taxSystem: 'VAT',
    taxIdLabel: 'TRN',
    taxId: '100234567800003',
    gstin: '100234567800003',
    branch: 'Dubai Silicon Oasis',
    legalType: 'Free Zone LLC (FZ-LLC)',
    departments: ['Accounts', 'Operations'],
    zones: ['Dubai Head Office', 'Abu Dhabi Branch'],
  },
  {
    id: 'c4',
    name: 'Nclever Solutions UK Ltd',
    country: 'GB',
    countryName: 'United Kingdom',
    countryFlag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    taxSystem: 'VAT',
    taxIdLabel: 'VAT Reg No',
    taxId: 'GB 123 4567 89',
    gstin: 'GB 123 4567 89',
    branch: 'London Office',
    legalType: 'Private Limited (Ltd)',
    departments: ['Accounts', 'Finance'],
    zones: ['Greater London', 'Manchester Branch'],
  },
  {
    id: 'c5',
    name: 'Nclever Canada Inc.',
    country: 'CA',
    countryName: 'Canada',
    countryFlag: '🇨🇦',
    currency: 'CAD',
    currencySymbol: 'CA$',
    taxSystem: 'GST_HST',
    taxIdLabel: 'Business Number (BN)',
    taxId: '123456789 RT0001',
    gstin: '123456789 RT0001',
    branch: 'Toronto, Ontario',
    legalType: 'Federal Corporation',
    departments: ['Accounts', 'Sales', 'Finance'],
    zones: ['Ontario', 'British Columbia', 'Quebec'],
  },
  {
    id: 'c6',
    name: 'Nclever Australia Pty Ltd',
    country: 'AU',
    countryName: 'Australia',
    countryFlag: '🇦🇺',
    currency: 'AUD',
    currencySymbol: 'A$',
    taxSystem: 'GST',
    taxIdLabel: 'ABN',
    taxId: '51 824 753 556',
    gstin: '51 824 753 556',
    branch: 'Sydney, NSW',
    legalType: 'Proprietary Limited (Pty Ltd)',
    departments: ['Accounts', 'Operations'],
    zones: ['New South Wales', 'Victoria'],
  },
  {
    id: 'c7',
    name: 'Nclever Deutschland GmbH',
    country: 'DE',
    countryName: 'Germany (EU)',
    countryFlag: '🇩🇪',
    currency: 'EUR',
    currencySymbol: '€',
    taxSystem: 'VAT',
    taxIdLabel: 'USt-IdNr',
    taxId: 'DE 123456789',
    gstin: 'DE 123456789',
    branch: 'Berlin',
    legalType: 'GmbH',
    departments: ['Accounts', 'Finance'],
    zones: ['Berlin', 'Bayern'],
  },
  {
    id: 'c8',
    name: 'Nclever Asia Pte Ltd',
    country: 'SG',
    countryName: 'Singapore',
    countryFlag: '🇸🇬',
    currency: 'SGD',
    currencySymbol: 'S$',
    taxSystem: 'GST',
    taxIdLabel: 'UEN / GST Reg No',
    taxId: '201912345A',
    gstin: '201912345A',
    branch: 'Marina Bay',
    legalType: 'Private Limited (Pte Ltd)',
    departments: ['Accounts', 'Sales'],
    zones: ['Central', 'East'],
  },
]

/**
 * Point formatters at the company's country and the interface language:
 * currency and fiscal year come from the country; number and date style from
 * language + country (e.g. French UI for a Canadian company → fr-CA).
 */
function applyCompanyLocale(company, language = defaultLanguage) {
  const config = getCountryTaxConfig(company?.country || 'IN')
  setActiveCurrency(company?.currency || config.currency, displayLocale(language, config.locale))
  setFiscalYearStartMonth(config.fiscalYearStartMonth)
}

// Apply the persisted company's locale before the first render
try {
  const persisted = JSON.parse(localStorage.getItem('ut-accounting-store') || 'null')
  applyCompanyLocale(persisted?.state?.activeCompany ?? MOCK_COMPANIES[0], persisted?.state?.language ?? defaultLanguage)
} catch {
  applyCompanyLocale(MOCK_COMPANIES[0])
}

const DEFAULT_COMPLIANCE_PIPELINE = [
  { id: 'invoice-posted', label: 'Invoice Posted', status: 'done', owner: 'Accountant', due: 'Today', risk: 'low' },
  { id: 'irn-generated', label: 'IRN Generated', status: 'ready', owner: 'Senior Accountant', due: 'Today', risk: 'medium' },
  { id: 'eway-generated', label: 'E-way Bill Generated', status: 'blocked', owner: 'Finance Lead', due: 'Tomorrow', risk: 'medium' },
  { id: 'gstr1-staged', label: 'GSTR-1 Staged', status: 'pending', owner: 'Finance Lead', due: '11 Jun 2026', risk: 'high' },
  { id: 'gstr3b-reviewed', label: 'GSTR-3B Reviewed', status: 'pending', owner: 'CA / Auditor', due: '20 Jun 2026', risk: 'high' },
  { id: 'return-filed', label: 'Return Filed', status: 'pending', owner: 'Super Admin', due: '20 Jun 2026', risk: 'high' },
]

function makeAuditEvent(type, title, detail, meta = {}) {
  return {
    id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ts: new Date().toISOString(),
    type,
    title,
    detail,
    actor: meta.actor ?? 'Demo User',
    role: meta.role ?? null,
    severity: meta.severity ?? 'info',
    module: meta.module ?? 'System',
  }
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      /* ── Company ── */
      companies: MOCK_COMPANIES,
      activeCompany: MOCK_COMPANIES[0],
      activeDepartment: MOCK_COMPANIES[0].departments[0],
      activeZone: MOCK_COMPANIES[0].zones[0],
      setActiveCompany: (company) => set({ activeCompany: company }),
      setCompanyContext: ({ company, department, zone }) => set((state) => {
        const nextCompany = company ?? state.activeCompany
        const nextDepartment = department ?? state.activeDepartment ?? nextCompany?.departments?.[0]
        const nextZone = zone ?? state.activeZone ?? nextCompany?.zones?.[0]
        return {
          activeCompany: nextCompany,
          activeDepartment: nextDepartment,
          activeZone: nextZone,
        }
      }),
      setActiveDepartment: (activeDepartment) => set({ activeDepartment }),
      setActiveZone: (activeZone) => set({ activeZone }),
      addCompanyDepartment: (department) => set((state) => {
        const value = department.trim()
        if (!value || !state.activeCompany) return {}
        const departments = state.activeCompany.departments ?? []
        if (departments.includes(value)) return { activeDepartment: value }
        const activeCompany = { ...state.activeCompany, departments: [...departments, value] }
        return {
          activeCompany,
          activeDepartment: value,
          companies: state.companies.map(company => company.id === activeCompany.id ? activeCompany : company),
        }
      }),
      addCompanyZone: (zone) => set((state) => {
        const value = zone.trim()
        if (!value || !state.activeCompany) return {}
        const zones = state.activeCompany.zones ?? []
        if (zones.includes(value)) return { activeZone: value }
        const activeCompany = { ...state.activeCompany, zones: [...zones, value] }
        return {
          activeCompany,
          activeZone: value,
          companies: state.companies.map(company => company.id === activeCompany.id ? activeCompany : company),
        }
      }),
      addCompany: (draft) => set((state) => {
        const company = buildCompanyRecord(draft)
        return {
          companies: [...state.companies, company],
          activeCompany: company,
          activeDepartment: company.departments?.[0] ?? 'Accounts',
          activeZone: company.zones?.[0] ?? 'Default',
        }
      }),

      /* ── Financial Year ── */
      financialYear: defaultFYYear,          // e.g. 2024 → FY 2024-25
      setFinancialYear: (year) => set({ financialYear: year }),

      /* ── Period (used by period-aware pages) ── */
      period: {
        mode: 'year',
        from: defaultFYRange.from,
        to:   defaultFYRange.to,
      },
      setPeriod: (period) => set({ period }),

      /* ── Theme ── */
      theme: defaultTheme,
      setTheme: (theme) => {
        try {
          localStorage.setItem('ut-theme', theme)
        } catch {
          /* localStorage can be unavailable in private/embedded contexts */
        }
        applyTheme(theme)
        set({ theme })
      },

      /* ── Accent Theme (Executive Palette) ── */
      // Side menu (CRM style): rail mode, starred pages and folded groups
      navCollapsed: false,
      toggleNav: () => set(s => ({ navCollapsed: !s.navCollapsed })),
      navFavorites: [],
      toggleNavFavorite: (key) => set(s => ({ navFavorites: s.navFavorites.includes(key) ? s.navFavorites.filter(k => k !== key) : [...s.navFavorites, key] })),
      navOpen: {},
      setNavOpen: (id, open) => set(s => ({ navOpen: { ...s.navOpen, [id]: open } })),

      accentTheme: defaultAccent,
      setAccentTheme: (accent) => {
        try {
          localStorage.setItem('ut-accent', accent)
        } catch { /* storage blocked */ }
        applyAccent(accent)
        set({ accentTheme: accent })
      },

      /* ── Language (i18n) ── */
      language: defaultLanguage,
      setLanguage: (requested) => {
        const language = LANGUAGE_BY_CODE[requested] ? requested : 'en'
        try {
          localStorage.setItem('ut-lang', language)
        } catch {
          /* localStorage can be unavailable in private/embedded contexts */
        }
        changeLanguage(language)
        set({ language })
      },

      /* ── RBAC (frontend mock) ── */
      currentRole: 'Super Admin',
      setCurrentRole: (currentRole) => set({ currentRole }),

      /* ── Session (signed-in user; the backend enforces their role) ── */
      session: null,                                 // { token, user, expiresAt }
      setSession: (session) => set({ session, currentRole: session?.user?.role ?? 'Super Admin' }),
      clearSession: () => set({ session: null, access: null }),

      /* Effective access from the backend (sections + visible pages) */
      access: null,
      setAccess: (access) => set({ access, currentRole: access?.role ?? get().currentRole }),
      permissionOverrides: {},                       // { sectionId: { role: level } }
      setPermission: (sectionId, role, level) => {
        get().recordAudit('rbac', 'Permission changed', `${role} access for ${sectionId} changed to ${level}.`, { module: 'Settings' })
        set((state) => ({
          permissionOverrides: {
            ...state.permissionOverrides,
            [sectionId]: { ...(state.permissionOverrides[sectionId] ?? {}), [role]: level },
          },
        }))
      },
      resetPermissions: () => {
        get().recordAudit('rbac', 'Permissions reset', 'Permission matrix reset to defaults.', { module: 'Settings', severity: 'warning' })
        set({ permissionOverrides: {} })
      },

      /* ── Audit trail (frontend mock) ── */
      auditEvents: [],
      recordAudit: (type, title, detail, meta = {}) => set((state) => ({
        auditEvents: [
          makeAuditEvent(type, title, detail, { ...meta, role: state.currentRole }),
          ...state.auditEvents,
        ].slice(0, 100),
      })),

      /* ── Compliance pipeline (frontend mock) ── */
      compliancePipeline: DEFAULT_COMPLIANCE_PIPELINE,
      runComplianceAction: (stepId) => set((state) => {
        const next = state.compliancePipeline.map((step, index, all) => {
          if (step.id === stepId) return { ...step, status: 'done', risk: 'low', completedAt: new Date().toISOString() }
          const prevDone = all[index - 1]?.id === stepId
          if (prevDone && step.status === 'pending') return { ...step, status: 'ready' }
          if (prevDone && step.status === 'blocked') return { ...step, status: 'ready' }
          return step
        })
        return { compliancePipeline: next }
      }),
      resetCompliancePipeline: () => set({ compliancePipeline: DEFAULT_COMPLIANCE_PIPELINE }),

      /* ── Import jobs (frontend mock) ── */
      importJobs: [],
      addImportJob: (job) => set((state) => ({
        importJobs: [{ id: `IMP-${Date.now()}`, createdAt: new Date().toISOString(), ...job }, ...state.importJobs].slice(0, 20),
      })),

      /* ── Setup completion (frontend mock) ── */
      completedSetupActions: [],
      markSetupAction: (id) => set((state) => ({
        completedSetupActions: state.completedSetupActions.includes(id)
          ? state.completedSetupActions
          : [...state.completedSetupActions, id],
      })),

      /* ── Integrations (frontend mock) ── */
      integrations: {},                              // { id: { status, lastSync, apiKey } }
      connectIntegration: (id, creds = {}) => {
        get().recordAudit('integration', 'Integration connected', `${id} connected with mock credentials.`, { module: 'Integrations' })
        set((state) => ({
          integrations: {
            ...state.integrations,
            [id]: { status: 'connected', lastSync: new Date().toISOString(), apiKey: creds.apiKey ?? null },
          },
        }))
      },
      disconnectIntegration: (id) => {
        get().recordAudit('integration', 'Integration disconnected', `${id} disconnected.`, { module: 'Integrations', severity: 'warning' })
        set((state) => ({
          integrations: { ...state.integrations, [id]: { status: 'disconnected', lastSync: null, apiKey: null } },
        }))
      },
      syncIntegration: (id) => {
        get().recordAudit('integration', 'Integration synced', `${id} synced mock data.`, { module: 'Integrations' })
        set((state) => ({
          integrations: {
            ...state.integrations,
            [id]: { ...(state.integrations[id] ?? {}), status: 'connected', lastSync: new Date().toISOString() },
          },
        }))
      },

      /* ── Country & Dynamic Multi-Tax Engine ── */
      customTaxRates: COUNTRY_TAX_RATES,
      setCompanyCountry: (countryCode) => {
        const config = getCountryTaxConfig(countryCode)
        const activeCompany = get().activeCompany
        if (!activeCompany) return

        const updatedCompany = {
          ...activeCompany,
          country: countryCode,
          countryName: config.name,
          countryFlag: config.flag,
          currency: config.currency,
          currencySymbol: config.currencySymbol,
          taxSystem: config.taxSystem,
          taxIdLabel: config.taxIdLabel,
        }

        get().recordAudit(
          'company',
          'Company Country Changed',
          `Changed jurisdiction to ${config.name} (${config.taxSystem}). Tax engine updated.`,
          { module: 'Settings' }
        )

        set((state) => ({
          activeCompany: updatedCompany,
          companies: state.companies.map((c) => (c.id === updatedCompany.id ? updatedCompany : c)),
        }))
      },
      addTaxRate: (countryCode, newRate) => {
        const code = countryCode || get().activeCompany?.country || 'IN'
        const rateRecord = {
          id: `${code}-T${Date.now()}`,
          status: 'active',
          ...newRate,
        }
        get().recordAudit(
          'tax',
          'Tax Rate Created',
          `Created ${rateRecord.name} (${rateRecord.rate}%) under ${code} tax rules.`,
          { module: 'Masters' }
        )
        set((state) => ({
          customTaxRates: {
            ...state.customTaxRates,
            [code]: [rateRecord, ...(state.customTaxRates[code] || [])],
          },
        }))
      },

      /* ── Sidebar / nav state ── */
      activeSection: 'dashboard',
      setActiveSection: (id) => set({ activeSection: id }),
    }),
    {
      name: 'ut-accounting-store',
      version: 2,
      // v2: seed companies for every supported country; keep user-created ones
      migrate: (persisted) => {
        if (!persisted) return persisted
        const existing = persisted.companies ?? []
        const ids = new Set(existing.map(c => c.id))
        const companies = [...existing, ...MOCK_COMPANIES.filter(c => !ids.has(c.id))]
          .map(c => {
            const seed = MOCK_COMPANIES.find(m => m.id === c.id)
            return seed ? { ...c, currencySymbol: seed.currencySymbol } : c
          })
        return { ...persisted, companies }
      },
      partialize: (s) => ({
        companies:           s.companies,
        activeCompany:       s.activeCompany,
        activeDepartment:    s.activeDepartment,
        activeZone:          s.activeZone,
        financialYear:       s.financialYear,
        theme:               s.theme,
        accentTheme:         s.accentTheme,
        navCollapsed:        s.navCollapsed,
        navFavorites:        s.navFavorites,
        navOpen:             s.navOpen,
        language:            s.language,
        currentRole:         s.currentRole,
        session:             s.session,
        permissionOverrides: s.permissionOverrides,
        integrations:        s.integrations,
        auditEvents:         s.auditEvents,
        compliancePipeline:  s.compliancePipeline,
        importJobs:          s.importJobs,
        completedSetupActions: s.completedSetupActions,
        customTaxRates:      s.customTaxRates,
      }),
    }
  )
)

// Keep formatters in sync with the active company (switching, country edits, rehydration)
applyCompanyLocale(useAppStore.getState().activeCompany, useAppStore.getState().language)
useAppStore.subscribe((state, prev) => {
  const a = state.activeCompany
  const b = prev.activeCompany
  if (a?.id !== b?.id || a?.country !== b?.country || a?.currency !== b?.currency || state.language !== prev.language) {
    applyCompanyLocale(a, state.language)
  }
})
