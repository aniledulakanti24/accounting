import { LEVELS, ACTION_MIN_LEVEL, DEFAULT_MATRIX } from '../config/permissions.js'

/** Merge default matrix with persisted overrides (overrides win per cell). */
export function mergeMatrix(overrides = {}) {
  const merged = {}
  for (const sectionId of Object.keys(DEFAULT_MATRIX)) {
    merged[sectionId] = { ...DEFAULT_MATRIX[sectionId], ...(overrides[sectionId] ?? {}) }
  }
  return merged
}

export function levelFor(matrix, role, sectionId) {
  return matrix[sectionId]?.[role] ?? 'none'
}

/** True if `role` can perform `action` on `sectionId` under `matrix`. */
export function can(matrix, role, sectionId, action) {
  const level = levelFor(matrix, role, sectionId)
  const required = ACTION_MIN_LEVEL[action] ?? 'view'
  return LEVELS.indexOf(level) >= LEVELS.indexOf(required)
}
