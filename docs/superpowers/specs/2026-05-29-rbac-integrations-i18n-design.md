# UnifiedTree — RBAC + Integrations + i18n (Frontend Mock)

**Date:** 2026-05-29
**Scope:** Make three competitive-roadmap features functional at the frontend layer. No backend — state persists via Zustand + localStorage. All "connections" and "auth" are simulated.

---

## Guiding constraint

App has no server. So:
- **RBAC** = client-side gating (nav visibility, route guard, action gating). Not security — UX/demo of role-based access.
- **Integrations** = connect-cards with persisted fake status. No real API calls.
- **i18n** = real `react-i18next`, genuinely switches language and persists.

Reuse existing infrastructure. `SettingsPanel.jsx` already ships static **Roles & Permissions** and **Integrations** panels and routes (`/settings/roles`, `/settings/integrations`). Make those real rather than adding new nav.

---

## Role canonicalization

Single canonical set of 6 roles (from `SYSTEM_USERS`):
`Super Admin`, `Finance Lead`, `Senior Accountant`, `Accountant`, `CA / Auditor`, `Viewer (Branch)`.

Fix mismatch: `SettingsPanel` `PERMISSIONS_MATRIX` currently says "Junior Accountant" → rename to "Accountant".

---

## Part A — i18n (English + Hindi)

| Item | Detail |
|---|---|
| Deps | `i18next`, `react-i18next` |
| Init | `src/i18n/index.js` — resources `en`/`hi`, fallback `en`, initial lang from localStorage key `ut-lang` |
| Locales | `src/i18n/locales/en.json`, `hi.json` — namespaces: `nav` (section + group labels keyed by section id), `common` (Save/Cancel/Create/Edit/Delete/Search/Connect/Configure/Disconnect/Sync), `shell` (search placeholder, settings item labels) |
| Wiring | `main.jsx` imports `./i18n` before `App` |
| Store | add `language` + `setLanguage` (persisted); `setLanguage` calls `i18n.changeLanguage` |
| Switcher | globe dropdown in TabPanel header next to theme toggle: English / हिन्दी |
| Applied to | SideNav section + group labels, search placeholder, settings popover labels. `sections.js` keeps English labels as fallback: components call `t(\`nav.${id}\`, fallbackLabel)` |

Honesty: translations cover nav + shell chrome (not all 80 feature pages).

---

## Part B — RBAC enforcement

| Item | Detail |
|---|---|
| Config | `src/config/permissions.js` — `ROLES` (6), `LEVELS` order `none < view < create < edit < full`, `DEFAULT_MATRIX`: `{ [sectionId]: { [role]: level } }` covering all `sections.js` ids |
| Helper | `src/lib/rbac.js` — `levelFor(matrix, role, sectionId)`, `can(matrix, role, sectionId, action)` where action ∈ view/create/edit/delete maps to required level |
| Store | add `currentRole` (default `Super Admin`) + `setCurrentRole`; `permissionOverrides` (`{sectionId:{role:level}}`) + `setPermission`; both persisted |
| Hook | `src/hooks/useCan.js` — merges DEFAULT_MATRIX + overrides, reads currentRole, returns `can(action, sectionId)` |
| Enforce: nav | SideNav hides sections where `can('view', id)` is false |
| Enforce: route | guard wrapper redirects forbidden section → `/dashboard/overview` |
| Enforce: actions | QuickCreateFAB hides speed-dial actions the role can't `create`; `<Can action section>` component available for page buttons |
| Demo control | role switcher dropdown in TabPanel header (6 roles) — switching re-gates live |
| Settings>Roles | matrix becomes editable: clicking a cell cycles level, persists to `permissionOverrides`; drives live enforcement. "Reset to defaults" button |

Default matrix intent:
- Super Admin: `full` everywhere.
- Finance Lead: `full` daily/finance/reports/tax, `view` setup/masters, `none` business-tools user mgmt edit.
- Senior Accountant: `edit` daily + tax prep, `view` reports, `none` settings/masters.
- Accountant: `create` daily, `view` reports, `none` finance setup.
- CA / Auditor: `view` finance/reports/tax, `none` editing.
- Viewer (Branch): `view` reports/dashboard only, `none` else.

---

## Part C — Integrations (functional)

| Item | Detail |
|---|---|
| Service | `src/data/services/integrationsService.js` — `getIntegrations()` returns provider catalog. Categories incl. **Payment Gateways** (Razorpay, PayU, Cashfree, Stripe), **Banking** (ICICI, HDFC, SBI, Kotak), **E-commerce** (Amazon, Flipkart, Shopify), plus existing Tax/Comms |
| Store | `integrations` map `{ [id]: { status, lastSync, apiKey } }` + actions `connectIntegration(id, creds)`, `disconnectIntegration(id)`, `syncIntegration(id)`; persisted |
| Panel | `SettingsPanel` Integrations tab: merge catalog with persisted state. Connect → modal (mock API key/secret) → status `connected` + `lastSync = now`. Configure → same modal pre-filled + Disconnect. Sync Now → updates `lastSync` |
| Grouping | grouped by category, existing card layout reused |

---

## Files

**New:** `src/i18n/index.js`, `src/i18n/locales/en.json`, `src/i18n/locales/hi.json`, `src/config/permissions.js`, `src/lib/rbac.js`, `src/hooks/useCan.js`, `src/components/ui/Can.jsx`, `src/data/services/integrationsService.js`

**Edit:** `package.json` (deps), `src/main.jsx`, `src/store/useAppStore.js`, `src/components/layout/SideNav.jsx`, `src/components/layout/TabPanel.jsx`, `src/components/ui/QuickCreateFAB.jsx`, `src/features/settings/SettingsPanel.jsx`, `src/router.jsx` (route guard)

---

## Out of scope

Real auth/sessions, real gateway/bank/GSTN calls, translating every feature page, server-side permission checks, granular field-level permissions.
