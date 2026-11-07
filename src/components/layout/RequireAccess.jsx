import { Navigate, useLocation } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { useCan } from '../../hooks/useCan'
import sections from '../../config/sections'
import { firstAllowedPath } from '../../lib/access'

/**
 * Route guard — the admin decides (in Access control) which sections and pages
 * each role and person can see. The backend enforces the same rules on the API.
 */
export default function RequireAccess({ sectionId, tabId, children }) {
  const can = useCan()
  const location = useLocation()
  const allowed = can('view', sectionId) && (!tabId || can.seesTab(sectionId, tabId))
  if (allowed) return children
  // Prefer another visible page in the same section, then the first page anywhere
  const sameSection = sections.find(s => s.id === sectionId)
  const sibling = can('view', sectionId) && sameSection?.tabs.find(t => can.seesTab(sectionId, t.id))
  const fallback = sibling ? `/${sectionId}/${sibling.id}` : firstAllowedPath(can)
  if (fallback && fallback !== location.pathname) return <Navigate to={fallback} replace />
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShieldOff size={32} className="text-[var(--muted)] mb-3" />
      <p className="text-base font-semibold text-[var(--text)]">You don't have access to this page</p>
      <p className="text-sm text-[var(--muted)] mt-1">Ask your administrator to give your role access in Settings → Access control.</p>
    </div>
  )
}
