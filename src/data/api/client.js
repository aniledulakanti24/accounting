/**
 * API client — the only module the UI talks to for backend data.
 *
 * Today it forwards requests to the in-browser mock server. To connect a real
 * backend, set VITE_API_BASE_URL and requests go over fetch() instead; the
 * request/response shape ({ data } on success, ApiError on failure) is the same.
 */
import { handleRequest } from './mockServer'
import { useAppStore } from '../../store/useAppStore'

const BASE_URL = import.meta.env?.VITE_API_BASE_URL || ''

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function activeCompany() {
  return useAppStore.getState().activeCompany
}

function sessionToken() {
  return useAppStore.getState().session?.token ?? null
}

/** An expired or revoked session signs the user out (the app then shows the login page). */
function handleUnauthorized(url) {
  if (url.startsWith('/auth/login')) return
  if (useAppStore.getState().session) useAppStore.getState().clearSession()
}

async function request(method, url, body, options = {}) {
  const company = options.company ?? activeCompany()
  // Pass { token: null } to call as an anonymous visitor (e.g. the public checkout)
  const token = 'token' in options ? options.token : sessionToken()

  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Company-Id': company?.id ?? '',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body == null ? undefined : JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (res.status === 401 && token) handleUnauthorized(url)
    if (!res.ok) throw new ApiError(res.status, json?.message || res.statusText, json?.details)
    return json
  }

  const res = await handleRequest({
    method, url, body, token,
    company: company ? { id: company.id, country: company.country || 'IN', name: company.name, taxId: company.taxId } : null,
  })
  if (res.status === 401 && token) handleUnauthorized(url)
  if (res.status >= 400) throw new ApiError(res.status, res.error?.message || 'Request failed', res.error?.details)
  return res.data
}

export const api = {
  get: (url, options) => request('GET', url, null, options),
  post: (url, body, options) => request('POST', url, body, options),
  patch: (url, body, options) => request('PATCH', url, body, options),
  put: (url, body, options) => request('PUT', url, body, options),
  delete: (url, options) => request('DELETE', url, null, options),
}

export const isMockBackend = !BASE_URL
