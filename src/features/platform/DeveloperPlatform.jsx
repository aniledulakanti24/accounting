import { useState } from 'react'
import { KeyRound, Webhook, BookOpen, Send, Trash2, Copy, Plus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { useApi } from '../../hooks/useApi'
import { api } from '../../data/api/client'
import { toast } from '../../lib/toast'
import { ROLES } from '../../config/permissions'
import { Chip, ErrorBox } from '../tax/global/shared'

const input = 'h-9 w-full px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]'
const METHOD_TONE = { GET: 'primary', POST: 'pos', PATCH: 'warn', DELETE: 'neg' }
const when = iso => (iso ? new Date(iso).toLocaleString() : '—')

function Section({ icon: Icon, title, action, children }) {
  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-[var(--primary)]" />
        <h2 className="text-sm font-bold text-[var(--text)] flex-1">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function SecretModal({ secret, title, onClose }) {
  return (
    <Modal open={!!secret} onClose={onClose} title={title}
      footer={<div className="flex justify-end"><Button variant="primary" onClick={onClose}>I've stored it safely</Button></div>}>
      <p className="text-sm text-[var(--muted)] mb-2">Copy this now — it will not be shown again.</p>
      <div className="flex gap-2">
        <code className="flex-1 break-all rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-2 text-xs text-[var(--text)]">{secret}</code>
        <Button size="sm" icon={Copy} onClick={() => navigator.clipboard?.writeText(secret).then(() => toast.success('Copied'))}>Copy</Button>
      </div>
    </Modal>
  )
}

export default function DeveloperPlatform() {
  const keys = useApi('/developer/api-keys')
  const hooks = useApi('/developer/webhooks')
  const deliveries = useApi('/developer/deliveries')
  const routes = useApi('/developer/routes')
  const events = useApi('/developer/events')
  const [keyName, setKeyName] = useState('')
  const [keyRole, setKeyRole] = useState('Viewer (Branch)')
  const [hookUrl, setHookUrl] = useState('')
  const [hookEvents, setHookEvents] = useState([])
  const [secret, setSecret] = useState(null)
  const [query, setQuery] = useState('')

  async function run(fn, done) {
    try { const r = await fn(); done?.(r) } catch (err) { toast.error(err.message) }
  }

  const createKey = () => run(() => api.post('/developer/api-keys', { name: keyName, role: keyRole }), r => {
    setSecret({ value: r.secret, title: `API key "${r.name}"` }); setKeyName(''); keys.refetch()
  })
  const createHook = () => run(() => api.post('/developer/webhooks', { url: hookUrl, events: hookEvents.length ? hookEvents : ['*'] }), r => {
    setSecret({ value: r.secret, title: 'Webhook signing secret' }); setHookUrl(''); setHookEvents([]); hooks.refetch()
  })

  const q = query.trim().toLowerCase()
  const visibleRoutes = (routes.data ?? []).filter(r => !q || `${r.method} ${r.path} ${r.summary}`.toLowerCase().includes(q))

  return (
    <div>
      <PageHeader title="Developer & API" subtitle="Connect ERPs, BI tools and your own apps — REST API, API keys and signed webhooks" breadcrumb={['Settings', 'Developer & API']} />
      <ErrorBox error={keys.error} onRetry={keys.refetch} />

      <Section icon={KeyRound} title="API keys">
        <div className="flex flex-wrap gap-2 mb-2">
          <input className={`${input} max-w-xs`} placeholder="Key name (e.g. Power BI sync)" value={keyName} onChange={e => setKeyName(e.target.value)} />
          <select className={`${input} max-w-[200px]`} value={keyRole} onChange={e => setKeyRole(e.target.value)}>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
          <Button variant="primary" icon={Plus} disabled={!keyName.trim()} onClick={createKey}>Create key</Button>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] divide-y divide-[var(--border)]">
          {(keys.data ?? []).length === 0 && <p className="p-3 text-sm text-[var(--muted)]">No API keys yet. Keys act with the role you choose and can be revoked at any time.</p>}
          {(keys.data ?? []).map(k => (
            <div key={k.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <span className="font-medium text-[var(--text)]">{k.name}</span>
              <code className="text-xs text-[var(--muted)]">utk_••••{k.last4}</code>
              <Chip tone="primary" label={k.role} />
              <span className="text-xs text-[var(--muted)]">Last used {when(k.lastUsedAt)}</span>
              <span className="ms-auto">{k.revokedAt ? <Chip tone="muted" label="Revoked" /> : <Button size="sm" variant="ghost" icon={Trash2} onClick={() => run(() => api.delete(`/developer/api-keys/${k.id}`), () => { toast.success('Key revoked'); keys.refetch() })}>Revoke</Button>}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--muted)] mt-2">Use the key as a bearer token: <code>Authorization: Bearer utk_…</code>. Only a SHA-256 hash is stored.</p>
      </Section>

      <Section icon={Webhook} title="Webhooks">
        <div className="flex flex-wrap gap-2 mb-2">
          <input className={`${input} max-w-sm`} placeholder="https://your-app.example.com/webhooks/unifiedtree" value={hookUrl} onChange={e => setHookUrl(e.target.value)} />
          <select multiple className={`${input} h-auto min-h-[36px] max-w-xs`} value={hookEvents} onChange={e => setHookEvents([...e.target.selectedOptions].map(o => o.value))} aria-label="Events">
            {(events.data ?? []).map(ev => <option key={ev.event} value={ev.event}>{ev.event}</option>)}
          </select>
          <Button variant="primary" icon={Plus} disabled={!hookUrl} onClick={createHook}>Add endpoint</Button>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] divide-y divide-[var(--border)]">
          {(hooks.data ?? []).length === 0 && <p className="p-3 text-sm text-[var(--muted)]">No endpoints. Every event is signed with HMAC-SHA256 in the <code>UT-Signature</code> header and retried up to 3 times.</p>}
          {(hooks.data ?? []).map(h => (
            <div key={h.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <code className="text-xs text-[var(--text)]">{h.url}</code>
              <span className="text-xs text-[var(--muted)]">{h.events.join(', ')}</span>
              <span className="ms-auto flex gap-1">
                <Button size="sm" variant="ghost" icon={Send} onClick={() => run(() => api.post(`/developer/webhooks/${h.id}/test`), d => { toast[d.ok ? 'success' : 'error'](`Test event ${d.ok ? 'delivered' : 'failed'} (${d.status})`); deliveries.refetch() })}>Send test</Button>
                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => run(() => api.delete(`/developer/webhooks/${h.id}`), () => hooks.refetch())}>Remove</Button>
              </span>
            </div>
          ))}
        </div>
        {(deliveries.data ?? []).length > 0 && (
          <div className="mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] divide-y divide-[var(--border)] max-h-60 overflow-y-auto">
            {deliveries.data.slice(0, 20).map(d => (
              <div key={d.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-xs">
                <Chip tone={d.ok ? 'pos' : 'neg'} label={String(d.status)} />
                <span className="font-mono text-[var(--text)]">{d.event}</span>
                <span className="text-[var(--muted)]">{when(d.at)} · {d.attempts.length} attempt(s)</span>
                <code className="ms-auto truncate max-w-[280px] text-[var(--muted)]">{d.signature}</code>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={BookOpen} title={`API reference (${routes.data?.length ?? 0} endpoints)`}
        action={<input className={`${input} max-w-[220px]`} placeholder="Filter endpoints" value={query} onChange={e => setQuery(e.target.value)} />}>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] divide-y divide-[var(--border)]">
          {visibleRoutes.map(r => (
            <div key={`${r.method} ${r.path}`} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
              <span className="w-16"><Chip tone={METHOD_TONE[r.method] ?? 'muted'} label={r.method} /></span>
              <code className="text-xs text-[var(--text)] min-w-[240px]">{r.path}</code>
              <span className="text-xs text-[var(--muted)] flex-1">{r.summary}</span>
              {r.public && <Chip tone="warn" label="public" />}
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--muted)] mt-2">All endpoints accept and return JSON. Errors return <code>{'{ message, details }'}</code> with standard HTTP status codes (401, 403, 404, 422, 428).</p>
      </Section>

      <SecretModal secret={secret?.value} title={secret?.title} onClose={() => setSecret(null)} />
    </div>
  )
}
