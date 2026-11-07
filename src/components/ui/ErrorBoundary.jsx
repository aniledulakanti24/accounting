import { useRouteError, useNavigate } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Button from './Button'

export default function ErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()

  const errorMessage = error?.statusText || error?.message || 'An unexpected application error occurred.'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] p-6 text-center">
      <div className="w-full max-w-md rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-[var(--neg)]">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-lg font-bold text-[var(--text)]">Application Error</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          The view encountered an unexpected issue while rendering.
        </p>

        <div className="my-5 overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3 text-left font-mono text-xs text-[var(--muted)]">
          {errorMessage}
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            icon={RefreshCw}
            size="sm"
            onClick={() => window.location.reload()}
          >
            Reload View
          </Button>
          <Button
            variant="primary"
            icon={Home}
            size="sm"
            onClick={() => {
              navigate('/dashboard/overview')
              window.location.reload()
            }}
          >
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
