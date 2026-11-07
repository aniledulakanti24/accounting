import { useMemo, useState } from 'react'
import { FileText, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import { useApi } from '../../../hooks/useApi'
import { api } from '../../../data/api/client'
import { formatCurrency, formatCompact } from '../../../lib/currency'
import { toast } from '../../../lib/toast'
import FileReturnFlow from './FileReturnFlow'
import FilingConnection from './FilingConnection'
import { Chip, KpiStrip, RegimeCard, ErrorBox, MockApiNote, DueLabel } from './shared'
import { fmtDate, useTaxProfile } from './taxUtils'

/**
 * Periodic tax returns for non-India jurisdictions (VAT100, VAT 201, GST34,
 * BAS, UStVA, GST F5, US state sales tax). `mode="file"` opens the guided
 * filing flow for the next return that is ready.
 */
export default function GlobalTaxReturns({ mode = 'list' }) {
  const { t } = useTranslation()
  const { profile, catalog } = useTaxProfile()
  const returns = useApi('/tax/returns')
  const summary = useApi('/tax/summary')
  const [selectedId, setSelectedId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = useMemo(() => (returns.data ?? []).filter(r => statusFilter === 'all' || r.status === statusFilter), [returns.data, statusFilter])
  const fileable = useMemo(() => (returns.data ?? []).filter(r => r.status === 'ready').sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [returns.data])
  const [fileId, setFileId] = useState(null)
  const fileTarget = (returns.data ?? []).find(r => r.id === (fileId ?? fileable[0]?.id))
  const selected = (returns.data ?? []).find(r => r.id === selectedId)
  const hasJurisdictions = (returns.data ?? []).some(r => r.jurisdiction)

  function onFiled(updated) {
    // Keep the just-filed return on screen so its acknowledgement stays visible
    if (mode === 'file') setFileId(updated.id)
    returns.setData(list => list.map(r => (r.id === updated.id ? { ...r, ...updated } : r)))
    summary.refetch()
  }

  async function resetDemo() {
    await api.post('/tax/reset')
    toast.info('Demo tax data re-seeded for this company.')
    returns.refetch(); summary.refetch()
  }

  const s = summary.data
  const kpis = [
    { label: t('tax.kpi.readyToFile'), value: s ? s.ready : '—', color: s?.ready ? 'var(--warn)' : 'var(--text)', hint: s?.overdue ? t('tax.kpi.overdue', { count: s.overdue }) : t('tax.kpi.noneOverdue') },
    { label: t('tax.kpi.liabilityDue'), value: s ? formatCompact(s.liabilityDue) : '—', color: 'var(--neg)' },
    { label: t('tax.kpi.paidThisYear'), value: s ? formatCompact(s.paidYtd) : '—', color: 'var(--pos)' },
    { label: t('tax.kpi.nextDeadline'), value: s?.nextDue ? fmtDate(s.nextDue.dueDate) : '—', hint: s?.nextDue ? `${s.nextDue.form} · ${s.nextDue.periodLabel}` : '' },
  ]

  const columns = [
    { key: 'periodLabel', label: t('tax.col.period'), render: (v, r) => (
      <div>
        <p className="text-sm font-medium text-[var(--text)]">{v}</p>
        <p className="text-xs text-[var(--muted)]">{r.form}{r.jurisdiction ? ` · ${r.jurisdiction}` : ''}</p>
      </div>
    ) },
    ...(hasJurisdictions ? [{ key: 'authority', label: t('tax.col.authority'), render: v => <span className="text-sm text-[var(--muted)]">{v}</span> }] : []),
    { key: 'rate', label: t('tax.col.rate'), align: 'right', render: v => <span className="tabular text-sm">{v}%</span> },
    { key: 'dueDate', label: t('tax.col.due'), sortable: true, render: (v, r) => r.status === 'filed' ? <span className="text-sm text-[var(--muted)]">{fmtDate(v)}</span> : <DueLabel date={v} /> },
    { key: 'netPayable', label: t('tax.col.netPayable'), align: 'right', sortable: true, render: v => <span className={`tabular text-sm font-semibold ${v < 0 ? 'text-[var(--pos)]' : 'text-[var(--text)]'}`}>{formatCurrency(v)}</span> },
    { key: 'status', label: t('tax.col.status'), render: v => <Chip status={v} /> },
    { key: 'ackRef', label: t('tax.col.ack'), render: v => <span className="font-mono text-xs text-[var(--muted)]">{v ?? '—'}</span> },
    { key: 'id', label: '', align: 'right', render: (v, r) => (
      <Button size="sm" variant={r.status === 'ready' ? 'primary' : 'secondary'} onClick={(e) => { e.stopPropagation(); setSelectedId(v) }}>
        {r.status === 'ready' ? t('tax.file') : t('tax.view')}
      </Button>
    ) },
  ]

  const title = mode === 'file' ? t('tax.fileForm', { form: catalog?.returnForm ?? '' }) : (catalog?.returnName ?? '')

  // Countries without VAT / GST (Qatar, Kuwait, Hong Kong…) have no periodic return
  if (catalog && !catalog.returnForm) {
    return (
      <div>
        <PageHeader title={profile?.country?.taxSystemName ?? ''} breadcrumb={[t('nav.sections.tax')]} />
        <div className="flex items-start gap-3 p-5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] shadow-sm text-sm">
          <FileText size={18} className="text-[var(--primary)] mt-0.5" />
          <div>
            <p className="font-semibold text-[var(--text)]">{profile?.country?.flag} {profile?.country?.name} has no VAT or GST.</p>
            <p className="text-[var(--muted)] mt-1">There are no periodic sales-tax returns to file. Use the compliance calendar and tax payments for other taxes ({catalog.authority}).</p>
          </div>
        </div>
        <MockApiNote />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={catalog ? `${catalog.authority} · ${catalog.frequency} · due ${catalog.dueRule.text}` : t('tax.loadingJurisdiction')}
        breadcrumb={[t('nav.sections.tax'), title]}
        action={<Button size="sm" variant="ghost" icon={RotateCcw} onClick={resetDemo}>{t('common.resetDemo')}</Button>}
      />
      <ErrorBox error={returns.error} onRetry={returns.refetch} />
      <KpiStrip items={kpis} />

      {/* Authority connection + submission status; remounts (refetches) after each filing */}
      <FilingConnection key={(returns.data ?? []).filter(r => r.status === 'filed').length} />

      {mode === 'file' ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-5 shadow-sm">
          {returns.loading && <p className="text-sm text-[var(--muted)]">{t('common.loading')}</p>}
          {!returns.loading && !fileTarget && (
            <div className="text-sm text-[var(--muted)] flex items-center gap-2"><FileText size={16} /> {t('tax.nothingToFile')}</div>
          )}
          {fileTarget && (
            <>
              {fileTarget.status === 'filed' && fileable.length > 0 && (
                <Button size="sm" variant="secondary" className="mb-4" onClick={() => setFileId(fileable[0].id)}>
                  {t('tax.fileNext', { name: `${fileable[0].form}${fileable[0].jurisdiction ? ` · ${fileable[0].jurisdiction}` : ''} · ${fileable[0].periodLabel}` })}
                </Button>
              )}
              {fileTarget.status !== 'filed' && fileable.length > 1 && (
                <select
                  value={fileTarget.id}
                  onChange={e => setFileId(e.target.value)}
                  className="h-9 px-3 mb-4 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
                >
                  {fileable.map(r => <option key={r.id} value={r.id}>{r.form}{r.jurisdiction ? ` · ${r.jurisdiction}` : ''} · {r.periodLabel}</option>)}
                </select>
              )}
              <FileReturnFlow key={fileTarget.id} ret={fileTarget} catalog={catalog} onFiled={onFiled} />
            </>
          )}
        </div>
      ) : (
        <>
          <RegimeCard profile={profile} />
          <DataTable
            columns={columns}
            data={rows}
            loading={returns.loading}
            rowKey="id"
            onRowClick={r => setSelectedId(r.id)}
            toolbar={
              <div className="flex items-center gap-2">
                {['all', 'ready', 'open', 'filed'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`h-8 px-3 text-xs font-medium rounded-full border cursor-pointer ${statusFilter === st ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]'}`}
                  >
                    {st === 'all' ? t('common.all') : t(`tax.filter.${st}`)}
                  </button>
                ))}
              </div>
            }
          />
        </>
      )}

      <Modal open={!!selected} onClose={() => setSelectedId(null)} title={selected ? `${selected.form} — ${selected.periodLabel}` : ''} size="xl">
        {selected && <FileReturnFlow key={selected.id} ret={selected} catalog={catalog} onFiled={onFiled} />}
      </Modal>
      <MockApiNote />
    </div>
  )
}
