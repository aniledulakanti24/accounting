import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { DatabaseBackup, RotateCcw, Download, ShieldCheck, Smartphone, LogOut, Globe2, Activity, KeyRound } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { api } from '../../data/api/client'
import { toast } from '../../lib/toast'
import { useAppStore } from '../../store/useAppStore'
import { ErrorBox, Chip } from '../tax/global/shared'
import { Card, Table, Stat } from './ui'
import { inputCls } from './styles'

const kb = n => `${Math.max(1, Math.round(n / 1024))} KB`

/** Backups, restore, export, data region, service status and your own sign-in security. */
export default function BackupSecurity() {
  const me = useAppStore(s => s.session?.user)
  const backups = useApi('/platform/backups')
  const region = useApi('/platform/region')
  const status = useApi('/platform/status')
  const security = useApi('/security/overview')
  const [setup, setSetup] = useState(null)
  const [qr, setQr] = useState('')
  const [code, setCode] = useState('')
  const [confirmRestore, setConfirmRestore] = useState(null)
  const refresh = () => { backups.refetch(); region.refetch(); security.refetch() }
  async function act(promise, done) {
    try { const r = await promise; toast.success(done(r)); refresh(); return r } catch (err) { toast.error(err.message); return null }
  }
  useEffect(() => {
    if (!setup?.otpauthUrl) return
    QRCode.toDataURL(setup.otpauthUrl, { margin: 1, width: 180 }).then(setQr, () => setQr(''))
  }, [setup])

  async function exportAll() {
    try {
      const data = await api.get('/platform/export')
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
      const a = document.createElement('a'); a.href = url; a.download = `unifiedtree-export-${data.company.id}-${data.exportedAt.slice(0, 10)}.json`; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success('Export downloaded')
    } catch (err) { toast.error(err.message) }
  }
  const sec = security.data

  return (
    <div className="space-y-4">
      <PageHeader title="Backup & Security" subtitle="Encrypted backups, your data to take anywhere, where it's stored, and how you sign in" breadcrumb={['Settings', 'Backup & Security']} />
      {backups.error && <ErrorBox error={backups.error} onRetry={refresh} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Latest backup" value={backups.data?.[0] ? new Date(backups.data[0].at).toLocaleDateString() : '—'} hint={backups.data?.[0] ? `${backups.data[0].kind} · AES-256-GCM` : ''} />
        <Stat label="Backups kept" value={backups.data?.length ?? '—'} hint="Last 10, one automatic a day" />
        <Stat label="Data region" value={region.data?.current?.name ?? '—'} hint={region.data?.current?.law} />
        <Stat label="Two-factor sign-in" value={sec ? (sec.mfaEnabled ? 'On' : 'Off') : '—'} tone={sec?.mfaEnabled ? 'pos' : 'warn'} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card title="Backups" subtitle="Encrypted with your company's own key; the checksum is verified before any restore"
          action={<span className="flex gap-2">
            <Button size="sm" variant="ghost" icon={Download} onClick={exportAll}>Export everything</Button>
            <Button size="sm" variant="primary" icon={DatabaseBackup} onClick={() => act(api.post('/platform/backups'), b => `Backup ${b.id} taken`)}>Back up now</Button>
          </span>}>
          <Table columns={[
            { key: 'at', label: 'Taken', render: b => new Date(b.at).toLocaleString() },
            { key: 'kind', label: 'Type', render: b => <Chip tone={b.kind === 'manual' ? 'primary' : b.kind === 'automatic' ? 'muted' : 'warn'} label={b.kind} /> },
            { key: 'counts', label: 'Contains', render: b => <span className="text-xs text-[var(--muted)]">{b.counts.journals} journals · {b.counts.invoices} invoices</span> },
            { key: 'size', label: 'Size', align: 'right', render: b => kb(b.sizeBytes) },
            { key: 'checksum', label: 'SHA-256', render: b => <span className="font-mono text-[11px]" title={b.checksum}>{b.checksum.slice(0, 10)}…</span> },
            { key: 'r', label: '', render: b => confirmRestore === b.id
              ? <span className="flex justify-end gap-1"><Button size="sm" variant="danger" onClick={() => { setConfirmRestore(null); act(api.post(`/platform/backups/${b.id}/restore`), r => `Restored — safety copy ${r.safetyBackup} kept`) }}>Confirm restore</Button><Button size="sm" variant="ghost" onClick={() => setConfirmRestore(null)}>Cancel</Button></span>
              : <span className="flex justify-end"><Button size="sm" variant="ghost" icon={RotateCcw} disabled={me?.role !== 'Super Admin'} title={me?.role !== 'Super Admin' ? 'Only a Super Admin can restore' : undefined} onClick={() => setConfirmRestore(b.id)}>Restore</Button></span> },
          ]} rows={backups.data ?? []} />
        </Card>

        <div className="space-y-4">
          <Card title="Where your data lives" subtitle="Choose the region that matches your data-protection law">
            <div className="flex items-center gap-2">
              <Globe2 size={16} className="text-[var(--primary)]" />
              <select id="region" className={inputCls} value={region.data?.current?.id ?? ''} onChange={e => act(api.put('/platform/region', { region: e.target.value }), r => `Data region: ${r.current.name}`)}>
                {(region.data?.options ?? []).map(o => <option key={o.id} value={o.id}>{o.name} — {o.law}</option>)}
              </select>
            </div>
          </Card>
          <Card title="Service status" subtitle={status.data ? `${status.data.overall} · API ${status.data.latencyMs} ms` : 'Checking…'}>
            <ul className="space-y-1.5">
              {(status.data?.components ?? []).map(c => (
                <li key={c.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${c.status === 'operational' ? 'bg-[var(--pos)]' : 'bg-[var(--warn)]'}`} />{c.name}</span>
                  <span className="tabular text-xs text-[var(--muted)]">{c.uptime90d}% · 90 days</span>
                </li>
              ))}
            </ul>
            {status.data?.incidents?.[0] && <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--faint)]"><Activity size={12} /> Last incident {status.data.incidents[0].date}: {status.data.incidents[0].title} ({status.data.incidents[0].minutes} min, resolved)</p>}
          </Card>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Two-factor sign-in" subtitle="A code from an authenticator app (Google, Microsoft, Authy) is needed after your password">
          {sec?.mfaEnabled ? (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-[var(--pos)]"><ShieldCheck size={16} /> On for {me?.email}</p>
              <div className="flex gap-2">
                <input id="mfa-off-code" inputMode="numeric" maxLength={6} placeholder="Current code" className={`${inputCls} !w-36 font-mono`} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} />
                <Button size="sm" variant="ghost" onClick={async () => { if (await act(api.post('/security/2fa/disable', { code }), () => 'Two-factor sign-in turned off')) setCode('') }}>Turn off</Button>
              </div>
            </div>
          ) : setup ? (
            <div className="flex flex-wrap gap-4">
              {qr && <img src={qr} alt="QR code to add UnifiedTree to your authenticator app" width={150} height={150} className="rounded-lg border border-[var(--border)] bg-white p-1" />}
              <div className="min-w-0 flex-1 space-y-2 text-sm">
                <p>1. Scan the code with your authenticator app, or enter this key:</p>
                <p className="break-all rounded bg-[var(--surface-2)] px-2 py-1 font-mono text-xs">{setup.secret.match(/.{1,4}/g).join(' ')}</p>
                <p>2. Type the 6-digit code it shows:</p>
                <div className="flex gap-2">
                  <input id="mfa-code" inputMode="numeric" maxLength={6} className={`${inputCls} !w-32 text-center font-mono tracking-widest`} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} aria-label="Code from your app" />
                  <Button size="sm" variant="primary" disabled={code.length !== 6} onClick={async () => { if (await act(api.post('/security/2fa/enable', { code }), () => 'Two-factor sign-in is on')) { setSetup(null); setCode('') } }}>Turn on</Button>
                </div>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="primary" icon={Smartphone} onClick={async () => { try { setSetup(await api.post('/security/2fa/setup')) } catch (err) { toast.error(err.message) } }}>Set up two-factor sign-in</Button>
          )}
        </Card>

        <Card title="Where you're signed in" subtitle="Sign out any device you don't recognise">
          <ul className="space-y-2">
            {(sec?.sessions ?? []).map(s => (
              <li key={s.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                <KeyRound size={15} className="text-[var(--muted)]" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{s.device}{s.current && <span className="ms-2 rounded-full bg-[var(--primary-tint)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--primary)]">This device</span>}</span>
                  <span className="block text-xs text-[var(--muted)]">{s.createdAt ? `Signed in ${new Date(s.createdAt).toLocaleString()}` : 'Earlier session'} · ends {new Date(s.expiresAt).toLocaleTimeString()}{s.mfa ? ' · with 2FA' : ''}</span>
                </span>
                {!s.current && <Button size="sm" variant="ghost" icon={LogOut} onClick={() => act(api.delete(`/security/sessions/${s.id}`), () => 'Signed out that device')}>Sign out</Button>}
              </li>
            ))}
          </ul>
          {sec && <p className="mt-3 text-xs text-[var(--faint)]">Passwords: at least {sec.passwordPolicy.minLength} characters, {sec.passwordPolicy.hashing}. Data encrypted {sec.encryption.atRest} at rest, {sec.encryption.inTransit} in transit.</p>}
        </Card>
      </div>
    </div>
  )
}
