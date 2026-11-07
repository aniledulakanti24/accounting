/**
 * RBAC permission model — frontend mock (client-side gating, not security).
 *
 * Single source of truth for roles and default per-section access levels.
 * Section ids must match src/config/sections.js. `settings` is a virtual
 * section id used to gate the settings area.
 */
import sections from './sections.js'

/** Canonical roles — must match SYSTEM_USERS in businessToolsService. */
export const ROLES = [
  'Super Admin',
  'Finance Lead',
  'Senior Accountant',
  'Accountant',
  'CA / Auditor',
  'Viewer (Branch)',
]

/** Access levels, lowest → highest. */
export const LEVELS = ['none', 'view', 'create', 'edit', 'full']

/** Minimum level required for an action. */
export const ACTION_MIN_LEVEL = {
  view:   'view',
  create: 'create',
  edit:   'edit',
  delete: 'full',
}

/* Section grouping for concise default rules. Settings handled explicitly. */
const GROUP_OF = Object.fromEntries(sections.map(s => [s.id, s.group]))

/**
 * Per-role default level by section group.
 * Resolved into a flat { sectionId: { role: level } } matrix below.
 */
const ROLE_GROUP_LEVELS = {
  'Super Admin':       { main: 'full', daily: 'full', finance: 'full', advanced: 'full', settings: 'full' },
  'Finance Lead':      { main: 'full', daily: 'full', finance: 'full', advanced: 'none', settings: 'view' },
  'Senior Accountant': { main: 'view', daily: 'edit', finance: 'none', advanced: 'none', settings: 'none' },
  'Accountant':        { main: 'view', daily: 'create', finance: 'none', advanced: 'none', settings: 'none' },
  'CA / Auditor':      { main: 'view', daily: 'none', finance: 'view', advanced: 'none', settings: 'none' },
  'Viewer (Branch)':   { main: 'view', daily: 'none', finance: 'none', advanced: 'none', settings: 'none' },
}

/** Per-section overrides on top of group defaults (sectionId → role → level). */
const SECTION_OVERRIDES = {
  reports: {
    'Senior Accountant': 'view',
    Accountant: 'view',
    'Viewer (Branch)': 'view',
  },
  tax: {
    'Senior Accountant': 'edit',
  },
  masters: {
    'Finance Lead': 'view',
  },
  'business-tools': {
    'Finance Lead': 'none',
    'Senior Accountant': 'none',
    Accountant: 'none',
  },
}

function levelForDefault(sectionId, role) {
  const ov = SECTION_OVERRIDES[sectionId]?.[role]
  if (ov) return ov
  const group = GROUP_OF[sectionId] ?? 'advanced'
  return ROLE_GROUP_LEVELS[role]?.[group] ?? 'none'
}

/** Flat default matrix: { sectionId: { role: level } } incl. virtual `settings`. */
export const DEFAULT_MATRIX = (() => {
  const ids = [...sections.map(s => s.id), 'settings']
  const matrix = {}
  for (const id of ids) {
    matrix[id] = {}
    for (const role of ROLES) {
      matrix[id][role] = id === 'settings'
        ? ROLE_GROUP_LEVELS[role].settings
        : levelForDefault(id, role)
    }
  }
  return matrix
})()
