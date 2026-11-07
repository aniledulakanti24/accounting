import { useState } from 'react'
import { UserPlus, Star, LifeBuoy, Search, Copy, Ban, Clock } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { api } from '../../data/api/client'
import { toast } from '../../lib/toast'
import { Chip } from '../tax/global/shared'
import { Card, Table } from './ui'
import { inputCls } from './styles'

/** Bring in your accountant, find a certified partner, and get help. */
export default function AccountantHub() {
  const accountants = useApi('/accountants')
  const tickets = useApi('/support/tickets')
  const [q, setQ] = useState('')
  const [helpQ, setHelpQ] = useState('')
  const partners = useApi(`/partners?q=${encodeURIComponent(q)}`)
  const help = useApi(`/help/articles?q=${encodeURIComponent(helpQ)}`)
  const [invite, setInvite] = useState({ name: '', email: '', firm: '' })
  const [ticket, setTicket] = useState({ subject: '', message: '', priority: 'normal' })
  async function act(promise, done, after) {
    try { const r = await promise; toast.success(done(r)); after?.() } catch (err) { toast.error(err.message) }
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast.success('Invite link copied') } catch { toast.info(text) }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Accountants & Support" subtitle="Invite your CA, find a certified partner near you, and get answers fast" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Your accountants" subtitle="They get the CA / Auditor role: see everything, file returns, change nothing else">
          <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)_auto]">
            <input id="ca-name" placeholder="Name" className={inputCls} value={invite.name} onChange={e => setInvite(x => ({ ...x, name: e.target.value }))} />
            <input id="ca-email" type="email" placeholder="Email" className={inputCls} value={invite.email} onChange={e => setInvite(x => ({ ...x, email: e.target.value }))} />
            <input id="ca-firm" placeholder="Firm" className={inputCls} value={invite.firm} onChange={e => setInvite(x => ({ ...x, firm: e.target.value }))} />
            <Button size="sm" variant="primary" icon={UserPlus} onClick={() => act(api.post('/accountants', invite), a => `Invite sent to ${a.email}`, () => { setInvite({ name: '', email: '', firm: '' }); accountants.refetch() })}>Invite</Button>
          </div>
          <Table columns={[
            { key: 'name', label: 'Accountant', render: a => <span><strong>{a.name}</strong><span className="block text-xs text-[var(--muted)]">{a.email}{a.firm ? ` · ${a.firm}` : ''}</span></span> },
            { key: 'status', label: 'Status', render: a => <Chip tone={a.status === 'revoked' ? 'neg' : 'warn'} label={a.status} /> },
            { key: 'x', label: '', render: a => a.status !== 'revoked' && <span className="flex justify-end gap-1">
              <Button size="sm" variant="ghost" icon={Copy} onClick={() => copy(a.link)}>Link</Button>
              <Button size="sm" variant="ghost" icon={Ban} onClick={() => act(api.delete(`/accountants/${a.id}`), () => 'Access revoked', accountants.refetch)}>Revoke</Button>
            </span> },
          ]} rows={accountants.data ?? []} empty="No accountants invited yet" />
        </Card>

        <Card title="Find a certified partner" subtitle="Firms trained on UnifiedTree — your country first">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input id="partner-q" placeholder="City, language or speciality (e.g. GST, Tally migration)" className={`${inputCls} pl-8`} value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <ul className="space-y-2">
            {(partners.data ?? []).slice(0, 5).map(p => (
              <li key={p.name} className="rounded-lg border border-[var(--border)] px-3 py-2">
                <p className="flex items-center justify-between gap-2 text-sm"><strong>{p.name}</strong><span className="flex items-center gap-1 text-xs"><Star size={12} className="fill-[var(--warn)] text-[var(--warn)]" />{p.rating}</span></p>
                <p className="text-xs text-[var(--muted)]">{p.city} · {p.certified} partner · {p.clients} clients · {p.languages.join(', ')}</p>
                <p className="mt-1 flex flex-wrap gap-1">{p.focus.map(f => <span key={f} className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[11px]">{f}</span>)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Help centre" subtitle="Short answers to common questions">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input id="help-q" placeholder="Search help — e.g. GSTR-2B, backup, Tally" className={`${inputCls} pl-8`} value={helpQ} onChange={e => setHelpQ(e.target.value)} />
          </div>
          <ul className="space-y-2">
            {(help.data ?? []).slice(0, 6).map(h => (
              <li key={h.id}><details className="rounded-lg border border-[var(--border)] px-3 py-2"><summary className="cursor-pointer text-sm font-semibold">{h.title}</summary><p className="mt-1.5 text-sm text-[var(--muted)]">{h.body}</p></details></li>
            ))}
          </ul>
        </Card>

        <Card title="Contact support" subtitle="Response targets: urgent 1 hour · high 4 hours · normal 1 day">
          <div className="space-y-2">
            <input id="tkt-subject" placeholder="What's wrong?" className={inputCls} value={ticket.subject} onChange={e => setTicket(x => ({ ...x, subject: e.target.value }))} />
            <textarea id="tkt-message" rows={3} placeholder="Steps you took and what you expected" className={`${inputCls} !h-auto py-2`} value={ticket.message} onChange={e => setTicket(x => ({ ...x, message: e.target.value }))} />
            <div className="flex gap-2">
              <select id="tkt-priority" className={`${inputCls} !w-40`} value={ticket.priority} onChange={e => setTicket(x => ({ ...x, priority: e.target.value }))}>
                <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent — can't work</option>
              </select>
              <Button size="sm" variant="primary" icon={LifeBuoy} onClick={() => act(api.post('/support/tickets', ticket), t => `Ticket ${t.id} opened`, () => { setTicket({ subject: '', message: '', priority: 'normal' }); tickets.refetch() })}>Send</Button>
            </div>
          </div>
          <ul className="mt-3 space-y-2">
            {(tickets.data ?? []).slice(0, 4).map(t => (
              <li key={t.id} className="rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm">
                <p className="flex justify-between gap-2"><strong>{t.id} · {t.subject}</strong><Chip tone={t.priority === 'urgent' || t.priority === 'high' ? 'warn' : 'muted'} label={t.priority} /></p>
                <p className="flex items-center gap-1 text-xs text-[var(--muted)]"><Clock size={11} /> Reply by {new Date(t.respondBy).toLocaleString()}</p>
                <p className="mt-1 text-xs text-[var(--faint)]">{t.replies.at(-1)?.text}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
