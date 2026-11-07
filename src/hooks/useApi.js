import { useCallback, useEffect, useState } from 'react'
import { api } from '../data/api/client'
import { useAppStore } from '../store/useAppStore'

/**
 * Fetch a GET endpoint and re-fetch automatically when the active company changes.
 * Returns { data, loading, error, refetch, setData }.
 * While re-fetching, the previous data stays visible.
 */
export function useApi(url, { enabled = true } = {}) {
  const companyId = useAppStore(s => s.activeCompany?.id)
  const country = useAppStore(s => s.activeCompany?.country)
  const [nonce, setNonce] = useState(0)
  const key = `${url}|${companyId}|${country}|${nonce}`
  const [state, setState] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    if (!enabled || !url) return undefined
    let cancelled = false
    api.get(url).then(
      data => { if (!cancelled) setState({ key, data, error: null }) },
      error => { if (!cancelled) setState(s => ({ key, data: s.data, error })) },
    )
    return () => { cancelled = true }
  }, [key, url, enabled])

  const refetch = useCallback(() => setNonce(n => n + 1), [])
  const setData = useCallback((updater) => {
    setState(s => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }))
  }, [])

  return {
    data: state.data,
    error: state.error,
    loading: enabled && !!url && state.key !== key,
    refetch,
    setData,
  }
}
