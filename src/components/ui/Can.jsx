import { useCan } from '../../hooks/useCan'

/**
 * Conditionally renders children when the current role can perform `action`
 * on `section`. Optional `fallback` shown otherwise.
 *
 *   <Can action="create" section="sales"><Button>New</Button></Can>
 */
export default function Can({ action = 'view', section, children, fallback = null }) {
  const can = useCan()
  return can(action, section) ? children : fallback
}
