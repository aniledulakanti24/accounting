import { useState } from 'react'
import { Plug, RefreshCw, Unplug, ShieldCheck, Download, Code2, X } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { api } from '../../data/api/client'
import { toast } from '../../lib/toast'
import { formatCurrency } from '../../lib/currency'
import { ErrorBox } from '../tax/global/shared'
import { Card, Segmented } from './ui'

const CATEGORY_TINT = { 'E-commerce': '#7c3aed', Payments: '#0f766e', CRM: '#2563eb', Messaging: '#16a34a', Files: '#d97706', Automation: '#db2777', Payroll: '#475569' }

/** Connect apps with explicit consent; syncs do real work in the books and are logged. */
export default function AppMarketplace() {
  const apps = useApi('/apps')
  const log = useApi('/apps/log')
  const spec = useApi('/developer/openapi.json')
  const [cat, setCat] = useState('all')
  const [consent, setConsent] = useState(null)
  const refresh = () => { apps.refetch(); log.refetch() }
  async function act(promise, done) {
    try { const r = await promise; toast.success(done(r)); refresh() } catch (err) { toast.error(err.message) }
  }
  const list = (apps.data ?? []).filter(a => cat === 'all' || (cat === 'connected' ? a.connection : a.category === cat))
  const cats = [...new Set((apps.data ?? []).map(a => a.category))]

  function downloadSpec() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(spec.data, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = 'unifiedtree-openapi.json'; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="space-y-4">
      <PageHeader title="App Marketplace" subtitle="Connect your shop, payments, CRM, messaging and payroll — each sync posts real entries you can trace" breadcrumb={['Settings', 'Apps']} />
      {apps.error && <ErrorBox error={apps.error} onRetry={refresh} />}
      <Segmented value={cat} onChange={setCat} options={[['all', 'All'], ['connected', `Connected (${(apps.data ?? []).filter(a => a.connection).length})`], ...cats.map(c => [c, c])]} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map(app => (
          <div key={app.id} className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-shadow hover:shadow-md">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold text-white" style={{ background: CATEGORY_TINT[app.category] ?? '#475569' }}>{app.name.slice(0, 2).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[var(--text)]">{app.name}</p>
                <p className="text-xs text-[var(--muted)]">{app.category}</p>
              </div>
              {app.connection && <span className="rounded-full bg-[var(--pos-tint)] px-2 py-0.5 text-[11px] font-bold text-[var(--pos)]">Connected</span>}
            </div>
            <p className="mt-3 flex-1 text-sm text-[var(--text)]">{app.blurb}</p>
            {app.connection && <p className="mt-2 text-[11px] text-[var(--faint)]">{app.connection.lastSync ? `Last sync ${new Date(app.connection.lastSync).toLocaleString()}` : 'Not synced yet'} · token {app.connection.token}</p>}
            <div className="mt-3 flex gap-2">
              {app.connection ? <>
                <Button size="sm" variant="primary" icon={RefreshCw} onClick={() => act(api.post(`/apps/${app.id}/sync`), r => r.message)}>Sync now</Button>
                <Button size="sm" variant="ghost" icon={Unplug} onClick={() => act(api.delete(`/apps/${app.id}`), () => `${app.name} disconnected and its token revoked`)}>Disconnect</Button>
              </> : <Button size="sm" variant="secondary" icon={Plug} onClick={() => setConsent({ app, scopes: app.scopes })}>Connect</Button>}
            </div>
          </div>
        ))}
      </div>

      {consent && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="consent-title">
          <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <h2 id="consent-title" className="flex items-center gap-2 text-base font-bold"><ShieldCheck size={18} className="text-[var(--primary)]" /> Allow {consent.app.name}?</h2>
              <button type="button" aria-label="Close" onClick={() => setConsent(null)} className="rounded border-0 bg-transparent p-1 text-[var(--muted)] cursor-pointer"><X size={16} /></button>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">{consent.app.name} is asking for permission to:</p>
            <div className="mt-3 space-y-2">
              {consent.app.scopes.map(s => (
                <label key={s} className="flex items-center gap-2 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm">
                  <input id={`scope-${s}`} type="checkbox" checked={consent.scopes.includes(s)} onChange={e => setConsent(c => ({ ...c, scopes: e.target.checked ? [...c.scopes, s] : c.scopes.filter(x => x !== s) }))} />
                  <span className="font-mono text-xs">{s}</span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-[var(--faint)]">You can disconnect at any time; the token is revoked immediately.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setConsent(null)}>Cancel</Button>
              <Button size="sm" variant="primary" disabled={!consent.scopes.length} onClick={() => { act(api.post(`/apps/${consent.app.id}/connect`, { consent: true, scopes: consent.scopes }), () => `${consent.app.name} connected`); setConsent(null) }}>Allow and connect</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Recent syncs" subtitle="What each sync created in your books">
          {(log.data ?? []).length === 0 ? <p className="text-sm text-[var(--muted)]">No syncs yet — connect an app and press Sync now.</p> : (
            <ul className="space-y-2">
              {(log.data ?? []).slice(0, 8).map((l, i) => (
                <li key={i} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                  <p className="flex justify-between gap-2"><strong>{l.appName}</strong><span className="text-xs text-[var(--faint)]">{new Date(l.at).toLocaleString()}</span></p>
                  <p className="text-[var(--muted)]">{l.message}</p>
                  {l.created.slice(0, 3).map(c => <p key={c.id} className="text-xs text-[var(--faint)]">+ {c.label}{c.amount ? ` · ${formatCurrency(c.amount)}` : ''}</p>)}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="For developers" subtitle="Build your own integration on the same API the app uses"
          action={<Button size="sm" variant="secondary" icon={Download} disabled={!spec.data} onClick={downloadSpec}>OpenAPI 3.0 file</Button>}>
          <p className="flex items-center gap-2 text-sm"><Code2 size={16} className="text-[var(--primary)]" /> {spec.data ? `${Object.keys(spec.data.paths).length} endpoints across ${spec.data.tags.length} areas` : 'Loading…'}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Import the file into Postman or Swagger, create an API key in Settings → Developer &amp; API, and subscribe to webhooks for invoices, payments and filings. A sandbox server is listed in the file for testing.</p>
        </Card>
      </div>
    </div>
  )
}
