import { useEffect, useState } from 'react'
import { api } from '../../../data/api/client'

/** Local calendar date as YYYY-MM-DD. */
export function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Fetch the mock market rate (base per 1 unit) for a currency on a date; returns [rate, loading]. */
export function useMarketRate(currency, date) {
  const [state, setState] = useState({ key: null, rate: null })
  const key = `${currency}|${date}`
  useEffect(() => {
    if (!currency || !date) return undefined
    let cancelled = false
    api.get(`/fx/rates?date=${date}`).then(
      r => { if (!cancelled) setState({ key, rate: r.rates[currency] ?? null }) },
      () => { if (!cancelled) setState({ key, rate: null }) },
    )
    return () => { cancelled = true }
  }, [key, currency, date])
  return [state.key === key ? state.rate : null, Boolean(currency && date) && state.key !== key]
}
