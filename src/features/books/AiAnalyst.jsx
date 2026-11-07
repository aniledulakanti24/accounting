import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Sparkles, Send, AlertTriangle, ShieldAlert, Info, ArrowRight } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { api } from '../../data/api/client'
import { toast } from '../../lib/toast'
import { formatCompact, formatCurrency } from '../../lib/currency'
import { Card, Stat } from './ui'
import { inputCls } from './styles'

const SUGGESTED = ['What was profit this month?', 'Who owes us money?', 'Which invoices are overdue?', 'How much GST do we owe?', 'Who is our biggest customer this year?', 'How much stock do we have?']
const SEV = { high: ['var(--neg)', ShieldAlert], medium: ['var(--warn)', AlertTriangle], low: ['var(--primary)', Info] }

/** Ask questions in plain words, see what looks wrong, and where cash is heading — all from the books. */
export default function AiAnalyst() {
  const navigate = useNavigate()
  const issues = useApi('/ai/anomalies')
  const fc = useApi('/ai/forecast?months=6')
  const [q, setQ] = useState('')
  const [answers, setAnswers] = useState([])
  const [busy, setBusy] = useState(false)
  async function askIt(text) {
    const question = (text ?? q).trim()
    if (!question) return
    setBusy(true)
    try { const r = await api.post('/ai/ask', { question }); setAnswers(a => [r, ...a].slice(0, 6)); setQ('') } catch (err) { toast.error(err.message) } finally { setBusy(false) }
  }
  const chart = fc.data ? [...fc.data.history.map(h => ({ label: h.month, net: h.net })), ...fc.data.projection.map(p => ({ label: p.month, projected: p.net, balance: p.balance }))] : []

  return (
    <div className="space-y-4">
      <PageHeader title="AI Analyst" subtitle="Plain-language answers, checks a controller would run, and a cash forecast — every number traced to a report" />

      <Card>
        <form onSubmit={e => { e.preventDefault(); askIt() }} className="flex gap-2">
          <div className="relative flex-1">
            <Sparkles size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)]" />
            <input id="ai-q" value={q} onChange={e => setQ(e.target.value)} placeholder="Ask about sales, profit, cash, GST, stock…" className={`${inputCls} !h-10 pl-9`} />
          </div>
          <Button variant="primary" icon={Send} disabled={busy || !q.trim()} type="submit">Ask</Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED.map(s => <button key={s} type="button" onClick={() => askIt(s)} className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--text)] cursor-pointer">{s}</button>)}
        </div>
        {answers.length > 0 && (
          <ul className="mt-4 space-y-2">
            {answers.map((a, i) => (
              <li key={i} className="rounded-lg bg-[var(--surface-2)] px-4 py-3" style={{ animation: i === 0 ? 'utFadeUp 280ms ease both' : undefined }}>
                <p className="text-xs font-semibold text-[var(--muted)]">{a.question}</p>
                <p className="mt-1 text-sm text-[var(--text)]">{a.answer}</p>
                {a.source && <button type="button" onClick={() => navigate(a.link)} className="mt-1.5 flex items-center gap-1 border-0 bg-transparent p-0 text-xs font-semibold text-[var(--primary)] cursor-pointer">From: {a.source} <ArrowRight size={12} /></button>}
              </li>
            ))}
          </ul>
        )}
        <style>{'@keyframes utFadeUp{from{opacity:0;transform:translateY(6px)}}'}</style>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card title="Cash forecast" subtitle={fc.data ? `${fc.data.method}. ${fc.data.runway}.` : 'Working it out…'}>
          {fc.data && (
            <>
              <div className="mb-3 grid grid-cols-3 gap-2">
                <Stat label="Cash today" value={formatCompact(fc.data.cashToday)} />
                <Stat label="Trend per month" value={`${fc.data.trendPerMonth >= 0 ? '+' : ''}${formatCompact(fc.data.trendPerMonth)}`} tone={fc.data.trendPerMonth >= 0 ? 'pos' : 'neg'} />
                <Stat label={`In ${fc.data.projection.length} months`} value={formatCompact(fc.data.projection.at(-1).balance)} />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--faint)' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => formatCompact(v)} width={58} tick={{ fontSize: 11, fill: 'var(--faint)' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="net" name="Net cash (actual)" fill="#0f766e" radius={[4, 4, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="projected" name="Net cash (forecast)" fill="#0f766e" fillOpacity={0.35} radius={[4, 4, 0, 0]} maxBarSize={26} />
                  <Line dataKey="balance" name="Projected balance" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
              <p className="mt-2 text-xs text-[var(--muted)]">Expected from open invoices: {fc.data.expectedCollections.map(e => `${formatCompact(e.amount)} within ${e.withinDays} days`).join(' · ')} (overdue counted at 60%).</p>
            </>
          )}
        </Card>

        <Card title="Things that look wrong" subtitle={issues.data ? `${issues.data.length} check(s) flagged` : 'Checking…'}>
          {issues.data?.length === 0 && <p className="text-sm text-[var(--muted)]">Nothing unusual in the books.</p>}
          <ul className="space-y-2">
            {(issues.data ?? []).slice(0, 8).map((a, i) => {
              const [color, Icon] = SEV[a.severity]
              return (
                <li key={i}>
                  <button type="button" onClick={() => navigate(a.link)} className="flex w-full gap-2.5 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-left hover:border-[var(--primary)] cursor-pointer">
                    <Icon size={16} className="mt-0.5 shrink-0" style={{ color }} />
                    <span><span className="block text-sm font-semibold text-[var(--text)]">{a.title}</span><span className="block text-xs text-[var(--muted)]">{a.detail}</span></span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </div>
  )
}
