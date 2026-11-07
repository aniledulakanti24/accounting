import { useState } from 'react'
import { PlugZap, ShieldCheck, RefreshCw } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { useApi } from '../../../hooks/useApi'
import { api } from '../../../data/api/client'
import { toast } from '../../../lib/toast'
import { Chip } from './shared'
import { fmtDate } from './taxUtils'

/**
 * Connection to the tax authority's filing API (MTD, GSP, ELSTER, SBR…) and the
 * status of recent submissions. Filing is blocked until a connection is authorised.
 */
export default function FilingConnection({ onChange }) {
  const conn = useApi('/filing/connection')
  const subs = useApi('/filing/submissions')
  const [open, setOpen] = useState(false)
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const provider = conn.data?.provider
  const connection = conn.data?.connection

  async function authorise() {
    setBusy(true)
    try {
      await api.post('/filing/connections', { consent })
      toast.success(`Connected to ${provider.name}`)
      setOpen(false)
      conn.refetch()
      onChange?.()
    } catch (err) { toast.error(err.message) } finally { setBusy(false) }
  }

  async function refresh(sub) {
    try {
      const s = await api.post(`/filing/submissions/${sub.id}/refresh`)
      toast[s.status === 'rejected' ? 'error' : 'success'](`${s.form} ${s.period}: ${s.message}`)
      subs.refetch()
    } catch (err) { toast.error(err.message) }
  }

  if (!provider) return null
  const recent = (subs.data ?? []).slice(0, 3)

  return (
    <div className="mb-5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {connection ? <ShieldCheck size={18} className="text-[var(--pos)]" /> : <PlugZap size={18} className="text-[var(--warn)]" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text)]">{provider.name}</p>
          <p className="text-xs text-[var(--muted)]">
            {connection
              ? `Connected by ${connection.authorisedBy} · authorisation valid to ${fmtDate(connection.expiresAt.slice(0, 10))} · scopes ${connection.scopes.join(', ')}`
              : `Not connected — authorise ${provider.auth} to file returns directly`}
          </p>
        </div>
        {connection ? <Chip tone="pos" label="Connected" /> : <Button size="sm" variant="primary" icon={PlugZap} onClick={() => setOpen(true)}>Connect</Button>}
      </div>
      {recent.length > 0 && (
        <div className="mt-3 border-t border-[var(--border)] pt-3 space-y-1.5">
          {recent.map(s => (
            <div key={s.id} className="flex flex-wrap items-center gap-2 text-xs">
              <Chip tone={s.status === 'accepted' ? 'pos' : s.status === 'rejected' ? 'neg' : 'warn'} label={s.status} />
              <span className="text-[var(--text)]">{s.form} · {s.period}</span>
              <span className="text-[var(--muted)]">{s.message}</span>
              <code className="text-[var(--muted)]">{s.correlationId.slice(0, 8)}</code>
              {s.status === 'processing' && <Button size="sm" variant="ghost" icon={RefreshCw} onClick={() => refresh(s)}>Check status</Button>}
            </div>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={`Connect to ${provider.name}`}
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={authorise} disabled={!consent || busy}>{busy ? 'Authorising…' : 'Authorise'}</Button></div>}>
        <p className="text-sm text-[var(--muted)] mb-3">You'll sign in with <strong className="text-[var(--text)]">{provider.auth}</strong> and grant UnifiedTree permission to:</p>
        <ul className="mb-4 space-y-1 text-sm text-[var(--text)]">
          {provider.scopes.map(s => <li key={s} className="flex items-center gap-2"><ShieldCheck size={13} className="text-[var(--primary)]" /> <code>{s}</code></li>)}
        </ul>
        <label className="flex items-start gap-2 text-sm text-[var(--text)] cursor-pointer">
          <input type="checkbox" className="mt-1" checked={consent} onChange={e => setConsent(e.target.checked)} />
          <span>I authorise UnifiedTree to submit returns and read filing status on behalf of this company.</span>
        </label>
        <p className="mt-3 text-xs text-[var(--muted)]">Demo mode: the authority's sign-in is simulated.</p>
      </Modal>
    </div>
  )
}
