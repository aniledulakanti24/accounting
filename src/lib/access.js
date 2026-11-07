import sections from '../config/sections'

/** First page a person is allowed to see (given a `can` from useCan), or null. */
export function firstAllowedPath(can) {
  for (const s of sections) {
    if (!can('view', s.id)) continue
    const tab = s.tabs.find(t => can.seesTab(s.id, t.id))
    if (tab) return `/${s.id}/${tab.id}`
  }
  return null
}
