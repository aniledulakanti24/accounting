import { useState, useEffect } from 'react'
import {
  UserCheck, Copy, QrCode, ShieldCheck, Eye, EyeOff,
  Clock, MessageSquare, CheckCircle2, Circle, Pencil,
  RefreshCw, Link, Trash2, Plus,
} from 'lucide-react'
import PageHeader   from '../../components/layout/PageHeader'
import Button       from '../../components/ui/Button'
import StatusBadge  from '../../components/ui/StatusBadge'
import { formatCurrency, localizeMoneyText } from '../../lib/currency'
import { toast }    from '../../lib/toast'

/* ── Mock data ── */
const MOCK_SESSIONS = [
  {
    id: 'CA-2024-001', caName: 'Ramesh Gupta & Associates', email: 'ramesh@rga.in',
    gstin: '27AAPCA1234R1Z1', phone: '+91 98200 45678',
    expiresAt: '2025-01-10', createdAt: '2024-12-25', status: 'active',
    scope: ['Financial Statements', 'GST Returns', 'Audit Logs', 'Bank Statements'],
    lastActive: '2 hours ago', activityCount: 14,
  },
  {
    id: 'CA-2024-002', caName: 'Priya Mehta, CA', email: 'priya@priyamehta.in',
    gstin: null, phone: '+91 87654 32100',
    expiresAt: '2024-12-20', createdAt: '2024-12-01', status: 'expired',
    scope: ['Financial Statements', 'GST Returns'],
    lastActive: '10 days ago', activityCount: 31,
  },
]

const ALL_PERMISSIONS = [
  { id: 'financial', label: 'Financial Statements', icon: Eye,          risky: false },
  { id: 'gst',       label: 'GST Returns',          icon: ShieldCheck,  risky: false },
  { id: 'bank',      label: 'Bank Statements',      icon: Eye,          risky: true  },
  { id: 'audit',     label: 'Audit Logs',            icon: Eye,          risky: false },
  { id: 'payroll',   label: 'Payroll Data',          icon: EyeOff,       risky: true  },
  { id: 'inventory', label: 'Inventory',             icon: Eye,          risky: false },
]

const ACTIVITY_LOG = [
  { id: 1, caName: 'Ramesh Gupta', action: 'Viewed GSTR-3B for Nov 2024',               time: '2 hours ago'  },
  { id: 2, caName: 'Ramesh Gupta', action: 'Downloaded Trial Balance — FY 2024–25',      time: '3 hours ago'  },
  { id: 3, caName: 'Ramesh Gupta', action: 'Annotated: "Check depreciation on Plant A"', time: '5 hours ago'  },
  { id: 4, caName: 'Ramesh Gupta', action: 'Viewed Profit & Loss Statement',             time: '1 day ago'    },
  { id: 5, caName: 'Ramesh Gupta', action: 'Reviewed Bank Reconciliation',               time: '1 day ago'    },
  { id: 6, caName: 'Priya Mehta',  action: 'Viewed GSTR-1 for Oct 2024',                time: '12 days ago'  },
]

const ANNOTATIONS = [
  { id: 1, caName: 'Ramesh Gupta', module: 'P&L Statement',          note: 'Depreciation amount seems high — please share asset register.',   time: '3 hours ago', resolved: false },
  { id: 2, caName: 'Ramesh Gupta', module: 'Bank Reconciliation',    note: 'Transaction on Dec 10 ₹4,200 — what is this bank charge for?',    time: '5 hours ago', resolved: false },
  { id: 3, caName: 'Priya Mehta',  module: 'GST Returns — Oct 2024', note: 'ITC reversal Rule 42 needs to be checked again. Confirm figures.', time: '12 days ago', resolved: true  },
]

/* ── QR SVG (hardcoded simple QR pattern for demo) ── */
function QrIcon({ url }) {
  return (
    <div className="p-3 rounded-xl border border-[var(--border)] bg-white flex items-center justify-center">
      <QrCode size={80} style={{ color: 'var(--text)' }} />
    </div>
  )
}

/* ── Countdown badge ── */
function ExpiryBadge({ expiresAt }) {
  const days = Math.ceil((new Date(expiresAt) - Date.now()) / 86400000)
  if (days < 0) return <span className="text-[11px] font-semibold text-[var(--faint)]">Expired</span>
  const color = days <= 3 ? 'var(--neg)' : days <= 7 ? 'var(--warn)' : 'var(--pos)'
  const bg    = days <= 3 ? 'var(--neg-tint)' : days <= 7 ? 'var(--warn-tint)' : 'var(--pos-tint)'
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>
      <Clock size={9} />{days}d left
    </span>
  )
}

/* ── New access modal ── */
function NewAccessModal({ onClose, onCreate }) {
  const [name,   setName]   = useState('')
  const [email,  setEmail]  = useState('')
  const [days,   setDays]   = useState(7)
  const [scope,  setScope]  = useState(new Set(['financial', 'gst', 'audit']))

  function toggleScope(id) {
    setScope(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function handleCreate() {
    if (!name.trim() || !email.trim()) { toast.error('CA name and email required'); return }
    onCreate({ caName: name, email, expiresInDays: days, scope: [...scope].map(id => ALL_PERMISSIONS.find(p => p.id === id)?.label).filter(Boolean) })
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-[900] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed z-[910] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden"
        style={{ animation: 'fadeInUp 200ms cubic-bezier(0.16,1,0.3,1) both' }}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-600))' }}>
            <UserCheck size={14} color="#fff" />
          </div>
          <p className="text-sm font-bold text-[var(--text)] flex-1">Grant CA Access</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--faint)]">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1.5">CA Firm / Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ramesh Gupta & Associates"
              className="w-full h-10 px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1.5">Email *</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="ca@firm.in"
              className="w-full h-10 px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">Access Duration</label>
            <div className="flex gap-2">
              {[7, 14, 30, 90].map(d => (
                <button key={d} onClick={() => setDays(d)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg border transition-all"
                  style={{
                    borderColor: days === d ? 'var(--primary)' : 'var(--border)',
                    background:  days === d ? 'var(--primary-tint)' : 'transparent',
                    color:       days === d ? 'var(--primary)' : 'var(--muted)',
                  }}
                >{d}d</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">Read-Only Permissions</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_PERMISSIONS.map(p => {
                const selected = scope.has(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleScope(p.id)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all"
                    style={{
                      borderColor: selected ? 'var(--primary)' : 'var(--border)',
                      background:  selected ? 'var(--primary-tint)' : 'var(--surface-2)',
                    }}
                  >
                    {selected ? <CheckCircle2 size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} /> : <Circle size={13} style={{ color: 'var(--faint)', flexShrink: 0 }} />}
                    <span className="text-xs font-medium" style={{ color: selected ? 'var(--text)' : 'var(--muted)' }}>{p.label}</span>
                    {p.risky && <span className="ml-auto text-[9px] font-bold text-[var(--warn)]">Sensitive</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="primary" className="flex-1" onClick={handleCreate}>Generate Access Link</Button>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translate(-50%,-48%) scale(0.97); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }`}</style>
    </>
  )
}

/* ── Main ── */
export default function CACollaborationMode() {
  const [sessions,    setSessions]    = useState(MOCK_SESSIONS)
  const [annotations, setAnnotations] = useState(ANNOTATIONS)
  const [selected,    setSelected]    = useState(sessions[0])
  const [newModal,    setNewModal]    = useState(false)
  const [tab,         setTab]         = useState('overview') // overview | activity | annotations

  const ACCESS_URL = `https://ca.unifiedtree.app/access/${selected?.id?.toLowerCase()}`

  function copyLink() {
    navigator.clipboard.writeText(ACCESS_URL)
      .then(() => toast.success('Access link copied to clipboard'))
      .catch(() => toast.error('Copy failed'))
  }

  function revoke(id) {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'expired' } : s))
    toast.success('Access revoked')
  }

  function handleCreate({ caName, email, scope, expiresInDays }) {
    const newSession = {
      id: `CA-2024-${String(sessions.length + 1).padStart(3, '0')}`,
      caName, email, gstin: null, phone: null,
      expiresAt: new Date(Date.now() + expiresInDays * 86400000).toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),
      status: 'active', scope, lastActive: 'Just now', activityCount: 0,
    }
    setSessions(prev => [newSession, ...prev])
    setSelected(newSession)
    toast.success(`Access link created for ${caName}`)
  }

  function resolveAnnotation(id) {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a))
    toast.success('Annotation marked as resolved')
  }

  const TABS = [
    { id: 'overview',     label: 'Access Link'  },
    { id: 'activity',     label: 'Activity Log' },
    { id: 'annotations',  label: `Notes (${annotations.filter(a => !a.resolved).length})` },
  ]

  return (
    <div>
      <PageHeader
        title="CA Collaboration Mode"
        subtitle="Secure read-only access for chartered accountants — with annotations"
        breadcrumb={['Team & Tools', 'CA Collaboration']}
        action={<Button variant="primary" icon={Plus} onClick={() => setNewModal(true)}>Grant CA Access</Button>}
      />

      {newModal && <NewAccessModal onClose={() => setNewModal(false)} onCreate={handleCreate} />}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* ── Session list ── */}
        <div className="xl:col-span-1 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Active Sessions</p>
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="w-full text-left p-4 rounded-xl border transition-all"
              style={{
                borderColor: selected?.id === s.id ? 'var(--primary)' : 'var(--border)',
                background:  selected?.id === s.id ? 'var(--primary-tint)' : 'var(--surface)',
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-bold text-[var(--text)] leading-tight">{s.caName}</p>
                <StatusBadge status={s.status} />
              </div>
              <p className="text-xs text-[var(--muted)]">{s.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {s.status === 'active' && <ExpiryBadge expiresAt={s.expiresAt} />}
                <span className="text-[10px] text-[var(--faint)]">{s.activityCount} actions</span>
              </div>
            </button>
          ))}
        </div>

        {/* ── Detail panel ── */}
        {selected && (
          <div className="xl:col-span-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
            {/* Detail header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div>
                <p className="text-sm font-bold text-[var(--text)]">{selected.caName}</p>
                <p className="text-xs text-[var(--muted)]">{selected.email} · Last active {selected.lastActive}</p>
              </div>
              {selected.status === 'active' && (
                <button
                  onClick={() => revoke(selected.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--neg)] hover:bg-[var(--neg-tint)] px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 size={12} /> Revoke
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 border-b border-[var(--border)]">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors"
                  style={{
                    borderColor: tab === t.id ? 'var(--primary)' : 'transparent',
                    color:       tab === t.id ? 'var(--primary)' : 'var(--muted)',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* Overview tab */}
              {tab === 'overview' && (
                <div className="space-y-4">
                  {/* Access link */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
                    <QrIcon url={ACCESS_URL} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Secure Access Link</p>
                      <div className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] mb-3">
                        <Link size={11} style={{ color: 'var(--faint)', flexShrink: 0 }} />
                        <p className="text-xs font-mono text-[var(--muted)] truncate flex-1">{ACCESS_URL}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="primary" icon={Copy} onClick={copyLink}>Copy Link</Button>
                        <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => toast.info('Generating new link…')}>Regenerate</Button>
                      </div>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Permissions (Read-Only)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {ALL_PERMISSIONS.map(p => {
                        const granted = selected.scope.includes(p.label)
                        return (
                          <div
                            key={p.id}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
                            style={{
                              borderColor: granted ? 'var(--primary)' : 'var(--border)',
                              background:  granted ? 'var(--primary-tint)' : 'var(--surface-2)',
                              color:       granted ? 'var(--text)' : 'var(--faint)',
                            }}
                          >
                            {granted ? <CheckCircle2 size={12} style={{ color: 'var(--primary)' }} /> : <Circle size={12} />}
                            <span className="text-xs">{p.label}</span>
                            {p.risky && granted && <span className="ml-auto text-[9px] font-bold text-[var(--warn)]">Sensitive</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Expiry info */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
                    <div className="text-xs text-[var(--muted)]">
                      Created <strong className="text-[var(--text)]">{selected.createdAt}</strong> · Expires <strong className="text-[var(--text)]">{selected.expiresAt}</strong>
                    </div>
                    {selected.status === 'active' && <ExpiryBadge expiresAt={selected.expiresAt} />}
                  </div>
                </div>
              )}

              {/* Activity tab */}
              {tab === 'activity' && (
                <div className="space-y-2">
                  {ACTIVITY_LOG.filter(a => a.caName === selected.caName.split(' ')[0] || selected.caName.startsWith(a.caName)).map(a => (
                    <div key={a.id} className="flex items-start gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--primary-tint)' }}>
                        <Eye size={10} style={{ color: 'var(--primary)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text)]">{a.action}</p>
                        <p className="text-[10px] text-[var(--faint)] mt-0.5">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Annotations tab */}
              {tab === 'annotations' && (
                <div className="space-y-3">
                  {ANNOTATIONS.filter(a => a.caName.startsWith(selected.caName.split(' ')[0])).length === 0 && (
                    <p className="text-sm text-[var(--faint)] text-center py-8">No annotations from this CA yet.</p>
                  )}
                  {ANNOTATIONS.filter(a => a.caName.startsWith(selected.caName.split(' ')[0])).map(a => (
                    <div
                      key={a.id}
                      className="p-4 rounded-xl border transition-all"
                      style={{
                        borderColor: a.resolved ? 'var(--border)' : 'var(--primary)',
                        background:  a.resolved ? 'var(--surface-2)' : 'var(--primary-tint)',
                        opacity:     a.resolved ? 0.6 : 1,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare size={12} style={{ color: a.resolved ? 'var(--faint)' : 'var(--primary)' }} />
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: a.resolved ? 'var(--faint)' : 'var(--primary)' }}>
                            {a.module}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--faint)]">{a.time}</span>
                          {a.resolved
                            ? <span className="text-[10px] font-semibold text-[var(--pos)]">✓ Resolved</span>
                            : <button onClick={() => resolveAnnotation(a.id)} className="text-[10px] font-semibold text-[var(--primary)] hover:underline">Mark Resolved</button>
                          }
                        </div>
                      </div>
                      <p className="text-sm text-[var(--text)] leading-relaxed">{localizeMoneyText(a.note)}</p>
                      <p className="text-[10px] text-[var(--faint)] mt-1.5">— {a.caName}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
