import { useApi } from '../../../hooks/useApi'
import { getActiveLocale } from '../../../lib/currency'

/** Non-component helpers shared by the country tax pages. */

export function useTaxProfile() {
  const { data, loading, error } = useApi('/tax/profile')
  return { profile: data, catalog: data?.catalog, country: data?.country, loading, error }
}

export function fmtDate(isoDate) {
  if (!isoDate) return '—'
  const d = new Date(`${isoDate}T00:00:00`)
  return d.toLocaleDateString(getActiveLocale(), { day: '2-digit', month: 'short', year: 'numeric' })
}

export function daysUntil(isoDate) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(`${isoDate}T00:00:00`)
  return Math.round((d - today) / 86400000)
}
