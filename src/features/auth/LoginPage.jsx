import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Lock, TreePine } from 'lucide-react'
import { api, ApiError } from '../../data/api/client'
import { useAppStore } from '../../store/useAppStore'

const AVATAR_COLORS = ['#9d3a6b', '#0f766e', '#2f5d8a', '#7c5c1e', '#5b3fa6', '#475569']
const initials = name => name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()

/**
 * Redirects to /login when there is no signed-in session, and loads the
 * person's effective access (what the admin lets them see) from the backend.
 */
export function RequireSession({ children }) {
  const session = useAppStore(s => s.session)
  const access = useAppStore(s => s.access)
  const setAccess = useAppStore(s => s.setAccess)
  const location = useLocation()
  const token = session?.token

  useEffect(() => {
    if (!token) return undefined
    let cancelled = false
    api.get('/access/me').then(
      a => { if (!cancelled) setAccess(a) },
      // If the policy can't be loaded, fall back to the role's defaults
      () => { if (!cancelled) setAccess({ role: session?.user?.role, sections: {}, hiddenTabs: [] }) },
    )
    return () => { cancelled = true }
  }, [token, setAccess]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!session || (session.expiresAt && new Date(session.expiresAt) < new Date())) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  // Wait for access so menus never flash pages the person cannot use
  if (!access) return <div className="flex h-screen items-center justify-center text-sm text-[var(--muted)]">Loading your workspace…</div>
  return children
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = useAppStore(s => s.session)
  const setSession = useAppStore(s => s.setSession)
  const [demo, setDemo] = useState({ users: [], password: '' })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const [otpFor, setOtpFor] = useState(null)
  const [otp, setOtp] = useState('')

  useEffect(() => {
    api.get('/auth/demo-users').then(setDemo, () => {})
  }, [])

  if (session) return <Navigate to={location.state?.from || '/dashboard/overview'} replace />

  async function signIn(e, creds) {
    e?.preventDefault()
    const body = creds ?? (otpFor ? { ...otpFor, otp } : { email, password })
    setBusy(body.email)
    setError('')
    try {
      const result = await api.post('/auth/login', body)
      setSession(result)
      navigate(location.state?.from || '/dashboard/overview', { replace: true })
    } catch (err) {
      // Two-factor sign-in: ask for the authenticator code, then retry with it
      if (['OTP_REQUIRED', 'OTP_INVALID'].includes(err.details?.code)) { setOtpFor({ email: body.email, password: body.password }); if (err.details.code === 'OTP_INVALID') setError(err.message) }
      else setError(err instanceof ApiError ? err.message : 'Sign-in failed')
    } finally {
      setBusy(null)
    }
  }

  if (otpFor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
        <form onSubmit={signIn} className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary-tint)] text-[var(--primary)]"><Lock size={20} /></span>
          <h2 className="text-xl font-bold text-[var(--text)]">Two-step verification</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Enter the 6-digit code from your authenticator app for {otpFor.email}.</p>
          <input id="otp" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            className="mt-4 h-12 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-center font-mono text-2xl tracking-[0.4em] text-[var(--text)] outline-none focus:border-[var(--primary)]" aria-label="Verification code" />
          {error && <p className="mt-2 text-sm text-[var(--neg)]">{error}</p>}
          <button type="submit" disabled={otp.length !== 6 || !!busy} className="mt-4 flex h-10 w-full items-center justify-center rounded-[var(--radius-sm)] border-0 bg-[var(--primary)] text-sm font-semibold text-white cursor-pointer disabled:opacity-60">{busy ? 'Checking…' : 'Verify and sign in'}</button>
          <button type="button" onClick={() => { setOtpFor(null); setOtp(''); setError('') }} className="mt-2 w-full border-0 bg-transparent text-sm text-[var(--muted)] cursor-pointer hover:text-[var(--text)]">Use a different account</button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--bg)]">
      {/* Brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden" style={{ background: '#10261f', color: '#fff' }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--primary)' }}><TreePine size={17} color="#fff" /></span>
          <span data-brand translate="no" className="notranslate text-base font-bold">UnifiedTree Accounting</span>
        </div>
        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Every ledger, tax return and currency on one tree.</h1>
          <p className="mt-4 text-sm leading-relaxed opacity-75">Books, compliance, banking and payments for 197 countries — filed with the right authority, in your team's language.</p>
        </div>
        <p className="text-xs opacity-60">Demo workspace with sample data</p>
      </aside>

      {/* Sign-in panel */}
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-[var(--text)]">Log in</h2>
          <p className="mt-1 mb-5 text-sm text-[var(--muted)]">Choose a role to explore what each person can do — access is enforced by the server.</p>

          <div className="space-y-2">
            {demo.users.map((u, i) => (
              <button
                key={u.id}
                type="button"
                disabled={!!busy}
                onClick={() => signIn(null, { email: u.email, password: demo.password })}
                className="flex w-full items-center gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3 text-left hover:border-[var(--primary)] cursor-pointer disabled:opacity-60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>{initials(u.name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[var(--text)]">{u.role} <span className="font-normal text-[var(--muted)]">· {u.name}</span></span>
                  <span className="block truncate text-xs text-[var(--muted)]">{u.email}</span>
                </span>
                <ArrowRight size={16} className="text-[var(--muted)]" />
              </button>
            ))}
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-[var(--muted)]">
            <span className="h-px flex-1 bg-[var(--border)]" /> or sign in with email <span className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <form onSubmit={signIn} className="space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-[var(--muted)]">Email</span>
              <input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com"
                className="mt-1 h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[var(--muted)]">Password</span>
              <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
                className="mt-1 h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]" />
            </label>
            {error && <p className="text-sm text-[var(--neg)]">{error}</p>}
            <button type="submit" disabled={!!busy || !email || !password}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border-0 bg-[var(--primary)] text-sm font-semibold text-white cursor-pointer disabled:opacity-60">
              <Lock size={14} /> {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-4 rounded-[var(--radius-sm)] bg-[var(--primary-tint)] p-3 text-xs text-[var(--primary)]">
            Demo mode: accounts and data live in this browser's built-in mock server. Connect a real identity provider and backend before storing live customer data.
          </p>
        </div>
      </main>
    </div>
  )
}
