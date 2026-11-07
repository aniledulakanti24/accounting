import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { mergeMatrix, can as canFn, levelFor } from '../lib/rbac'
import { LEVELS, ACTION_MIN_LEVEL } from '../config/permissions'

/**
 * Returns a `can(action, sectionId)` checker for the signed-in person.
 *
 * Uses the effective access the backend returned at sign-in (role defaults +
 * the admin's role policy + the person's own overrides). Before that has
 * loaded it falls back to the role's default matrix.
 * Also exposes `seesTab(sectionId, tabId)`, `level(sectionId)` and `role`.
 */
export function useCan() {
  const currentRole = useAppStore(s => s.currentRole)
  const overrides   = useAppStore(s => s.permissionOverrides)
  const access      = useAppStore(s => s.access)

  const matrix = useMemo(() => mergeMatrix(overrides), [overrides])

  return useMemo(() => {
    const level = sectionId => (access?.sections?.[sectionId] ?? levelFor(matrix, currentRole, sectionId))
    const hidden = new Set(access?.hiddenTabs ?? [])
    const check = (action, sectionId) => {
      if (!access) return canFn(matrix, currentRole, sectionId, action)
      return LEVELS.indexOf(level(sectionId)) >= LEVELS.indexOf(ACTION_MIN_LEVEL[action] ?? 'view')
    }
    return Object.assign(check, {
      role: access?.role ?? currentRole,
      level,
      seesTab: (sectionId, tabId) => check('view', sectionId) && !hidden.has(`${sectionId}/${tabId}`),
    })
  }, [matrix, currentRole, access])
}
