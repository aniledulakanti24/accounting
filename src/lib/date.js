import { getActiveLocale } from './currency.js'

/** Day–month–year in the active display locale (language + company country). */
export function formatDate(value) {
  return new Intl.DateTimeFormat(getActiveLocale(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
