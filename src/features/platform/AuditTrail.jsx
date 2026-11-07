import { useState } from 'react'
import { ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { api } from '../../data/api/client'
import { Chip, ErrorBox } from '../tax/global/shared'

/** Every change made through the backend, hash-chained so edits or deletions are detectable. */
export default function AuditTrail() {
  const log = useApi('/audit?limit=500')
  const [verify, setVerify] = useState(null)
  const [busy, setBusy] = useState(false)

  async function runVerify() {
    setBusy(true)
    try { setVerify(await api.get('/audit/verify')) } catch (err) { setVerify({ valid: false, reason: err.message }) } finally { setBusy(false) }
  }

  const columns = [
    { key: 'seq', label: '#', render: v => <span className="tabular text-xs text-[var(--muted)]">{v}</span> },
    { key: 'at', label: 'When', render: v => <span className="text-xs text-[var(--muted)]">{new Date(v).toLocaleString()}</span> },
    { key: 'user', label: 'Who', render: (v, r) => <div><p className="text-sm text-[var(--text)]">{v}</p><p className="text-xs text-[var(--muted)]">{r.role}</p></div> },
    { key: 'summary', label: 'What', render: (v, r) => <div><p className="text-sm text-[var(--text)]">{v}</p><p className="font-mono text-[10px] text-[var(--muted)]">{r.method} {r.path}</p></div> },
    { key: 'hash', label: 'Hash', render: v => <code className="text-[10px] text-[var(--muted)]">{v.slice(0, 16)}…</code> },
  ]

  return (
    <div>
      <PageHeader
        title="Tamper-proof Audit Trail"
        subtitle="Each entry stores the SHA-256 hash of the previous one — changing or deleting any entry breaks the chain"
        breadcrumb={['Settings', 'Audit Trail']}
        action={<div className="flex gap-2">
          <Button size="sm" variant="ghost" icon={RefreshCw} onClick={log.refetch}>Refresh</Button>
          <Button size="sm" variant="primary" icon={ShieldCheck} onClick={runVerify} disabled={busy}>{busy ? 'Verifying…' : 'Verify chain'}</Button>
        </div>}
      />
      <ErrorBox error={log.error} onRetry={log.refetch} />
      {verify && (
        <div className={`flex items-start gap-3 p-4 mb-4 rounded-[var(--radius-sm)] border ${verify.valid ? 'border-[var(--pos)] bg-[var(--pos-tint)]' : 'border-[var(--neg)] bg-[var(--neg-tint)]'}`}>
          {verify.valid ? <ShieldCheck size={18} className="text-[var(--pos)]" /> : <ShieldAlert size={18} className="text-[var(--neg)]" />}
          <div className="text-sm">
            <p className="font-semibold text-[var(--text)]">{verify.valid ? `Chain intact — ${verify.entries} entries verified` : `Chain broken at entry #${verify.brokenAt}`}</p>
            <p className="text-[var(--muted)]">{verify.valid ? <>Head hash <code>{verify.head?.slice(0, 32)}…</code></> : verify.reason}</p>
          </div>
        </div>
      )}
      <DataTable columns={columns} data={log.data ?? []} loading={log.loading} rowKey="seq" emptyState={<p className="p-6 text-sm text-[var(--muted)]">No changes recorded yet. Every create, update, filing and payment appears here.</p>} />
      <div className="mt-3"><Chip tone="muted" label="Retention: last 2,000 entries per company in demo mode" /></div>
    </div>
  )
}
