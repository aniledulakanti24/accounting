import { useMemo, useState } from 'react'
import { Plus, RotateCcw, Scale, TrendingDown, TrendingUp } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, YAxis, Tooltip } from 'recharts'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { api } from '../../data/api/client'
import { formatCurrency, formatCompact, formatNumber } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { useAppStore } from '../../store/useAppStore'
import { Chip, KpiStrip, ErrorBox } from '../tax/global/shared'
import { fmtDate } from '../tax/global/taxUtils'
import { SettleModal, NewFxDocumentModal } from './fx/FxModals'

const pnl = v => (v > 0 ? 'var(--pos)' : v < 0 ? 'var(--neg)' : 'var(--text)')
const signed = v => `${v > 0 ? "+" : ""}${formatCurrency(v)}`
const signedCompact = v => `${v > 0 ? "+" : ""}${formatCompact(v)}`

function ExposureCard({ row, base }) {
  const { t } = useTranslation()
  const { data } = useApi(`/fx/history?currency=${row.currency}&days=90`)
  const up = row.change30d >= 0
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-[var(--text)]">{row.currency}</p>
          <p className="tabular text-xs text-[var(--muted)]">1 {row.currency} = {formatNumber(row.rate, 6)} {base}</p>
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold ${up ? 'text-[var(--pos)]' : 'text-[var(--neg)]'}`}>
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{row.change30d > 0 ? '+' : ''}{formatNumber(row.change30d)}% 30d
        </span>
      </div>
      <div className="h-12 my-2">
        {data?.points && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <Tooltip formatter={v => [v, `${base} per ${row.currency}`]} labelFormatter={(_, p) => p?.[0]?.payload?.date ?? ''} contentStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="rate" stroke="var(--primary)" fill="var(--primary-tint)" strokeWidth={1.5} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <span className="text-[var(--muted)]">{t('fx.receivable')}</span><span className="tabular text-right text-[var(--text)]">{formatNumber(row.receivable)}</span>
        <span className="text-[var(--muted)]">{t('fx.payable')}</span><span className="tabular text-right text-[var(--text)]">{formatNumber(row.payable)}</span>
        <span className="font-semibold text-[var(--text)]">{t('fx.netIn', { base })}</span><span className="tabular text-right font-semibold" style={{ color: pnl(row.baseNet) }}>{formatCurrency(row.baseNet)}</span>
      </div>
    </div>
  )
}

function JournalLegs({ legs }) {
  return (
    <table className="w-full text-xs">
      <tbody>
        {legs.map((l, i) => (
          <tr key={i}>
            <td className={`py-0.5 ${l.credit ? 'pl-6' : ''} text-[var(--text)]`}>{l.account}</td>
            <td className="py-0.5 text-right tabular w-28">{l.debit ? formatCurrency(l.debit) : ''}</td>
            <td className="py-0.5 text-right tabular w-28">{l.credit ? formatCurrency(l.credit) : ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function RevaluationPanel({ suggestedDate, onPosted }) {
  const recordAudit = useAppStore(s => s.recordAudit)
  const [date, setDate] = useState(suggestedDate)
  const [busy, setBusy] = useState(false)
  const preview = useApi(date ? `/fx/revaluation/preview?date=${date}` : null)
  const runs = useApi('/fx/revaluations')
  const p = preview.data

  async function post() {
    setBusy(true)
    try {
      const run = await api.post('/fx/revaluation', { date })
      toast.success(`Revaluation posted for ${fmtDate(date)} · net ${signed(run.net)}`)
      recordAudit('fx', 'FX revaluation posted', `Month-end revaluation at ${date}: gain ${run.gain}, loss ${run.loss}.`, { module: 'Cash & Bank' })
      preview.refetch(); runs.refetch(); onPosted?.()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    { key: 'reference', label: 'Document', render: (v, r) => <div><p className="text-sm font-medium text-[var(--text)]">{v}</p><p className="text-xs text-[var(--muted)]">{r.party}</p></div> },
    { key: 'kind', label: 'Type', render: v => <Chip tone={v === 'receivable' ? 'primary' : 'warn'} label={v === 'receivable' ? 'Receivable' : 'Payable'} /> },
    { key: 'openAmount', label: 'Open', align: 'right', render: (v, r) => <span className="tabular text-sm">{r.currency} {formatNumber(v)}</span> },
    { key: 'carryingRate', label: 'Carrying → closing', align: 'right', render: (v, r) => <span className="tabular text-xs text-[var(--muted)]">{v} → {r.closingRate}</span> },
    { key: 'baseAfter', label: 'Revalued', align: 'right', render: v => <span className="tabular text-sm">{formatCurrency(v)}</span> },
    { key: 'difference', label: 'Unrealized', align: 'right', render: v => <span className="tabular text-sm font-semibold" style={{ color: pnl(v) }}>{signed(v)}</span> },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <label>
          <span className="block text-xs font-semibold text-[var(--muted)] mb-1">Revaluation date (closing rates)</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]" />
        </label>
        {p && (
          <div className="flex gap-4 text-sm">
            <span>Gain <strong className="tabular text-[var(--pos)]">{formatCurrency(p.totalGain)}</strong></span>
            <span>Loss <strong className="tabular text-[var(--neg)]">{formatCurrency(p.totalLoss)}</strong></span>
            <span>Net <strong className="tabular" style={{ color: pnl(p.net) }}>{signed(p.net)}</strong></span>
          </div>
        )}
        <Button variant="primary" icon={Scale} onClick={post} disabled={busy || !p || p.alreadyPosted || !p.lines.length} className="ml-auto">
          {p?.alreadyPosted ? 'Already posted' : busy ? 'Posting…' : 'Post revaluation'}
        </Button>
      </div>
      <ErrorBox error={preview.error} />
      <DataTable columns={columns} data={p?.lines ?? []} loading={preview.loading} rowKey="documentId" />
      <p className="text-xs text-[var(--muted)] mt-2">
        Open balances are restated at the closing rate; the difference goes to Unrealized FX Gain/Loss. When a document is later settled, the unrealized amount for that part is reversed and the full difference from the booked rate is recognised as realized.
      </p>
      {(runs.data ?? []).length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">Previous runs</p>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] divide-y divide-[var(--border)]">
            {runs.data.map(r => (
              <div key={r.id} className="flex flex-wrap items-center gap-4 px-4 py-2 text-sm">
                <span className="font-medium text-[var(--text)]">{fmtDate(r.date)}</span>
                <span className="text-[var(--muted)]">{r.documents} balances</span>
                <span className="ml-auto tabular" style={{ color: pnl(r.net) }}>{signed(r.net)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ForeignCurrency() {
  const { t } = useTranslation()
  const summary = useApi('/fx/summary')
  const docs = useApi('/fx/documents')
  const journal = useApi('/fx/journal')
  const rates = useApi('/fx/rates')
  const [view, setView] = useState('open')
  const [settling, setSettling] = useState(null)
  const [creating, setCreating] = useState(false)
  const s = summary.data
  const base = s?.base ?? rates.data?.base ?? ''
  const foreignCurrencies = useMemo(() => Object.keys(rates.data?.rates ?? {}), [rates.data])

  function refreshAll() {
    summary.refetch(); docs.refetch(); journal.refetch()
  }

  async function resetDemo() {
    await api.post('/fx/reset')
    toast.info('Foreign-currency demo data re-seeded.')
    refreshAll()
  }

  const rows = useMemo(() => (docs.data ?? []).filter(d => (view === 'open' ? d.openAmount > 0 : d.openAmount <= 0)), [docs.data, view])

  const kpis = [
    { label: t('fx.kpi.netExposure'), value: s ? formatCompact(s.netExposure) : '—', hint: s ? t('fx.kpi.openDocs', { count: s.openDocuments }) : '' },
    { label: t('fx.kpi.unrealized'), value: s ? signedCompact(s.unrealizedNow) : '—', color: pnl(s?.unrealizedNow), hint: s ? t('fx.kpi.postedSplit', { posted: formatCurrency(s.unrealizedBooked), unposted: formatCurrency(s.unrealizedUnposted) }) : '' },
    { label: t('fx.kpi.realized'), value: s ? signedCompact(s.realizedYtd) : '—', color: pnl(s?.realizedYtd) },
    { label: t('fx.kpi.lastReval'), value: s?.lastRevaluation ? fmtDate(s.lastRevaluation.date) : t('fx.kpi.never'), hint: s ? t('fx.kpi.suggested', { date: fmtDate(s.suggestedRevaluationDate) }) : '' },
  ]

  const columns = [
    { key: 'reference', label: t('fx.col.document'), render: (v, r) => <div><p className="text-sm font-medium text-[var(--text)]">{v}</p><p className="text-xs text-[var(--muted)]">{r.party} · {fmtDate(r.date)}</p></div> },
    { key: 'kind', label: t('fx.col.type'), render: v => <Chip tone={v === 'receivable' ? 'primary' : 'warn'} label={t(`fx.${v}`)} /> },
    { key: 'openAmount', label: t('fx.col.openForeign'), align: 'right', sortable: true, render: (v, r) => <span className="tabular text-sm">{r.currency} {formatNumber(v)}</span> },
    { key: 'bookedRate', label: t('fx.col.bookedNow'), align: 'right', render: (v, r) => <span className="tabular text-xs text-[var(--muted)]">{formatNumber(v, 6)} / {formatNumber(r.currentRate, 6)}</span> },
    { key: 'baseNow', label: t('fx.col.valueIn', { base }), align: 'right', sortable: true, render: v => <span className="tabular text-sm font-semibold">{formatCurrency(v)}</span> },
    { key: 'unrealizedSinceBooking', label: t('fx.col.unrealized'), align: 'right', sortable: true, render: v => <span className="tabular text-sm font-semibold" style={{ color: pnl(v) }}>{signed(v)}</span> },
    { key: 'status', label: t('fx.col.status'), render: v => <Chip status={v === 'settled' ? 'paid' : v === 'partial' ? 'pending' : 'open'} label={t(`fx.state.${v}`)} /> },
    { key: 'id', label: '', align: 'right', render: (v, r) => r.openAmount > 0
      ? <Button size="sm" variant="primary" onClick={() => setSettling(r)}>{r.kind === 'receivable' ? t('fx.receive') : t('fx.pay')}</Button> : null },
  ]

  const settledColumns = [
    columns[0], columns[1],
    { key: 'amount', label: t('fx.col.amount'), align: 'right', render: (v, r) => <span className="tabular text-sm">{r.currency} {formatNumber(v)}</span> },
    { key: 'bookedRate', label: t('fx.col.bookedRate'), align: 'right', render: v => <span className="tabular text-xs">{v}</span> },
    { key: 'settlements', label: t('fx.col.realized'), align: 'right', render: v => { const t = v.reduce((a, x) => a + x.realized, 0); return <span className="tabular text-sm font-semibold" style={{ color: pnl(t) }}>{signed(t)}</span> } },
  ]

  return (
    <div>
      <PageHeader
        title={t('fx.title')}
        subtitle={base ? t('fx.subtitle', { base }) : t('common.loading')}
        breadcrumb={[t('nav.sections.cashbank'), t('fx.title')]}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" icon={RotateCcw} onClick={resetDemo}>{t('common.resetDemo')}</Button>
            <Button size="sm" variant="primary" icon={Plus} onClick={() => setCreating(true)} disabled={!foreignCurrencies.length}>{t('fx.newDoc')}</Button>
          </div>
        }
      />
      <ErrorBox error={summary.error} onRetry={refreshAll} />
      <KpiStrip items={kpis} />

      {s?.exposure?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
          {s.exposure.map(row => <ExposureCard key={row.currency} row={row} base={base} />)}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {['open', 'settled', 'revaluation', 'journal'].map(k => [k, t(`fx.view.${k}`)]).map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} className={`h-8 px-3 text-xs font-medium rounded-full border cursor-pointer ${view === k ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]'}`}>{l}</button>
        ))}
      </div>

      {(view === 'open' || view === 'settled') && (
        <DataTable columns={view === 'open' ? columns : settledColumns} data={rows} loading={docs.loading} rowKey="id" />
      )}

      {view === 'revaluation' && s && <RevaluationPanel suggestedDate={s.suggestedRevaluationDate} onPosted={refreshAll} />}

      {view === 'journal' && (
        <div className="space-y-3">
          {journal.loading && <p className="text-sm text-[var(--muted)]">Loading journal…</p>}
          {(journal.data ?? []).map(e => (
            <div key={e.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-[var(--text)]">{fmtDate(e.date)}</span>
                <Chip tone={e.type === 'revaluation' ? 'warn' : e.type === 'settlement' ? 'pos' : 'primary'} label={e.type.charAt(0).toUpperCase() + e.type.slice(1)} />
                <span className="font-mono text-xs text-[var(--muted)]">{e.reference}</span>
                <span className="text-xs text-[var(--muted)] w-full sm:w-auto sm:ml-2">{e.description}</span>
              </div>
              <JournalLegs legs={e.legs} />
            </div>
          ))}
        </div>
      )}

      {settling && <SettleModal doc={settling} onClose={() => setSettling(null)} onSettled={refreshAll} />}
      <NewFxDocumentModal
        open={creating}
        base={base}
        currencies={foreignCurrencies}
        onClose={() => setCreating(false)}
        onCreated={refreshAll}
      />
      <p className="text-[11px] text-[var(--faint)] mt-4">{t('fx.demoNote')}</p>
    </div>
  )
}
