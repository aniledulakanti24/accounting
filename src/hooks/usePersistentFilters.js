import { useState } from 'react'

/**
 * usePersistentFilters — persists filter state in localStorage per section/tab.
 *
 * @param {string} namespace  — unique key, e.g. 'sales-invoices'
 * @param {object} defaults   — default filter values
 * @returns [filters, update] — current filters + updater (partial patch)
 *
 * Usage:
 *   const [filters, setFilters] = usePersistentFilters('sales-invoices', { search: '', status: 'All' })
 *   setFilters({ status: 'overdue' })  // partial patch, auto-saves
 */
export function usePersistentFilters(namespace, defaults) {
  const storageKey = `ut-filters-${namespace}`

  const [filters, setFilters] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return defaults
      return { ...defaults, ...JSON.parse(raw) }
    } catch {
      return defaults
    }
  })

  function update(patch) {
    setFilters(prev => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
      return next
    })
  }

  function reset() {
    try { localStorage.removeItem(storageKey) } catch {}
    setFilters(defaults)
  }

  return [filters, update, reset]
}
